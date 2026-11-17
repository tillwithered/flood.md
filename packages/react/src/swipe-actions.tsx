import {useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ForwardedRef, type PointerEvent} from "react";
import {IconButton, Surface, type SwipeActionsProps} from "./index.js";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

interface Gesture {
  pointerId: number;
  x: number;
  y: number;
  direction: number;
  active: boolean;
}

const gestureExclusions = "a, button, input, select, textarea, label, [tabindex], [contenteditable], [draggable=true], [role=button], [role=link]";

export function SwipeActionsRow({
  children, actions, label, size, open, defaultOpen, onOpenChange, swipe,
  className, style, onKeyDown, forwardedRef, ...props
}: SwipeActionsProps & Required<Pick<SwipeActionsProps, "size" | "defaultOpen" | "swipe">> & {
  forwardedRef: ForwardedRef<HTMLDivElement>;
}) {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const expanded = open ?? localOpen;
  const [actionWidth, setActionWidth] = useState(0);
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const rail = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const id = useId();

  useBrowserLayoutEffect(() => {
    const node = rail.current;
    if (!node) return;
    const measure = () => setActionWidth(node.offsetWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const setRail = useCallback((node: HTMLDivElement | null) => {
    rail.current = node;
    if (!node) return;
    if (!expanded && node.contains(node.ownerDocument.activeElement)) toggle.current?.focus({preventScroll:true});
    node.inert = !expanded;
  }, [expanded]);

  const requestOpen = (next: boolean) => {
    if (expanded === next) return;
    if (open === undefined) setLocalOpen(next);
    onOpenChange?.(next);
  };

  const startGesture = (event: PointerEvent<HTMLDivElement>) => {
    if (!swipe || !event.isPrimary || event.button !== 0 || !actionWidth) return;
    const excluded = (event.target as Element).closest(gestureExclusions);
    if (excluded && event.currentTarget.contains(excluded)) return;
    const direction = getComputedStyle(event.currentTarget).direction === "rtl" ? 1 : -1;
    gesture.current = {pointerId:event.pointerId, x:event.clientX, y:event.clientY, direction, active:false};
  };

  const slide = (event: PointerEvent<HTMLDivElement>) => {
    const start = gesture.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const distance = (event.clientX - start.x) * start.direction;
    if (!start.active) {
      const vertical = Math.abs(event.clientY - start.y);
      if (vertical > 8 && vertical >= Math.abs(distance)) {
        gesture.current = null;
        return;
      }
      if ((expanded ? -distance : distance) < 8) return;
      start.active = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    setDragWidth(Math.max(0, Math.min(actionWidth, (expanded ? actionWidth : 0) + distance)));
  };

  const endGesture = (event: PointerEvent<HTMLDivElement>, commit = false) => {
    const start = gesture.current;
    if (!start || start.pointerId !== event.pointerId) return;
    gesture.current = null;
    setDragWidth(null);
    if (commit && start.active) {
      const distance = (event.clientX - start.x) * start.direction;
      if ((expanded ? -distance : distance) >= Math.min(40, actionWidth / 2)) requestOpen(!expanded);
    }
  };

  return <Surface {...props} ref={forwardedRef} padding="3"
    className={["flood-swipe-actions", className].filter(Boolean).join(" ")}
    data-open={expanded} data-dragging={dragWidth !== null}
    style={{"--flood-swipe-reveal": dragWidth === null ? (expanded ? `${actionWidth}px` : "0px") : `${dragWidth}px`, ...style} as CSSProperties}
    onKeyDown={event => {
      onKeyDown?.(event);
      if (event.defaultPrevented || event.key !== "Escape" || !expanded) return;
      event.preventDefault();
      event.stopPropagation();
      toggle.current?.focus({preventScroll:true});
      requestOpen(false);
    }}>
    <div className="flood-swipe-actions__content" data-swipe={swipe}
      onPointerDown={startGesture} onPointerMove={slide}
      onPointerUp={event => endGesture(event, true)} onPointerCancel={event => endGesture(event)}
      onLostPointerCapture={event => {
        if (event.target === event.currentTarget) endGesture(event);
      }}
      onPointerLeave={event => {if (!gesture.current?.active) endGesture(event);}}>
      {children}
    </div>
    <IconButton ref={toggle} label={label} title={label} size={size} variant="ghost" type="button"
      className="flood-swipe-actions__toggle" aria-expanded={expanded} aria-controls={id}
      onClick={() => requestOpen(!expanded)}>
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
      </svg>
    </IconButton>
    <div className="flood-swipe-actions__clip">
      <div id={id} ref={setRail} className="flood-swipe-actions__rail" aria-hidden={!expanded || undefined}>{actions}</div>
    </div>
  </Surface>;
}
