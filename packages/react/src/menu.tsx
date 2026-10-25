import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import type { MenuProps, OverlayTriggerProps } from "./index.js";
import { Button, Kbd } from "./index.js";
import { OverlayScrollArea } from "./scroll-area.js";
import { positionLayer, registerLayer, returnFocus, tabbables } from "./overlay-runtime.js";
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export const ActionMenu = forwardRef<HTMLDivElement, MenuProps>(function ActionMenu(
  { label, trigger, items, onAction, open: controlled, defaultOpen, onOpenChange, disabled, side = "bottom", align = "start", controlSize = "sm", id: explicitId, className, onKeyDown, ...props }, ref,
) {
  const [local, setLocal] = useState(Boolean(defaultOpen)), open = controlled ?? local;
  const anchor = useRef<HTMLButtonElement>(null), panel = useRef<HTMLDivElement>(null);
  const generated = useId(), id = explicitId ?? `flood-menu-${generated}`;
  const pending = useRef<boolean | undefined>(undefined);
  const edge = useRef<"first" | "last">("first"), search = useRef({ text: "", time: 0 });
  if (!items.some(item => item.type !== "separator")) throw new Error("Flood Menu requires at least one action item");
  if (new Set(items.map(item => item.id)).size !== items.length || items.some(item => !item.id.trim() || (item.type !== "separator" && !item.label.trim())))
    throw new Error("Flood menu items need unique nonempty IDs and action labels");
  const request = (next: boolean) => {
    if (pending.current === next) return;
    pending.current = next; queueMicrotask(() => { pending.current = undefined; });
    if (controlled === undefined) setLocal(next); onOpenChange?.(next);
  };
  const current = useRef({ open, request });
  useBrowserLayoutEffect(() => { current.current = { open, request }; });
  const setAnchor = useCallback((node: HTMLButtonElement | null) => { anchor.current = node; }, []);
  useImperativeHandle(ref, () => panel.current!, []);
  const buttons = () => Array.from(panel.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
  const focusEdge = () => { const all = buttons(); ((edge.current === "last" ? all.at(-1) : all[0]) ?? panel.current)?.focus({ preventScroll: true }); };
  useBrowserLayoutEffect(() => {
    if (!open || !panel.current) return;
    const element = panel.current, document = element.ownerDocument, view = document.defaultView!;
    let alive = true, frame = 0, unregister = () => {};
    const start = () => {
      if (!alive || !anchor.current?.isConnected) return;
      const parent = anchor.current.closest("dialog");
      if (parent && !parent.open) { frame = view.requestAnimationFrame(start); return; }
      if (typeof element.showPopover !== "function") throw new Error("Flood Menu requires the native Popover API");
      element.style.visibility = "hidden"; element.showPopover(); positionLayer(anchor.current, element, side, align);
      unregister = registerLayer(document, { panel: element, anchor: () => anchor.current, close: () => current.current.request(false) });
      search.current = { text: "", time: 0 }; focusEdge();
      const update = () => { if (!alive) return; if (anchor.current?.isConnected) positionLayer(anchor.current, element, side, align); frame = view.requestAnimationFrame(update); };
      frame = view.requestAnimationFrame(update);
    };
    start();
    const toggle = (event: Event) => {
      if (!alive || (event as ToggleEvent).newState !== "closed" || element.matches(":popover-open") || !current.current.open) return;
      current.current.request(false);
      queueMicrotask(() => { if (alive && current.current.open && element.isConnected && !element.matches(":popover-open") && anchor.current?.isConnected) { element.showPopover(); positionLayer(anchor.current, element, side, align); focusEdge(); } });
    };
    element.addEventListener("toggle", toggle);
    return () => { alive = false; view.cancelAnimationFrame(frame); unregister(); element.removeEventListener("toggle", toggle); returnFocus(element, anchor.current); if (element.matches(":popover-open")) element.hidePopover(); };
  }, [open, side, align]);
  useBrowserLayoutEffect(() => {
    if (open && panel.current?.matches(":popover-open") && panel.current.ownerDocument.activeElement === panel.current.ownerDocument.body) focusEdge();
  }, [items, open]);
  const triggerProps: OverlayTriggerProps = { ref: setAnchor, type: "button", disabled, "aria-haspopup": "menu", "aria-expanded": open, "aria-controls": id,
    onClick: () => { edge.current = "first"; request(!open); },
    onKeyDown: event => { if (event.defaultPrevented || disabled || event.altKey || event.ctrlKey || event.metaKey || !["ArrowDown", "ArrowUp"].includes(event.key)) return; event.preventDefault(); edge.current = event.key === "ArrowUp" ? "last" : "first"; if (open && panel.current?.matches(":popover-open")) focusEdge(); else request(true); },
  };
  const hasIcons = items.some(item => item.type !== "separator" && item.icon != null);
  return <>{trigger(triggerProps)}<div {...props} ref={panel} id={id} popover="manual" role="menu" aria-label={label} aria-orientation="vertical" tabIndex={-1}
    className={["flood-overlay-panel", "flood-menu", className].filter(Boolean).join(" ")} onKeyDown={event => {
      onKeyDown?.(event); if (event.defaultPrevented) return;
      const all = buttons(), index = all.indexOf(event.target as HTMLButtonElement);
      if (event.key === "Tab") {
        const button = anchor.current;
        if (button) {
          const scope = button.closest("dialog[open]") ?? button.ownerDocument.body;
          const stops = tabbables(scope as HTMLElement).filter(node => !panel.current?.contains(node));
          const at = stops.indexOf(button), target = event.shiftKey ? button : at >= 0 ? stops[at + 1] : undefined;
          if (target) { event.preventDefault(); target.focus(); } else button.focus();
        }
        request(false); return;
      }
      if (event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) return;
      let next = event.key === "Home" ? 0 : event.key === "End" ? all.length - 1 : event.key === "ArrowDown" ? (index + 1) % all.length : event.key === "ArrowUp" ? (index - 1 + all.length) % all.length : -1;
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) search.current = { text: "", time: 0 };
      if (event.key.length === 1 && event.key !== " ") {
        const now = Date.now(); search.current = { text: (now - search.current.time < 700 ? search.current.text : "") + event.key.toLocaleLowerCase(), time: now };
        const text = Array.from(search.current.text).every(char => char === search.current.text[0]) ? search.current.text[0] : search.current.text;
        const start = text.length === 1 ? index + 1 : Math.max(0, index);
        next = Array.from({ length: all.length }, (_, offset) => (start + offset) % all.length).find(candidate => all[candidate].dataset.label?.toLocaleLowerCase().startsWith(text)) ?? -1;
        event.preventDefault();
      }
      if (next >= 0 && all[next]) { event.preventDefault(); all[next].focus({ preventScroll: true }); all[next].scrollIntoView({ block: "nearest", inline: "nearest" }); }
    }}>
    {open && <OverlayScrollArea orientation="vertical" role="group" tabIndex={-1} className="flood-menu__viewport">
      {items.map(item => item.type === "separator" ? <div key={item.id} role="separator" className="flood-menu__separator" /> :
        <Button key={item.id} role="menuitem" tabIndex={-1} variant="ghost" size={controlSize} aria-label={item.label} aria-disabled={item.disabled || undefined}
          data-label={item.label} data-tone={item.tone} className="flood-menu__item"
          onPointerMove={event => { if (event.pointerType !== "touch" && event.currentTarget.ownerDocument.activeElement !== event.currentTarget) event.currentTarget.focus({ preventScroll: true }); }}
          onClick={event => { if (item.disabled) { event.preventDefault(); return; } request(false); onAction?.(item.id); }}>
          {hasIcons && <span className="flood-menu__icon" aria-hidden="true">{item.icon}</span>}
          <span className="flood-menu__label">{item.label}</span>
          {item.shortcut && <span className="flood-menu__shortcut" aria-hidden="true"><Kbd>{item.shortcut}</Kbd></span>}
        </Button>)}
    </OverlayScrollArea>}
  </div></>;
});
