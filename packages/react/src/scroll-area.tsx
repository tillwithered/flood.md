import { forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import type { ScrollAreaProps } from "./index.js";

type Axis = "vertical" | "horizontal";
type RtlMode = "negative" | "default" | "reverse";
const rtlModes = new WeakMap<Document, RtlMode>();
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
function rtlMode(document: Document): RtlMode {
  const saved = rtlModes.get(document); if (saved) return saved;
  const probe = document.createElement("div"), content = document.createElement("div");
  probe.dir = "rtl"; probe.style.cssText = "position:fixed;left:-10000px;width:4px;height:1px;overflow:scroll;visibility:hidden";
  content.style.width = "8px"; probe.appendChild(content); document.body.appendChild(probe);
  let mode: RtlMode = "default";
  if (probe.scrollLeft === 0) { probe.scrollLeft = 1; mode = probe.scrollLeft === 0 ? "negative" : "reverse"; }
  probe.remove(); rtlModes.set(document, mode); return mode;
}
function horizontalOffset(element: HTMLElement, rtl: boolean): number {
  const max = element.scrollWidth - element.clientWidth;
  const value = !rtl ? element.scrollLeft : rtlMode(element.ownerDocument) === "negative" ? max + element.scrollLeft : rtlMode(element.ownerDocument) === "reverse" ? max - element.scrollLeft : element.scrollLeft;
  return Math.max(0, Math.min(max, value));
}
function scrollToOffset(element: HTMLElement, axis: Axis, value: number) {
  if (axis === "vertical") { element.scrollTop = value; return; }
  const max = element.scrollWidth - element.clientWidth;
  const next = Math.max(0, Math.min(max, value));
  element.scrollLeft = getComputedStyle(element).direction !== "rtl" ? next : rtlMode(element.ownerDocument) === "negative" ? next - max : rtlMode(element.ownerDocument) === "reverse" ? max - next : next;
}
interface Bar { visible: boolean; length: number; thumb: number; position: number; max: number; offset: number; left: number; top: number; size: number }
interface Measurements { enhanced: boolean; vertical: Bar; horizontal: Bar }
const emptyBar: Bar = { visible: false, length: 0, thumb: 0, position: 0, max: 0, offset: 0, left: 0, top: 0, size: 0 };
const empty: Measurements = { enhanced: false, vertical: emptyBar, horizontal: emptyBar };
const sameBar = (a: Bar, b: Bar) => a.visible === b.visible && a.length === b.length && a.thumb === b.thumb && a.position === b.position && a.max === b.max && a.offset === b.offset && a.left === b.left && a.top === b.top && a.size === b.size;

/** Original overlay chrome; the viewport itself remains a browser-native scroll container. */
export const OverlayScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(function OverlayScrollArea({
  orientation = "vertical", children, className, style, tabIndex = 0, role, ...props
}, forwardedRef) {
  const id = useId();
  const viewport = useRef<HTMLDivElement>(null), content = useRef<HTMLDivElement>(null);
  const vertical = useRef<HTMLDivElement>(null), horizontal = useRef<HTMLDivElement>(null);
  const [measurements, setMeasurements] = useState<Measurements>(empty);
  const [dragging, setDragging] = useState<Axis | null>(null);
  const metrics = useRef(measurements); metrics.current = measurements;
  const drag = useRef<{ axis: Axis; pointer: number; start: number; offset: number } | null>(null);
  useImperativeHandle(forwardedRef, () => viewport.current!, []);

  useBrowserLayoutEffect(() => {
    const node = viewport.current, contents = content.current;
    if (!node || !contents || typeof ResizeObserver === "undefined") return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const computed = getComputedStyle(node), rootSize = parseFloat(getComputedStyle(node.ownerDocument.documentElement).fontSize);
      const length = (name: string) => { const value = computed.getPropertyValue(name).trim(); return parseFloat(value) * (value.endsWith("rem") ? rootSize : 1); };
      const size = length("--flood-sys-scrollbar-size"), inset = length("--flood-sys-scrollbar-inset"), minimum = length("--flood-sys-scrollbar-min-thumb");
      const enhanced = size > 0 && inset >= 0 && minimum > 0;
      if (!enhanced) { setMeasurements((old) => old.enhanced ? empty : old); return; }
      const hasVertical = orientation !== "horizontal" && node.scrollHeight > node.clientHeight + 1;
      const hasHorizontal = orientation !== "vertical" && node.scrollWidth > node.clientWidth + 1;
      const rtl = computed.direction === "rtl";
      const make = (axis: Axis): Bar => {
        const isVertical = axis === "vertical";
        const client = isVertical ? node.clientHeight : node.clientWidth, total = isVertical ? node.scrollHeight : node.scrollWidth;
        const length = Math.max(0, client - inset * 2 - ((isVertical ? hasHorizontal : hasVertical) ? size + inset : 0));
        const thumb = Math.min(length, Math.max(minimum, total > 0 ? length * client / total : length));
        const max = Math.max(0, total - client), offset = isVertical ? node.scrollTop : horizontalOffset(node, rtl);
        return { visible: isVertical ? hasVertical : hasHorizontal, length, thumb, max, offset, position: max > 0 ? offset / max * (length - thumb) : 0, size,
          left: node.offsetLeft + node.clientLeft + (isVertical ? rtl ? inset : node.clientWidth - inset - size : inset + (hasVertical && rtl ? size + inset : 0)),
          top: node.offsetTop + node.clientTop + (isVertical ? inset : node.clientHeight - inset - size) };
      };
      const next = { enhanced, vertical: make("vertical"), horizontal: make("horizontal") };
      setMeasurements((old) => old.enhanced === next.enhanced && sameBar(old.vertical, next.vertical) && sameBar(old.horizontal, next.horizontal) ? old : next);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const resize = new ResizeObserver(schedule); resize.observe(node); resize.observe(contents);
    const mutation = new MutationObserver(schedule); mutation.observe(contents, { subtree: true, childList: true, characterData: true, attributes: true });
    // A writing-direction change can move the vertical rail without resizing the content.
    const direction = new MutationObserver(schedule); let ancestor: HTMLElement | null = node;
    while (ancestor) { direction.observe(ancestor, { attributes: true, attributeFilter: ["dir", "class", "style"] }); ancestor = ancestor.parentElement; }
    node.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", schedule);
    measure();
    return () => { if (frame) cancelAnimationFrame(frame); resize.disconnect(); mutation.disconnect(); direction.disconnect(); node.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, [orientation]);

  useEffect(() => {
    const wheel = (event: WheelEvent) => {
      const node = viewport.current; if (!node) return;
      const computed = getComputedStyle(node);
      const multiplier = event.deltaMode === 1 ? parseFloat(computed.lineHeight) || 16 : event.deltaMode === 2 ? node.clientHeight : 1;
      const deltaY = orientation !== "horizontal" ? event.deltaY * multiplier : 0;
      const deltaX = orientation !== "vertical" ? (orientation === "horizontal" && !event.deltaX ? event.deltaY : event.deltaX) * multiplier : 0;
      const beforeY = node.scrollTop, beforeX = horizontalOffset(node, computed.direction === "rtl");
      const nextY = Math.max(0, Math.min(node.scrollHeight - node.clientHeight, beforeY + deltaY));
      const nextX = Math.max(0, Math.min(node.scrollWidth - node.clientWidth, beforeX + deltaX));
      const consumed = nextY !== beforeY || nextX !== beforeX;
      const contained = (deltaY !== 0 && ["contain", "none"].includes(computed.overscrollBehaviorY)) || (deltaX !== 0 && ["contain", "none"].includes(computed.overscrollBehaviorX));
      if (consumed || contained) event.preventDefault();
      if (deltaY) node.scrollTop = nextY;
      if (deltaX) scrollToOffset(node, "horizontal", nextX);
    };
    const tracks = [vertical.current, horizontal.current].filter((track): track is HTMLDivElement => Boolean(track));
    tracks.forEach((track) => track.addEventListener("wheel", wheel, { passive: false }));
    return () => tracks.forEach((track) => track.removeEventListener("wheel", wheel));
  }, [measurements.vertical.visible, measurements.horizontal.visible, orientation]);

  function pointerDown(event: ReactPointerEvent<HTMLDivElement>, axis: Axis) {
    if (event.button !== 0 || !viewport.current) return;
    event.preventDefault(); event.stopPropagation();
    const bar = metrics.current[axis];
    drag.current = { axis, pointer: event.pointerId, start: axis === "vertical" ? event.clientY : event.clientX, offset: bar.offset };
    event.currentTarget.setPointerCapture(event.pointerId); setDragging(axis);
  }
  function pointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const active = drag.current, node = viewport.current;
    if (!active || active.pointer !== event.pointerId || !node) return;
    const bar = metrics.current[active.axis], distance = (active.axis === "vertical" ? event.clientY : event.clientX) - active.start;
    if (bar.length > bar.thumb) scrollToOffset(node, active.axis, active.offset + distance * bar.max / (bar.length - bar.thumb));
  }
  function pointerEnd() { drag.current = null; setDragging(null); }
  function trackDown(event: ReactPointerEvent<HTMLDivElement>, axis: Axis) {
    if (event.button !== 0 || !viewport.current) return;
    event.preventDefault(); event.stopPropagation();
    const bar = metrics.current[axis], rect = event.currentTarget.getBoundingClientRect();
    const click = axis === "vertical" ? event.clientY - rect.top : event.clientX - rect.left;
    if (bar.length > bar.thumb) scrollToOffset(viewport.current, axis, (click - bar.thumb / 2) * bar.max / (bar.length - bar.thumb));
  }
  const renderBar = (axis: Axis) => {
    const bar = measurements[axis]; if (!measurements.enhanced || !bar.visible) return null;
    const isVertical = axis === "vertical";
    return <div ref={isVertical ? vertical : horizontal} className={`flood-scroll-area__track flood-scroll-area__track--${axis}`} aria-hidden="true"
      data-dragging={dragging === axis || undefined} style={{ left: bar.left, top: bar.top, width: isVertical ? bar.size : bar.length, height: isVertical ? bar.length : bar.size }}
      onPointerDown={(event) => trackDown(event, axis)}>
      <div className="flood-scroll-area__thumb" style={{ width: isVertical ? "100%" : bar.thumb, height: isVertical ? bar.thumb : "100%", transform: isVertical ? `translateY(${bar.position}px)` : `translateX(${bar.position}px)` }}
        onPointerDown={(event) => pointerDown(event, axis)} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={pointerEnd} />
    </div>;
  };
  const rootStyle: CSSProperties = { width: style?.width, minWidth: style?.minWidth, maxWidth: style?.maxWidth, inlineSize: style?.inlineSize, minInlineSize: style?.minInlineSize, maxInlineSize: style?.maxInlineSize };
  const named = props["aria-label"] || props["aria-labelledby"];
  return <div className="flood-scroll-area" style={rootStyle}>
    <div {...props} id={props.id ?? `flood-scroll-${id}`} ref={viewport} tabIndex={tabIndex} role={role ?? (named ? "region" : undefined)}
      className={["flood-scroll-area__viewport", className].filter(Boolean).join(" ")} style={style}
      data-orientation={orientation} data-scrollbars={measurements.enhanced ? "overlay" : undefined}>
      <div className="flood-scroll-area__content" ref={content}>{children}</div>
    </div>
    {renderBar("vertical")}{renderBar("horizontal")}
  </div>;
});
