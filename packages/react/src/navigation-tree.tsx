import {forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState} from "react";
import type {NavigationTreeItem, NavigationTreeProps} from "./index.js";
import {IconButton, IconSlot, Link} from "./index.js";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const branch = (item: NavigationTreeItem) => item.children !== undefined || item.content !== undefined;

/** Ordinary website navigation uses disclosure lists, not application tree selection semantics. */
export const HierarchicalNavigation = forwardRef<HTMLElement, NavigationTreeProps>(function HierarchicalNavigation({
  label, items, currentValue, expandedValues, defaultExpandedValues = [], onExpandedValuesChange,
  expandLabel = (item, expanded) => `${expanded ? "Collapse" : "Expand"} ${item.label}`,
  size = "md", id: explicitId, className, tabIndex = -1, ...props
}, forwardedRef) {
  if (!label.trim()) throw new Error("Flood NavigationTree requires a nonempty label");
  const generated = useId(), id = explicitId ?? `flood-navigation-tree-${generated}`;
  const root = useRef<HTMLElement>(null);
  useImperativeHandle(forwardedRef, () => root.current!, []);
  const [local, setLocal] = useState(() => [...new Set(defaultExpandedValues)]);
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
  const latest = useRef({visible, parents}); latest.current = {visible, parents};
  const destinations = useRef(new Map<string, HTMLElement>());
  const refs = useRef(new Map<string, (node:HTMLElement|null) => void>());
  const refAncestors = useRef(new Map<string, string[]>());
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
  useBrowserLayoutEffect(() => {
    for (const key of refs.current.keys()) if (!known.has(key.slice(key.indexOf(":")+1))) {refs.current.delete(key); refAncestors.current.delete(key);}
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
    const body = <>{item.icon != null && <IconSlot size={size}>{item.icon}</IconSlot>}<span className="flood-navigation-tree__label">{item.label}</span></>;
    return <li key={item.value}>
      <div className="flood-navigation-tree__row" data-current={current || undefined}>
        {item.href !== undefined && !item.disabled ? <Link {...item.linkProps} href={item.href} ref={bind(`link:${item.value}`,ancestors)}
          variant="ghost" size={size} aria-current={current ? "page" : undefined}
          className={["flood-navigation-tree__link",item.linkProps?.className].filter(Boolean).join(" ")}>{body}</Link>
          : <span className="flood-navigation-tree__text" aria-disabled={item.disabled || undefined} aria-current={current ? "page" : undefined}>{body}</span>}
        {expandable && <IconButton ref={bind(`disclosure:${item.value}`,ancestors)} variant="ghost" size={size} label={disclosureLabel}
          className="flood-navigation-tree__disclosure" disabled={item.disabled} aria-expanded={open} aria-controls={open ? contentId : undefined}
          onClick={() => toggle(item.value)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m9 5 7 7-7 7" /></svg></IconButton>}
      </div>
      {expandable && open && <div id={contentId} ref={bind(`group:${item.value}`,[item.value,...ancestors])} className="flood-navigation-tree__branch">
        {item.children && item.children.length > 0 && <ul>{render(item.children,[item.value,...ancestors])}</ul>}
        {item.content != null && <div className="flood-navigation-tree__content">{item.content}</div>}
      </div>}
    </li>;
  });
  return <nav {...props} ref={root} id={id} aria-label={label} tabIndex={tabIndex} data-size={size}
    className={["flood-navigation-tree",className].filter(Boolean).join(" ")}><ul>{render(items)}</ul></nav>;
});
