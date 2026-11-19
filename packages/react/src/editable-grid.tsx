import {Fragment, forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode} from "react";
import {Input, Text, type EditableGridChange, type EditableGridProps} from "./index.js";
import {TabularData} from "./data-display.js";
import {useDataTableColumnLayout} from "./data-table-columns.js";
import {positionLayer} from "./overlay-runtime.js";

type Address = {rowId:string; columnId:string};
type Point = {row:number; column:number};
type Selection = {anchor:Address; active:Address};
type Draft = {address:Address; value:string; original:string; problem?:string};
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const key = (address: Address) => JSON.stringify([address.rowId,address.columnId]);
const same = (a: Address | undefined, b: Address | undefined) => a?.rowId===b?.rowId && a?.columnId===b?.columnId;
const encode = (value: string) => /["\t\r\n]/.test(value) ? `"${value.replaceAll('"','""')}"` : value;

function readTsv(text: string): string[][] | undefined {
  const input = text.replace(/\r\n?|\n/g,"\n").replace(/\n$/,"");
  const result: string[][] = [[]];
  let value = "", quoted = false, closedQuote = false;
  for (let index=0;index<input.length;index++) {
    const char = input[index];
    if (quoted) {
      if (char==='"' && input[index+1]==='"') { value+='"'; index++; }
      else if (char==='"') { quoted=false; closedQuote=true; }
      else value+=char;
    } else if (char==="\t" || char==="\n") {
      result.at(-1)!.push(value);
      if (char==="\n") result.push([]);
      value="";
      closedQuote=false;
    } else if (closedQuote) return;
    else if (char==='"' && value==="") quoted=true;
    else value+=char;
  }
  if (quoted) return;
  result.at(-1)!.push(value);
  return result.every(row=>row.length===result[0].length) ? result : undefined;
}

const clamp = (index: number, length: number) => Math.max(0,Math.min(length-1,index));

export const SheetGrid = /* @__PURE__ */ forwardRef<HTMLTableElement, EditableGridProps>(function SheetGrid({
  caption, columns, rows, readOnly = false, onChanges, labels, virtualRows, pinFirstColumn, columnWidths, defaultColumnWidths, onColumnWidthsChange, className, onFocus, onBlur, "aria-describedby": describedBy, ...props
}, ref) {
  const columnLayout = useDataTableColumnLayout(columns, columns, {columnWidths, defaultColumnWidths, onColumnWidthsChange});
  const grid = columnLayout.table;
  const viewport = useRef<HTMLDivElement>(null);
  const cellNodes = useRef(new Map<string,HTMLTableCellElement>());
  const editor = useRef<HTMLInputElement>(null);
  const errorLayer = useRef<HTMLDivElement>(null);
  const shouldFocus = useRef(false);
  const hasFocus = useRef(false);
  const resolved = useRef(false);
  const keepEditorText = useRef(false);
  const [selection, setSelection] = useState<Selection>();
  const [pending, setPending] = useState<Draft>();
  const [error, setError] = useState<string>();
  const [scrollTop, setScrollTop] = useState(0);
  const errorId = useId();
  useImperativeHandle(ref,()=>grid.current!,[]);

  const rowIndices = useMemo(() => new Map(rows.map((row,index)=>[row.id,index])), [rows]);
  const columnIndices = useMemo(() => new Map(columns.map((column,index)=>[column.id,index])), [columns]);
  if (!caption.trim() || !columns.length || columns.some(column=>!column.id.trim() || !column.label.trim())
    || rows.some(row=>!row.id.trim()) || rowIndices.size!==rows.length || columnIndices.size!==columns.length) {
    throw new Error("Flood EditableGrid requires a caption, unique nonempty row/column IDs, and named columns");
  }
  const origin = rows.length ? {rowId:rows[0].id,columnId:columns[0].id} : undefined;
  function point(address: Address | undefined) {
    if (!address) return;
    const row = rowIndices.get(address.rowId), column = columnIndices.get(address.columnId);
    return row===undefined || column===undefined ? undefined : {row,column};
  }
  const active = point(selection?.active) ? selection?.active : origin;
  const anchor = point(selection?.anchor) ? selection?.anchor : active;
  const first = point(anchor);
  const last = point(active);
  const range = first && last && {
    top:Math.min(first.row,last.row), bottom:Math.max(first.row,last.row),
    start:Math.min(first.column,last.column), end:Math.max(first.column,last.column),
  };
  const locked = readOnly || !onChanges;
  const editable = ({row,column}: Point) => !locked && !columns[column].readOnly && !rows[row].readOnlyColumns?.includes(columns[column].id);
  const pendingPoint = point(pending?.address);
  const draft = pendingPoint && editable(pendingPoint) ? pending : undefined;
  const draftKey = draft && key(draft.address);
  const problem = draft?.problem ?? error;
  const values = ({row,column}: Point) => rows[row].values[columns[column].id] ?? "";
  const fromPoint = ({row,column}: Point) => ({rowId:rows[row].id,columnId:columns[column].id});
  const label = (row: number) => rows[row].label ?? rows[row].id;
  const rowHeight = virtualRows?.rowHeight ?? 44;
  const overscan = virtualRows?.overscan ?? 5;
  if (virtualRows && (!Number.isFinite(virtualRows.height) || virtualRows.height < 1 || !Number.isFinite(rowHeight) || rowHeight < 24 || !Number.isInteger(overscan) || overscan < 0)) {
    throw new Error("Flood EditableGrid requires a positive viewport height, row height of at least 24px, and nonnegative integer overscan");
  }
  const bodyStart = grid.current?.tBodies[0]?.offsetTop ?? rowHeight;
  const firstRendered = virtualRows ? Math.max(0, Math.min(rows.length - 1, Math.floor((scrollTop - bodyStart) / rowHeight) - overscan)) : 0;
  const endRendered = virtualRows ? Math.min(rows.length, firstRendered + Math.ceil(virtualRows.height / rowHeight) + 2 * overscan + 2) : rows.length;
  const visibleRows = Array.from({length:endRendered-firstRendered}, (_, offset)=>firstRendered+offset);
  // Keep the current editing and tab stop mounted when the user scrolls away.
  if (virtualRows && last && (last.row < firstRendered || last.row >= endRendered)) {
    if (last.row < firstRendered) visibleRows.unshift(last.row);
    else visibleRows.push(last.row);
  }

  function spacers(from: number, to: number): ReactNode {
    if (to <= from) return null;
    return <tr aria-hidden="true" className="flood-editable-grid__spacer">
      <td colSpan={columns.length} style={{height:(to-from)*rowHeight}} />
    </tr>;
  }

  useBrowserLayoutEffect(()=>{
    if (pending && !draft) setPending(undefined);
    if (!active || draft) return;
    if (shouldFocus.current || (hasFocus.current && !point(selection?.active))) {
      shouldFocus.current=false;
      const cell = cellNodes.current.get(key(active));
      if (virtualRows && cell && viewport.current) {
        const scrolling = viewport.current;
        const bounds = scrolling.getBoundingClientRect();
        const cellBounds = cell.getBoundingClientRect();
        const header = grid.current?.rows[0];
        const visibleTop = props.stickyHeader ? Math.max(bounds.top, header?.getBoundingClientRect().bottom ?? bounds.top) : bounds.top;
        if (cellBounds.top < visibleTop) scrolling.scrollTop += cellBounds.top - visibleTop;
        else if (cellBounds.bottom > bounds.bottom) scrolling.scrollTop += cellBounds.bottom - bounds.bottom;
        const pinned = pinFirstColumn && last?.column !== 0 ? header?.cells[0]?.getBoundingClientRect() : undefined;
        const rtl = getComputedStyle(scrolling).direction === "rtl";
        const visibleLeft = !rtl && pinned ? pinned.right : bounds.left;
        const visibleRight = rtl && pinned ? pinned.left : bounds.right;
        if (cellBounds.left < visibleLeft) scrolling.scrollLeft += cellBounds.left - visibleLeft;
        else if (cellBounds.right > visibleRight) scrolling.scrollLeft += cellBounds.right - visibleRight;
        cell.focus({preventScroll:true});
      } else cell?.focus();
    }
  },[active?.rowId,active?.columnId,draftKey,selection?.active,pending,virtualRows,pinFirstColumn]);

  useBrowserLayoutEffect(()=>{
    if (!draftKey || !editor.current) return;
    editor.current.focus({preventScroll:true});
    if (keepEditorText.current) editor.current.select();
    else editor.current.setSelectionRange(editor.current.value.length,editor.current.value.length);
  },[draftKey]);

  useBrowserLayoutEffect(()=>{
    const layer = errorLayer.current;
    const anchorNode = draftKey ? editor.current : active && cellNodes.current.get(key(active));
    if (!layer || !anchorNode || !problem || props.hidden) return;
    const document = anchorNode.ownerDocument;
    const view = document.defaultView!;
    layer.style.visibility="hidden";
    layer.showPopover();
    const side = last?.row === rows.length - 1 ? "top" : "bottom";
    const update = () => { if (layer.matches(":popover-open")) positionLayer(anchorNode,layer,side,"start"); };
    update();
    const observer = new view.ResizeObserver(update);
    observer.observe(anchorNode);
    observer.observe(layer);
    document.addEventListener("scroll",update,true);
    view.addEventListener("resize",update);
    view.visualViewport?.addEventListener("resize",update);
    view.visualViewport?.addEventListener("scroll",update);
    return ()=>{
      observer.disconnect();
      document.removeEventListener("scroll",update,true);
      view.removeEventListener("resize",update);
      view.visualViewport?.removeEventListener("resize",update);
      view.visualViewport?.removeEventListener("scroll",update);
      if (layer.matches(":popover-open")) layer.hidePopover();
    };
  },[active?.rowId,active?.columnId,draftKey,last?.row,problem,props.hidden,rows.length]);

  const selectCell = (address: Address, extend: boolean, focus: boolean) => {
    if (focus) shouldFocus.current=true;
    setSelection({anchor:extend ? anchor ?? address : address, active:address});
    setError(undefined);
  };
  const startEditing = (address: Address, initial?: string) => {
    const target = point(address);
    if (!target || !editable(target)) return;
    resolved.current=false;
    keepEditorText.current=initial===undefined;
    const original = values(target);
    setSelection({anchor:address,active:address});
    setError(undefined);
    setPending({address,original,value:initial ?? original});
  };
  const invalidPaste = labels?.invalidPaste ?? "Cells accept single-line text.";
  const validate = (target: Point, value: string) => /[\t\r\n]/.test(value)
    ? invalidPaste
    : columns[target.column].validate?.(value,rows[target.row]) || undefined;
  const change = (target: Point, value: string): EditableGridChange => ({...fromPoint(target),value,previousValue:values(target)});
  const commit = () => {
    if (!draft || !pendingPoint || resolved.current) return true;
    const accepted = values(pendingPoint);
    const issue = accepted!==draft.original ? labels?.conflict ?? "This value changed. Cancel and reopen the cell."
      : validate(pendingPoint,draft.value) || (draft.value!==accepted
        ? onChanges?.([change(pendingPoint,draft.value)],"edit") : undefined);
    if (issue) { setPending({...draft,problem:issue}); return false; }
    resolved.current=true;
    setPending(undefined);
    setError(undefined);
    return true;
  };
  const paste = (text: string) => {
    if (!range || locked) return;
    const matrix = readTsv(text);
    if (!matrix) { setError(labels?.invalidPaste ?? "Paste cells with the same number of columns in every row."); return; }
    const single = matrix.length===1 && matrix[0].length===1;
    const bottom = single ? range.bottom : range.top+matrix.length-1;
    const end = single ? range.end : range.start+matrix[0].length-1;
    if (bottom>=rows.length || end>=columns.length) {
      setError(labels?.pasteOutsideGrid ?? "The pasted cells do not fit here.");
      return;
    }
    const changes: EditableGridChange[] = [];
    for (let row=range.top;row<=bottom;row++) {
      for (let column=range.start;column<=end;column++) {
        const target={row,column};
        const incoming=single ? matrix[0][0] : matrix[row-range.top][column-range.start];
        if (!editable(target)) { setError(labels?.readOnlyCell ?? "The selection includes a read-only cell."); return; }
        const issue=validate(target,incoming);
        if (issue) { setError(issue); return; }
        if (incoming!==values(target)) changes.push(change(target,incoming));
      }
    }
    const rejection = changes.length ? onChanges?.(changes,"paste") : undefined;
    if (rejection) { setError(rejection); return; }
    setError(undefined);
    setSelection({anchor:fromPoint({row:range.top,column:range.start}),active:fromPoint({row:bottom,column:end})});
    shouldFocus.current=true;
  };

  const navigate = (event: KeyboardEvent<HTMLTableElement>) => {
    if (!active || !last || event.defaultPrevented || event.nativeEvent.isComposing || event.keyCode===229
      || event.altKey || !(event.target instanceof Element) || !event.target.matches("td[role=gridcell]")) return;
    const modifier = event.ctrlKey || event.metaKey;
    const direction = getComputedStyle(event.currentTarget).direction==="rtl" ? -1 : 1;
    const {row,column} = last;
    const navigation = {
      ArrowLeft:{row,column:column-direction}, ArrowRight:{row,column:column+direction},
      ArrowUp:{row:row-1,column}, ArrowDown:{row:row+1,column},
      Home:{row:modifier ? 0 : row,column:0}, End:{row:modifier ? rows.length-1 : row,column:columns.length-1},
    } as Record<string,Point|undefined>;
    if (Object.hasOwn(navigation,event.key)) {
      event.preventDefault();
      const next = navigation[event.key]!;
      selectCell(fromPoint({row:clamp(next.row,rows.length),column:clamp(next.column,columns.length)}),event.shiftKey,true);
    } else if (modifier && event.key.toLowerCase()==="a" && origin) {
      event.preventDefault();
      setSelection({anchor:origin,active:fromPoint({row:rows.length-1,column:columns.length-1})});
      shouldFocus.current=true;
    } else if (event.key==="Escape" && range) {
      event.preventDefault();
      selectCell(active,false,true);
    } else if (!modifier && editable(last)) {
      if (event.key==="F2" || event.key==="Enter") {
        event.preventDefault();
        if (!event.repeat) startEditing(active);
      } else if ([...event.key].length===1) {
        event.preventDefault();
        startEditing(active,event.key);
      }
    }
  };

  return <>
    <TabularData {...props} ref={grid} caption={caption} role="grid" aria-label={props["aria-label"] ?? caption}
      maxViewportHeight={virtualRows ? `${virtualRows.height}px` : props.maxViewportHeight}
      onViewportMount={node=>{viewport.current=node;}}
      onViewportScroll={virtualRows ? event=>setScrollTop(event.currentTarget.scrollTop) : undefined}
      aria-describedby={[describedBy,problem && errorId].filter(Boolean).join(" ") || undefined}
      aria-multiselectable="true" aria-readonly={locked || undefined}
      aria-rowcount={virtualRows && rows.length ? rows.length+1 : undefined}
      data-virtual={virtualRows ? "" : undefined} data-pin-first={pinFirstColumn ? "" : undefined}
      data-fixed-columns={columnLayout.fixedWidth !== undefined || undefined}
      style={{...props.style,inlineSize:columnLayout.fixedWidth ?? props.style?.inlineSize,
        minInlineSize:props.style?.minInlineSize ?? `max(${columns.length*6.5}rem, ${columns.reduce((total,column)=>total+Math.max(0,column.width ?? 0),0)}px)`,
        ...(virtualRows ? {"--flood-editable-grid-fixed-row":`${rowHeight}px`} : {})} as CSSProperties}
      className={["flood-editable-grid",className].filter(Boolean).join(" ")}
      onFocus={event=>{hasFocus.current=true; onFocus?.(event);}}
      onBlur={event=>{
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) hasFocus.current=false;
        onBlur?.(event);
      }}
      onKeyDown={navigate}
      onPaste={event=>{
        if (!draft && !locked && event.clipboardData.types.includes("text/plain")) {
          event.preventDefault();
          paste(event.clipboardData.getData("text/plain"));
        }
      }}
      onCopy={event=>{
        if (draft || !range) return;
        const lines:string[]=[];
        for (let row=range.top;row<=range.bottom;row++) {
          const line:string[]=[];
          for (let column=range.start;column<=range.end;column++) line.push(encode(values({row,column})));
          lines.push(line.join("\t"));
        }
        event.clipboardData.setData("text/plain",lines.join("\n"));
        event.preventDefault();
      }}>
      <thead><tr role="row" aria-rowindex={virtualRows ? 1 : undefined}>
        {columns.map(column=><th {...columnLayout.columnCell(column,true)} key={column.id} scope="col" role="columnheader"
          data-align={column.align} data-resize-edge={column.resizable ? "end" : undefined}>
          {column.label}{columnLayout.renderHandle(column, `Resize ${column.label} column`, false)}
        </th>)}
      </tr></thead>
      <tbody>
        {rows.length===0 && <tr role="row"><td role="gridcell" colSpan={columns.length}>{labels?.empty ?? "No rows"}</td></tr>}
        {visibleRows.map((rowIndex,position)=>{
          const row=rows[rowIndex];
          return <Fragment key={row.id}>
          {virtualRows && spacers(position===0 ? 0 : visibleRows[position-1]+1, rowIndex)}
          <tr role="row" aria-rowindex={virtualRows ? rowIndex+2 : undefined}>
          {columns.map((column,columnIndex)=>{
            const address = {rowId:row.id,columnId:column.id};
            const addressKey = key(address);
            const target = {row:rowIndex,column:columnIndex};
            const value = values(target);
            const isActive = same(active,address);
            const selected = Boolean(selection && range && rowIndex>=range.top && rowIndex<=range.bottom && columnIndex>=range.start && columnIndex<=range.end);
            const isEditing = draft && same(draft.address,address);
            const canEdit = editable(target);
            return <td key={column.id} data-align={column.align} data-active={isActive || undefined} data-editing={isEditing || undefined}
              ref={node=>{if (node) cellNodes.current.set(addressKey,node); else cellNodes.current.delete(addressKey);}}
              role="gridcell" className="flood-editable-grid__cell" aria-selected={selected} aria-readonly={!canEdit || undefined}
              tabIndex={isActive && !isEditing ? 0 : -1}
              onFocus={event=>{
                if (event.target===event.currentTarget && !draft && !isActive) selectCell(address,false,false);
              }}
              onPointerDown={event=>{if (event.shiftKey && !isEditing) event.preventDefault();}}
              onClick={event=>{
                if (isEditing) return;
                if (draft && !commit()) { editor.current?.focus(); return; }
                selectCell(address,event.shiftKey,true);
              }}
              onDoubleClick={()=>{if (!draft) startEditing(address);}}>
              <div className="flood-editable-grid__body">
                <span className="flood-editable-grid__value" aria-hidden={isEditing || undefined}>{column.format?.(value,row) ?? value}</span>
                {isEditing && <Input ref={editor} className="flood-editable-grid__input" controlSize="sm"
                  style={{"--flood-editable-grid-value-span": `${Math.max(7, [...value].length + 2)}ch`} as CSSProperties}
                  value={draft.value} inputMode={column.inputMode} invalid={Boolean(draft.problem)}
                  aria-label={labels?.edit?.(column.label,label(rowIndex)) ?? `Edit ${column.label}, ${label(rowIndex)}`}
                  aria-describedby={draft.problem ? errorId : undefined}
                  onChange={event=>setPending({...draft,value:event.currentTarget.value,problem:undefined})}
                  onBlur={event=>{
                    if (event.relatedTarget) commit();
                  }}
                  onKeyDown={event=>{
                    if (event.defaultPrevented || event.nativeEvent.isComposing || event.keyCode===229 || event.altKey || event.ctrlKey || event.metaKey) return;
                    if (event.key==="Escape") {
                      event.preventDefault();
                      event.stopPropagation();
                      resolved.current=true;
                      setPending(undefined);
                      shouldFocus.current=true;
                    } else if (event.key==="Enter") {
                      event.preventDefault();
                      if (commit()) shouldFocus.current=true;
                    } else if (event.key==="Tab") {
                      if (!commit()) { event.preventDefault(); return; }
                      const nextOffset=rowIndex*columns.length+columnIndex+(event.shiftKey ? -1 : 1);
                      if (nextOffset>=0 && nextOffset<rows.length*columns.length) {
                        event.preventDefault();
                        selectCell(fromPoint({row:Math.floor(nextOffset/columns.length),column:nextOffset%columns.length}),false,true);
                      }
                    }
                  }}/>}
              </div>
            </td>;
          })}
          </tr></Fragment>;
        })}
        {virtualRows && rows.length > 0 && spacers((visibleRows.at(-1) ?? -1)+1, rows.length)}
      </tbody>
    </TabularData>
    {problem && !props.hidden && <div ref={errorLayer} popover="manual" className="flood-overlay-panel flood-editable-grid__error">
      <Text as="div" id={errorId} role="status" size="helper" tone="error">{problem}</Text>
    </div>}
  </>;
});
