import {forwardRef,useMemo,useState} from "react";
import {Table,Checkbox,Button,IconSlot,VisuallyHidden,Pagination,Text,Spinner,Alert,Stack,type DataTableProps,type DataTableSort,type DataTableRow} from "./index.js";

export const ManagedDataTable = /* @__PURE__ */ forwardRef<HTMLDivElement,DataTableProps>(function ManagedDataTable({
  caption,hideCaption=false,columns,rows,density="comfortable",striped=false,minWidth="40rem",
  sort:controlledSort,defaultSort=null,onSortChange,locale="en",selectable=false,
  selectedIds,defaultSelectedIds=[],onSelectionChange,page:controlledPage,defaultPage=1,pageSize=10,onPageChange,
  state="ready",onRetry,labels={},className,...props
},ref){
  if(!caption.trim()||columns.length===0||columns.some(column=>!column.id.trim()||!column.label.trim())||new Set(columns.map(column=>column.id)).size!==columns.length)throw new Error("Flood DataTable requires a caption and unique named columns");
  if(rows.some(row=>!row.id.trim()||(row.label!==undefined&&!row.label.trim()))||new Set(rows.map(row=>row.id)).size!==rows.length)throw new Error("Flood DataTable rows require unique nonempty IDs and labels");
  if(!Number.isSafeInteger(pageSize)||pageSize<1||!Number.isSafeInteger(defaultPage)||defaultPage<1||(controlledPage!==undefined&&(!Number.isSafeInteger(controlledPage)||controlledPage<1)))throw new Error("Flood DataTable page and pageSize must be positive safe integers");
  const [localSort,setSort]=useState(defaultSort),[localSelected,setSelected]=useState<readonly string[]>(defaultSelectedIds),[localPage,setPage]=useState(defaultPage);
  const requestedSort=controlledSort===undefined?localSort:controlledSort;
  const sorting=requestedSort&&columns.some(column=>column.id===requestedSort.column&&column.sortable)?requestedSort:null;
  const sorted=useMemo(()=>{
    if(!sorting)return [...rows];
    const collator=new Intl.Collator(locale,{numeric:true,sensitivity:"base"});
    const value=(row:DataTableRow)=>{
      const explicit=row.sortValues?.[sorting.column];
      if(explicit!==undefined)return explicit;
      const cell=row.cells[sorting.column];return typeof cell==="string"||typeof cell==="number"?cell:null;
    };
    return rows.map((row,index)=>({row,index})).sort((a,b)=>{
      const left=value(a.row),right=value(b.row);
      // Missing values stay last in both directions; ties retain source order.
      if(left===null||right===null)return left===right?a.index-b.index:left===null?1:-1;
      const comparison=typeof left==="number"&&typeof right==="number"?left-right:collator.compare(String(left),String(right));
      return comparison===0?a.index-b.index:comparison*(sorting.direction==="ascending"?1:-1);
    }).map(entry=>entry.row);
  },[rows,sorting?.column,sorting?.direction,locale]);
  const pageCount=Math.max(1,Math.ceil(rows.length/pageSize)),page=Math.min(controlledPage??localPage,pageCount);
  const visible=sorted.slice((page-1)*pageSize,page*pageSize),eligible=new Set(rows.filter(row=>!row.selectionDisabled).map(row=>row.id));
  const selection=[...new Set(selectedIds??localSelected)].filter(id=>eligible.has(id)),chosen=new Set(selection);
  const pageChoices=visible.filter(row=>!row.selectionDisabled),all=pageChoices.length>0&&pageChoices.every(row=>chosen.has(row.id)),some=pageChoices.some(row=>chosen.has(row.id));
  const blocked=state!=="ready";
  const select=(next:string[])=>{if(blocked)return;const accepted=[...new Set(next)].filter(id=>eligible.has(id));if(selectedIds===undefined)setSelected(accepted);onSelectionChange?.(accepted);};
  const changePage=(next:number)=>{if(blocked)return;if(controlledPage===undefined)setPage(next);onPageChange?.(next);};
  const changeSort=(column:string)=>{
    if(blocked)return;
    const next:DataTableSort|null=sorting?.column!==column?{column,direction:"ascending"}:sorting.direction==="ascending"?{column,direction:"descending"}:null;
    if(controlledSort===undefined)setSort(next);onSortChange?.(next);
    if(page!==1)changePage(1);
  };
  const resultLabel=labels.results??((from:number,to:number,total:number)=>`${from}–${to} of ${total}`);
  return <div {...props} ref={ref} className={["flood-data-table",className].filter(Boolean).join(" ")} aria-busy={state==="loading"||undefined}>
    <Table caption={caption} hideCaption={hideCaption} density={density} striped={striped} style={{minWidth}}>
      <thead><tr>
        {selectable&&<th scope="col" className="flood-data-table__choice"><Checkbox
          label={<VisuallyHidden>{labels.selectPage??"Select rows on this page"}</VisuallyHidden>}
          checked={all} indeterminate={some&&!all} disabled={blocked||pageChoices.length===0}
          onChange={event=>{const ids=new Set(selection);for(const row of pageChoices)event.currentTarget.checked?ids.add(row.id):ids.delete(row.id);select([...ids]);}}/></th>}
        {columns.map(column=><th key={column.id} scope="col" aria-sort={sorting?.column===column.id?sorting.direction:undefined} style={{textAlign:column.align??"start",width:column.width}}>
          {column.sortable?<Button variant="ghost" size="sm" disabled={blocked} className="flood-data-table__sort"
            aria-label={(labels.sort??((label:string)=>`Sort by ${label}`))(column.label)} onClick={()=>changeSort(column.id)}>
            {column.label}<IconSlot size="sm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {sorting?.column===column.id?<path d={sorting.direction==="ascending"?"m7 14 5-5 5 5":"m7 10 5 5 5-5"}/>:<path d="m8 8 4-4 4 4M8 16l4 4 4-4"/>}
            </svg></IconSlot>
          </Button>:column.label}
        </th>)}
      </tr></thead>
      <tbody>{state==="ready"&&visible.length>0?visible.map(row=><tr key={row.id} data-selected={selectable&&chosen.has(row.id)||undefined}>
        {selectable&&<td className="flood-data-table__choice"><Checkbox label={<VisuallyHidden>{(labels.selectRow??((label:string)=>`Select ${label}`))(row.label??row.id)}</VisuallyHidden>}
          checked={chosen.has(row.id)} disabled={Boolean(row.selectionDisabled)} onChange={event=>select(event.currentTarget.checked?[...selection,row.id]:selection.filter(id=>id!==row.id))}/></td>}
        {columns.map(column=><td key={column.id} style={{textAlign:column.align??"start"}}>{row.cells[column.id]??null}</td>)}
      </tr>):<tr><td colSpan={columns.length+(selectable?1:0)} className="flood-data-table__state">
        {state==="loading"?<Spinner label={labels.loading??"Loading rows…"}/>:state==="error"?<Stack gap="3"><Alert tone="error" announcement="polite">{labels.error??"Could not load the rows."}</Alert>{onRetry&&<Button variant="subtle" size="sm" onClick={onRetry}>{labels.retry??"Try again"}</Button>}</Stack>:<Text as="p" size="compact" tone="subtle" role="status">{labels.empty??"No results found."}</Text>}
      </td></tr>}</tbody>
    </Table>
    <div className="flood-data-table__footer">
      <Text as="p" size="helper" tone="subtle">{state==="ready"?resultLabel(rows.length?(page-1)*pageSize+1:0,Math.min(page*pageSize,rows.length),rows.length):""}</Text>
      {selectable&&<Text as="p" size="helper" tone="subtle" role="status">{(labels.selection??((count:number,total:number)=>`${count} of ${total} selected`))(selection.length,eligible.size)}</Text>}
      {pageCount>1&&<Pagination page={page} pageCount={pageCount} onPageChange={changePage} disabled={blocked} label={labels.pagination} previousLabel={labels.previousPage} nextLabel={labels.nextPage} pageLabel={labels.page}/>}
    </div>
  </div>;
});
