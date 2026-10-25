import { useCallback, useEffect, useLayoutEffect, useRef, type Ref, type RefCallback } from "react";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const heldAttribute = "data-flood-focus-held";
type Entry = { node: HTMLElement; enabled: () => boolean };
type Scope = { add: (entry: Entry) => () => void };
const scopes = new WeakMap<Document, Scope>();

/** Keep in-flow focus reveal stable until the native pointer gesture completes. */
function createScope(document: Document): Scope {
  const view = document.defaultView!;
  const entries = new Set<Entry>(), held = new Set<HTMLElement>(), pointers = new Set<number>();
  let releaseTask: number | undefined;
  const cancelTask = () => { if (releaseTask !== undefined) view.clearTimeout(releaseTask); releaseTask = undefined; };
  const release = () => { cancelTask(); held.forEach(node => node.removeAttribute(heldAttribute)); held.clear(); };
  const releaseAfterDispatch = () => {
    if (pointers.size || !held.size) return;
    cancelTask();
    // A task, rather than a microtask, keeps the reveal through all native click
    // listeners. Pointerup also schedules this fallback when no click is fired.
    releaseTask = view.setTimeout(() => { releaseTask = undefined; if (!pointers.size) release(); }, 0);
  };
  const down = (event: PointerEvent) => {
    if (event.button !== 0) return;
    cancelTask(); pointers.add(event.pointerId);
    entries.forEach(entry => {
      if (entry.enabled() && entry.node.matches(":focus-within")) {
        entry.node.setAttribute(heldAttribute, ""); held.add(entry.node);
      }
    });
  };
  const up = (event: PointerEvent) => { pointers.delete(event.pointerId); releaseAfterDispatch(); };
  const click = () => releaseAfterDispatch();
  const cancel = (event: PointerEvent) => { pointers.delete(event.pointerId); if (!pointers.size) release(); };
  const blur = () => { pointers.clear(); release(); };
  document.addEventListener("pointerdown", down, true);
  document.addEventListener("pointerup", up, true);
  document.addEventListener("click", click, true);
  document.addEventListener("pointercancel", cancel, true);
  view.addEventListener("blur", blur);
  const scope: Scope = { add(entry) {
    entries.add(entry);
    return () => {
      entries.delete(entry); held.delete(entry.node); entry.node.removeAttribute(heldAttribute);
      if (entries.size) return;
      pointers.clear(); release();
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("pointerup", up, true);
      document.removeEventListener("click", click, true);
      document.removeEventListener("pointercancel", cancel, true);
      view.removeEventListener("blur", blur);
      scopes.delete(document);
    };
  } };
  return scope;
}

/** A native ref adapter; does not replace handlers or clone rich child content. */
export function useFocusableHidden<T extends HTMLElement>(enabled: boolean, forwardedRef?: Ref<T>): RefCallback<T> {
  const node = useRef<T | null>(null), active = useRef(enabled), disconnect = useRef<() => void>(() => {});
  const forwardedCleanup = useRef<(() => void) | undefined>(undefined);
  useBrowserLayoutEffect(() => {
    active.current = enabled;
    if (!enabled) node.current?.removeAttribute(heldAttribute);
  }, [enabled]);
  return useCallback((element: T | null) => {
    disconnect.current(); disconnect.current = () => {}; node.current = element;
    if (element?.ownerDocument.defaultView) {
      const document = element.ownerDocument;
      let scope = scopes.get(document);
      if (!scope) { scope = createScope(document); scopes.set(document, scope); }
      disconnect.current = scope.add({ node: element, enabled: () => active.current });
    }
    if (typeof forwardedRef === "function") {
      const previousCleanup = forwardedCleanup.current; forwardedCleanup.current = undefined;
      previousCleanup?.();
      if (element !== null || !previousCleanup) {
        const cleanup = forwardedRef(element);
        if (typeof cleanup === "function") forwardedCleanup.current = cleanup;
      }
    } else if (forwardedRef) forwardedRef.current = element;
  }, [forwardedRef]);
}
