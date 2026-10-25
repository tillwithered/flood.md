export type Side = "top" | "bottom" | "left" | "right";
export type Align = "start" | "center" | "end";
type Rect = {left:number; top:number; right:number; bottom:number; width:number; height:number};
/** Pure collision handling in layout-viewport coordinates. */
export function placeOverlay(anchor:Rect, size:{width:number;height:number}, viewport:{left:number;top:number;width:number;height:number}, side:Side, align:Align, gap:number, rtl=false) {
  const edge={left:viewport.left+gap,right:viewport.left+viewport.width-gap,top:viewport.top+gap,bottom:viewport.top+viewport.height-gap};
  const space={top:anchor.top-edge.top,bottom:edge.bottom-anchor.bottom,left:anchor.left-edge.left,right:edge.right-anchor.right};
  const opposite={top:"bottom",bottom:"top",left:"right",right:"left"} as const;
  const needed=(side==="top"||side==="bottom"?size.height:size.width)+gap;
  if(space[side]<needed && space[opposite[side]]>space[side]) side=opposite[side];
  const horizontal=side==="top"||side==="bottom";
  const resolved=horizontal&&rtl?(align==="start"?"end":align==="end"?"start":align):align;
  let left=horizontal?(resolved==="start"?anchor.left:resolved==="end"?anchor.right-size.width:anchor.left+(anchor.width-size.width)/2):side==="left"?anchor.left-size.width-gap:anchor.right+gap;
  let top=horizontal?(side==="top"?anchor.top-size.height-gap:anchor.bottom+gap):(resolved==="start"?anchor.top:resolved==="end"?anchor.bottom-size.height:anchor.top+(anchor.height-size.height)/2);
  left=Math.max(edge.left,Math.min(left,edge.right-size.width)); top=Math.max(edge.top,Math.min(top,edge.bottom-size.height));
  return {left,top,side};
}

export function tabbables(root:HTMLElement) {
  const candidates=Array.from(root.querySelectorAll<HTMLElement>('a[href],button,input,select,textarea,[tabindex],[contenteditable]:not([contenteditable="false"]),details > summary:first-of-type,audio[controls],video[controls],iframe')).filter(node=>{
    // Editing roots and native media may report -1 without an explicit tabindex
    // while still participating in sequential focus. Nested editing hosts do not.
    const implicit=!node.hasAttribute("tabindex")&&((node.isContentEditable&&!node.parentElement?.isContentEditable)||node.matches("audio[controls],video[controls]"));
    return (node.tabIndex>=0||implicit)&&!node.matches(':disabled,input[type="hidden"]')&&!node.closest('[hidden],[inert]')&&node.getClientRects().length>0&&getComputedStyle(node).visibility!=="hidden";
  });
  return candidates.filter(node=>{
    if(node.localName!=="input"||(node as HTMLInputElement).type!=="radio"||!(node as HTMLInputElement).name)return true;
    const radio=node as HTMLInputElement;
    const group=candidates.filter((other):other is HTMLInputElement=>other.localName==="input"&&(other as HTMLInputElement).type==="radio"&&(other as HTMLInputElement).name===radio.name&&(other as HTMLInputElement).form===radio.form);
    return node===(group.find(other=>other.checked)??group[0]);
  }).sort((a,b)=>(a.tabIndex>0?a.tabIndex:Infinity)-(b.tabIndex>0?b.tabIndex:Infinity));
}

type Layer={panel:HTMLElement; anchor:()=>HTMLElement|null; close:()=>void; outside?:()=>void; modal?:boolean; tooltip?:boolean};
const stacks=new WeakMap<Document,Layer[]>();
export function registerLayer(document:Document,layer:Layer) {
  let layers=stacks.get(document);
  if(!layers){layers=[];stacks.set(document,layers);}
  layers.push(layer);
  const top=()=>layers!.filter(item=>item.panel.isConnected&&(item.panel.localName==="dialog"?(item.panel as HTMLDialogElement).open:item.panel.matches(":popover-open"))).at(-1);
  const key=(event:KeyboardEvent)=>{if(event.defaultPrevented||event.key!=="Escape"||top()!==layer)return;event.preventDefault();event.stopPropagation();layer.close();};
  const pointer=(event:PointerEvent)=>{
    if(event.defaultPrevented||top()!==layer)return;
    const path=event.composedPath();
    if(layer.modal){const rect=layer.panel.getBoundingClientRect();if(event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom)return;}
    else if(path.includes(layer.panel)||path.includes(layer.anchor() as EventTarget))return;
    (layer.outside??layer.close)();
  };
  const focus=(event:FocusEvent)=>{
    if(top()!==layer||layer.modal)return;
    const target=event.target as Node;
    if(!layer.panel.contains(target)&&!layer.anchor()?.contains(target))layer.close();
  };
  document.addEventListener("keydown",key);document.addEventListener("pointerdown",pointer);document.addEventListener("focusin",focus);
  return ()=>{const index=layers!.indexOf(layer);if(index>=0)layers!.splice(index,1);document.removeEventListener("keydown",key);document.removeEventListener("pointerdown",pointer);document.removeEventListener("focusin",focus);};
}

const locks=new WeakMap<Document,{count:number;overflow:string;overflowPriority:string;gutter:string;gutterPriority:string}>();
export function lockScroll(document:Document){
  const style=document.documentElement.style;let lock=locks.get(document);
  if(!lock){const reserve=(document.defaultView?.innerWidth??0)-document.documentElement.clientWidth>0;lock={count:0,overflow:style.getPropertyValue("overflow"),overflowPriority:style.getPropertyPriority("overflow"),gutter:style.getPropertyValue("scrollbar-gutter"),gutterPriority:style.getPropertyPriority("scrollbar-gutter")};locks.set(document,lock);style.setProperty("overflow","hidden","important");if(reserve)style.setProperty("scrollbar-gutter","stable","important");}
  lock.count++;
  return ()=>{if(--lock!.count!==0)return;for(const [key,value,priority] of [["overflow",lock!.overflow,lock!.overflowPriority],["scrollbar-gutter",lock!.gutter,lock!.gutterPriority]]){if(value)style.setProperty(key,value,priority);else style.removeProperty(key);}locks.delete(document);};
}

export function positionLayer(anchor:HTMLElement,panel:HTMLElement,side:Side,align:Align){
  const view=panel.ownerDocument.defaultView!;const visual=view.visualViewport;
  const viewport={left:visual?.offsetLeft??0,top:visual?.offsetTop??0,width:visual?.width??view.innerWidth,height:visual?.height??view.innerHeight};
  const gap=parseFloat(getComputedStyle(panel).columnGap)||8;
  panel.style.setProperty("--flood-overlay-available-width",`${Math.max(0,viewport.width-2*gap)}px`);panel.style.setProperty("--flood-overlay-available-height",`${Math.max(0,viewport.height-2*gap)}px`);
  const position=placeOverlay(anchor.getBoundingClientRect(),panel.getBoundingClientRect(),viewport,side,align,gap,getComputedStyle(anchor).direction==="rtl");
  const left=`${position.left}px`,top=`${position.top}px`;
  if(panel.style.left!==left)panel.style.left=left;if(panel.style.top!==top)panel.style.top=top;
  panel.dataset.side=position.side;panel.style.visibility="visible";
}

export function returnFocus(panel:HTMLElement,anchor:HTMLElement|null){
  const active=panel.ownerDocument.activeElement;
  if(anchor?.isConnected&&!anchor.matches(":disabled")&&(panel.contains(active)||active===panel.ownerDocument.body))anchor.focus({preventScroll:true});
}
