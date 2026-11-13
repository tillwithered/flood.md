"use client";
import {useRef,useState} from 'react';
import {Button,DataTable,EmptyState,Field,FileItem,FileList,FloodRoot,Heading,Select,Stack,StatusIndicator,Surface,Tabs,ToastRegion,type ToastItem} from '@flood-md/react';
import {SiteHeader} from './site-header';
import {SiteFooter} from './site-footer';
import {CollectionViewControls} from './recipes/collection-views';
import {emptyCollectionQuery,matchesCollectionQuery,type CollectionQuery,type CollectionSchema,type CollectionView,type ViewStorage} from './recipes/collection-views-model';
import './collections-playground.css';
import {ProjectSelectionActions,type ProjectStatusUpdate} from './recipes/project-selection-actions';

const owners=[{value:'maya',label:'Maya'},{value:'noah',label:'Noah'},{value:'sam',label:'Sam'}];
const projectSchema:CollectionSchema={properties:[
 {id:'status',label:'Status',options:[{value:'active',label:'Active'},{value:'paused',label:'Paused'},{value:'archived',label:'Archived'}]},
 {id:'owner',label:'Owner',options:owners},
 {id:'priority',label:'Priority',options:[{value:'urgent',label:'Urgent'},{value:'normal',label:'Normal'}]},
],sortColumns:['name','owner','status','priority']};
const projects=[
 {id:'design',name:'Design system',status:'active',owner:'maya',priority:'urgent'},
 {id:'checkout',name:'Checkout',status:'active',owner:'noah',priority:'urgent'},
 {id:'help',name:'Help center',status:'paused',owner:'sam',priority:'normal'},
 {id:'portal',name:'Customer portal',status:'active',owner:'maya',priority:'normal'},
 {id:'analytics',name:'Analytics',status:'archived',owner:'noah',priority:'normal'},
 {id:'onboarding',name:'Onboarding',status:'paused',owner:'maya',priority:'urgent'},
 {id:'docs',name:'Documentation',status:'active',owner:'sam',priority:'normal'},
 {id:'billing',name:'Billing',status:'archived',owner:'sam',priority:'normal'},
];
const projectPresets:CollectionView[]=[{id:'all',name:'All projects',query:emptyCollectionQuery()},{id:'active',name:'Active projects',query:{...emptyCollectionQuery(),conditions:[{id:'preset-active',property:'status',operator:'is',values:['active']}]}}];

export function ProjectCollection({storage,onUpdateStatus}: {
 storage?:ViewStorage;
 onUpdateStatus?:(update:ProjectStatusUpdate)=>void|Promise<void>;
}){
 const [records, setRecords] = useState(projects);
 const [query, setQuery] = useState(emptyCollectionQuery);
 const [page, setPage] = useState(1);
 const [selection, setSelection] = useState<readonly string[]>([]);
 const [pending, setPending] = useState(false);
 const [feedback, setFeedback] = useState<ToastItem | null>(null);
 const feedbackSequence = useRef(0);
 const inFlight = useRef(false);
 const collection = useRef<HTMLElement>(null);
 const selectionPanel = useRef<HTMLDivElement>(null);
 const change = (query: CollectionQuery) => {
   setQuery(query);
   setPage(1);
   setSelection([]);
   setFeedback(null);
 };
 const rows=records.filter(project=>matchesCollectionQuery(query,`${project.name} ${owners.find(owner=>owner.value===project.owner)!.label}`,property=>project[property as 'status'|'owner'|'priority']));
 const selectedProjects=rows.filter(project=>selection.includes(project.id));
 const hasSelection = selectedProjects.length > 0;

 async function updateStatus(proposal: ProjectStatusUpdate) {
   if (inFlight.current) return;
   const update = { ids: [...new Set(proposal.ids)], status: proposal.status };
   if (!update.ids.length) return;
   inFlight.current = true;
   setPending(true);
   setFeedback(null);
   try {
     await onUpdateStatus?.({ ids: [...update.ids], status: update.status });
     const ids = new Set(update.ids);
     setRecords(current => current.map(project => ids.has(project.id) ? { ...project, status: update.status } : project));
     if (selectionPanel.current?.contains(collection.current?.ownerDocument.activeElement ?? null)) {
       collection.current?.focus({ preventScroll: true });
     }
     setSelection(current => current.filter(id => !ids.has(id)));
     setPage(1);
     const result = update.status === 'active' ? 'set active' : update.status;
     setFeedback({ id: String(++feedbackSequence.current), status: 'success', title: `${ids.size} ${ids.size === 1 ? 'project' : 'projects'} ${result}.` });
   } catch {
     setFeedback({
       id: String(++feedbackSequence.current),
       status: 'error',
       title: `Couldn’t update ${update.ids.length} ${update.ids.length === 1 ? 'project' : 'projects'}.`,
       action: { label: 'Retry update', onClick: () => {
         collection.current?.focus({ preventScroll: true });
         void updateStatus(update);
       }},
     });
   } finally {
     inFlight.current = false;
     setPending(false);
   }
 }

 return <section ref={collection} tabIndex={-1} className="collection-projects" aria-label="Projects collection"><Stack gap="6">
  {hasSelection&&<div ref={selectionPanel} className="collection-selection-panel"><ProjectSelectionActions projects={selectedProjects} pending={pending} onUpdate={update=>{void updateStatus(update);}} onClear={()=>{
   collection.current?.focus({preventScroll:true});setSelection([]);setFeedback(null);
  }}/></div>}
  <ToastRegion label="Project updates" items={feedback ? [feedback] : []}
   onDismiss={id=>setFeedback(current=>current?.id===id?null:current)}/>
  <Surface padding="0" className="collection-table-frame">
   <DataTable caption="Projects" hideCaption minWidth="36rem" selectable showSelection={false} pageSize={5} page={page} onPageChange={setPage} selectedIds={selection} onSelectionChange={ids=>{setSelection(ids);setFeedback(null);}} sort={query.sort} onSortChange={sort=>change({...query,sort})}
   inset="roomy" showColumnVisibility
   toolbar={({columns}) => <CollectionViewControls label="Projects" schema={projectSchema} presets={projectPresets}
     value={query} onValueChange={change} storageKey="flood-project-views-v1" storage={storage} toolbarActions={columns}/>}
   emptyContent={<EmptyState title="No matching projects" actions={<Button variant="subtle" onClick={()=>{change({...query,search:'',conditions:[]});collection.current?.querySelector<HTMLInputElement>('.flood-collection-toolbar input')?.focus({preventScroll:true});}}>Reset filters</Button>}/>}
   columns={[{id:'name',label:'Project',sortable:true,hideable:false},{id:'owner',label:'Owner',sortable:true},{id:'status',label:'Status',sortable:true},{id:'priority',label:'Priority',sortable:true}]}
   rows={rows.map(project=>({id:project.id,label:project.name,cells:{name:project.name,owner:owners.find(owner=>owner.value===project.owner)!.label,status:<StatusIndicator label={projectSchema.properties[0].options.find(option=>option.value===project.status)!.label} tone={project.status==='active'?'success':project.status==='paused'?'warning':'neutral'}/>,priority:project.priority==='urgent'?'Urgent':'Normal'},sortValues:{name:project.name,owner:project.owner,status:project.status,priority:project.priority==='urgent'?1:0}}))}/>
  </Surface>
 </Stack></section>;
}

const teams=[{value:'design',label:'Design team'},{value:'product',label:'Product team'},{value:'finance',label:'Finance team'}];
const fileSchema:CollectionSchema={properties:[
 {id:'kind',label:'Format',options:[{value:'pdf',label:'PDF'},{value:'fig',label:'Figma'},{value:'png',label:'PNG'},{value:'csv',label:'CSV'}]},
 {id:'team',label:'Team',options:teams},
],sortColumns:['name','size']};
const files=[
 {id:'guidelines',name:'Brand guidelines.pdf',kind:'pdf',team:'design',size:2400000},
 {id:'library',name:'Component library.fig',kind:'fig',team:'design',size:18400000},
 {id:'research',name:'Research summary.pdf',kind:'pdf',team:'product',size:780000},
 {id:'forecast',name:'Revenue forecast.csv',kind:'csv',team:'finance',size:28000},
 {id:'cover',name:'Launch cover.png',kind:'png',team:'design',size:4100000},
 {id:'feedback',name:'Customer feedback.csv',kind:'csv',team:'product',size:92000},
];
const fileDefault=():CollectionQuery=>({...emptyCollectionQuery(),sort:{column:'name',direction:'ascending'}});
const filePresets:CollectionView[]=[{id:'all',name:'All files',query:fileDefault()},{id:'design',name:'Design files',query:{...fileDefault(),conditions:[{id:'preset-design',property:'team',operator:'is',values:['design']}]}}];
export function FileCollection({storage}: {storage?:ViewStorage}){
 const [query,setQuery]=useState(fileDefault);
 const sort=query.sort??{column:'name',direction:'ascending'};
 const rows=files.filter(file=>matchesCollectionQuery(query,file.name,property=>file[property as 'kind'|'team'])).sort((a,b)=>(sort.column==='size'?a.size-b.size:a.name.localeCompare(b.name))*(sort.direction==='ascending'?1:-1));
 return <section aria-label="Files collection"><Stack gap="6">
  <CollectionViewControls label="Files" schema={fileSchema} presets={filePresets} value={query} onValueChange={setQuery} storageKey="flood-file-views-v1" storage={storage}/>
  <div style={{maxWidth:'16rem'}}><Field label="Sort files" hideLabel>{props=><Select {...props} value={`${sort.column}:${sort.direction}`} onChange={event=>{const[column,direction]=event.target.value.split(':');setQuery({...query,sort:{column,direction:direction as 'ascending'|'descending'}});}}><option value="name:ascending">Name A–Z</option><option value="name:descending">Name Z–A</option><option value="size:ascending">Size small–large</option><option value="size:descending">Size large–small</option></Select>}</Field></div>
  {rows.length?<FileList label="Files">{rows.map(file=><FileItem key={file.id} name={file.name} size={file.size} format={file.kind.toUpperCase()} description={teams.find(team=>team.value===file.team)!.label}/>)}</FileList>:<EmptyState title="No matching files" actions={<Button variant="subtle" onClick={()=>setQuery({...query,search:'',conditions:[]})}>Reset filters</Button>}/>}
 </Stack></section>;
}

export default function CollectionsPlayground(){return <FloodRoot className="site-root"><div className="site-shell"><SiteHeader path="/playground/collections"/><main id="main-content" className="collection-examples"><Stack gap="4"><Heading level={1} size="page">Collections</Heading><Tabs label="Collection examples" variant="line" items={[{value:'projects',label:'Projects',content:<ProjectCollection/>},{value:'files',label:'Files',content:<FileCollection/>}]}/></Stack></main><SiteFooter/></div></FloodRoot>;}
