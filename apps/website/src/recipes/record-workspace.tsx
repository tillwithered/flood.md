"use client";
import {useEffect,useMemo,useRef,useState,type FormEvent} from "react";
import {Alert,AlertDialog,Button,DataTable,EmptyState,Field,Fieldset,Grid,Heading,Inline,Input,Metric,NavigationList,
  ResizablePanels,SearchInput,Select,Stack,StatusIndicator,Surface,Tag,Text,Toolbar,
  type DataTableSort} from "@flood-md/react";

export interface ProjectRecord {id:string; name:string; owner:string; status:"active"|"archived";}
type Store=Pick<Storage,"getItem"|"setItem">;
type Collection={state:"ready";records:ProjectRecord[]}|{state:"error";records:ProjectRecord[];raw:string|null;message:string};
type Draft={record:ProjectRecord;initial:ProjectRecord|null;error?:string};
export interface ProjectPage {rows:ProjectRecord[];total:number;}
export interface ProjectQuery {records:readonly ProjectRecord[];search:string;status:string;page:number;pageSize:number;sort:DataTableSort|null;signal:AbortSignal;}
export type ProjectPageLoader=(query:ProjectQuery)=>Promise<ProjectPage>;
export interface RecordWorkspaceProps {storageKey?:string;storage?:Store;loadPage?:ProjectPageLoader;}

/** Host-owned schema. A bad read never becomes fixtures or a successful empty read. */
export function readProjectCollection(key:string,storage?:Store):Collection {
  let raw:string|null=null;
  try{
    if(!storage&&typeof window==="undefined")return {state:"ready",records:[]};
    raw=(storage??window.localStorage).getItem(key);
    if(raw===null)return {state:"ready",records:[]};
    const data:unknown=JSON.parse(raw);
    if(!data||typeof data!=="object"||!("version"in data)||data.version!==1||!("records"in data)||!Array.isArray(data.records))throw Error("schema");
    const ids=new Set<string>();
    const records=data.records.map((record:unknown):ProjectRecord=>{
      if(!record||typeof record!=="object"||!("id"in record)||typeof record.id!=="string"||!record.id.trim()||ids.has(record.id)||
        !("name"in record)||typeof record.name!=="string"||!record.name.trim()||!("owner"in record)||typeof record.owner!=="string"||
        !("status"in record)||(record.status!=="active"&&record.status!=="archived"))throw Error("schema");
      ids.add(record.id);return {id:record.id,name:record.name,owner:record.owner,status:record.status};
    });
    return {state:"ready",records};
  }catch{return {state:"error",records:[],raw,message:"Projects could not be read."};}
}

/** The example's local adapter has the same boundary as a remote page loader. */
const localPage:ProjectPageLoader=async({records,search,status,page,pageSize,sort,signal})=>{
  if(signal.aborted)throw new DOMException("Aborted","AbortError");
  const filtered=records.filter(record=>(status==="all"||record.status===status)&&[record.name,record.owner].join(" ").toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const sorted=sort?[...filtered].sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true})*(sort.direction==="ascending"?1:-1)):filtered;
  return {rows:sorted.slice((page-1)*pageSize,page*pageSize),total:sorted.length};
};
const route=()=>typeof window!=="undefined"&&window.location.hash==="#record-workspace/overview"?"overview":"records";

/** Working host composition, not another library AppShell or persistence API. */
export function RecordWorkspace({storageKey="flood-recipe-projects-v1",storage,loadPage=localPage}:RecordWorkspaceProps){
  const [collection,setCollection]=useState(()=>readProjectCollection(storageKey,storage));
  const [view,setView]=useState(route),[search,setSearch]=useState(""),[status,setStatus]=useState("all"),[page,setPage]=useState(1),[sort,setSort]=useState<DataTableSort|null>(null);
  const [selected,setSelected]=useState<string[]>([]),[draft,setDraft]=useState<Draft|null>(null),[revision,setRevision]=useState(0),[retry,setRetry]=useState(0);
  const [response,setResponse]=useState<{key:string;page:ProjectPage;error?:string}|null>(null);
  const [operationError,setOperationError]=useState("");
  const [confirmation,setConfirmation]=useState<{kind:"replace"}|{kind:"delete";ids:string[]}|{kind:"leave";next:()=>void}|null>(null);
  const generation=useRef(0),name=useRef<HTMLInputElement>(null),[split,setSplit]=useState(58);
  const records=collection.records,pageSize=5;
  const key=JSON.stringify({search,status,page,sort,revision,retry});
  const dirty=Boolean(draft&&(draft.initial?JSON.stringify(draft.record)!==JSON.stringify(draft.initial):draft.record.name||draft.record.owner||draft.record.status!=="active"));
  useEffect(()=>{const update=()=>setView(route());window.addEventListener("hashchange",update);return()=>window.removeEventListener("hashchange",update);},[]);
  useEffect(()=>{
    if(collection.state!=="ready")return;
    const controller=new AbortController(),ticket=++generation.current;
    void loadPage({records,search,status,page,pageSize,sort,signal:controller.signal}).then(result=>{
      if(controller.signal.aborted||generation.current!==ticket)return;
      const maxPage=Math.max(1,Math.ceil(result.total/pageSize));
      if(page>maxPage){setPage(maxPage);return;}
      setResponse({key,page:result});
    }).catch(()=>{if(!controller.signal.aborted&&generation.current===ticket)setResponse({key,page:{rows:[],total:0},error:"Projects could not be loaded."});});
    return()=>{controller.abort();};
  },[key,records,collection.state,loadPage]);
  useEffect(()=>{if(draft)name.current?.focus({preventScroll:true});},[draft?.record.id]);
  const current=response?.key===key?response:null,state=current?.error?"error":current?"ready":"loading";
  const result=current?.page??{rows:[],total:response?.page.total??0};
  const updateFilter=(nextSearch:string,nextStatus:string)=>{setSearch(nextSearch);setStatus(nextStatus);setPage(1);setSelected([]);};
  const leave=(next:()=>void)=>{if(dirty)setConfirmation({kind:"leave",next});else{setDraft(null);next();}};
  function persist(next:ProjectRecord[]){
    if(collection.state!=="ready")return false;
    try{(storage??window.localStorage).setItem(storageKey,JSON.stringify({version:1,records:next}));setCollection({state:"ready",records:next});setRevision(value=>value+1);setOperationError("");return true;}
    catch{return false;}
  }
  function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!draft||collection.state!=="ready")return;
    if(!draft.record.name.trim()){name.current?.setCustomValidity("Enter a project name.");name.current?.reportValidity();return;}
    const record={...draft.record,name:draft.record.name.trim()},next=draft.initial?records.map(old=>old.id===record.id?record:old):[...records,record];
    if(persist(next)){setDraft(null);setSelected(ids=>ids.filter(id=>next.some(record=>record.id===id)));}
    else setDraft({...draft,error:"Changes could not be saved. Try again."});
  }
  function confirm(){
    const pending=confirmation;setConfirmation(null);if(!pending)return;
    if(pending.kind==="leave"){setDraft(null);pending.next();}
    else if(pending.kind==="delete"){
      const proposal=new Set(pending.ids),next=records.filter(record=>!proposal.has(record.id));
      if(persist(next)){setSelected([]);if(draft&&proposal.has(draft.record.id))setDraft(null);}
      else setOperationError("Projects could not be deleted. Try again.");
    }else{
      try{(storage??window.localStorage).setItem(storageKey,JSON.stringify({version:1,records:[]}));setCollection({state:"ready",records:[]});setDraft(null);setSelected([]);setPage(1);setRevision(value=>value+1);setOperationError("");}
      catch{setOperationError("The saved collection could not be replaced.");}
    }
  }
  function exportRecovery(){
    if(collection.state!=="error"||collection.raw===null)return;
    try{const url=URL.createObjectURL(new Blob([collection.raw],{type:"application/json"})),anchor=document.createElement("a");anchor.href=url;anchor.download="projects-recovery.json";anchor.click();setTimeout(()=>URL.revokeObjectURL(url),0);}
    catch{setOperationError("The recovery snapshot could not be exported.");}
  }
  const editor=draft?<Surface padding="6"><form onSubmit={save}><Stack gap="6">
    <Heading level={3} size="section">{draft.initial?"Edit project":"New project"}</Heading>
    <Fieldset legend="Project details" hideLabel><Grid minItemWidth="12rem" gap="6">
      <div style={{gridColumn:"1 / -1"}}><Field label="Project name" required>{props=><Input {...props} ref={name} name="name" value={draft.record.name} onChange={event=>{event.currentTarget.setCustomValidity("");setDraft({...draft,record:{...draft.record,name:event.target.value}});}}/>}</Field></div>
      <Field label="Owner">{props=><Input {...props} name="owner" value={draft.record.owner} onChange={event=>setDraft({...draft,record:{...draft.record,owner:event.target.value}})}/>}</Field>
      <Field label="Status">{props=><Select {...props} name="status" value={draft.record.status} onChange={event=>setDraft({...draft,record:{...draft.record,status:event.target.value as ProjectRecord["status"]}})}><option value="active">Active</option><option value="archived">Archived</option></Select>}</Field>
    </Grid></Fieldset>
    {draft.error&&<Alert tone="error" announcement="polite">{draft.error}</Alert>}
    <Inline gap="3"><Button type="submit">Save project</Button><Button variant="subtle" onClick={()=>setDraft(null)}>Cancel</Button></Inline>
  </Stack></form></Surface>:null;
  const table=<Stack gap="6">
    <Grid minItemWidth="12rem" gap="4">
      <Field label="Search projects">{props=><SearchInput {...props} value={search} onChange={event=>updateFilter(event.target.value,status)} clearLabel="Clear search"/>}</Field>
      <Field label="Status">{props=><Select {...props} value={status} onChange={event=>updateFilter(search,event.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="archived">Archived</option></Select>}</Field>
    </Grid>
    {(search||status!=="all")&&<Inline gap="2">{search&&<Tag onRemove={()=>updateFilter("",status)} removeLabel="Remove search filter">{search}</Tag>}{status!=="all"&&<Tag onRemove={()=>updateFilter(search,"all")} removeLabel="Remove status filter">{status==="active"?"Active":"Archived"}</Tag>}<Button variant="ghost" size="sm" onClick={()=>updateFilter("","all")}>Clear filters</Button></Inline>}
    {selected.length>0&&<Toolbar label="Selected projects"><Text size="compact">{selected.length} selected</Text><Button variant="subtle" size="sm" tone="danger" onClick={()=>setConfirmation({kind:"delete",ids:[...selected]})}>Delete selected</Button><Button variant="ghost" size="sm" onClick={()=>setSelected([])}>Clear selection</Button></Toolbar>}
    {operationError&&<Alert tone="error" announcement="polite">{operationError}</Alert>}
    {state==="ready"&&!result.total&&!search&&status==="all"?<EmptyState title="No projects"/>:<DataTable caption="Projects" hideCaption paginationMode="server" page={page} pageSize={pageSize} totalRows={result.total}
      sort={sort} onSortChange={next=>{setSort(next);setPage(1);}} onPageChange={setPage} state={state} onRetry={()=>setRetry(value=>value+1)}
      selectable selectionScope="dataset" selectedIds={selected} onSelectionChange={setSelected} minWidth="32rem"
      labels={{empty:"No matching projects.",error:"Projects could not be loaded."}}
      columns={[{id:"name",label:"Project",sortable:true},{id:"owner",label:"Owner"},{id:"state",label:"Status"},{id:"actions",label:"Actions",align:"end"}]}
      rows={result.rows.map(record=>({id:record.id,label:record.name,cells:{name:record.name,owner:record.owner||"—",state:<StatusIndicator label={record.status==="active"?"Active":"Archived"} tone={record.status==="active"?"success":"neutral"}/>,actions:<Button variant="subtle" size="sm" onClick={()=>leave(()=>setDraft({record:{...record},initial:{...record}}))}>Edit</Button>}}))}/>}
  </Stack>;
  const overview=useMemo(()=>records.reduce((totals,record)=>({...totals,[record.status]:totals[record.status]+1}),{active:0,archived:0}),[records]);
  const navigate=(href:string)=>(event:React.MouseEvent<HTMLAnchorElement>)=>{if(event.button||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;if(dirty){event.preventDefault();leave(()=>{window.location.hash=href;});}};
  return <section aria-label="Project workspace"><Grid gap="6" style={{gridTemplateColumns:"minmax(8rem, 12rem) minmax(0, 1fr)",alignItems:"start"}}>
    <NavigationList label="Project navigation" currentValue={view} items={[{value:"records",label:"Projects",href:"#record-workspace/records",linkProps:{onClick:navigate("#record-workspace/records")}},{value:"overview",label:"Overview",href:"#record-workspace/overview",linkProps:{onClick:navigate("#record-workspace/overview")}}]}/>
    <Stack gap="6" style={{minWidth:0,marginBlock:0}}>
      <Inline align="center" gap="4" style={{justifyContent:"space-between",minBlockSize:"2.5rem"}}><Heading level={2} size="page">{view==="records"?"Projects":"Overview"}</Heading>
        {collection.state==="ready"&&<Button onClick={()=>leave(()=>setDraft({record:{id:crypto.randomUUID(),name:"",owner:"",status:"active"},initial:null}))}>New project</Button>}</Inline>
      {collection.state==="error"?<Stack gap="4"><Alert tone="error">{collection.message}</Alert><Inline gap="3"><Button onClick={()=>{setCollection(readProjectCollection(storageKey,storage));setOperationError("");}}>Retry reading</Button>{collection.raw!==null&&<Button variant="subtle" onClick={exportRecovery}>Export recovery snapshot</Button>}<Button variant="subtle" tone="danger" onClick={()=>setConfirmation({kind:"replace"})}>Replace collection</Button></Inline>{operationError&&<Alert tone="error">{operationError}</Alert>}</Stack>:
        view==="overview"?<Grid minItemWidth="12rem" gap="4"><Surface padding="6"><Metric label="Active projects" value={overview.active}/></Surface><Surface padding="6"><Metric label="Archived projects" value={overview.archived}/></Surface></Grid>:
        draft?<ResizablePanels label="Projects and editor" main={table} secondary={editor} value={split} onValueChange={setSplit} min={35} max={70}/>:table}
    </Stack>
    {confirmation&&<AlertDialog title={confirmation.kind==="replace"?"Replace unreadable records?":confirmation.kind==="delete"?"Delete selected projects?":"Discard changes?"}
      description={confirmation.kind==="replace"?"The saved snapshot will be replaced with an empty collection. Export it before continuing if available.":confirmation.kind==="delete"?`${confirmation.ids.length} selected projects will be removed from this collection.`:"Your edits to this project will be lost."}
      open trigger={()=>null} confirmLabel={confirmation.kind==="replace"?"Replace":confirmation.kind==="delete"?"Delete projects":"Discard changes"} cancelLabel="Keep working"
      onConfirm={confirm} onCancel={()=>setConfirmation(null)} onOpenChange={next=>{if(!next)setConfirmation(null);}}/>}
  </Grid></section>;
}
