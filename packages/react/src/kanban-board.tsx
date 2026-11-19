import {forwardRef,useEffect,useId,useImperativeHandle,useLayoutEffect,useRef,useState,type KeyboardEvent} from "react";
import {Avatar,Badge,Button,Card,CountBadge,IconButton,IconSlot,Inline,Menu,ScrollArea,Stack,Surface,Text,VisuallyHidden,type KanbanBoardProps,type KanbanMove,type MenuItem} from "./index.js";
import {createCollectionMoveResolver,useCollectionGrip,type GripPoint} from "./collection-reorder.js";

const useBrowserLayoutEffect=typeof window==="undefined" ? useEffect : useLayoutEffect;
type InputMode="keyboard" | "pointer";
type Session={sourceId:string;mode:InputMode;move?:KanbanMove};
const laneKey=(id:string)=>`lane:${id}`;
const cardKey=(id:string)=>`card:${id}`;
const same=(a:KanbanMove|undefined,b:KanbanMove|undefined)=>a?.toColumnId===b?.toColumnId && a?.beforeCardId===b?.beforeCardId;
const cardContent = "button, a, input, select, textarea, label, summary, [contenteditable], [tabindex], [role], .flood-kanban-board__title-text, .flood-kanban-board__description, .flood-card__footer";

export const KanbanCollection = /* @__PURE__ */ forwardRef<HTMLDivElement,KanbanBoardProps>(function KanbanCollection({
  label,columns,onMove,canMove,onCardOpen,labels,appearance="open",cardLayout="compact",dragActivation="handle",showCounts=true,disabled=false,className,"aria-describedby":describedBy,...props
},ref){
  const root=useRef<HTMLDivElement>(null);
  const scroll=useRef<HTMLDivElement>(null);
  const grips=useRef(new Map<string,HTMLButtonElement>());
  const laneNodes=useRef(new Map<string,HTMLDivElement>());
  const cardNodes=useRef(new Map<string,HTMLDivElement>());
  const current=useRef<Session>(undefined);
  const restore=useRef<string>(undefined);
  const [session,setSession]=useState<Session>();
  const [notice,setNotice]=useState("");
  const [problem,setProblem]=useState("");
  const instructionsId=useId();
  useImperativeHandle(ref,()=>root.current!,[]);

  if (!label.trim() || columns.some(column=>!column.id.trim() || !column.label.trim()
    || column.cards.some(card=>!card.id.trim() || !card.title.trim()))) {
    throw new Error("Flood KanbanBoard requires named columns, cards, and board");
  }
  const entries=columns.flatMap((column,columnIndex)=>column.cards.map((card,cardIndex)=>({column,columnIndex,card,cardIndex})));
  const cards=new Map(entries.map(entry=>[entry.card.id,entry]));
  const lanes=new Map(columns.map(column=>[column.id,column]));
  const resolveMove=createCollectionMoveResolver([
    ...columns.map(column=>({id:laneKey(column.id),disabled:column.disabled,canContain:true})),
    ...entries.map(({column,card})=>({id:cardKey(card.id),parentId:laneKey(column.id),disabled:column.disabled||card.disabled})),
  ]);
  const cardsFor=(columnId:string,sourceId:string)=>lanes.get(columnId)?.cards.filter(card=>card.id!==sourceId) ?? [];
  const propose=(sourceId:string,columnId:string,index:number)=>{
    const source=cards.get(sourceId), column=lanes.get(columnId);
    if (!source || !column || disabled) return;
    const remaining=cardsFor(columnId,sourceId);
    if (index<0 || index>remaining.length || source.column.id===columnId && source.cardIndex===index) return;
    const before=remaining[index]?.id;
    const targetId=before===undefined ? laneKey(columnId) : cardKey(before);
    if (!resolveMove(cardKey(sourceId),targetId,before===undefined ? "inside" : "before")) return;
    const move:KanbanMove={cardId:sourceId,fromColumnId:source.column.id,toColumnId:columnId,beforeCardId:before};
    if (canMove && !canMove(move)) return;
    return move;
  };
  const statement=(move:KanbanMove,complete:boolean)=>{
    const card=cards.get(move.cardId)?.card.title ?? move.cardId;
    const lane=lanes.get(move.toColumnId)?.label ?? move.toColumnId;
    const before=move.beforeCardId ? cards.get(move.beforeCardId)?.card.title : undefined;
    const format=complete ? labels?.moved : labels?.position;
    return format?.(card,lane,before) ?? (before ? `${complete ? "Moved" : "Move"} ${card} before ${before} in ${lane}.` : `${complete ? "Moved" : "Move"} ${card} to ${lane}.`);
  };
  const update=(next:Session|undefined)=>{current.current=next;setSession(next);};
  const cancel=(focus:boolean)=>{
    pointer.clear();
    const drag=current.current;
    if (!drag) return;
    if (focus) restore.current=drag.sourceId;
    setNotice(labels?.cancelled ?? "Move cancelled.");
    update(undefined);
  };
  const mark=(move:KanbanMove|undefined)=>{
    const drag=current.current;
    if (!drag || same(drag.move,move)) return;
    update({...drag,move});
    if (!move) return;
    setNotice(statement(move,false));
    if (drag.mode==="keyboard") {
      const node=move.beforeCardId ? cardNodes.current.get(move.beforeCardId) : laneNodes.current.get(move.toColumnId);
      node?.scrollIntoView({block:"nearest",inline:"nearest"});
    }
  };
  const accept=(move:KanbanMove,input:InputMode|"menu")=>{
    const rejection=onMove(move,input);
    setProblem(rejection || "");
    setNotice(rejection ? "" : statement(move,true));
  };
  const commit=()=>{
    const drag=current.current, move=drag?.move;
    if (!drag || !move) {cancel(true);return;}
    const remaining=cardsFor(move.toColumnId,move.cardId);
    const index=move.beforeCardId ? remaining.findIndex(card=>card.id===move.beforeCardId) : remaining.length;
    const next=propose(move.cardId,move.toColumnId,index);
    if (!next || !same(next,move)) {cancel(true);return;}
    accept(next,drag.mode);
    restore.current=drag.sourceId;
    update(undefined);
  };
  const pick=(id:string,mode:InputMode)=>{
    const source=cards.get(id);
    if (!source || disabled || source.card.disabled || source.column.disabled) return;
    setProblem("");
    update({sourceId:id,mode});
    if (mode==="keyboard") setNotice(labels?.picked?.(source.card.title) ?? `Picked up ${source.card.title}.`);
  };

  useBrowserLayoutEffect(()=>{
    if (session && (disabled || !cards.has(session.sourceId) || cards.get(session.sourceId)?.card.disabled
      || cards.get(session.sourceId)?.column.disabled)) cancel(false);
    const source=restore.current;
    if (session || !source || !root.current) return;
    restore.current=undefined;
    const view=root.current.ownerDocument.defaultView!;
    const frame=view.requestAnimationFrame(()=>{
      const doc=root.current?.ownerDocument;
      if (doc && (doc.activeElement===doc.body || root.current?.contains(doc.activeElement))) {
        (grips.current.get(source) ?? [...grips.current.values()].find(node=>!node.disabled))?.focus({preventScroll:true});
      }
    });
    return ()=>view.cancelAnimationFrame(frame);
  },[session,columns,disabled]);

  const navigate=(event:KeyboardEvent<HTMLButtonElement>)=>{
    const drag=current.current;
    if (!drag || event.defaultPrevented || event.nativeEvent.isComposing || event.altKey||event.ctrlKey||event.metaKey) return;
    if (event.key==="Escape" || event.key==="Tab") {
      if (event.key==="Escape") {event.preventDefault();event.stopPropagation();}
      cancel(event.key==="Escape");return;
    }
    if (drag.mode!=="keyboard") return;
    if (event.key==="Enter" || event.key===" ") {event.preventDefault();if(!event.repeat)commit();return;}
    if (!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(event.key)) return;
    const source=cards.get(drag.sourceId);
    if (!source) return;
    event.preventDefault();
    const laneId=drag.move?.toColumnId ?? source.column.id;
    const remaining=cardsFor(laneId,drag.sourceId);
    const start=drag.move ? (drag.move.beforeCardId ? remaining.findIndex(card=>card.id===drag.move!.beforeCardId) : remaining.length) : source.cardIndex;
    if (event.key==="ArrowLeft" || event.key==="ArrowRight") {
      const rtl=getComputedStyle(event.currentTarget).direction==="rtl";
      const step=(event.key==="ArrowRight"?1:-1)*(rtl?-1:1);
      for (let index=columns.findIndex(column=>column.id===laneId)+step;index>=0&&index<columns.length;index+=step) {
        const column=columns[index], slots=cardsFor(column.id,drag.sourceId).length;
        const choices=Array.from({length:slots+1},(_,index)=>index).sort((a,b)=>Math.abs(a-start)-Math.abs(b-start));
        const candidate=choices.map(slot=>propose(drag.sourceId,column.id,slot)).find(Boolean);
        if (candidate) {mark(candidate);return;}
      }
    } else {
      const step=event.key==="ArrowUp" || event.key==="End" ? -1 : 1;
      const next=event.key==="Home" ? 0 : event.key==="End" ? remaining.length : start+step;
      for (let index=next;index>=0 && index<=remaining.length;index+=step) {
        const candidate=propose(drag.sourceId,laneId,index);
        if (candidate) {mark(candidate);return;}
      }
    }
  };

  const pointerMove=(sourceId:string,point:GripPoint)=>{
    const node=root.current?.ownerDocument.elementFromPoint(point.x,point.y)?.closest("[data-flood-kanban-lane]");
    const lane=node?.getAttribute("data-flood-kanban-lane");
    if (!lane || laneNodes.current.get(lane)!==node) {mark(undefined);return;}
    const remaining=cardsFor(lane,sourceId);
    const index=remaining.findIndex(card=>{
      const bounds=cardNodes.current.get(card.id)?.getBoundingClientRect();
      return bounds && point.y<bounds.top+bounds.height/2;
    });
    mark(propose(sourceId,lane,index<0 ? remaining.length : index));
  };
  const pointer=useCollectionGrip({
    prepare:()=>{if (current.current?.mode==="keyboard") cancel(false);},
    start:id=>{
      pick(id,"pointer");
      grips.current.get(id)?.focus({preventScroll:true});
    },
    move:pointerMove,
    drop:(id,point)=>{pointerMove(id,point);commit();},cancel:()=>cancel(true),
  });
  const tick=useRef<()=>void>(()=>{});
  tick.current=()=>{
    const point=pointer.tracking.current?.point, area=scroll.current, drag=current.current;
    if (!point || !area || drag?.mode!=="pointer") return;
    const rect=area.getBoundingClientRect();
    if(point.y<rect.top || point.y>rect.bottom || point.x<rect.left || point.x>rect.right)return;
    const edge=Math.min(32,rect.width/3);
    const left=Math.max(0,edge-(point.x-rect.left)), right=Math.max(0,edge-(rect.right-point.x));
    const before=area.scrollLeft;
    area.scrollLeft+=(right-left)/3;
    if (area.scrollLeft!==before) pointerMove(drag.sourceId,point);
  };
  useEffect(()=>{
    const doc=root.current?.ownerDocument;
    const view=doc?.defaultView;
    if (!doc || !view || session?.mode!=="pointer") return;
    const escape=(event: globalThis.KeyboardEvent)=>{
      if (event.key!=="Escape" || event.defaultPrevented || current.current?.mode!=="pointer") return;
      event.preventDefault();
      cancel(true);
    };
    doc.addEventListener("keydown",escape,true);
    let frame=0;
    const animate=()=>{tick.current();frame=view.requestAnimationFrame(animate);};
    frame=view.requestAnimationFrame(animate);
    return ()=>{
      doc.removeEventListener("keydown",escape,true);
      view.cancelAnimationFrame(frame);
    };
  },[session?.mode]);

  return <div {...props} ref={root} role="region" aria-label={label} aria-describedby={describedBy}
    className={["flood-kanban-board",className].filter(Boolean).join(" ")} data-moving={session?.mode} data-appearance={appearance}
    data-card-layout={cardLayout}
    onBlur={event=>{
      props.onBlur?.(event);
      if (current.current?.mode==="keyboard" && event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) cancel(false);
    }}>
    <VisuallyHidden id={instructionsId}>{labels?.instructions ?? "Use the move menu to change position without dragging. Press Space on the grip to pick up. Use Left and Right to choose a column, Up or Down to choose a place, Enter to move, or Escape to cancel."}</VisuallyHidden>
    <ScrollArea ref={scroll} orientation="horizontal" tabIndex={-1} contentInset="none" className="flood-kanban-board__scroll">
      <div className="flood-kanban-board__columns">
        {columns.map(column=><Surface key={column.id} role="group" aria-label={column.label}
          padding={appearance==="open"?"0":"2"} style={appearance==="open"?{background:"transparent"}:undefined}
          ref={node=>{if(node)laneNodes.current.set(column.id,node);else laneNodes.current.delete(column.id);}}
          className="flood-kanban-board__column" data-flood-kanban-lane={column.id}
          data-drop-end={session?.move?.toColumnId===column.id && session.move.beforeCardId===undefined || undefined}>
          <Stack gap="2">
            <Inline gap="2" align="center" className="flood-kanban-board__header">
              <Text size="label">{column.label}</Text>
              {showCounts && <CountBadge count={column.cards.length} showZero formatLabel={labels?.count} />}
            </Inline>
            <Stack gap="2" className="flood-kanban-board__cards">
              {column.cards.length===0 && <Text size="helper" tone="subtle">{labels?.empty ?? "No cards"}</Text>}
              {column.cards.map((card,index)=>{
                const unavailable=Boolean(disabled||column.disabled||card.disabled);
                const moveLabel=labels?.moveTo?.(card.title) ?? `Move options for ${card.title}`;
                const destinations=columns.filter(lane=>lane.id!==column.id).map(lane=>({
                  id:laneKey(lane.id),label:lane.label,disabled:!propose(card.id,lane.id,lane.cards.length),
                }));
                const positions=column.cards.length>1 ? [
                  {id:"earlier",label:labels?.moveEarlier ?? "Move earlier",disabled:!propose(card.id,column.id,index-1)},
                  {id:"later",label:labels?.moveLater ?? "Move later",disabled:!propose(card.id,column.id,index+1)},
                ] : [];
                const choices: MenuItem[]=[
                  ...positions,
                  ...(positions.length && destinations.length ? [{id:"destinations",type:"separator" as const}] : []),
                  ...destinations,
                ];
                const surfaceDrag=dragActivation==="card" && !unavailable;
                const surfacePointer=pointer.handlers<HTMLDivElement>(card.id,unavailable,false);
                const title=onCardOpen ? <Button variant="ghost" className="flood-kanban-board__open"
                  disabled={unavailable} onClick={event=>{
                    event.currentTarget.focus({preventScroll:true});
                    onCardOpen(card);
                  }}>{card.title}</Button> : <span className="flood-kanban-board__title-text">{card.title}</span>;
                const heading=card.icon ? <span className="flood-kanban-board__title">
                  <IconSlot size="xs" className="flood-kanban-board__project-icon">{card.icon}</IconSlot>{title}
                </span> : title;
                const metadata=typeof card.metadata==="string" ? <Text size="helper" tone="subtle">{card.metadata}</Text> : card.metadata;
                const details=(card.status || card.dueDate || card.assignee) && <Inline gap="2" className="flood-kanban-board__details">
                  {card.status && <Badge size="sm" tone={card.status.tone}>{card.status.label}</Badge>}
                  {card.dueDate && <Text size="helper" tone="subtle"><time dateTime={card.dueDate.dateTime}>{card.dueDate.label}</time></Text>}
                  {card.assignee && <Avatar {...card.assignee} size="xs" title={card.assignee.name} className="flood-kanban-board__assignee" />}
                </Inline>;
                return <Card key={card.id} title={heading} headingSize="group" headingLevel={2}
                density="compact" elevation="raised" footerDivider={false}
                footer={details ? <Stack gap="2">{details}{metadata}</Stack> : metadata}
                style={cardLayout==="compact" ? {paddingBlock:"var(--flood-sys-space-2)",paddingInline:"var(--flood-sys-space-3)"} : undefined}
                data-surface-drag={surfaceDrag || undefined}
                {...(surfaceDrag && {
                  onPointerMove:event=>{if (event.target===event.currentTarget) surfacePointer.onPointerMove(event);},
                  onPointerUp:event=>{if (event.target===event.currentTarget) surfacePointer.onPointerUp(event);},
                  onPointerCancel:event=>{if (event.target===event.currentTarget) surfacePointer.onPointerCancel(event);},
                  onLostPointerCapture:event=>{if (event.target===event.currentTarget) surfacePointer.onLostPointerCapture(event);},
                  onPointerDown:event=>{
                    if ((event.pointerType!=="mouse" && event.pointerType!=="pen") || event.button!==0 || !event.isPrimary
                      || event.defaultPrevented || !(event.target instanceof Element) || !event.currentTarget.contains(event.target)) return;
                    const content=event.target.closest(cardContent);
                    if (content && event.currentTarget.contains(content)) return;
                    event.preventDefault();
                    surfacePointer.onPointerDown(event);
                  },
                })}
                className="flood-kanban-board__card" data-moving-card={session?.sourceId===card.id || undefined}
                data-drop-before={session?.move?.beforeCardId===card.id || undefined}
                ref={node=>{if(node)cardNodes.current.set(card.id,node);else cardNodes.current.delete(card.id);}}
                actions={<Inline gap="1"><IconButton ref={node=>{if(node)grips.current.set(card.id,node);else grips.current.delete(card.id);}}
                  label={labels?.handle?.(card.title) ?? `Move ${card.title}`} aria-describedby={instructionsId}
                  aria-pressed={session?.sourceId===card.id} variant="ghost" size="xs" className="flood-kanban-board__grip"
                  disabled={unavailable} onKeyDown={navigate}
                  onClick={event=>{if(event.detail===0 && !current.current)pick(card.id,"keyboard");}}
                  {...pointer.handlers(card.id,unavailable)}>
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
                    <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                    <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
                  </svg>
                </IconButton>
                {choices.length>0 && <Menu label={moveLabel} align="end" items={choices}
                  disabled={Boolean(session)||unavailable||[...positions,...destinations].every(choice=>choice.disabled)}
                  getFallbackFocus={()=>grips.current.get(card.id) ?? null}
                  onAction={id=>{
                    const position=id==="earlier" ? index-1 : index+1;
                    const destination=columns.find(lane=>laneKey(lane.id)===id);
                    const move=destination ? propose(card.id,destination.id,destination.cards.length)
                      : propose(card.id,column.id,position);
                    if (move) accept(move,"menu");
                  }}
                  trigger={props=><IconButton {...props} label={moveLabel} title={moveLabel} variant="ghost" size="xs" className="flood-kanban-board__menu">
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
                    </svg>
                  </IconButton>} />}
                </Inline>}>
                  {card.description && <Text as="p" size="compact" tone="subtle" className="flood-kanban-board__description">{card.description}</Text>}
                </Card>;
              })}
            </Stack>
          </Stack>
        </Surface>)}
      </div>
    </ScrollArea>
    <VisuallyHidden role="status">{notice}</VisuallyHidden>
    {problem && <Text as="p" role="status" tone="error" size="helper" className="flood-kanban-board__error">{problem}</Text>}
  </div>;
});
