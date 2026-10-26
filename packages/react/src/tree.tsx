import {forwardRef,useEffect,useId,useImperativeHandle,useLayoutEffect,useRef,useState} from "react";
import type {CSSProperties} from "react";
import type {TreeItem,TreeProps} from "./index.js";

const useBrowserLayoutEffect=typeof window==="undefined"?useEffect:useLayoutEffect;
const searchable=(value:string)=>value.normalize("NFKD").replace(/\p{M}/gu,"").toLocaleLowerCase();
interface Entry {item:TreeItem;parent?:string;level:number;position:number;size:number;branch:boolean;}
const values=(value:string|readonly string[]|undefined):string[]=>[...new Set(typeof value==="string"?(value?[value]:[]):value??[])];

/** Application selection, not navigation or a form field; expansion and selection are independent. */
export const SelectionTree=/* @__PURE__ */ forwardRef<HTMLDivElement,TreeProps>(function SelectionTree({
  label,hideLabel=false,items,value,defaultValue,onValueChange,multiple=false,
  expandedValues,defaultExpandedValues=[],onExpandedValuesChange,disabled=false,readOnly=false,
  controlSize="md",emptyMessage="No items.",loadingMessage="Loading…",unloadedMessage="Content not loaded.",readOnlyMessage="Selection is read only.",
  id:explicitId,className,onKeyDown,onClick,onDoubleClick,onFocus,onBlur,...props
},forwardedRef){
  if(![label,emptyMessage,loadingMessage,unloadedMessage,readOnlyMessage].every(text=>text.trim()))throw new Error("Flood Tree requires nonempty labels and state messages");
  const all=new Map<string,Entry>();
  const collect=(siblings:readonly TreeItem[],parent:string|undefined,level:number)=>{
    if(level>256)throw new Error("Flood Tree nesting exceeds the supported depth");
    siblings.forEach((item,index)=>{
      if(!item.value.trim()||!item.label.trim()||all.has(item.value))throw new Error("Flood Tree items require globally unique nonempty values and labels");
      all.set(item.value,{item,parent,level,position:index+1,size:siblings.length,branch:!!item.hasChildren||!!item.loading||!!item.children?.length});
      if(item.children)collect(item.children,item.value,level+1);
    });
  };collect(items,undefined,1);
  const [localSelected,setLocalSelected]=useState(()=>values(defaultValue));
  const [localExpanded,setLocalExpanded]=useState(()=>values(defaultExpandedValues));
  const selectedValues=values(value===undefined?localSelected:value).filter(key=>all.has(key)&&all.get(key)!.item.selectable!==false),selected=new Set(multiple?selectedValues:selectedValues.slice(0,1));
  const expandedList=values(expandedValues??localExpanded),expanded=new Set(expandedList);
  const visible:Entry[]=[];
  for(const entry of all.values()){
    let parent=entry.parent,shown=true;
    while(parent){if(!expanded.has(parent)){shown=false;break;}parent=all.get(parent)?.parent;}
    if(shown)visible.push(entry);
  }
  const visibleValues=new Set(visible.map(entry=>entry.item.value));
  const root=useRef<HTMLDivElement>(null),tree=useRef<HTMLDivElement>(null),nodes=useRef(new Map<string,HTMLDivElement>());
  const previous=useRef<{all:Map<string,Entry>;visible:Entry[]}>({all,visible});
  const [focused,setFocused]=useState<string>();
  const [direction,setDirection]=useState("ltr");
  const document=root.current?.ownerDocument,domFocused=document?.activeElement as HTMLElement|null|undefined;
  const wasFocused=!!domFocused&&!!root.current?.contains(domFocused)&&domFocused.hasAttribute("data-tree-value");
  let active=focused&&visibleValues.has(focused)?focused:undefined;
  if(!active&&focused){
    let ancestor=all.get(focused)?.parent??previous.current.all.get(focused)?.parent;
    while(ancestor){if(visibleValues.has(ancestor)){active=ancestor;break;}ancestor=all.get(ancestor)?.parent??previous.current.all.get(ancestor)?.parent;}
    if(!active){const old=previous.current.visible.findIndex(entry=>entry.item.value===focused);active=visible[Math.min(Math.max(old,0),visible.length-1)]?.item.value;}
  }
  active??=visible.find(entry=>selected.has(entry.item.value))?.item.value??visible[0]?.item.value;
  const generated=useId(),id=explicitId??`flood-tree-${generated}`;
  const itemId=(key:string)=>`${id}-item-${encodeURIComponent(key)}`;
  useImperativeHandle(forwardedRef,()=>root.current!,[]);
  useBrowserLayoutEffect(()=>{
    const node=root.current;if(!node)return;
    const update=()=>setDirection(node.ownerDocument.defaultView!.getComputedStyle(node).direction);update();
    const observer=new node.ownerDocument.defaultView!.MutationObserver(update);let ancestor:HTMLElement|null=node;
    while(ancestor){observer.observe(ancestor,{attributes:true,attributeFilter:["dir"]});ancestor=ancestor.parentElement;}
    return()=>observer.disconnect();
  },[props.dir]);
  useBrowserLayoutEffect(()=>{
    previous.current={all,visible};
    if(focused!==active)setFocused(active);
    const current=document?.activeElement;
    if(wasFocused&&!disabled&&(current===document?.body||!!current&&!!root.current?.contains(current))){
      if(active&&nodes.current.get(active)!==current)nodes.current.get(active)?.focus({preventScroll:true});
      else if(!active&&tree.current!==current)tree.current?.focus({preventScroll:true});
    }
  });
  const search=useRef({text:"",time:0});
  const focusItem=(key:string)=>{setFocused(key);nodes.current.get(key)?.focus({preventScroll:true});};
  const toggle=(entry:Entry)=>{
    if(disabled||entry.item.disabled||!entry.branch)return;
    const next=expanded.has(entry.item.value)?expandedList.filter(key=>key!==entry.item.value):[...expandedList,entry.item.value];
    if(expandedValues===undefined)setLocalExpanded(next);onExpandedValuesChange?.(next);
  };
  const select=(entry:Entry)=>{
    if(disabled||readOnly||entry.item.disabled||entry.item.readOnly||entry.item.selectable===false)return;
    const key=entry.item.value,next=multiple?(selected.has(key)?selectedValues.filter(value=>value!==key):[...selectedValues,key]):[key];
    if(next.length===selectedValues.length&&next.every((key,index)=>key===selectedValues[index]))return;
    if(value===undefined)setLocalSelected(next);onValueChange?.(multiple?next:key);
  };
  const eventEntry=(target:EventTarget|null)=>{
    if(!(target instanceof (root.current?.ownerDocument.defaultView?.Element??Element)))return;
    const node=(target as Element).closest<HTMLElement>("[data-tree-entry]");
    if(!node||!tree.current?.contains(node))return;return all.get(node.dataset.treeValue!);
  };
  const render=(siblings:readonly TreeItem[])=>siblings.map(item=>{
    const entry=all.get(item.value)!,open=entry.branch&&expanded.has(item.value),selectedItem=selected.has(item.value),status=open?(item.loading?loadingMessage:item.hasChildren&&item.children===undefined?unloadedMessage:entry.branch&&!item.children?.length?emptyMessage:undefined):undefined;
    return <div key={item.value} className="flood-tree__branch" data-tree-entry data-tree-value={item.value} data-has-icon={item.icon!=null||undefined} style={{"--flood-tree-depth":entry.level-1}as CSSProperties}>
      <div id={itemId(item.value)} ref={node=>{if(node)nodes.current.set(item.value,node);else nodes.current.delete(item.value);}}
      className="flood-tree__item" role="treeitem" data-tree-value={item.value} data-disabled={disabled||item.disabled||undefined} data-readonly={readOnly||item.readOnly||undefined}
      tabIndex={!disabled&&active===item.value?0:-1} aria-labelledby={[`${itemId(item.value)}-label`,item.description?`${itemId(item.value)}-description`:undefined].filter(Boolean).join(" ")} aria-describedby={[status?`${itemId(item.value)}-status`:undefined,readOnly||item.readOnly?`${id}-readonly`:undefined].filter(Boolean).join(" ")||undefined}
      aria-owns={open&&item.children?.length?`${itemId(item.value)}-group`:undefined}
      aria-level={entry.level} aria-posinset={entry.position} aria-setsize={entry.size} aria-expanded={entry.branch?open:undefined}
      aria-selected={item.selectable===false?undefined:selectedItem} aria-disabled={disabled||item.disabled||undefined} aria-busy={item.loading||undefined}>
      <div className="flood-tree__row" data-tree-row data-selected={selectedItem||undefined}>
        <span className="flood-tree__disclosure" data-tree-toggle={entry.branch?"true":undefined} aria-hidden="true">{entry.branch&&<svg viewBox="0 0 24 24" fill="none" className="flood-tree__chevron" data-expanded={open||undefined}><path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}</span>
        {item.icon!=null&&<span className="flood-tree__icon" aria-hidden="true">{item.icon}</span>}
        <span className="flood-tree__text"><span id={`${itemId(item.value)}-label`} className="flood-tree__label">{item.label}</span>{item.description&&<> <span id={`${itemId(item.value)}-description`} className="flood-tree__description">{item.description}</span></>}</span>
      </div>
      </div>
      {open&&!!item.children?.length&&<div id={`${itemId(item.value)}-group`} role="group" className="flood-tree__group">{render(item.children)}</div>}
      {status&&<div id={`${itemId(item.value)}-status`} className="flood-tree__branch-status" role="status">{status}</div>}
    </div>;
  });
  return <div {...props} id={id} ref={root} className={["flood-tree",`flood-control--${controlSize}`,className].filter(Boolean).join(" ")} data-disabled={disabled||undefined} data-readonly={readOnly||undefined} data-tree-direction={direction}
    onFocus={event=>{onFocus?.(event);const entry=eventEntry(event.target);if(entry)setFocused(entry.item.value);}}
    onBlur={onBlur} onClick={event=>{
      onClick?.(event);if(event.defaultPrevented||disabled)return;const entry=eventEntry(event.target);if(!entry)return;
      focusItem(entry.item.value);if(event.detail>1)return;
      if((event.target as Element).closest("[data-tree-toggle='true']"))toggle(entry);else if(entry.item.selectable===false&&entry.branch)toggle(entry);else select(entry);
    }} onDoubleClick={event=>{
      onDoubleClick?.(event);if(event.defaultPrevented||disabled)return;const entry=eventEntry(event.target);if(entry&&entry.item.selectable!==false&&!(event.target as Element).closest("[data-tree-toggle='true']"))toggle(entry);
    }} onKeyDown={event=>{
      onKeyDown?.(event);if(event.defaultPrevented||disabled||event.nativeEvent.isComposing||event.keyCode===229||event.altKey||event.ctrlKey||event.metaKey||(event.shiftKey&&event.key.length!==1))return;
      const entry=eventEntry(event.target);if(!entry)return;const index=visible.findIndex(item=>item.item.value===entry.item.value);
      const rtl=root.current?.ownerDocument.defaultView!.getComputedStyle(root.current).direction==="rtl";
      const forward=rtl?"ArrowLeft":"ArrowRight",back=rtl?"ArrowRight":"ArrowLeft";
      if(event.key==="ArrowDown"||event.key==="ArrowUp"||event.key==="Home"||event.key==="End"){
        event.preventDefault();const next=event.key==="Home"?0:event.key==="End"?visible.length-1:Math.max(0,Math.min(visible.length-1,index+(event.key==="ArrowDown"?1:-1)));if(visible[next])focusItem(visible[next].item.value);return;
      }
      if(event.key===forward){event.preventDefault();if(entry.branch&&!expanded.has(entry.item.value))toggle(entry);else if(entry.branch&&entry.item.children?.length)focusItem(entry.item.children[0].value);return;}
      if(event.key===back){event.preventDefault();if(entry.branch&&expanded.has(entry.item.value))toggle(entry);else if(entry.parent)focusItem(entry.parent);return;}
      if(event.key==="Enter"||event.key===" "){event.preventDefault();if(entry.item.selectable===false&&entry.branch)toggle(entry);else select(entry);return;}
      if(event.key.length===1&&event.key.trim()){
        const now=Date.now(),text=searchable(event.key);search.current={text:now-search.current.time>700?text:search.current.text+text,time:now};
        const query=[...search.current.text].every(letter=>letter===text)?text:search.current.text;
        for(let offset=1;offset<=visible.length;offset++){const candidate=visible[(index+offset)%visible.length];if(searchable(candidate.item.label).startsWith(query)){event.preventDefault();focusItem(candidate.item.value);break;}}
      }
    }}>
    <span className={["flood-label",hideLabel?"flood-visually-hidden":""].filter(Boolean).join(" ")} id={`${id}-label`}>{label}</span>
    <span id={`${id}-readonly`} hidden>{readOnlyMessage}</span>
    <div ref={tree} role="tree" aria-labelledby={`${id}-label`} aria-multiselectable={multiple||undefined} aria-disabled={disabled||undefined} aria-describedby={[!items.length?`${id}-empty`:undefined,readOnly?`${id}-readonly`:undefined].filter(Boolean).join(" ")||undefined} tabIndex={!disabled&&!items.length?0:-1} className="flood-tree__viewport">{render(items)}</div>
    {!items.length&&<div id={`${id}-empty`} role="status" className="flood-tree__empty">{emptyMessage}</div>}
  </div>;
});
