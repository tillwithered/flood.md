import {forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState} from "react";
import {Button, IconSlot, Menu, Toolbar, type OverflowAction, type OverflowActionsProps} from "./index.js";
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export const AdaptiveActions = /* @__PURE__ */ forwardRef<HTMLDivElement, OverflowActionsProps>(function AdaptiveActions({
  label, items, onAction, moreLabel="More actions", size="md", variant="subtle", disabled=false, className, ...props
}, ref) {
  if (!label.trim() || !moreLabel.trim() || items.some(item=>!item.id.trim() || !item.label.trim() || (item.priority!==undefined&&!Number.isFinite(item.priority))) || new Set(items.map(item=>item.id)).size!==items.length) throw new Error("Flood OverflowActions requires unique named actions and finite priorities");
  const root=useRef<HTMLDivElement>(null), measure=useRef<HTMLDivElement>(null), more=useRef<HTMLButtonElement>(null);
  useImperativeHandle(ref,()=>root.current!,[]);
  const [visibleIds,setVisibleIds]=useState<readonly string[]>(()=>items.map(item=>item.id));
  const [open,setOpen]=useState(false), focusAfter=useRef(false);
  const visible=items.filter(item=>visibleIds.includes(item.id)), hidden=items.filter(item=>!visibleIds.includes(item.id));
  const action=(item:OverflowAction, measuring=false)=><Button key={item.id} size={size} variant={variant}
    tone={item.tone} disabled={disabled||item.disabled} data-overflow-action={measuring?undefined:item.id} data-measure-action={measuring?item.id:undefined}
    tabIndex={measuring?-1:undefined} onClick={measuring?undefined:()=>onAction?.(item.id)}>
    {item.icon&&<IconSlot>{item.icon}</IconSlot>}{item.label}
  </Button>;
  const overflow=(measuring=false)=><Button size={size} variant={variant} disabled={disabled} tabIndex={measuring?-1:undefined} data-measure-more={measuring||undefined}>
    {moreLabel}<IconSlot><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg></IconSlot>
  </Button>;
  useBrowserLayoutEffect(()=>{
    const node=root.current, measured=measure.current, view=node?.ownerDocument.defaultView;
    if(!node||!measured||!view)return;
    const update=()=>{
      const widths=new Map([...measured.querySelectorAll<HTMLElement>('[data-measure-action]')].map(item=>[item.dataset.measureAction!,item.getBoundingClientRect().width]));
      const bar=node.querySelector<HTMLElement>('[role="toolbar"]'), gap=bar?parseFloat(view.getComputedStyle(bar).columnGap)||0:0;
      const available=bar?.clientWidth??node.clientWidth, extra=measured.querySelector<HTMLElement>('[data-measure-more]')?.getBoundingClientRect().width??0;
      const kept=new Set(items.map(item=>item.id));
      const width=()=>items.filter(item=>kept.has(item.id)).reduce((sum,item)=>sum+(widths.get(item.id)??0),0)+Math.max(0,kept.size-1)*gap;
      if(width()>available){
        const order=items.map((item,index)=>({item,index})).sort((a,b)=>(a.item.priority??0)-(b.item.priority??0)||b.index-a.index);
        for(const {item}of order){kept.delete(item.id);if(width()+extra+(kept.size?gap:0)<=available)break;}
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
    let alive=true;void node.ownerDocument.fonts?.ready.then(()=>{if(alive)update();});
    return()=>{alive=false;observer?.disconnect();};
  },[items,size,variant,moreLabel,disabled]);
  useBrowserLayoutEffect(()=>{
    if(!hidden.length&&open){setOpen(false);focusAfter.current=true;}
    if(focusAfter.current){focusAfter.current=false;(more.current??root.current?.querySelector<HTMLButtonElement>('[data-overflow-action]:not(:disabled)'))?.focus({preventScroll:true});}
  },[visibleIds,hidden.length,open]);
  return <div {...props} ref={root} className={["flood-overflow-actions",className].filter(Boolean).join(" ")}>
    <Toolbar label={label} className="flood-overflow-actions__bar">
      {visible.map(item=>action(item))}
      {hidden.length>0&&<Menu label={moreLabel} items={hidden} open={open} onOpenChange={setOpen} onAction={onAction} disabled={disabled} controlSize={size}
        trigger={trigger=><Button {...trigger} ref={node=>{more.current=node;trigger.ref(node);}} size={size} variant={variant}>
          {moreLabel}<IconSlot><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg></IconSlot>
        </Button>}/>} 
    </Toolbar>
    <div ref={node=>{measure.current=node;if(node)node.inert=true;}} className="flood-overflow-actions__measure" aria-hidden="true">{items.map(item=>action(item,true))}{overflow(true)}</div>
  </div>;
});
