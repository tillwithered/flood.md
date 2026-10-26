import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, type KeyboardEvent } from "react";
import type { ToolbarProps } from "./index.js";
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const selector = 'button:not([role]),button[role="button"],a[href]:not([role]),a[href][role="link"]';
const independent = '[role="menu"],[role="tablist"],[role="radiogroup"],[role="listbox"],[role="combobox"],.flood-toggle-group';

export const RovingToolbar = /* @__PURE__ */ forwardRef<HTMLDivElement, ToolbarProps>(function RovingToolbar(
  { label, orientation = "horizontal", loop = true, className, onKeyDown, onKeyDownCapture, onFocus, ...props }, ref,
) {
  const root = useRef<HTMLDivElement>(null), current = useRef<HTMLElement | null>(null), within = useRef(false);
  const refresh = useRef<() => HTMLElement[]>(() => []);
  useImperativeHandle(ref, () => root.current!, []);
  useBrowserLayoutEffect(() => {
    const element = root.current!, document = element.ownerDocument, view = document.defaultView!;
    const original = new Map<HTMLElement, string | null>();
    let alive = true;
    const restore = (node: HTMLElement) => { const value = original.get(node); if (value == null) node.removeAttribute("tabindex"); else node.setAttribute("tabindex", value); };
    const sync = () => {
      if (!alive) return [];
      const owned = Array.from(element.querySelectorAll<HTMLElement>(selector)).filter(node => node.closest('[role="toolbar"]') === element && !node.closest(independent));
      const active = document.activeElement;
      const hadFocus = active === element || original.has(active as HTMLElement) || (active === document.body && within.current);
      for (const node of original.keys()) if (!owned.includes(node)) { restore(node); original.delete(node); }
      const enabled = owned.filter(node => !node.matches(':disabled,[aria-disabled="true"]') && !node.closest('[hidden],[inert]') && node.getClientRects().length > 0 && getComputedStyle(node).visibility !== "hidden");
      const entry = enabled.includes(active as HTMLElement) ? active as HTMLElement : enabled.includes(current.current!) ? current.current : enabled[0] ?? null;
      current.current = entry;
      for (const node of owned) {
        if (!original.has(node)) original.set(node, node.getAttribute("tabindex"));
        const value = node === entry ? "0" : "-1"; if (node.getAttribute("tabindex") !== value) node.setAttribute("tabindex", value);
      }
      const value = entry ? "-1" : "0"; if (element.getAttribute("tabindex") !== value) element.setAttribute("tabindex", value);
      if (hadFocus && active !== entry && !enabled.includes(active as HTMLElement) && element.getClientRects().length) (entry ?? element).focus({ preventScroll: true });
      return enabled;
    };
    refresh.current = sync; sync();
    const observer = new MutationObserver(records => { if (records.some(record => !(record.target instanceof Element) || !record.target.closest(independent))) sync(); });
    observer.observe(element, { subtree: true, childList: true, attributes: true, attributeFilter: ["disabled", "aria-disabled", "hidden", "inert", "style", "class", "tabindex", "href", "role"] });
    const resize = typeof ResizeObserver === "function" ? new ResizeObserver(() => sync()) : undefined; resize?.observe(element);
    const focus = (event: FocusEvent) => { within.current = element.contains(event.target as Node); };
    document.addEventListener("focusin", focus); view.addEventListener("resize", sync);
    return () => { alive = false; observer.disconnect(); resize?.disconnect(); document.removeEventListener("focusin", focus); view.removeEventListener("resize", sync); for (const node of original.keys()) restore(node); refresh.current = () => []; };
  }, []);
  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    const controls = refresh.current(), index = controls.indexOf(event.target as HTMLElement);
    if (index < 0 || event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) return;
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const nextKey = orientation === "vertical" ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight", previousKey = orientation === "vertical" ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
    const step = event.key === nextKey ? 1 : event.key === previousKey ? -1 : 0;
    const wanted = event.key === "Home" ? 0 : event.key === "End" ? controls.length - 1 : step ? index + step : -1;
    if (wanted < 0 && !step) return;
    const next = loop ? (wanted + controls.length) % controls.length : Math.max(0, Math.min(controls.length - 1, wanted));
    event.preventDefault(); current.current = controls[next]; controls[next].focus({ preventScroll: true }); controls[next].scrollIntoView({ block: "nearest", inline: "nearest" }); refresh.current();
  };
  return <div {...props} ref={root} role="toolbar" aria-label={label} aria-orientation={orientation} tabIndex={-1}
    data-orientation={orientation} className={["flood-toolbar", className].filter(Boolean).join(" ")}
    onFocus={event => { onFocus?.(event); if (event.defaultPrevented) return; within.current = true; refresh.current(); }}
    onKeyDownCapture={event => { onKeyDownCapture?.(event); if (!event.defaultPrevented && orientation === "vertical" && (event.target as HTMLElement).getAttribute("aria-haspopup") === "menu" && ["ArrowUp", "ArrowDown"].includes(event.key)) move(event); }}
    onKeyDown={event => { onKeyDown?.(event); if (!event.defaultPrevented) move(event); }} />;
});
