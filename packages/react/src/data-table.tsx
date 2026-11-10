import {forwardRef,useMemo,useState,type MouseEvent} from "react";
import {Table,Checkbox,Button,IconSlot,VisuallyHidden,Pagination,Text,Spinner,Alert,Stack,type DataTableProps,type DataTableSort,type DataTableRow} from "./index.js";

function activatePrimaryRowAction(event: MouseEvent<HTMLTableRowElement>) {
  const target = event.target;
  const row = event.currentTarget;
  if (!(target instanceof Element) || target.closest("tr") !== row || event.defaultPrevented ||
      event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const control = target.closest('button,a,input,label,select,textarea,summary,[role],[tabindex],[contenteditable]:not([contenteditable="false"])');
  if (control && row.contains(control)) return;
  const selection = row.ownerDocument.getSelection();
  if (selection && !selection.isCollapsed && selection.containsNode(row, true)) return;
  const button = row.querySelector<HTMLButtonElement>(":scope > td > .flood-stack > .flood-data-table__primary-action");
  if (!button || button.disabled || button.getAttribute("aria-disabled") === "true") return;
  button.focus({preventScroll: true});
  button.click();
}

export const ManagedDataTable = /* @__PURE__ */ forwardRef<HTMLDivElement,DataTableProps>(function ManagedDataTable({
  caption,hideCaption=false,columns,rows,density="comfortable",striped=false,minWidth="40rem",toolbar,inset="standard",
  sort:controlledSort,defaultSort=null,onSortChange,locale="en",selectable=false,
  selectedIds,defaultSelectedIds=[],onSelectionChange,page:controlledPage,defaultPage=1,pageSize=10,onPageChange,showResults=true,
  paginationMode="client",totalRows,selectionScope,
  state="ready",onRetry,emptyContent,labels={},className,...props
},ref){
  if(!caption.trim()||columns.length===0||columns.some(column=>!column.id.trim()||!column.label.trim())||new Set(columns.map(column=>column.id)).size!==columns.length)throw new Error("Flood DataTable requires a caption and unique named columns");
  if(rows.some(row=>!row.id.trim()||(row.label!==undefined&&!row.label.trim()))||new Set(rows.map(row=>row.id)).size!==rows.length)throw new Error("Flood DataTable rows require unique nonempty IDs and labels");
  if (rows.some(({primaryAction}) => primaryAction && (
    typeof primaryAction.title !== "string" || !primaryAction.title.trim() ||
    !columns.some(column => column.id === primaryAction.column)
  ))) throw new Error("Flood DataTable primary actions require a nonempty title and an existing column");
  if(!Number.isSafeInteger(pageSize)||pageSize<1||!Number.isSafeInteger(defaultPage)||defaultPage<1||(controlledPage!==undefined&&(!Number.isSafeInteger(controlledPage)||controlledPage<1)))throw new Error("Flood DataTable page and pageSize must be positive safe integers");
  const server=paginationMode==="server",scope=selectionScope??(server?"page":"dataset");
  if(server&&(controlledPage===undefined||!onPageChange||!Number.isSafeInteger(totalRows)||(totalRows??-1)<0))throw new Error("Flood server DataTable requires page, onPageChange and a nonnegative totalRows");
  if(server&&columns.some(column=>column.sortable)&&(controlledSort===undefined||!onSortChange))throw new Error("Flood server sorting requires sort (or null) and onSortChange");
  if(server&&selectable&&scope==="dataset"&&(selectedIds===undefined||!onSelectionChange))throw new Error("Flood server dataset selection must be controlled");
  const [localSort,setSort]=useState(defaultSort),[localSelected,setSelected]=useState<readonly string[]>(defaultSelectedIds),[localPage,setPage]=useState(defaultPage);
  const requestedSort=controlledSort===undefined?localSort:controlledSort;
  const sorting=requestedSort&&columns.some(column=>column.id===requestedSort.column&&column.sortable)?requestedSort:null;
  const sorted=useMemo(()=>{
    if(server||!sorting)return [...rows];
    const collator=new Intl.Collator(locale,{numeric:true,sensitivity:"base"});
    const value=(row:DataTableRow)=>{
      const explicit=row.sortValues?.[sorting.column];
      if(explicit!==undefined)return explicit;
      if(row.primaryAction?.column===sorting.column)return row.primaryAction.title;
      const cell=row.cells[sorting.column];return typeof cell==="string"||typeof cell==="number"?cell:null;
    };
    return rows.map((row,index)=>({row,index})).sort((a,b)=>{
      const left=value(a.row),right=value(b.row);
      // Missing values stay last in both directions; ties retain source order.
      if(left===null||right===null)return left===right?a.index-b.index:left===null?1:-1;
      const comparison=typeof left==="number"&&typeof right==="number"?left-right:collator.compare(String(left),String(right));
      return comparison===0?a.index-b.index:comparison*(sorting.direction==="ascending"?1:-1);
    }).map(entry=>entry.row);
  },[rows,sorting?.column,sorting?.direction,locale,server]);
  const total=server?totalRows!:rows.length,pageCount=Math.max(1,Math.ceil(total/pageSize)),page=server?controlledPage!:Math.min(controlledPage??localPage,pageCount);
  if(server&&state==="ready"&&(page>pageCount||rows.length>pageSize||(page-1)*pageSize+rows.length>total))throw new Error("Flood server rows and page must match totalRows/pageSize; reconcile the page after a query change");
  const visible=server?sorted:sorted.slice((page-1)*pageSize,page*pageSize),eligible=new Set((scope==="page"?visible:rows).filter(row=>!row.selectionDisabled).map(row=>row.id));
  const accepts=(id:string)=>server&&scope==="dataset"?!rows.some(row=>row.id===id&&row.selectionDisabled):eligible.has(id);
  const selection=[...new Set(selectedIds??localSelected)].filter(accepts),chosen=new Set(selection);
  const pageChoices=visible.filter(row=>!row.selectionDisabled),all=pageChoices.length>0&&pageChoices.every(row=>chosen.has(row.id)),some=pageChoices.some(row=>chosen.has(row.id));
  const blocked=state!=="ready";
  const select=(next:string[])=>{if(blocked)return;const accepted=[...new Set(next)].filter(accepts);if(selectedIds===undefined)setSelected(accepted);onSelectionChange?.(accepted);};
  const changePage=(next:number)=>{if(blocked)return;if(controlledPage===undefined)setPage(next);onPageChange?.(next);};
  const changeSort=(column:string)=>{
    if(blocked)return;
    const next:DataTableSort|null=sorting?.column!==column?{column,direction:"ascending"}:sorting.direction==="ascending"?{column,direction:"descending"}:null;
    if(controlledSort===undefined)setSort(next);onSortChange?.(next);
    if(page!==1)changePage(1);
  };
  const resultLabel=labels.results??((from:number,to:number,total:number)=>`${from}–${to} of ${total}`);
  return <div {...props} ref={ref} className={["flood-data-table",className].filter(Boolean).join(" ")} data-inset={inset} aria-busy={state==="loading"||undefined}>
    {toolbar != null && <div className="flood-data-table__toolbar">{toolbar}</div>}
    <Table caption={caption} hideCaption={hideCaption} density={density} striped={striped} style={{minWidth}}>
      <thead><tr>
        {selectable&&<th scope="col" className="flood-data-table__choice"><Checkbox
          label={<VisuallyHidden>{labels.selectPage??"Select rows on this page"}</VisuallyHidden>}
          checked={all} indeterminate={some&&!all} disabled={blocked||pageChoices.length===0}
          onChange={event=>{const ids=new Set(selection);for(const row of pageChoices)event.currentTarget.checked?ids.add(row.id):ids.delete(row.id);select([...ids]);}}/></th>}
        {columns.map(column=><th key={column.id} scope="col" data-numeric={column.numeric||undefined} data-align={column.align} data-sortable={column.sortable||undefined} aria-sort={sorting?.column===column.id?sorting.direction:undefined} style={{width:column.width}}>
          {column.sortable?<Button variant="ghost" size="sm" disabled={blocked} className="flood-data-table__sort"
            aria-label={(labels.sort??((label:string)=>`Sort by ${label}`))(column.label)} onClick={()=>changeSort(column.id)}>
            {column.label}<IconSlot size="sm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {sorting?.column===column.id?<path d="m7 14 5-5 5 5"/>:<path d="m8 8 4-4 4 4M8 16l4 4 4-4"/>}
            </svg></IconSlot>
          </Button>:column.label}
        </th>)}
      </tr></thead>
      <tbody>{state==="ready"&&visible.length>0?visible.map(row=><tr key={row.id} data-selected={selectable&&chosen.has(row.id)||undefined}
        data-primary-action={row.primaryAction && !row.primaryAction.buttonProps.disabled && row.primaryAction.buttonProps["aria-disabled"] !== "true" || undefined}
        onClick={row.primaryAction ? activatePrimaryRowAction : undefined}>
        {selectable&&<td className="flood-data-table__choice"><Checkbox label={<VisuallyHidden>{(labels.selectRow??((label:string)=>`Select ${label}`))(row.label??row.id)}</VisuallyHidden>}
          checked={chosen.has(row.id)} disabled={Boolean(row.selectionDisabled)} onChange={event=>select(event.currentTarget.checked?[...selection,row.id]:selection.filter(id=>id!==row.id))}/></td>}
        {columns.map(column=><td key={column.id} data-numeric={column.numeric||undefined} data-align={column.align}>{row.primaryAction?.column === column.id
          ? <Stack gap="1">
            <Button {...row.primaryAction.buttonProps} type="button" variant="ghost" size="sm"
              className={["flood-data-table__primary-action",row.primaryAction.buttonProps.className].filter(Boolean).join(" ")}>
              {row.primaryAction.title}
            </Button>
            {row.primaryAction.description != null && <Text as="div" size="helper" tone="subtle">{row.primaryAction.description}</Text>}
          </Stack>
          : row.cells[column.id]??null}</td>)}
      </tr>):<tr><td colSpan={columns.length+(selectable?1:0)} className="flood-data-table__state">
        {state==="loading"?<Spinner label={labels.loading??"Loading rows…"}/>:state==="error"?<Stack gap="3"><Alert tone="error" announcement="polite">{labels.error??"Could not load the rows."}</Alert>{onRetry&&<Button variant="subtle" size="sm" onClick={onRetry}>{labels.retry??"Try again"}</Button>}</Stack>:emptyContent??<Text as="p" size="compact" tone="subtle" role="status">{labels.empty??"No results found."}</Text>}
      </td></tr>}</tbody>
    </Table>
    {(showResults||selectable||pageCount>1)&&<div className="flood-data-table__footer">
      {showResults&&<Text as="p" size="helper" tone="subtle">{state==="ready"?resultLabel(visible.length?(page-1)*pageSize+1:0,visible.length?(page-1)*pageSize+visible.length:0,total):""}</Text>}
      {selectable&&<Text as="p" size="helper" tone="subtle" role="status">{(labels.selection??((count:number,total:number)=>`${count} of ${total} selected`))(selection.length,server&&scope==="dataset"?total:eligible.size)}</Text>}
      {pageCount>1&&<Pagination page={Math.min(page,pageCount)} pageCount={pageCount} onPageChange={changePage} disabled={blocked} label={labels.pagination} previousLabel={labels.previousPage} nextLabel={labels.nextPage} pageLabel={labels.page}/>}
    </div>}
  </div>;
});
