import {Fragment, forwardRef, useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode} from "react";
import type {MenuItem, MenuProps, MenuSubmenuItem, OverlayTriggerProps} from "./index.js";
import {Button, Kbd, ScrollArea} from "./index.js";
import {positionLayer, registerLayer, returnFocus, tabbables} from "./overlay-runtime.js";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
type InternalItem = MenuItem | MenuSubmenuItem;
type Edge = "first" | "last";

/** Validate each level while retaining globally unique action IDs. */
export function validateMenuTree(items: readonly InternalItem[]) {
  const ids = new Set<string>();
  const pending: Array<{items:readonly InternalItem[]; ancestors:Set<readonly InternalItem[]>}> = [{items, ancestors:new Set()}];
  while (pending.length) {
    const current = pending.pop()!;
    if (current.ancestors.has(current.items)) throw new Error("Flood Menu does not accept recursive item arrays");
    if (!current.items.some(item => item.type !== "separator")) throw new Error("Flood Menu requires at least one action item in every menu");
    const ancestors = new Set(current.ancestors); ancestors.add(current.items);
    const checkedGroups = new Set<string>();
    for (const item of current.items) {
      if (!item.id.trim() || ids.has(item.id) || (item.type !== "separator" && !item.label.trim()))
        throw new Error("Flood menu items need unique nonempty IDs across the tree and action labels");
      ids.add(item.id);
      if (item.type === "submenu") pending.push({items:item.items, ancestors});
      if (item.type === "radio") {
        if (!item.group.trim()) throw new Error("Flood Menu radio items need a nonempty group label");
        if (item.checked && checkedGroups.has(item.group)) throw new Error("Flood Menu radio groups accept only one checked item");
        if (item.checked) checkedGroups.add(item.group);
      }
    }
  }
}

const ownButtons = (panel: HTMLElement | null) => Array.from(panel?.querySelectorAll<HTMLButtonElement>('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]') ?? [])
  .filter(button => button.closest('[role="menu"]') === panel);
export function focusMenuEdge(panel: HTMLElement | null, edge: Edge = "first") {
  const all = ownButtons(panel);
  ((edge === "last" ? all.at(-1) : all[0]) ?? panel)?.focus({preventScroll:true});
}

interface MenuLayerProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role"> {
  label: string;
  items: readonly InternalItem[];
  open: boolean;
  requestOpen: (open: boolean) => void;
  closeTree: () => void;
  anchor: () => HTMLElement | null;
  rootAnchor: () => HTMLElement | null;
  rootPanel?: () => HTMLDivElement | null;
  onAction?: (id: string) => void;
  edge?: () => Edge;
  nested?: boolean;
  position?: (panel: HTMLDivElement) => void;
  side?: MenuProps["side"];
  align?: MenuProps["align"];
  controlSize?: MenuProps["controlSize"];
}

/** Internal native top-layer engine shared by Menu and ContextMenu. */
export const MenuLayer = forwardRef<HTMLDivElement, MenuLayerProps>(function MenuLayerRender({
  label, items, open, requestOpen, closeTree, anchor, rootAnchor, rootPanel, onAction,
  edge, nested = false, position, side = "bottom", align = "start", controlSize = "sm",
  id: explicitId, className, onKeyDown, ...props
}, forwardedRef) {
  const generated = useId(), id = explicitId ?? `flood-menu-${generated}`;
  const panel = useRef<HTMLDivElement>(null), anchors = useRef(new Map<string, HTMLButtonElement>()), children = useRef(new Map<string, HTMLDivElement>());
  const anchorRefs = useRef(new Map<string, (node: HTMLButtonElement | null) => void>());
  const childRefs = useRef(new Map<string, (node: HTMLDivElement | null) => void>());
  const [openChild, setOpenChild] = useState<string | undefined>(undefined);
  const hover = useRef<ReturnType<typeof setTimeout> | undefined>(undefined), pointerType = useRef("");
  const search = useRef({text:"", time:0}), pointerTarget = useRef<Node | null>(null);
  const current = useRef({open, requestOpen, closeTree, anchor, rootAnchor, rootPanel, position, edge});
  current.current = {open, requestOpen, closeTree, anchor, rootAnchor, rootPanel, position, edge};
  useImperativeHandle(forwardedRef, () => panel.current!, []);
  const clearHover = () => {clearTimeout(hover.current); hover.current = undefined;};
  useEffect(() => () => clearHover(), []);
  useBrowserLayoutEffect(() => {
    clearHover();
    const keys = new Set(items.filter(item => item.type !== "separator").map(item => item.id));
    for (const key of anchorRefs.current.keys()) if (!keys.has(key)) anchorRefs.current.delete(key);
    for (const key of childRefs.current.keys()) if (!keys.has(key)) childRefs.current.delete(key);
  }, [items]);
  const anchorRef = (key: string) => {
    if (!anchorRefs.current.has(key)) anchorRefs.current.set(key, node => {if (node) anchors.current.set(key,node); else anchors.current.delete(key);});
    return anchorRefs.current.get(key)!;
  };
  const childRef = (key: string) => {
    if (!childRefs.current.has(key)) childRefs.current.set(key, node => {if (node) children.current.set(key,node); else children.current.delete(key);});
    return childRefs.current.get(key)!;
  };
  const wholePanel = () => current.current.rootPanel?.() ?? panel.current;
  const place = (node: HTMLDivElement) => {
    const target = current.current.anchor(); if (!target) return;
    const direction = node.ownerDocument.defaultView!.getComputedStyle(target).direction;
    node.dataset.menuDirection = direction;
    if (current.current.position) {current.current.position(node); return;}
    positionLayer(target, node, nested ? direction === "rtl" ? "left" : "right" : side, nested ? "start" : align);
  };
  useBrowserLayoutEffect(() => {
    if (!open || !panel.current) {clearHover(); if (openChild !== undefined) setOpenChild(undefined); return;}
    const element = panel.current, document = element.ownerDocument, view = document.defaultView!;
    let alive = true, frame = 0, unregister = () => {};
    const closeLevel = () => {
      const active = document.activeElement;
      if (nested && active && !wholePanel()?.contains(active) && !current.current.rootAnchor()?.contains(active)) current.current.closeTree();
      else current.current.requestOpen(false);
    };
    const trackPointer = (event: PointerEvent) => {pointerTarget.current = event.target as Node | null;};
    document.addEventListener("pointerdown", trackPointer, true);
    const start = () => {
      const target = current.current.anchor();
      if (!alive || !target?.isConnected) return;
      const parent = target.closest("dialog");
      if (parent && !parent.open) {frame = view.requestAnimationFrame(start); return;}
      if (typeof element.showPopover !== "function") throw new Error("Flood Menu requires the native Popover API");
      element.style.visibility = "hidden"; element.showPopover(); place(element);
      unregister = registerLayer(document, {panel:element, anchor:() => current.current.anchor(), close:closeLevel,
        outside:() => {
          if (nested && pointerTarget.current && wholePanel()?.contains(pointerTarget.current)) current.current.requestOpen(false);
          else current.current.closeTree();
        }});
      search.current = {text:"", time:0}; focusMenuEdge(element, current.current.edge?.() ?? "first");
      const update = () => {if (!alive) return; if (current.current.anchor()?.isConnected) place(element); frame = view.requestAnimationFrame(update);};
      frame = view.requestAnimationFrame(update);
    };
    start();
    const toggle = (event: Event) => {
      if (!alive || (event as ToggleEvent).newState !== "closed" || element.matches(":popover-open") || !current.current.open) return;
      current.current.requestOpen(false);
      queueMicrotask(() => {
        if (alive && current.current.open && element.isConnected && !element.matches(":popover-open") && current.current.anchor()?.isConnected) {
          element.showPopover(); place(element); focusMenuEdge(element, current.current.edge?.() ?? "first");
        }
      });
    };
    element.addEventListener("toggle", toggle);
    return () => {
      alive = false; clearHover(); view.cancelAnimationFrame(frame); unregister();
      document.removeEventListener("pointerdown", trackPointer, true); element.removeEventListener("toggle", toggle);
      returnFocus(element, current.current.anchor());
      if (element.matches(":popover-open")) element.hidePopover();
    };
  }, [open, side, align, nested]);
  useBrowserLayoutEffect(() => {
    if (openChild && !items.some(item => item.id === openChild && item.type === "submenu" && !item.disabled)) setOpenChild(undefined);
    if (open && panel.current?.matches(":popover-open") && panel.current.ownerDocument.activeElement === panel.current.ownerDocument.body) focusMenuEdge(panel.current, edge?.() ?? "first");
  }, [items, open, openChild]);
  const showChild = (item: MenuSubmenuItem) => {
    if (item.disabled) return;
    clearHover();
    if (openChild === item.id) focusMenuEdge(children.current.get(item.id) ?? null);
    else setOpenChild(item.id);
  };
  const scheduleHover = (item: Exclude<InternalItem, {type:"separator"}>, node: HTMLButtonElement) => {
    clearHover();
    if (!openChild && item.type !== "submenu") {node.focus({preventScroll:true}); return;}
    hover.current = setTimeout(() => {
      hover.current = undefined;
      if (!node.isConnected || !panel.current?.matches(":popover-open")) return;
      node.focus({preventScroll:true});
      setOpenChild(item.type === "submenu" && !item.disabled ? item.id : undefined);
    }, 150);
  };
  const hasIcons = items.some(item => item.type !== "separator" && item.icon != null);
  const renderItem = (item: InternalItem): ReactNode => {
    if (item.type === "separator") return <div key={item.id} role="separator" className="flood-menu__separator" />;
    const submenu = item.type === "submenu", childId = `${id}-submenu-${encodeURIComponent(item.id)}`;
    return <Fragment key={item.id}>
      <Button ref={anchorRef(item.id)}
        role={item.type === "checkbox" ? "menuitemcheckbox" : item.type === "radio" ? "menuitemradio" : "menuitem"}
        aria-checked={item.type === "checkbox" || item.type === "radio" ? item.checked : undefined}
        aria-haspopup={submenu ? "menu" : undefined} aria-expanded={submenu ? openChild === item.id && !item.disabled : undefined}
        aria-controls={submenu ? childId : undefined} tabIndex={-1} variant="ghost" size={controlSize}
        aria-label={item.label} aria-disabled={item.disabled || undefined} data-label={item.label} data-menu-id={item.id}
        data-tone={"tone" in item ? item.tone : undefined} data-submenu={submenu || undefined} className="flood-menu__item"
        onPointerDown={event => {pointerType.current = event.pointerType;}}
        onPointerEnter={event => {if (event.pointerType === "mouse") scheduleHover(item,event.currentTarget);}}
        onPointerLeave={() => clearHover()}
        onPointerMove={event => {
          if (event.pointerType === "touch" || openChild) return;
          if (event.currentTarget.ownerDocument.activeElement !== event.currentTarget) event.currentTarget.focus({preventScroll:true});
        }}
        onClick={event => {
          clearHover();
          if (item.disabled) {event.preventDefault(); return;}
          if (item.type === "submenu") {
            if (event.detail > 0 && pointerType.current === "touch" && openChild === item.id) setOpenChild(undefined);
            else showChild(item);
          } else if (item.type === "checkbox") {item.onCheckedChange(item.checked !== true); if (item.closeOnSelect) closeTree();}
          else if (item.type === "radio") {if (!item.checked) item.onCheckedChange(true); if (item.closeOnSelect) closeTree();}
          else {closeTree(); onAction?.(item.id);}
        }}>
        {hasIcons && <span className="flood-menu__icon" aria-hidden="true">{item.icon}</span>}
        <span className="flood-menu__label">{item.label}</span>
        {"shortcut" in item && item.shortcut && <span className="flood-menu__shortcut" aria-hidden="true"><Kbd>{item.shortcut}</Kbd></span>}
        {(item.type === "checkbox" || item.type === "radio") && <span className="flood-menu__icon flood-menu__indicator" aria-hidden="true">{item.checked &&
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {item.type === "radio" ? <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" /> : item.checked === "mixed" ? <path d="M6 12h12" /> : <path d="m5 12 4 4L19 6" />}
          </svg>}</span>}
        {submenu && <span className="flood-menu__icon flood-menu__submenu-indicator" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m9 5 7 7-7 7" /></svg></span>}
      </Button>
      {item.type === "submenu" && <MenuLayer id={childId} ref={childRef(item.id)}
        label={item.label} items={item.items} open={openChild === item.id && !item.disabled}
        requestOpen={next => {if (next && !item.disabled) setOpenChild(item.id); else setOpenChild(current => current === item.id ? undefined : current);}}
        closeTree={closeTree} anchor={() => anchors.current.get(item.id) ?? null} rootAnchor={rootAnchor}
        rootPanel={rootPanel ?? (() => panel.current)} onAction={onAction} controlSize={controlSize} nested />}
    </Fragment>;
  };
  const rows: ReactNode[] = [];
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    if (item.type !== "radio") {rows.push(renderItem(item)); continue;}
    const group = [item];
    while (items[index + 1]?.type === "radio" && (items[index + 1] as typeof item).group === item.group) group.push(items[++index] as typeof item);
    rows.push(<div key={`radio-${item.id}`} role="group" aria-label={item.group}>
      <div className="flood-menu__group-label" aria-hidden="true">{item.group}</div>{group.map(renderItem)}
    </div>);
  }
  return <div {...props} ref={panel} id={id} popover="manual" role="menu" aria-label={label} aria-orientation="vertical" tabIndex={-1}
    className={["flood-overlay-panel", "flood-menu", nested && "flood-menu--submenu", className].filter(Boolean).join(" ")}
    onKeyDown={event => {
      if ((event.target as Element).closest('[role="menu"]') !== panel.current) return;
      onKeyDown?.(event); if (event.defaultPrevented) return;
      const all = ownButtons(panel.current), index = all.indexOf(event.target as HTMLButtonElement);
      if (event.key === "Tab") {
        clearHover();
        const source = current.current.rootAnchor();
        if (source) {
          const scope = source.closest("dialog[open]") ?? source.ownerDocument.body;
          const stops = tabbables(scope as HTMLElement).filter(node => !wholePanel()?.contains(node));
          const at = stops.indexOf(source), target = event.shiftKey ? source : at >= 0 ? stops[at + 1] : undefined;
          if (target) {event.preventDefault(); target.focus();} else source.focus();
        }
        closeTree(); return;
      }
      if (event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) return;
      const rtl = panel.current && getComputedStyle(panel.current).direction === "rtl";
      if (nested && event.key === (rtl ? "ArrowRight" : "ArrowLeft")) {
        event.preventDefault(); event.stopPropagation(); requestOpen(false); return;
      }
      if (event.key === (rtl ? "ArrowLeft" : "ArrowRight")) {
        const item = items.find(item => item.id === all[index]?.dataset.menuId);
        if (item?.type === "submenu") {event.preventDefault(); if (!item.disabled) showChild(item);}
        return;
      }
      let next = event.key === "Home" ? 0 : event.key === "End" ? all.length - 1 : event.key === "ArrowDown" ? (index + 1) % all.length : event.key === "ArrowUp" ? (index - 1 + all.length) % all.length : -1;
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {clearHover(); setOpenChild(undefined); search.current = {text:"",time:0};}
      if (event.key.length === 1 && event.key !== " ") {
        clearHover(); setOpenChild(undefined);
        const now = Date.now(); search.current = {text:(now-search.current.time < 700 ? search.current.text : "") + event.key.toLocaleLowerCase(),time:now};
        const text = Array.from(search.current.text).every(char => char === search.current.text[0]) ? search.current.text[0] : search.current.text;
        const start = text.length === 1 ? index + 1 : Math.max(0,index);
        next = Array.from({length:all.length},(_,offset) => (start+offset)%all.length).find(candidate => all[candidate].dataset.label?.toLocaleLowerCase().startsWith(text)) ?? -1;
        event.preventDefault();
      }
      if (next >= 0 && all[next]) {event.preventDefault(); all[next].focus({preventScroll:true}); all[next].scrollIntoView({block:"nearest",inline:"nearest"});}
    }}>
    {open && <ScrollArea orientation="vertical" role="group" tabIndex={-1} className="flood-menu__viewport">{rows}</ScrollArea>}
  </div>;
});

export const ActionMenu = forwardRef<HTMLDivElement, MenuProps>(function ActionMenu({
  label, trigger, items, onAction, open:controlled, defaultOpen, onOpenChange, disabled,
  side = "bottom", align = "start", controlSize = "sm", ...props
}, forwardedRef) {
  if (!label.trim()) throw new Error("Flood Menu requires a nonempty label");
  validateMenuTree(items);
  const [local, setLocal] = useState(Boolean(defaultOpen)), requestedOpen = controlled ?? local;
  const open = !disabled && requestedOpen;
  const anchor = useRef<HTMLButtonElement>(null), panel = useRef<HTMLDivElement>(null), edge = useRef<Edge>("first");
  const pending = useRef<boolean | undefined>(undefined);
  const current = useRef({controlled,onOpenChange}); current.current = {controlled,onOpenChange};
  const request = (next: boolean) => {
    if (pending.current === next) return;
    pending.current = next; queueMicrotask(() => {pending.current = undefined;});
    if (current.current.controlled === undefined) setLocal(next);
    current.current.onOpenChange?.(next);
  };
  useImperativeHandle(forwardedRef, () => panel.current!, []);
  useEffect(() => {if (disabled && requestedOpen) request(false);},[disabled,requestedOpen]);
  const setAnchor = useCallback((node: HTMLButtonElement | null) => {anchor.current = node;},[]);
  const triggerProps: OverlayTriggerProps = {ref:setAnchor,type:"button",disabled,"aria-haspopup":"menu","aria-expanded":open,
    onClick:() => {edge.current = "first"; request(!open);},
    onKeyDown:event => {
      if (event.defaultPrevented || disabled || event.altKey || event.ctrlKey || event.metaKey || !["ArrowDown","ArrowUp"].includes(event.key)) return;
      event.preventDefault(); edge.current = event.key === "ArrowUp" ? "last" : "first";
      if (open && panel.current?.matches(":popover-open")) focusMenuEdge(panel.current,edge.current); else request(true);
    }};
  const generated = useId(), id = props.id ?? `flood-menu-${generated}`;
  triggerProps["aria-controls"] = id;
  return <>{trigger(triggerProps)}<MenuLayer {...props} id={id} ref={panel} label={label} items={items} open={open}
    requestOpen={request} closeTree={() => request(false)} anchor={() => anchor.current} rootAnchor={() => anchor.current}
    onAction={onAction} edge={() => edge.current} side={side} align={align} controlSize={controlSize} /></>;
});
