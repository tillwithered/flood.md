import {forwardRef,useEffect,useMemo,useRef,useState,type MouseEvent} from "react";
import {Table,Checkbox,Button,Badge,IconSlot,VisuallyHidden,Pagination,Text,Spinner,Alert,Stack,Inline,Menu,Tooltip,type DataTableColumn,type DataTableProps,type DataTableSort,type DataTableRow,type MenuItem} from "./index.js";
import { useDataTableColumnLayout } from "./data-table-columns.js";
import { DataTableExpandableRow, useDataTableExpansion } from "./data-table-expansion.js";

const columnName = (column: DataTableColumn) => column.unit ? `${column.label} (${column.unit})` : column.label;

function DataTableHeading({ column, sortLabel, disabled, descending, onSort }: {
  column: DataTableColumn;
  sortLabel: string;
  disabled: boolean;
  descending: boolean;
  onSort: () => void;
}) {
  const label = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);
  useEffect(() => {
    const node = label.current;
    if (!node) return;
    const measure = () => setTruncated(node.scrollWidth > node.clientWidth);
    measure();
    const Observer = node.ownerDocument.defaultView?.ResizeObserver;
    const observer = Observer && new Observer(measure);
    observer?.observe(node);
    const fonts = node.ownerDocument.fonts;
    fonts?.addEventListener("loadingdone", measure);
    return () => {
      observer?.disconnect();
      fonts?.removeEventListener("loadingdone", measure);
    };
  }, [column.label, column.unit]);

  const content = <>
    <span ref={label} className="flood-data-table__header-label">{column.label}</span>
    {column.unit && <Badge size="sm" variant="outline" className="flood-data-table__header-unit" aria-hidden="true">{column.unit}</Badge>}
  </>;
  return <Tooltip content={columnName(column)} disabled={!truncated} trigger={trigger =>
    column.sortable ? <Button {...trigger} aria-describedby={undefined} variant="ghost" size="sm" disabled={disabled}
      className="flood-data-table__sort" aria-label={sortLabel} onClick={onSort}>
      {content}<IconSlot size="sm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {descending ? <path d="m7 14 5-5 5 5"/> : <path d="m8 8 4-4 4 4M8 16l4 4 4-4"/>}
      </svg></IconSlot>
    </Button> : <span {...trigger} aria-describedby={undefined} className="flood-data-table__header-content"
      tabIndex={truncated ? 0 : undefined}>{content}</span>
  } />;
}

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
  maxViewportHeight,stickyHeader,
  showColumnVisibility=false,hiddenColumnIds,defaultHiddenColumnIds=[],onHiddenColumnIdsChange,
  columnWidths,defaultColumnWidths,onColumnWidthsChange,
  expandedIds,defaultExpandedIds,onExpandedChange,
  sort:controlledSort,defaultSort=null,onSortChange,locale="en",selectable=false,
  selectedIds,defaultSelectedIds=[],onSelectionChange,page:controlledPage,defaultPage=1,pageSize=10,onPageChange,showResults=true,showSelection=true,
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
  const [localHiddenIds, setHiddenIds] = useState(defaultHiddenColumnIds);
  const hidden = new Set(hiddenColumnIds ?? localHiddenIds);
  const required = new Set(rows.flatMap(row => row.primaryAction ? [row.primaryAction.column] : []));
  if (sorting) required.add(sorting.column);
  const displayed = columns.filter(column => column.hideable === false || required.has(column.id) || !hidden.has(column.id));
  const retained = displayed.length > 0 ? displayed : columns.slice(0, 1);
  const visibleColumns = [
    ...retained.filter(column => column.pinned === "start"),
    ...retained.filter(column => !column.pinned),
    ...retained.filter(column => column.pinned === "end"),
  ];
  const expansion = useDataTableExpansion(rows, expandedIds, defaultExpandedIds, onExpandedChange);
  const columnLayout = useDataTableColumnLayout(columns, visibleColumns, {
    columnWidths, defaultColumnWidths, onColumnWidthsChange, measureViewport: expansion.enabled,
  });
  const columnCount = visibleColumns.length + Number(selectable) + Number(expansion.enabled);
  const visibleIds = new Set(visibleColumns.map(column => column.id));
  const normalizeHiddenIds = (ids: ReadonlySet<string>) =>
    columns.filter(column => column.hideable !== false && ids.has(column.id)).map(column => column.id);
  const defaultIds = normalizeHiddenIds(new Set(defaultHiddenColumnIds));
  const requestedIds = normalizeHiddenIds(hidden);
  const visibilityAtDefaults = requestedIds.length === defaultIds.length && defaultIds.every(id => hidden.has(id));
  const changeHiddenIds = (next: string[]) => {
    if (hiddenColumnIds === undefined) setHiddenIds(next);
    onHiddenColumnIdsChange?.(next);
  };
  const columnItems: MenuItem[] = showColumnVisibility ? [
    ...columns.map((column): MenuItem => ({
      id: `column:${column.id}`,
      type: "checkbox",
      label: sorting?.column === column.id
        ? (labels.sortedColumn ?? (label => `${label} (sorted)`))(columnName(column))
        : columnName(column),
      checked: visibleIds.has(column.id),
      disabled: column.hideable === false || required.has(column.id) || (visibleColumns.length === 1 && visibleIds.has(column.id)),
      onCheckedChange: checked => {
        const next = new Set(hidden);
        if (checked) next.delete(column.id);
        else next.add(column.id);
        changeHiddenIds(normalizeHiddenIds(next));
      },
    })),
    { id: "column-layout-separator", type: "separator" },
    { id: "reset-columns", label: labels.resetColumns ?? "Reset columns",
      disabled: visibilityAtDefaults && columnLayout.atDefaults },
  ] : [];
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
  const selectionLabel = selectable
    ? (labels.selection ?? ((count, total) => `${count} of ${total} selected`))(selection.length, server && scope === "dataset" ? total : eligible.size)
    : null;
  const renderToolbar = typeof toolbar === "function" ? toolbar : null;
  const columnsControl = showColumnVisibility ? (
    <Menu label={labels.columns ?? "Columns"} items={columnItems} align="end"
      onAction={id => {
        if (id !== "reset-columns") return;
        if (!visibilityAtDefaults) changeHiddenIds(defaultIds);
        columnLayout.reset();
      }}
      trigger={trigger => <Button {...trigger} className={renderToolbar ? undefined : "flood-data-table__columns"} variant="subtle" size="sm">{labels.columns ?? "Columns"}</Button>}/>
  ) : null;
  const toolbarContent = typeof toolbar === "function" ? toolbar({ columns: columnsControl }) : toolbar;
  const sortLabel = labels.sort ?? ((label: string) => `Sort by ${label}`);
  return <div {...props} ref={ref} className={["flood-data-table",className].filter(Boolean).join(" ")} data-inset={inset} aria-busy={state==="loading"||undefined}>
    {columnsControl && !renderToolbar ? <Inline gap="3" className="flood-data-table__toolbar">
      {toolbarContent != null && <div className="flood-data-table__toolbar-content">{toolbarContent}</div>}
      {columnsControl}
    </Inline> : toolbarContent != null && <div className="flood-data-table__toolbar">{toolbarContent}</div>}
    <Table ref={columnLayout.table} className="flood-data-table__table" caption={caption} hideCaption={hideCaption} density={density} striped={striped}
      maxViewportHeight={maxViewportHeight} stickyHeader={stickyHeader}
      data-inset={inset} data-fixed-columns={columnLayout.fixedWidth !== undefined || undefined}
      style={columnLayout.fixedWidth === undefined ? {minWidth} : {inlineSize:columnLayout.fixedWidth,tableLayout:"fixed"}}>
      <thead><tr>
        {expansion.enabled && <th {...columnLayout.utilityCell("expansion", true)} scope="col"
          data-data-table-utility="expansion" className="flood-data-table__expand">
          <VisuallyHidden>{labels.rowDetails ?? "Row details"}</VisuallyHidden>
        </th>}
        {selectable&&<th {...columnLayout.utilityCell("selection", true)} scope="col" className="flood-data-table__choice"><Checkbox
          label={<VisuallyHidden>{labels.selectPage??"Select rows on this page"}</VisuallyHidden>}
          checked={all} indeterminate={some&&!all} disabled={blocked||pageChoices.length===0}
          onChange={event=>{const ids=new Set(selection);for(const row of pageChoices)event.currentTarget.checked?ids.add(row.id):ids.delete(row.id);select([...ids]);}}/></th>}
        {visibleColumns.map(column=>{
          const name = columnName(column);
          return <th {...columnLayout.columnCell(column, true)} key={column.id} scope="col"
          data-numeric={column.numeric||undefined} data-align={column.align} data-sortable={column.sortable||undefined}
          data-resize-edge={column.resizable ? column.pinned === "end" ? "start" : "end" : undefined}
          aria-label={column.sortable ? sortLabel(name) : name}
          aria-sort={sorting?.column===column.id?sorting.direction:undefined}>
          <DataTableHeading column={column} sortLabel={sortLabel(name)} disabled={blocked}
            descending={sorting?.column === column.id} onSort={() => changeSort(column.id)} />
          {column.resizable && columnLayout.renderHandle(column, (labels.resizeColumn ?? (label => `Resize ${label} column`))(name), blocked)}
        </th>;
        })}
      </tr></thead>
      <tbody>{state==="ready"&&visible.length>0?visible.map(row=><DataTableExpandableRow key={row.id} row={row}
        showDisclosure={expansion.enabled} expanded={expansion.expanded.has(row.id)} colSpan={columnCount}
        labels={labels} onToggle={() => expansion.toggle(row.id)} disclosureCellProps={columnLayout.utilityCell("expansion")}
        viewportWidth={columnLayout.viewportWidth} disclosureWidth={columnLayout.disclosureWidth}>
        {disclosure => <tr data-selected={selectable&&chosen.has(row.id)||undefined}
        data-primary-action={row.primaryAction && !row.primaryAction.buttonProps.disabled && row.primaryAction.buttonProps["aria-disabled"] !== "true" || undefined}
        onClick={row.primaryAction ? activatePrimaryRowAction : undefined}>
        {disclosure}
        {selectable&&<td {...columnLayout.utilityCell("selection")} className="flood-data-table__choice"><Checkbox label={<VisuallyHidden>{(labels.selectRow??((label:string)=>`Select ${label}`))(row.label??row.id)}</VisuallyHidden>}
          checked={chosen.has(row.id)} disabled={Boolean(row.selectionDisabled)} onChange={event=>select(event.currentTarget.checked?[...selection,row.id]:selection.filter(id=>id!==row.id))}/></td>}
        {visibleColumns.map(column=><td {...columnLayout.columnCell(column)} key={column.id} data-numeric={column.numeric||undefined} data-align={column.align}>{row.primaryAction?.column === column.id
          ? <Stack gap="1">
            <Button {...row.primaryAction.buttonProps} type="button" variant="ghost" size="sm"
              className={["flood-data-table__primary-action",row.primaryAction.buttonProps.className].filter(Boolean).join(" ")}>
              {row.primaryAction.title}
            </Button>
            {row.primaryAction.description != null && <Text as="div" size="helper" tone="subtle">{row.primaryAction.description}</Text>}
          </Stack>
          : row.cells[column.id]??null}</td>)}
      </tr>}
      </DataTableExpandableRow>):<tr><td colSpan={columnCount} className="flood-data-table__state">
        {state==="loading"?<Spinner label={labels.loading??"Loading rows…"}/>:state==="error"?<Stack gap="3"><Alert tone="error" announcement="polite">{labels.error??"Could not load the rows."}</Alert>{onRetry&&<Button variant="subtle" size="sm" onClick={onRetry}>{labels.retry??"Try again"}</Button>}</Stack>:emptyContent??<Text as="p" size="compact" tone="subtle" role="status">{labels.empty??"No results found."}</Text>}
      </td></tr>}</tbody>
    </Table>
    {selectable && !showSelection && <VisuallyHidden role="status">{selectionLabel}</VisuallyHidden>}
    {(showResults||(selectable&&showSelection)||pageCount>1)&&<div className="flood-data-table__footer">
      {showResults&&<Text as="p" size="helper" tone="subtle">{state==="ready"?resultLabel(visible.length?(page-1)*pageSize+1:0,visible.length?(page-1)*pageSize+visible.length:0,total):""}</Text>}
      {selectable&&showSelection&&<Text as="p" size="helper" tone="subtle" role="status">{selectionLabel}</Text>}
      {pageCount>1&&<Pagination page={Math.min(page,pageCount)} pageCount={pageCount} onPageChange={changePage} disabled={blocked} label={labels.pagination} previousLabel={labels.previousPage} nextLabel={labels.nextPage} pageLabel={labels.page}/>}
    </div>}
  </div>;
});
