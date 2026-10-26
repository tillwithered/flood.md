import {forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";
import type {ContextMenuProps} from "./index.js";
import {focusMenuEdge, MenuLayer, validateMenuTree} from "./menu.js";
import {placeOverlay, positionLayer} from "./overlay-runtime.js";

type Point = {x:number;y:number};
export const ContextActionMenu = /* @__PURE__ */ forwardRef<HTMLDivElement, ContextMenuProps>(function ContextActionMenu({
  label, items, children, onAction, open:controlled, defaultOpen = false, onOpenChange,
  disabled = false, controlSize = "sm", className, tabIndex = 0, onContextMenu, onKeyDown, ...props
}, forwardedRef) {
  if (!label.trim()) throw new Error("Flood ContextMenu requires a nonempty label");
  validateMenuTree(items);
  const root = useRef<HTMLDivElement>(null), panel = useRef<HTMLDivElement>(null), source = useRef<HTMLElement | null>(null);
  useImperativeHandle(forwardedRef, () => root.current!, []);
  const [local, setLocal] = useState(defaultOpen), [point,setPoint] = useState<Point | undefined>(undefined);
  const requestedOpen = controlled ?? local, open = !disabled && requestedOpen;
  const pending = useRef<boolean | undefined>(undefined);
  const current = useRef({controlled,onOpenChange}); current.current = {controlled,onOpenChange};
  const request = (next: boolean) => {
    if (pending.current === next) return;
    pending.current = next; queueMicrotask(() => {pending.current = undefined;});
    if (current.current.controlled === undefined) setLocal(next);
    current.current.onOpenChange?.(next);
  };
  useEffect(() => {if (disabled && requestedOpen) request(false);},[disabled,requestedOpen]);
  const anchor = () => source.current?.isConnected ? source.current : root.current;
  const targetOf = (target: EventTarget | null) => {
    const element = target && "nodeType" in target && (target as Node).nodeType === 1 ? target as Element : null;
    const focusable = element?.closest<HTMLElement>('button,a[href],input,select,textarea,[tabindex],[contenteditable="true"]');
    return focusable && root.current?.contains(focusable) && typeof focusable.focus === "function" ? focusable : root.current;
  };
  const position = (element: HTMLDivElement) => {
    const target = anchor(); if (!target) return;
    if (!point) {positionLayer(target,element,"bottom","start"); return;}
    const view = element.ownerDocument.defaultView!, visual = view.visualViewport;
    const viewport = {left:visual?.offsetLeft ?? 0,top:visual?.offsetTop ?? 0,width:visual?.width ?? view.innerWidth,height:visual?.height ?? view.innerHeight};
    const gap = parseFloat(view.getComputedStyle(element).columnGap) || 8;
    element.style.setProperty("--flood-overlay-available-width",`${Math.max(0,viewport.width-2*gap)}px`);
    element.style.setProperty("--flood-overlay-available-height",`${Math.max(0,viewport.height-2*gap)}px`);
    const rect = {left:point.x,right:point.x,top:point.y,bottom:point.y,width:0,height:0};
    const placed = placeOverlay(rect,element.getBoundingClientRect(),viewport,"bottom","start",gap,view.getComputedStyle(target).direction === "rtl");
    element.style.left = `${placed.left}px`; element.style.top = `${placed.top}px`;
    element.dataset.side = placed.side; element.style.visibility = "visible";
  };
  return <div {...props} ref={root} role="group" aria-label={label} tabIndex={tabIndex}
    className={["flood-context-menu",className].filter(Boolean).join(" ")}
    onContextMenu={event => {
      onContextMenu?.(event);
      if (event.defaultPrevented || disabled || panel.current?.contains(event.target as Node)) return;
      event.preventDefault(); source.current = targetOf(event.target);
      setPoint({x:event.clientX,y:event.clientY}); request(true);
      if (open) focusMenuEdge(panel.current);
    }}
    onKeyDown={event => {
      onKeyDown?.(event);
      if (event.defaultPrevented || disabled || event.altKey || event.ctrlKey || event.metaKey || panel.current?.contains(event.target as Node)) return;
      if (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10")) return;
      event.preventDefault(); source.current = targetOf(event.target); setPoint(undefined); request(true);
      if (open) focusMenuEdge(panel.current);
    }}>
    {children}
    <MenuLayer ref={panel} label={label} items={items} open={open} requestOpen={request}
      closeTree={() => request(false)} anchor={anchor} rootAnchor={anchor} position={position}
      onAction={onAction} controlSize={controlSize} />
  </div>;
});
