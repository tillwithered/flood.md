import {forwardRef,useCallback,useEffect,useId,useImperativeHandle,useLayoutEffect,useRef,useState,type CSSProperties,type RefCallback} from "react";
import {Popover,ScrollArea,Tree,type TreeItem,type TreeSelectProps} from "./index.js";
import {mergeDescriptions,resolveFieldStatus} from "./field-state.js";

const useBrowserLayoutEffect=typeof window==="undefined"?useEffect:useLayoutEffect;

/** A single hierarchical form selection. Tree owns navigation; the select owns submission. */
export const HierarchicalSelect=/* @__PURE__ */ forwardRef<HTMLDivElement,TreeSelectProps>(function HierarchicalSelect({
  label,hideLabel=false,items,value,defaultValue="",onValueChange,placeholder="Choose an item…",name,form,required=false,
  disabled=false,readOnly=false,invalid,status,controlSize="md",open:controlledOpen,defaultOpen=false,onOpenChange,
  expandedValues,defaultExpandedValues=[],onExpandedValuesChange,emptyMessage="No items.",invalidSelectionMessage="Choose an item.",
  id:explicitId,className,"aria-describedby":describedBy,"aria-invalid":ariaInvalid,onKeyDown,...props
},forwardedRef){
  if(![label,placeholder,emptyMessage,invalidSelectionMessage].every(text=>text.trim()))throw new Error("Flood TreeSelect requires nonempty labels and messages");
  const entries=new Map<string,{item:TreeItem;ancestors:string[]}>();
  const collect=(nodes:readonly TreeItem[],ancestors:string[])=>{
    if(ancestors.length>256)throw new Error("Flood TreeSelect nesting exceeds the supported depth");
    for(const item of nodes){
      if(!item.value.trim()||!item.label.trim()||entries.has(item.value))throw new Error("Flood TreeSelect items need globally unique nonempty values and labels");
      entries.set(item.value,{item,ancestors});if(item.children)collect(item.children,[...ancestors,item.value]);
    }
  };collect(items,[]);
  const generated=useId(),id=explicitId??`flood-tree-select-${generated}`;
  const root=useRef<HTMLDivElement>(null),native=useRef<HTMLSelectElement>(null),trigger=useRef<HTMLButtonElement>(null),initialFocus=useRef<HTMLElement|null>(null);
  const overlayAnchor=useRef<RefCallback<HTMLButtonElement>|undefined>(undefined);
  const setTrigger=useCallback((node:HTMLButtonElement|null)=>{trigger.current=node;overlayAnchor.current?.(node);},[]);
  useImperativeHandle(forwardedRef,()=>root.current!,[]);
  const initial=useRef(defaultValue),[local,setLocal]=useState(defaultValue),[localOpen,setLocalOpen]=useState(defaultOpen);
  const [width,setWidth]=useState<number>(),[validation,setValidation]=useState(""),[inheritedDisabled,setInheritedDisabled]=useState(false);
  const requested=value??local,entry=entries.get(requested),selected=entry?.item.selectable===false?undefined:entry?.item;
  const committed=selected?.value??"",blocked=disabled||readOnly||inheritedDisabled,requestedOpen=controlledOpen??localOpen;
  const [expanded,setExpanded]=useState(()=>[...new Set([...defaultExpandedValues,...(entries.get(value??defaultValue)?.ancestors??[])])]);
  const current=useRef({value,controlledOpen,onOpenChange,requestedOpen,onValueChange});
  current.current={value,controlledOpen,onOpenChange,requestedOpen,onValueChange};
  const requestOpen=(next:boolean)=>{
    if(next&&(blocked||native.current?.matches(":disabled")))return;
    if(current.current.controlledOpen===undefined)setLocalOpen(next);
    if(next!==current.current.requestedOpen)current.current.onOpenChange?.(next);
  };
  const choose=(next:string|string[])=>{
    const key=typeof next==="string"?next:next[0]??"",choice=entries.get(key)?.item;
    if(blocked||native.current?.matches(":disabled")||!choice||choice.disabled||choice.readOnly||choice.selectable===false)return;
    if(current.current.value===undefined)setLocal(key);
    if(key!==committed)current.current.onValueChange?.(key);
    setValidation("");requestOpen(false);
  };
  useBrowserLayoutEffect(()=>{
    const node=trigger.current;if(!node)return;
    const update=()=>{const next=node.getBoundingClientRect().width;if(next>0)setWidth(previous=>previous===next?previous:next);};update();
    const Observer=node.ownerDocument.defaultView?.ResizeObserver,observer=Observer?new Observer(update):undefined;observer?.observe(node);return()=>observer?.disconnect();
  },[]);
  useBrowserLayoutEffect(()=>{
    const node=native.current;if(!node)return;
    node.setCustomValidity(!readOnly&&required&&!committed?invalidSelectionMessage:"");
    if(validation&&node.validity.valid)setValidation("");
  });
  useEffect(()=>{
    const node=native.current,Observer=node?.ownerDocument.defaultView?.MutationObserver;if(!node||!Observer)return;
    const update=()=>setInheritedDisabled(node.matches(":disabled")),observer=new Observer(update);update();
    let ancestor=node.parentElement;while(ancestor){if(ancestor.localName==="fieldset")observer.observe(ancestor,{attributes:true,attributeFilter:["disabled"]});ancestor=ancestor.parentElement;}
    return()=>observer.disconnect();
  },[]);
  useEffect(()=>{if(blocked&&requestedOpen)requestOpen(false);},[blocked,requestedOpen]);
  useEffect(()=>{
    const owner=native.current?.form;if(!owner)return;const timers=new Set<ReturnType<typeof setTimeout>>();
    const reset=(event:Event)=>{const timer=setTimeout(()=>{timers.delete(timer);if(event.defaultPrevented)return;if(current.current.value===undefined)setLocal(initial.current);setValidation("");requestOpen(false);},0);timers.add(timer);};
    owner.addEventListener("reset",reset);return()=>{owner.removeEventListener("reset",reset);for(const timer of timers)clearTimeout(timer);};
  },[form]);
  const described=mergeDescriptions(describedBy,readOnly&&`${id}-readonly`,required&&`${id}-required`,validation&&`${id}-validation`);
  return <div {...props} ref={root} id={id} className={["flood-tree-select",className].filter(Boolean).join(" ")} data-disabled={disabled||inheritedDisabled||undefined} data-readonly={readOnly||undefined}
    onKeyDown={event=>{onKeyDown?.(event);if(event.defaultPrevented||blocked||event.nativeEvent.isComposing||event.keyCode===229)return;if(event.target===trigger.current&&(event.key==="ArrowDown"||event.key==="ArrowUp")){event.preventDefault();requestOpen(true);}}}>
    <label htmlFor={`${id}-trigger`} id={`${id}-label`} className={["flood-label",hideLabel?"flood-visually-hidden":""].filter(Boolean).join(" ")}>{label}</label>
    <Popover title={label} className="flood-tree-select__panel" open={!blocked&&requestedOpen} onOpenChange={requestOpen} disabled={blocked} initialFocusRef={initialFocus}
      style={{"--flood-tree-select-width":width===undefined?undefined:`${width}px`}as CSSProperties}
      trigger={overlay=>{overlayAnchor.current=overlay.ref;return <span className={`flood-select flood-select--custom flood-control--${controlSize}`}>
        <button {...overlay} ref={setTrigger} id={`${id}-trigger`} className={`flood-input flood-select__control flood-control--${controlSize}`}
          aria-labelledby={`${id}-label ${id}-value`} aria-describedby={described} aria-invalid={invalid||status==="error"||Boolean(validation)||ariaInvalid||undefined}
          data-status={resolveFieldStatus(status,invalid||Boolean(validation),ariaInvalid)} data-readonly={readOnly||undefined} aria-disabled={readOnly||undefined}>
          <span id={`${id}-value`} className="flood-select__value" data-placeholder={!selected||undefined}>{selected?.label??placeholder}</span>
        </button>
      </span>;}}>
      <ScrollArea orientation="vertical" className="flood-tree-select__scroll" tabIndex={-1}>
        <Tree ref={node=>{initialFocus.current=node?.querySelector<HTMLElement>('[role="treeitem"][tabindex="0"], [role="tree"][tabindex="0"]')??null;}}
          label={label} hideLabel items={items} value={committed} onValueChange={choose} controlSize={controlSize} emptyMessage={emptyMessage}
          expandedValues={expandedValues??expanded} onExpandedValuesChange={next=>{if(expandedValues===undefined)setExpanded(next);onExpandedValuesChange?.(next);}}
          onClick={event=>{const target=(event.target as Element).closest<HTMLElement>('[role="treeitem"]');if(target?.dataset.treeValue===committed&&!(event.target as Element).closest('[data-tree-toggle="true"]'))requestOpen(false);}}
          onKeyDown={event=>{if((event.key==="Enter"||event.key===" ")&&(event.target as HTMLElement).dataset.treeValue===committed)requestOpen(false);}} />
      </ScrollArea>
    </Popover>
    <select ref={native} name={name} form={form} value={committed} disabled={disabled} required={required&&!readOnly} hidden aria-hidden="true" tabIndex={-1}
      onChange={()=>{}} onInvalid={event=>{event.preventDefault();setValidation(event.currentTarget.validationMessage);trigger.current?.focus();}}>
      <option value="" />{[...entries.values()].filter(({item})=>item.selectable!==false).map(({item})=><option key={item.value} value={item.value}>{item.label}</option>)}
    </select>
    <span hidden id={`${id}-readonly`}>Selection is read only.</span>
    <span hidden id={`${id}-required`}>Required.</span>
    {validation&&<span id={`${id}-validation`} className="flood-tree-select__validation" role="alert">{validation}</span>}
  </div>;
});
