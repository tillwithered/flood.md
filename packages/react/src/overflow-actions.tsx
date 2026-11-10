import {forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type RefCallback} from "react";
import {Button, IconSlot, Menu, Toolbar, type OverflowAction, type OverflowActionsProps} from "./index.js";
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export const AdaptiveActions = /* @__PURE__ */ forwardRef<HTMLDivElement, OverflowActionsProps>(function AdaptiveActions({
  label, items, onAction, moreLabel="More actions", size="md", variant="subtle", shape="pill", containerVariant="contained", disabled=false, leading, trailing, maxVisibleActions, className, ...props
}, ref) {
  if (!label.trim() || !moreLabel.trim() || items.some(item=>!item.id.trim() || !item.label.trim() || (item.priority!==undefined&&!Number.isFinite(item.priority))) || new Set(items.map(item=>item.id)).size!==items.length) throw new Error("Flood OverflowActions requires unique named actions and finite priorities");
  if(maxVisibleActions!==undefined&&(!Number.isInteger(maxVisibleActions)||maxVisibleActions<0))throw new Error("Flood OverflowActions maxVisibleActions must be a nonnegative integer");
  const root=useRef<HTMLDivElement>(null), measure=useRef<HTMLDivElement>(null), more=useRef<HTMLButtonElement>(null);
  const before=useRef<HTMLDivElement>(null), after=useRef<HTMLDivElement>(null);
  const menuAnchor=useRef<RefCallback<HTMLButtonElement> | null>(null);
  const setMore=useCallback((node:HTMLButtonElement|null)=>{more.current=node;menuAnchor.current?.(node);},[]);
  useImperativeHandle(ref,()=>root.current!,[]);
  const [visibleIds,setVisibleIds]=useState<readonly string[]>(()=>items.map(item=>item.id));
  const [open,setOpen]=useState(false), focusAfter=useRef(false);
  const visible=items.filter(item=>visibleIds.includes(item.id)), hidden=items.filter(item=>!visibleIds.includes(item.id));
  const action=(item:OverflowAction, measuring=false)=><Button key={item.id} size={size} variant={variant}
    tone={item.tone} disabled={disabled||item.disabled} data-overflow-action={measuring?undefined:item.id} data-measure-action={measuring?item.id:undefined}
    tabIndex={measuring?-1:undefined} onClick={measuring?undefined:()=>onAction?.(item.id)}>
    {item.icon&&<IconSlot size={size}>{item.icon}</IconSlot>}{item.label}
  </Button>;
  const overflow=(measuring=false)=><Button size={size} variant={variant} disabled={disabled} tabIndex={measuring?-1:undefined} data-measure-more={measuring||undefined}>
    {moreLabel}<IconSlot size={size}><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg></IconSlot>
  </Button>;
  useBrowserLayoutEffect(()=>{
    const node=root.current, measured=measure.current, view=node?.ownerDocument.defaultView;
    if(!node||!measured||!view)return;
    const update=()=>{
      const widths=new Map([...measured.querySelectorAll<HTMLElement>('[data-measure-action]')].map(item=>[item.dataset.measureAction!,item.getBoundingClientRect().width]));
      const bar=node.querySelector<HTMLElement>('[role="toolbar"]'), gap=bar?parseFloat(view.getComputedStyle(bar).columnGap)||0:0;
      const barStyle=bar?view.getComputedStyle(bar):null;
      const rootStyle=view.getComputedStyle(node);
      const available=Math.max(0,node.clientWidth-parseFloat(rootStyle.paddingLeft)-parseFloat(rootStyle.paddingRight)-(barStyle?parseFloat(barStyle.paddingLeft)+parseFloat(barStyle.paddingRight)+parseFloat(barStyle.borderLeftWidth)+parseFloat(barStyle.borderRightWidth):0)), extra=measured.querySelector<HTMLElement>('[data-measure-more]')?.getBoundingClientRect().width??0;
      const fixed=[before.current,after.current].filter((item):item is HTMLDivElement=>item!==null);
      const fixedWidth=fixed.reduce((sum,item)=>sum+item.getBoundingClientRect().width,0);
      const kept=new Set(items.map(item=>item.id));
      const width=(withMore:boolean)=>fixedWidth+items.filter(item=>kept.has(item.id)).reduce((sum,item)=>sum+(widths.get(item.id)??0),0)+(withMore?extra:0)+Math.max(0,kept.size+fixed.length+(withMore?1:0)-1)*gap;
      const order=items.map((item,index)=>({item,index})).sort((a,b)=>(a.item.priority??0)-(b.item.priority??0)||b.index-a.index);
      for(const {item}of order){
        if(kept.size<=(maxVisibleActions??items.length)&&width(kept.size<items.length)<=available)break;
        kept.delete(item.id);
      }
      const next=items.filter(item=>kept.has(item.id)).map(item=>item.id);
      const active=node.ownerDocument.activeElement as HTMLElement|null;
      const activeId=active?.dataset.overflowAction;
      if((activeId&&!kept.has(activeId)) || (!items.some(item=>!kept.has(item.id))&&more.current?.contains(active)))focusAfter.current=true;
      setVisibleIds(previous=>previous.join("\0")===next.join("\0")?previous:next);
    };
    update();
    const observer=view.ResizeObserver?new view.ResizeObserver(update):undefined;
    observer?.observe(node);observer?.observe(measured);
    if(before.current)observer?.observe(before.current);if(after.current)observer?.observe(after.current);
    let alive=true;void node.ownerDocument.fonts?.ready.then(()=>{if(alive)update();});
    return()=>{alive=false;observer?.disconnect();};
  },[items,size,variant,moreLabel,disabled,leading,trailing,maxVisibleActions]);
  useBrowserLayoutEffect(()=>{
    if(!hidden.length&&open){setOpen(false);focusAfter.current=true;}
    if(focusAfter.current){focusAfter.current=false;(more.current??root.current?.querySelector<HTMLButtonElement>('[data-overflow-action]:not(:disabled)'))?.focus({preventScroll:true});}
  },[visibleIds,hidden.length,open]);
  return <div {...props} ref={root} className={["flood-overflow-actions",className].filter(Boolean).join(" ")}>
    <Toolbar label={label} shape={shape} variant={containerVariant} className="flood-overflow-actions__bar">
      {leading!=null&&<div ref={before} className="flood-overflow-actions__leading">{leading}</div>}
      {visible.map(item=>action(item))}
      {hidden.length>0&&<Menu label={moreLabel} items={hidden} open={open} onOpenChange={setOpen} onAction={onAction} disabled={disabled} controlSize={size}
        trigger={trigger=>{menuAnchor.current=trigger.ref;return <Button {...trigger} ref={setMore} size={size} variant={variant}>
          {moreLabel}<IconSlot size={size}><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg></IconSlot>
        </Button>;}}/>}
      {trailing!=null&&<div ref={after} className="flood-overflow-actions__trailing">{trailing}</div>}
    </Toolbar>
    <div ref={node=>{measure.current=node;if(node)node.inert=true;}} className="flood-overflow-actions__measure" aria-hidden="true">{items.map(item=>action(item,true))}{overflow(true)}</div>
  </div>;
});
