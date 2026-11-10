import {forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState, type RefCallback} from "react";
import type {NavigationTreeItem, NavigationTreeProps} from "./index.js";
import {NavigationItem, Popover, NavigationTree} from "./index.js";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const branch = (item: NavigationTreeItem) => item.children !== undefined || item.content !== undefined;

/** Ordinary website navigation uses disclosure lists, not application tree selection semantics. */
export const HierarchicalNavigation = /* @__PURE__ */ forwardRef<HTMLElement, NavigationTreeProps>(function HierarchicalNavigation({
  label, items, currentValue, currentKind = "page", expandedValues, defaultExpandedValues = [], onExpandedValuesChange,
  expandLabel = (item, expanded) => `${expanded ? "Collapse" : "Expand"} ${item.label}`,
  size = "md", variant = "quiet", compact = false, flyoutSide = "right", branchGuides = false, id: explicitId, className, tabIndex = -1, ...props
}, forwardedRef) {
  if (!label.trim()) throw new Error("Flood NavigationTree requires a nonempty label");
  const generated = useId(), id = explicitId ?? `flood-navigation-tree-${generated}`;
  const root = useRef<HTMLElement>(null);
  useImperativeHandle(forwardedRef, () => root.current!, []);
  const [local, setLocal] = useState(() => [...new Set(defaultExpandedValues)]);
  const [flyout,setFlyout]=useState<{value:string;preview:boolean}|null>(null);
  const hoverTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const clearHover=()=>clearTimeout(hoverTimer.current);
  useEffect(()=>{setFlyout(null);return clearHover;},[compact,currentValue]);
  const leaveFlyout=(value:string)=>{
    clearHover();
    hoverTimer.current=setTimeout(()=>setFlyout(current=>current?.value===value&&current.preview?null:current),240);
  };
  const expanded = new Set(expandedValues ?? local);
  const known = new Set<string>(), visible = new Set<string>();
  const parents = new Map<string, string | undefined>();
  const pending: Array<{items:readonly NavigationTreeItem[]; parent?:string; shown:boolean; ancestors:Set<readonly NavigationTreeItem[]>}> = [{items, shown:true, ancestors:new Set()}];
  while (pending.length) {
    const level = pending.pop()!;
    if (level.ancestors.has(level.items)) throw new Error("Flood NavigationTree does not accept recursive item arrays");
    const ancestors = new Set(level.ancestors); ancestors.add(level.items);
    for (const item of level.items) {
      if (!item.value.trim() || !item.label.trim() || known.has(item.value)) throw new Error("Flood NavigationTree requires globally unique nonempty values and labels");
      known.add(item.value); parents.set(item.value, level.parent);
      if (level.shown) visible.add(item.value);
      if (item.children) pending.push({items:item.children, parent:item.value, shown:level.shown && expanded.has(item.value), ancestors});
    }
  }
  const currentAncestors = new Set<string>();
  for (let parent = currentValue === undefined ? undefined : parents.get(currentValue); parent !== undefined; parent = parents.get(parent)) {
    currentAncestors.add(parent);
  }
  const latest = useRef({visible, parents}); latest.current = {visible, parents};
  const destinations = useRef(new Map<string, HTMLElement>());
  const refs = useRef(new Map<string, (node:HTMLElement|null) => void>());
  const refAncestors = useRef(new Map<string, string[]>());
  const railAnchors=useRef(new Map<string,RefCallback<HTMLButtonElement>>());
  const railRefs=useRef(new Map<string,RefCallback<HTMLElement>>());
  const repair = (removed: HTMLElement, ancestors: string[]) => {
    const active = removed.ownerDocument.activeElement;
    if (!active || !removed.contains(active)) return;
    for (const value of ancestors) {
      const target = destinations.current.get(`disclosure:${value}`) ?? destinations.current.get(`link:${value}`);
      if (latest.current.visible.has(value) && target?.isConnected && !target.matches(":disabled")) {target.focus({preventScroll:true}); return;}
    }
    root.current?.focus({preventScroll:true});
  };
  const bind = (key: string, ancestors: string[]) => {
    refAncestors.current.set(key,ancestors);
    if (!refs.current.has(key)) {
      let previous: HTMLElement | null = null;
      refs.current.set(key, node => {
        if (!node && previous) repair(previous, refAncestors.current.get(key) ?? []);
        previous = node;
        if (node) destinations.current.set(key,node); else destinations.current.delete(key);
      });
    }
    return refs.current.get(key)!;
  };
  const bindRail=(value:string,anchor:RefCallback<HTMLButtonElement>)=>{
    const key=`disclosure:${value}`;railAnchors.current.set(key,anchor);bind(key,[]);
    if(!railRefs.current.has(key))railRefs.current.set(key,node=>{bind(key,[])(node);railAnchors.current.get(key)?.(node as HTMLButtonElement|null);});
    return railRefs.current.get(key)!;
  };
  useBrowserLayoutEffect(() => {
    for (const key of refs.current.keys()) if (!known.has(key.slice(key.indexOf(":")+1))) {refs.current.delete(key); refAncestors.current.delete(key);railRefs.current.delete(key);railAnchors.current.delete(key);}
  }, [items]);
  const toggle = (value: string) => {
    const next = new Set(expandedValues ?? local);
    if (next.has(value)) next.delete(value); else next.add(value);
    const values = [...next];
    if (expandedValues === undefined) setLocal(values);
    onExpandedValuesChange?.(values);
  };
  const render = (entries: readonly NavigationTreeItem[], ancestors: string[] = []) => entries.map(item => {
    const open = expanded.has(item.value), expandable = branch(item), current = item.value === currentValue;
    const contentId = `${id}-branch-${encodeURIComponent(item.value)}`;
    const disclosureLabel = expandable ? expandLabel(item,open) : "";
    if (expandable && !disclosureLabel.trim()) throw new Error("Flood NavigationTree disclosure labels must be nonempty");
    const ancestorCurrent = currentAncestors.has(item.value) && (compact ? flyout?.value !== item.value : !open);
    const linkProps={...item.linkProps,className:["flood-navigation-tree__link",item.linkProps?.className].filter(Boolean).join(" ")};
    const shared={label:item.label,icon:item.icon,reserveIcon:entries.some(entry=>entry.icon!=null),size,variant,current,currentKind,ancestorCurrent,disabled:item.disabled,className:"flood-navigation-tree__row"};
    if(compact){
      const shown=flyout?.value===item.value;
      const preview=shown&&flyout.preview;
      const hover=item.flyout?.openOnHover&&!item.disabled;
      return <li key={item.value}>{expandable?<Popover title={item.label} chrome="title-only" side={flyoutSide} align="start" open={shown} disabled={item.disabled}
        positionReference={item.flyout?.positionReference} focusOnOpen={!preview}
        onOpenChange={open=>{clearHover();setFlyout(open?{value:item.value,preview:false}:null);}} className="flood-navigation-tree__flyout"
        onPointerEnter={hover?clearHover:undefined}
        onPointerLeave={hover?()=>leaveFlyout(item.value):undefined}
        onFocusCapture={hover&&preview?()=>{clearHover();setFlyout({value:item.value,preview:false});}:undefined}
        onClick={event=>{if(!event.defaultPrevented&&(event.target as HTMLElement).closest('a[href]')){clearHover();setFlyout(null);}}}
        trigger={({ref:anchor,...trigger})=><NavigationItem {...shared} compact actionProps={{...trigger,
          onPointerEnter:hover?event=>{
            if(event.pointerType!=="mouse")return;
            clearHover();
            hoverTimer.current=setTimeout(()=>setFlyout(current=>current&&!current.preview?current:{value:item.value,preview:true}),130);
          }:undefined,
          onPointerLeave:hover?()=>leaveFlyout(item.value):undefined,
          onClick:preview?()=>{clearHover();setFlyout({value:item.value,preview:false});}:trigger.onClick,
        }} controlRef={bindRail(item.value,anchor)} tooltip={!hover&&!shown} tooltipSide={flyoutSide}/> }>
        {(item.href||item.children?.length) ? <NavigationTree label={item.label} size={size} variant={variant} currentValue={currentValue} currentKind={currentKind} branchGuides={branchGuides}
          items={[...(item.href?[{...item,children:undefined,content:undefined}]:[]),...(item.children??[])]}
          expandedValues={expandedValues??local} onExpandedValuesChange={values=>{if(expandedValues===undefined)setLocal(values);onExpandedValuesChange?.(values);}} expandLabel={expandLabel}/> : null}
        {item.content}
      </Popover>:<NavigationItem {...shared} compact href={item.href} linkProps={linkProps} controlRef={bind(`link:${item.value}`,[])} tooltipSide={flyoutSide}/>}</li>;
    }
    return <li key={item.value}>
      <NavigationItem {...shared} href={item.href} linkProps={linkProps} trailing={item.trailing} trailingAction={item.trailingAction}
        controlRef={bind(`${item.href!==undefined?'link':'disclosure'}:${item.value}`,ancestors)}
        disclosureRef={bind(`disclosure:${item.value}`,ancestors)}
        disclosure={expandable?{expanded:open,onExpandedChange:()=>toggle(item.value),label:disclosureLabel,controls:open?contentId:undefined}:undefined}/>
      {expandable && open && <div id={contentId} ref={bind(`group:${item.value}`,[item.value,...ancestors])} className="flood-navigation-tree__branch">
        {item.children && item.children.length > 0 && <ul>{render(item.children,[item.value,...ancestors])}</ul>}
        {item.content != null && <div className="flood-navigation-tree__content">{item.content}</div>}
      </div>}
    </li>;
  });
  return <nav {...props} ref={root} id={id} aria-label={label} tabIndex={tabIndex} data-size={size} data-compact={compact||undefined} data-branch-guides={branchGuides||undefined}
    className={["flood-navigation-tree",className].filter(Boolean).join(" ")}><ul>{render(items)}</ul></nav>;
});
