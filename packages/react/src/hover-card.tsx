import {forwardRef, useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState} from "react";
import type {HoverCardProps, OverlayTriggerProps} from "./index.js";
import {IconButton} from "./index.js";
import {positionLayer, registerLayer, returnFocus, tabbables} from "./overlay-runtime.js";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const delay = (value: number | undefined, fallback: number) => Number.isFinite(value) ? Math.max(0, value!) : fallback;

/** A focus-preserving preview; explicit activation pins it for pointer/touch use. */
export const HoverPreview = /* @__PURE__ */ forwardRef<HTMLDivElement, HoverCardProps>(function HoverPreview({
  trigger, title, children, open: controlled, defaultOpen = false, onOpenChange,
  openDelay = 300, closeDelay = 180, side = "bottom", align = "start", disabled = false,
  closeLabel = "Close preview", id: explicitId, className, onPointerEnter, onPointerLeave,
  onFocus, onBlur, ...attributes
}, forwardedRef) {
  const [local, setLocal] = useState(defaultOpen);
  const open = !disabled && (controlled ?? local);
  const anchor = useRef<HTMLButtonElement>(null), panel = useRef<HTMLDivElement>(null);
  const generated = useId(), id = explicitId ?? `flood-hover-card-${generated}`;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hovered = useRef(false), overPanel = useRef(false), focused = useRef(false);
  const pinned = useRef(defaultOpen), suppressed = useRef(false), focusRequested = useRef(false);
  const current = useRef({controlled, onOpenChange, open, disabled});
  useBrowserLayoutEffect(() => {current.current = {controlled, onOpenChange, open, disabled};});
  const setAnchor = useCallback((element: HTMLButtonElement | null) => {anchor.current = element;}, []);
  useImperativeHandle(forwardedRef, () => panel.current!, []);
  const clear = () => {clearTimeout(timer.current); timer.current = undefined;};
  const request = (next: boolean) => {
    clear();
    if (next && (current.current.disabled || anchor.current?.matches(":disabled"))) return;
    if (current.current.controlled === undefined) setLocal(next);
    if (current.current.open !== next) current.current.onOpenChange?.(next);
  };
  const close = () => {pinned.current = false; suppressed.current = true; focusRequested.current = false; request(false);};
  const latest = useRef({request, close});
  useBrowserLayoutEffect(() => {latest.current = {request, close};});
  const leave = () => {
    clear();
    if (hovered.current || overPanel.current || focused.current || pinned.current) return;
    suppressed.current = false;
    timer.current = setTimeout(() => latest.current.request(false), delay(closeDelay, 180));
  };
  const enter = (immediate = false) => {
    clear();
    if (suppressed.current || disabled) return;
    if (immediate) request(true);
    else timer.current = setTimeout(() => latest.current.request(true), delay(openDelay, 300));
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {if (disabled) {clear(); pinned.current = false; suppressed.current = false; setLocal(false);}}, [disabled]);

  useBrowserLayoutEffect(() => {
    if (!open || !panel.current) return;
    const element = panel.current, document = element.ownerDocument, view = document.defaultView!;
    let alive = true, frame = 0, unregister = () => {};
    const position = () => {
      if (!alive) return;
      if (!anchor.current?.isConnected) {latest.current.close(); return;}
      positionLayer(anchor.current, element, side, align);
      frame = view.requestAnimationFrame(position);
    };
    const start = () => {
      if (!alive || !anchor.current?.isConnected) return;
      const parent = anchor.current.closest("dialog");
      if (parent && !parent.open) {frame = view.requestAnimationFrame(start); return;}
      if (typeof element.showPopover !== "function") throw new Error("Flood HoverCard requires the native Popover API");
      element.style.visibility = "hidden";
      element.showPopover();
      unregister = registerLayer(document, {panel: element, anchor: () => anchor.current, close: () => latest.current.close()});
      position();
      if (focusRequested.current) {focusRequested.current = false; (tabbables(element)[0] ?? element).focus({preventScroll: true});}
    };
    const toggle = (event: Event) => {
      if (!alive || (event as ToggleEvent).newState !== "closed" || element.matches(":popover-open") || !current.current.open) return;
      latest.current.close();
      // A controlled owner may reject dismissal. Keep its rendered state authoritative.
      queueMicrotask(() => {if (alive && current.current.open && element.isConnected && !element.matches(":popover-open")) {element.showPopover(); if (anchor.current) positionLayer(anchor.current, element, side, align);}});
    };
    element.addEventListener("toggle", toggle);
    start();
    return () => {
      alive = false; view.cancelAnimationFrame(frame); unregister();
      element.removeEventListener("toggle", toggle);
      returnFocus(element, anchor.current);
      if (element.matches(":popover-open")) element.hidePopover();
    };
  }, [open, side, align]);

  const triggerProps: OverlayTriggerProps = {
    ref: setAnchor, type: "button", disabled, "aria-haspopup": "dialog", "aria-expanded": open, "aria-controls": id,
    onPointerEnter: event => {if (event.pointerType === "touch") return; hovered.current = true; enter();},
    onPointerLeave: () => {hovered.current = false; leave();},
    onFocus: () => {focused.current = true; enter(true);},
    onBlur: event => {focused.current = Boolean(panel.current?.contains(event.relatedTarget as Node)); leave();},
    onClick: () => {
      if (pinned.current && open) close();
      else {suppressed.current = false; pinned.current = true; request(true);}
    },
    onKeyDown: event => {
      if (event.defaultPrevented || event.key !== "ArrowDown" || disabled) return;
      event.preventDefault(); suppressed.current = false; pinned.current = true;
      if (open && panel.current) (tabbables(panel.current)[0] ?? panel.current).focus({preventScroll: true});
      else {focusRequested.current = true; request(true);}
    },
  };
  return <>{trigger(triggerProps)}<div {...attributes} ref={panel} id={id} popover="manual" role="dialog"
    aria-modal="false" aria-labelledby={`${id}-title`} tabIndex={-1}
    className={["flood-overlay-panel", "flood-hover-card", className].filter(Boolean).join(" ")}
    onPointerEnter={event => {onPointerEnter?.(event); overPanel.current = true; clear();}}
    onPointerLeave={event => {onPointerLeave?.(event); overPanel.current = false; leave();}}
    onFocus={event => {onFocus?.(event); focused.current = true; clear();}}
    onBlur={event => {onBlur?.(event); const target = event.relatedTarget as Node; focused.current = Boolean(panel.current?.contains(target) || anchor.current?.contains(target)); leave();}}>
    <div className="flood-overlay-header"><h2 id={`${id}-title`} className="flood-overlay-title">{title}</h2>
      <IconButton label={closeLabel} size="xs" variant="ghost" className="flood-overlay-close" onClick={close}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </IconButton>
    </div>
    {open && <div className="flood-hover-card__body">{children}</div>}
  </div></>;
});
