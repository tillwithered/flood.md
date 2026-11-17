import {forwardRef,useEffect,useId,useImperativeHandle,useLayoutEffect,useRef,useState,type KeyboardEvent} from "react";
import {DataList,DataListItem,IconButton,ScrollArea,Text,VisuallyHidden,type ReorderListProps,type ReorderMove,type ReorderPlacement} from "./index.js";
import {mergeDescriptions} from "./field-state.js";
import {createCollectionMoveResolver,useCollectionGrip} from "./collection-reorder.js";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const placements = ["before","inside","after"] as const;
type Mode = "keyboard" | "pointer";
type Drag = {sourceId:string; target?:ReorderMove; mode:Mode};
const same = (a: ReorderMove | undefined,b: ReorderMove | undefined) =>
  a?.sourceId===b?.sourceId && a?.targetId===b?.targetId && a?.placement===b?.placement;

export const CollectionReorderList = /* @__PURE__ */ forwardRef<HTMLUListElement,ReorderListProps>(function CollectionReorderList({
  label, items, onMove, canMove, labels, maxViewportHeight, disabled, className, "aria-describedby": describedBy, ...props
}, ref) {
  const list = useRef<HTMLUListElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const grips = useRef(new Map<string,HTMLButtonElement>());
  const rows = useRef(new Map<string,HTMLLIElement>());
  const focusAfterMove = useRef<string>(undefined);
  const dragRef = useRef<Drag>(undefined);
  const [drag,setDrag] = useState<Drag>();
  const [announcement,setAnnouncement] = useState("");
  const [problem,setProblem] = useState("");
  const instructionsId = useId();
  useImperativeHandle(ref,()=>list.current!,[]);
  if (!label.trim() || items.some(item=>!item.label.trim())) throw new Error("Flood ReorderList requires accessible list and item names");
  const resolveMove = createCollectionMoveResolver(items,canMove);
  const instructions = labels?.instructions ?? "Press Space or Enter to pick up. Use arrows to choose a position, Enter to move, or Escape to cancel.";
  const name = (id:string) => items.find(item=>item.id===id)?.label ?? id;
  const place = (move: ReorderMove) => labels?.position?.(name(move.sourceId),name(move.targetId),move.placement)
    ?? `Move ${name(move.sourceId)} ${move.placement} ${name(move.targetId)}.`;

  const updateDrag = (next: Drag | undefined) => {
    dragRef.current = next;
    setDrag(next);
  };
  const cancel = (restore: boolean) => {
    const session = dragRef.current;
    pointer.clear();
    if (!session) return;
    if (restore) focusAfterMove.current=session.sourceId;
    setAnnouncement(labels?.cancelled?.(name(session.sourceId)) ?? `Move cancelled for ${name(session.sourceId)}.`);
    updateDrag(undefined);
  };
  const drop = () => {
    const session = dragRef.current;
    if (!session) return;
    const target = session.target && resolveMove(session.sourceId,session.target.targetId,session.target.placement);
    if (!target || disabled) { cancel(true); return; }
    const rejection = onMove(target,session.mode);
    if (rejection) {
      setProblem(rejection);
      setAnnouncement("");
    } else {
      setAnnouncement(labels?.moved?.(name(session.sourceId),name(target.targetId),target.placement)
        ?? `Moved ${name(session.sourceId)} ${target.placement} ${name(target.targetId)}.`);
    }
    focusAfterMove.current=session.sourceId;
    updateDrag(undefined);
  };
  const mark = (session: Drag,target: ReorderMove | undefined) => {
    if (same(session.target,target)) return;
    updateDrag({...session,target});
    if (target) setAnnouncement(place(target));
    if (target && session.mode==="keyboard") rows.current.get(target.targetId)?.scrollIntoView({block:"nearest",inline:"nearest"});
  };
  const targetFor = (sourceId: string,targetId: string,placement: ReorderPlacement) =>
    resolveMove(sourceId,targetId,placement) ?? (placement!=="inside" ? resolveMove(sourceId,targetId,"inside") : undefined);
  const verticalTarget = (sourceId: string,start: number,step: number,placement: ReorderPlacement = step>0 ? "after" : "before") => {
    for (let index=start;index>=0 && index<items.length;index+=step) {
      const target = targetFor(sourceId,items[index].id,placement);
      if (target) return target;
    }
  };
  const pickUp = (id: string) => {
    if (disabled) return;
    const index = items.findIndex(item=>item.id===id && !item.disabled);
    if (index===-1) return;
    setProblem("");
    const target = verticalTarget(id,index+1,1) ?? verticalTarget(id,index-1,-1);
    if (!target) {
      setAnnouncement(labels?.unavailable ?? "No available move.");
      return;
    }
    updateDrag({sourceId:id,mode:"keyboard"});
    setAnnouncement(labels?.picked?.(name(id)) ?? `Picked up ${name(id)}. Use arrows to choose a position.`);
  };

  useBrowserLayoutEffect(()=>{
    if (drag && (disabled || !items.some(item=>item.id===drag.sourceId && !item.disabled))) cancel(false);
    if (drag || !focusAfterMove.current || !list.current) return;
    const sourceId = focusAfterMove.current;
    focusAfterMove.current=undefined;
    const view = list.current.ownerDocument.defaultView;
    if (!view) return;
    const frame = view.requestAnimationFrame(()=>{
      const document = list.current?.ownerDocument;
      const target = grips.current.get(sourceId) ?? [...grips.current.values()].find(node=>!node.disabled);
      if (document && (document.activeElement===document.body || list.current?.contains(document.activeElement))) {
        target?.focus({preventScroll:true});
      }
    });
    return ()=>view.cancelAnimationFrame(frame);
  },[drag,items,disabled]);

  const onHandleKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const session = dragRef.current;
    if (!session || event.defaultPrevented || event.nativeEvent.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key==="Escape" || event.key==="Tab") {
      if (event.key==="Escape") { event.preventDefault(); event.stopPropagation(); }
      cancel(event.key==="Escape");
      return;
    }
    if (session.mode!=="keyboard") return;
    const index = items.findIndex(item=>item.id===(session.target?.targetId ?? session.sourceId));
    const direction = getComputedStyle(event.currentTarget).direction==="rtl" ? -1 : 1;
    if (event.key===" " || event.key==="Enter") {
      event.preventDefault();
      if (!event.repeat) drop();
    } else if (["ArrowUp","ArrowDown","Home","End"].includes(event.key)) {
      event.preventDefault();
      const next = event.key==="Home" ? verticalTarget(session.sourceId,0,1,"before")
        : event.key==="End" ? verticalTarget(session.sourceId,items.length-1,-1,"after")
          : event.key==="ArrowUp" ? verticalTarget(session.sourceId,index-1,-1)
            : verticalTarget(session.sourceId,index+1,1);
      if (next) mark(session,next);
    } else if ((event.key==="ArrowLeft" || event.key==="ArrowRight") && session.target) {
      event.preventDefault();
      const step = event.key==="ArrowRight" ? direction : -direction;
      for (let offset=placements.indexOf(session.target.placement)+step;offset>=0 && offset<placements.length;offset+=step) {
        const next = resolveMove(session.sourceId,session.target.targetId,placements[offset]);
        if (next) { mark(session,next); break; }
      }
    }
  };

  const pointerTarget = (x:number,y:number,sourceId:string) => {
    const document = list.current?.ownerDocument;
    const row = document?.elementFromPoint(x,y)?.closest("[data-flood-reorder-id]");
    const id = row?.getAttribute("data-flood-reorder-id");
    if (!row || !id || row.parentElement!==list.current) return;
    const item = items.find(item=>item.id===id);
    const bounds = row.getBoundingClientRect();
    const ratio = bounds.height ? (y-bounds.top)/bounds.height : 0;
    const placement = item?.canContain && ratio>0.3 && ratio<0.7 ? "inside" : ratio < 0.5 ? "before" : "after";
    return resolveMove(sourceId,id,placement);
  };

  const pointer = useCollectionGrip({
    prepare:()=>{if (dragRef.current?.mode==="keyboard") cancel(false);},
    start:sourceId=>{
      setProblem("");
      updateDrag({sourceId,mode:"pointer"});
    },
    move:(sourceId,point)=>{
      const session=dragRef.current;
      if (session) mark(session,pointerTarget(point.x,point.y,sourceId));
    },
    drop:(sourceId,point)=>{
      if (!dragRef.current) return;
      mark(dragRef.current,pointerTarget(point.x,point.y,sourceId));
      drop();
    },
    cancel:()=>cancel(true),
  });

  const tick = useRef<() => void>(()=>{});
  tick.current=()=>{
    const area = viewport.current, point = pointer.tracking.current?.point, session = dragRef.current;
    if (!area || !point || session?.mode!=="pointer") return;
    const bounds = area.getBoundingClientRect();
    if (point.x<bounds.left || point.x>bounds.right || point.y<bounds.top || point.y>bounds.bottom) return;
    const clearance = Math.min(28,bounds.height/3);
    const towardStart = Math.max(0,clearance-(point.y-bounds.top));
    const towardEnd = Math.max(0,clearance-(bounds.bottom-point.y));
    const before = area.scrollTop;
    area.scrollTop+=(towardEnd-towardStart)/3;
    if (area.scrollTop!==before) mark(session,pointerTarget(point.x,point.y,session.sourceId));
  };
  useEffect(()=>{
    const view = list.current?.ownerDocument.defaultView;
    if (!view || drag?.mode!=="pointer" || maxViewportHeight===undefined) return;
    let frame = 0;
    const run=()=>{tick.current(); frame=view.requestAnimationFrame(run);};
    frame=view.requestAnimationFrame(run);
    return ()=>view.cancelAnimationFrame(frame);
  },[drag?.mode,maxViewportHeight]);

  const content = <DataList {...props} ref={list} aria-label={label} dividers={props.dividers ?? false}
    className={["flood-reorder-list",className].filter(Boolean).join(" ")} data-moving={drag?.mode}
    onBlur={event=>{
      props.onBlur?.(event);
      if (dragRef.current?.mode==="keyboard" && event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) cancel(false);
    }}>
    {items.map(item=><DataListItem key={item.id} title={item.label} description={item.description} media={item.media}
      data-nested={Boolean(item.parentId) || undefined}
      data-flood-reorder-id={item.id} data-source={drag?.sourceId===item.id || undefined}
      data-placement={drag?.target?.targetId===item.id ? drag.target.placement : undefined}
      ref={node=>{if (node) rows.current.set(item.id,node); else rows.current.delete(item.id);}}
      actions={<IconButton ref={node=>{if (node) grips.current.set(item.id,node); else grips.current.delete(item.id);}}
        label={labels?.handle?.(item.label) ?? `Reorder ${item.label}`}
        aria-describedby={mergeDescriptions(describedBy,instructionsId)} aria-pressed={drag?.sourceId===item.id}
        disabled={disabled || item.disabled} className="flood-reorder-list__grip" size="sm" variant="ghost"
        onClick={event=>{
          if (!dragRef.current && event.detail===0) pickUp(item.id);
          else if (dragRef.current?.mode==="keyboard" && dragRef.current.sourceId===item.id && event.detail===0) drop();
        }}
        onKeyDown={onHandleKey} {...pointer.handlers(item.id,Boolean(disabled||item.disabled))}>
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
          <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
          <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
        </svg>
      </IconButton>}/>)}
  </DataList>;

  return <>
    <VisuallyHidden id={instructionsId}>{instructions}</VisuallyHidden>
    {maxViewportHeight === undefined ? content
      : <ScrollArea ref={viewport} aria-label={labels?.scroll ?? label} orientation="vertical" tabIndex={-1} style={{maxBlockSize:maxViewportHeight}}>{content}</ScrollArea>}
    <VisuallyHidden role="status">{announcement}</VisuallyHidden>
    {problem && <Text as="p" role="status" tone="error" size="helper" className="flood-reorder-list__error">{problem}</Text>}
  </>;
});
