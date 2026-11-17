import type {ReorderMove, ReorderPlacement} from "./index.js";
import {useRef, type PointerEvent} from "react";

type Entry = {id:string; parentId?:string; disabled?:boolean; canContain?:boolean};
export function createCollectionMoveResolver(items: readonly Entry[], canMove?: (move: ReorderMove) => boolean) {
  const byId = new Map(items.map(item=>[item.id,item]));
  if (byId.size!==items.length || items.some(item=>!item.id.trim())) {
    throw new Error("Flood reorder items require unique nonempty IDs");
  }

  const ancestors = (id: string) => {
    const seen = new Set<string>();
    let next = byId.get(id)?.parentId;
    while (next !== undefined && !seen.has(next)) {
      seen.add(next);
      next = byId.get(next)?.parentId;
    }
    return seen;
  };
  if (items.some(item=>ancestors(item.id).has(item.id))) throw new Error("Flood reorder item parents must not form a cycle");

  return (sourceId: string, targetId: string, placement: ReorderPlacement) => {
    const source = byId.get(sourceId), target = byId.get(targetId);
    if (!source || !target || sourceId===targetId || source.disabled || target.disabled
      || (placement==="inside" && !target.canContain) || ancestors(targetId).has(sourceId)) return;
    const move: ReorderMove = {sourceId,targetId,placement};
    return canMove && !canMove(move) ? undefined : move;
  };
}

export type GripPoint = {x:number;y:number};
type Gesture = {id:number;sourceId:string;origin:GripPoint;point:GripPoint;started:boolean};
type GripActions = {
  prepare?: (id:string) => void;
  start: (id:string) => void;
  move: (id:string,point:GripPoint) => void;
  drop: (id:string,point:GripPoint) => void;
  cancel: () => void;
};

/** Share the pickup threshold and captured pointer lifecycle across reorder targets. */
export function useCollectionGrip(actions: GripActions) {
  const tracking = useRef<Gesture>(undefined);
  const clear = () => { tracking.current=undefined; };
  const point = (event: PointerEvent<HTMLElement>) => ({x:event.clientX,y:event.clientY});
  return {
    tracking, clear,
    handlers: <Target extends HTMLElement = HTMLButtonElement>(sourceId:string, disabled:boolean, focusOnDown=true) => ({
      onPointerDown: (event:PointerEvent<Target>) => {
        if (disabled || event.button!==0 || !event.isPrimary || tracking.current) return;
        actions.prepare?.(sourceId);
        const origin = point(event);
        tracking.current={id:event.pointerId,sourceId,origin,point:origin,started:false};
        if (focusOnDown) event.currentTarget.focus({preventScroll:true});
        event.currentTarget.setPointerCapture(event.pointerId);
      },
      onPointerMove: (event:PointerEvent<Target>) => {
        const gesture = tracking.current;
        if (!gesture || event.pointerId!==gesture.id || disabled) return;
        const current = gesture.point = point(event);
        if (!gesture.started) {
          if (Math.hypot(current.x-gesture.origin.x,current.y-gesture.origin.y)<6) return;
          gesture.started=true;
          actions.start(gesture.sourceId);
        }
        actions.move(gesture.sourceId,current);
      },
      onPointerUp: (event:PointerEvent<Target>) => {
        const gesture = tracking.current;
        if (!gesture || event.pointerId!==gesture.id) return;
        clear();
        if (gesture.started && !disabled) actions.drop(gesture.sourceId,point(event));
      },
      onPointerCancel: (event:PointerEvent<Target>) => {
        if (tracking.current?.id===event.pointerId) { clear(); actions.cancel(); }
      },
      onLostPointerCapture: (event:PointerEvent<Target>) => {
        if (tracking.current?.id===event.pointerId) { clear(); actions.cancel(); }
      },
    }),
  };
}
