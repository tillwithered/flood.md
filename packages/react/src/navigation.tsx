import {forwardRef,useEffect,useId,useImperativeHandle,useLayoutEffect,useRef,useState,type ReactNode} from "react";
import type {TabsProps,BreadcrumbItem,BreadcrumbProps,PaginationProps,CursorPaginationProps} from "./index.js";
import {Button, CountBadge, IconButton, IconLink, IconSlot, Link, List, Popover, ScrollArea, Text, Tooltip, TruncatedText, VisuallyHidden} from "./index.js";
import {useInlineOverflow} from "./use-inline-overflow.js";
import {pageWindow} from "./page-window.js";
const useBrowserLayoutEffect=typeof window==="undefined"?useEffect:useLayoutEffect;

export const TabNavigation=/* @__PURE__ */ forwardRef<HTMLDivElement,TabsProps>(function TabNavigation({label,items,value,defaultValue,onValueChange,activationMode="automatic",orientation="horizontal",variant="contained",controlSize="md",disabled=false,iconOnly=false,maxCount,formatCountLabel,className,onKeyDown,id:explicitId,...props},ref){
  const generated=useId(),id=explicitId??`flood-tabs-${generated}`;
  const [local,setLocal]=useState(defaultValue),[focused,setFocused]=useState<string>();
  const root=useRef<HTMLDivElement>(null),list=useRef<HTMLDivElement>(null),focusedPanel=useRef<string|undefined>(undefined);
  const viewport=useRef<HTMLDivElement>(null);
  useImperativeHandle(ref,()=>root.current!,[]);
  if(new Set(items.map(item=>item.value)).size!==items.length)throw new Error("Flood tab values must be unique");
  if(iconOnly&&items.some(item=>!item.icon))throw new Error("Flood icon-only tabs require icons");
  const available=items.filter(item=>!item.disabled),enabled=disabled?[]:available;
  const selected=available.find(item=>item.value===(value??local))?.value??available[0]?.value;
  const tabStop=enabled.some(item=>item.value===focused)?focused:selected;
  const select=(next:string)=>{if(next===selected)return;if(value===undefined)setLocal(next);onValueChange?.(next);};
  const activeIndex = items.findIndex(item=>item.value === tabStop);
  useBrowserLayoutEffect(()=>{
    const rail = viewport.current;
    const tabList = list.current;
    const tab = tabList?.children[activeIndex];
    if (!rail || !tabList || !tab) return;
    const reveal = () => {
      const outer = rail.getBoundingClientRect(), inner = tab.getBoundingClientRect();
      const horizontal = orientation === "horizontal";
      const start = horizontal ? inner.left - outer.left : inner.top - outer.top;
      const end = horizontal ? inner.right - outer.right : inner.bottom - outer.bottom;
      const oversized = horizontal ? inner.width > outer.width : inner.height > outer.height;
      const rtl = horizontal && getComputedStyle(rail).direction === "rtl";
      const delta = oversized ? (rtl ? end : start) : start < -1 ? start : end > 1 ? end : 0;
      if (Math.abs(delta) > 1) rail.scrollBy(horizontal ? {left:delta,behavior:"instant"} : {top:delta,behavior:"instant"});
    };
    reveal();
    const Observer = rail.ownerDocument.defaultView?.ResizeObserver;
    const observer = Observer && new Observer(reveal);
    observer?.observe(rail);
    observer?.observe(tabList);
    return ()=>observer?.disconnect();
  },[activeIndex,orientation,tabStop]);
  useBrowserLayoutEffect(()=>{
    if(focusedPanel.current===undefined||focusedPanel.current===selected)return;
    const index=items.findIndex(item=>item.value===focusedPanel.current),panel=root.current?.ownerDocument.getElementById(`${id}-panel-${index}`);
    const active=root.current?.ownerDocument.activeElement;
    if(active===root.current?.ownerDocument.body||panel?.contains(active??null)){
      const next=items.findIndex(item=>item.value===selected);root.current?.ownerDocument.getElementById(`${id}-tab-${next}`)?.focus();
    }
    focusedPanel.current=undefined;
  },[selected,id,items]);
  return <div {...props} ref={root} id={id} className={["flood-tabs",className].filter(Boolean).join(" ")} data-orientation={orientation} data-variant={variant} onKeyDown={event=>{
    onKeyDown?.(event);if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||event.nativeEvent.isComposing)return;
    const buttons=Array.from(list.current?.querySelectorAll<HTMLButtonElement>(':scope > button[role="tab"]:not(:disabled)')??[]),index=buttons.indexOf(event.target as HTMLButtonElement);
    if(index<0)return;const rtl=getComputedStyle(event.currentTarget).direction==="rtl";
    const nextKey=orientation==="vertical"?"ArrowDown":rtl?"ArrowLeft":"ArrowRight",previousKey=orientation==="vertical"?"ArrowUp":rtl?"ArrowRight":"ArrowLeft";
    const next=event.key==="Home"?0:event.key==="End"?buttons.length-1:event.key===nextKey?(index+1)%buttons.length:event.key===previousKey?(index-1+buttons.length)%buttons.length:-1;
    if(next>=0){event.preventDefault();buttons[next].focus();if(activationMode==="automatic")select(buttons[next].dataset.value!);}
  }}>
    <ScrollArea ref={viewport} orientation={orientation} tabIndex={-1} className="flood-tabs__scroll">
      <div ref={list} role="tablist" aria-label={label} aria-orientation={orientation} className="flood-tabs__list" onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setFocused(undefined)}}>
        {items.map((item,index)=>{
          const countId = item.count === undefined ? undefined : `${id}-count-${index}`;
          return <Button variant="ghost" size={controlSize} key={item.value} id={`${id}-tab-${index}`} type="button" role="tab" aria-selected={item.value===selected} aria-controls={`${id}-panel-${index}`} data-value={item.value}
            disabled={disabled||item.disabled} tabIndex={item.value===tabStop?0:-1} aria-label={iconOnly||countId?item.label:undefined}
            aria-describedby={countId} className={`flood-tab${iconOnly?" flood-icon-button":""}`} onFocus={()=>setFocused(item.value)} onClick={()=>select(item.value)}>
            {item.icon&&<IconSlot size={controlSize}>{item.icon}</IconSlot>}
            {!iconOnly&&<span className="flood-tab__label">{item.label}</span>}
            {item.count !== undefined && <>
              <CountBadge count={item.count} max={maxCount} lang={props.lang ?? "en"} showZero
                presentation={iconOnly?"dot":"count"} aria-hidden="true" className="flood-tab__count"/>
              <VisuallyHidden id={countId}>{formatCountLabel?.(item.count,item) ?? String(item.count)}</VisuallyHidden>
            </>}
          </Button>;
        })}
      </div>
    </ScrollArea>
    {items.map((item,index)=><div key={item.value} id={`${id}-panel-${index}`} role="tabpanel" aria-labelledby={`${id}-tab-${index}`} tabIndex={0} hidden={item.value!==selected} className="flood-tabs__panel"
      onFocusCapture={()=>{focusedPanel.current=item.value}} onBlurCapture={event=>{if(!event.currentTarget.hidden)focusedPanel.current=undefined}}>{item.content}</div>)}
  </div>;
});

function CompactCrumb({item,current}: {item:BreadcrumbItem;current:boolean}) {
  const {ref,overflow} = useInlineOverflow(item.label,item.href !== undefined);
  const ariaCurrent = current ? "page" as const : undefined;
  if (item.href === undefined) return <span aria-current={ariaCurrent}><TruncatedText>{item.label}</TruncatedText></span>;
  return <Tooltip content={item.label} disabled={!overflow} trigger={trigger=>
    <Link {...trigger} aria-describedby={undefined} href={item.href!} aria-current={ariaCurrent}>
      <span ref={ref} className="flood-breadcrumb__clip">{item.label}</span>
    </Link>}/>;
}

function BreadcrumbOverflow({items,label}: {items:readonly BreadcrumbItem[];label:string}) {
  const [open,setOpen] = useState(false);
  const initialFocus = useRef<HTMLAnchorElement>(null);
  const firstLink = items.findIndex(item=>item.href !== undefined);
  return <Popover title={label} chrome="title-only" className="flood-breadcrumb__panel"
    open={open} onOpenChange={setOpen} initialFocusRef={initialFocus}
    trigger={trigger=><IconButton {...trigger} label={label} title={label} size="sm" variant="ghost">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
    </IconButton>}>
    <ScrollArea className="flood-breadcrumb__ancestor-scroll" aria-label={label}>
      <List marker={false} gap="1">{items.map((item,index)=><li key={index}>
        {item.href !== undefined ? <Link ref={index === firstLink ? initialFocus : undefined} href={item.href} variant="ghost" size="sm" onClick={event=>{
          if (!event.defaultPrevented && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) setOpen(false);
        }}>{item.label}</Link> : <Text size="compact" tone="subtle">{item.label}</Text>}
      </li>)}</List>
    </ScrollArea>
  </Popover>;
}

export const BreadcrumbNavigation=/* @__PURE__ */ forwardRef<HTMLElement,BreadcrumbProps>(function BreadcrumbNavigation(
  {items,label,separator,layout,maxVisibleItems=2,overflowLabel="Earlier pages",className,...props},ref,
){
  const compact = layout === "compact";
  if (compact && (!Number.isSafeInteger(maxVisibleItems) || maxVisibleItems < 2)) {
    throw new RangeError("Flood compact Breadcrumb requires maxVisibleItems of at least 2");
  }
  const hiddenUntil = compact && items.length > maxVisibleItems ? items.length - maxVisibleItems + 1 : 1;
  const hidden = items.slice(1,hiddenUntil);
  if (hidden.length && !overflowLabel.trim()) throw new Error("Flood Breadcrumb overflow needs a label");
  const separatorMark = <span className="flood-breadcrumb__separator" aria-hidden="true">{separator}</span>;
  const crumb = (item:BreadcrumbItem,index:number) => {
    const current = index === items.length - 1;
    return <li key={index} data-current={current || undefined}>{index > 0 && separatorMark}
      {compact ? <CompactCrumb item={item} current={current}/> : item.href !== undefined
        ? <Link href={item.href} aria-current={current?"page":undefined}>{item.label}</Link>
        : <span aria-current={current?"page":undefined}>{item.label}</span>}
    </li>;
  };
  return <nav {...props} ref={ref} aria-label={label} data-layout={layout} className={["flood-breadcrumb",className].filter(Boolean).join(" ")}><ol>
    {items.length > 0 && crumb(items[0],0)}
    {hidden.length > 0 && <li className="flood-breadcrumb__overflow">{separatorMark}
      <BreadcrumbOverflow items={hidden} label={overflowLabel}/>
    </li>}
    {items.slice(hiddenUntil).map((item,index)=>crumb(item,index+hiddenUntil))}
  </ol></nav>;
});

function PageArrow({previous}: {previous: boolean}) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d={previous ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"} />
  </svg>;
}

export const PageNavigation=/* @__PURE__ */ forwardRef<HTMLElement,PaginationProps>(function PageNavigation({page,pageCount,onPageChange,getHref,siblingCount=1,presentation="numbered",formatPage=String,positionLabel=(page,count)=>`Page ${formatPage(page)} of ${formatPage(count)}`,controlSize="sm",disabled=false,label="Pagination",previousLabel="Previous page",nextLabel="Next page",pageLabel=page=>`Page ${formatPage(page)}`,className,...props},ref){
  const pages=pageWindow(page,pageCount,siblingCount);
  const variant = presentation === "arrows" ? "ghost" : "subtle";
  const control=(target:number,text:ReactNode,name:string,unavailable=false)=>{
    const inactive=disabled||unavailable,current=target===page;
    const shared={className:"flood-page","aria-label":name,"aria-current":current&&!unavailable?"page" as const:undefined};
    if(getHref)return inactive?<span {...shared} className={`flood-button flood-button--${variant} flood-button--${controlSize} flood-page`} role="link" aria-disabled="true">{text}</span>:<Link {...shared} variant={variant} size={controlSize} href={getHref(target)} onClick={event=>{if(!event.defaultPrevented&&event.button===0&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey&&!current)onPageChange?.(target)}}>{text}</Link>;
    return <Button {...shared} variant={variant} size={controlSize} type="button" disabled={inactive} onClick={()=>{if(!current)onPageChange?.(target)}}>{text}</Button>;
  };
  return <nav {...props} ref={ref} aria-label={label} data-presentation={presentation} className={["flood-pagination",className].filter(Boolean).join(" ")}><ul role="list">
    <li>{control(page-1,<PageArrow previous />,previousLabel,page===1)}</li>
    {presentation === "numbered"
      ? pages.map(item=><li key={item} aria-hidden={typeof item==="string"?true:undefined}>{typeof item==="number"?control(item,formatPage(item),pageLabel(item)):<span className="flood-page-gap">…</span>}</li>)
      : <li className={presentation === "arrows" ? "flood-visually-hidden" : "flood-page-position"}>
        <Text size="compact" aria-current="page">{positionLabel(page,pageCount)}</Text>
      </li>}
    <li>{control(page+1,<PageArrow previous={false} />,nextLabel,page===pageCount)}</li>
  </ul></nav>;
});

export const CursorPageNavigation = /* @__PURE__ */ forwardRef<HTMLElement, CursorPaginationProps>(function CursorPageNavigation(
  {previous, next, position, controlSize, variant, label, previousLabel = "Previous page", nextLabel = "Next page", pending, className, ...props}, ref,
) {
  const control = (direction: "previous" | "next") => {
    const target = direction === "previous" ? previous : next;
    const name = direction === "previous" ? previousLabel : nextLabel;
    const shared = {label:name, title:name, variant, size:controlSize, className:"flood-page"};
    const arrow = <PageArrow previous={direction === "previous"} />;
    return target?.href !== undefined && !pending
      ? <IconLink {...shared} href={target.href}>{arrow}</IconLink>
      : <IconButton {...shared} disabled={!target?.onSelect || Boolean(pending && pending !== direction)}
          loading={pending === direction && target?.onSelect ? "retain-focus" : false} onClick={target?.onSelect}>{arrow}</IconButton>;
  };
  return <nav {...props} ref={ref} aria-label={label} className={["flood-pagination", "flood-cursor-pagination", className].filter(Boolean).join(" ")}
    data-presentation={position ? "compact" : "arrows"}>
    <ul role="list">
      <li>{control("previous")}</li>
      {position && <li className="flood-page-position"><Text size="compact">{position}</Text></li>}
      <li>{control("next")}</li>
    </ul>
  </nav>;
});
