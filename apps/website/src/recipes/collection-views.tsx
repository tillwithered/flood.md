"use client";
import {useEffect,useId,useRef,useState,type FormEvent} from 'react';
import {Alert,AlertDialog,Button,Dialog,Divider,Field,Fieldset,Grid,IconButton,Inline,Input,MultiSelect,OverflowActions,Popover,SearchInput,SegmentedControl,Select,Stack,Tag,Text,type OverflowAction} from '@flood-md/react';
import {collectionQueryKey,copyCollectionQuery,parseCollectionQuery,readCollectionViews,type CollectionQuery,type CollectionSchema,type CollectionView,type ViewRead,type ViewStorage} from './collection-views-model';

interface CollectionViewControlsProps {
 label:string;schema:CollectionSchema;presets:readonly CollectionView[];
 value:CollectionQuery;onValueChange:(query:CollectionQuery)=>void;storageKey:string;storage?:ViewStorage;
}
type NameDraft={kind:'create'|'rename';id?:string;name:string;snapshot:CollectionQuery;error?:string;invalid?:string};

/** Host recipe: shared behaviour, not a second Flood component implementation. */
export function CollectionViewControls({label,schema,presets,value,onValueChange,storageKey,storage}:CollectionViewControlsProps){
 const [saved,setSaved]=useState<ViewRead|{state:'loading';views:[]}>({state:'loading',views:[]}),[selectedId,setSelectedId]=useState(presets[0].id);
 const [editing,setEditing]=useState(false),[draft,setDraft]=useState(()=>copyCollectionQuery(value)),[draftError,setDraftError]=useState('');
 const [nameDraft,setNameDraft]=useState<NameDraft|null>(null),[confirmation,setConfirmation]=useState<{kind:'delete';id:string;name:string}|{kind:'replace'}|null>(null);
 const [operationError,setOperationError]=useState<{kind:'update'|'delete'|'replace'|'export';message:string}|null>(null),[readAttempt,setReadAttempt]=useState(0);
 const generated=useId(),nameInput=useRef<HTMLInputElement>(null),viewInput=useRef<HTMLSelectElement>(null);
 const schemaKey=JSON.stringify({properties:schema.properties.map(property=>[property.id,property.options.map(option=>option.value)]),sort:schema.sortColumns});
 const appliedKey=collectionQueryKey(value);
 useEffect(()=>setEditing(false),[appliedKey]);
 useEffect(()=>{try{setSaved(readCollectionViews(storageKey,schema,storage??window.localStorage,presets.map(preset=>preset.name)));}catch{setSaved({state:'error',views:[],raw:null});}},[storageKey,storage,schemaKey,readAttempt]);
 const views=[...presets,...saved.views],selected=views.find(view=>view.id===selectedId)??presets[0];
 const dirty=collectionQueryKey(value)!==collectionQueryKey(selected.query),custom=saved.views.find(view=>view.id===selected.id);
 function persist(views:CollectionView[]){
  if(saved.state!=='ready')return false;
  try{(storage??window.localStorage).setItem(storageKey,JSON.stringify({version:1,views}));setSaved({state:'ready',views});setOperationError(null);return true;}catch{return false;}
 }
 const requestEditor=(next:boolean)=>{if(next){setDraft(copyCollectionQuery(value));setDraftError('');}setEditing(next);};
 const changeProperty=(id:string,property:string)=>setDraft(current=>({...current,conditions:current.conditions.map(condition=>condition.id===id?{...condition,property,values:[]}:condition)}));
 function apply(event:FormEvent<HTMLFormElement>){event.preventDefault();try{onValueChange(parseCollectionQuery({...value,match:draft.match,conditions:draft.conditions},schema));setEditing(false);}catch{setDraftError('Choose a value for each condition.');}}
 function saveName(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(!nameDraft)return;const name=nameDraft.name.trim();
  if(!name){setNameDraft({...nameDraft,invalid:'Enter a view name.'});return;}
  if(views.some(view=>view.id!==nameDraft.id&&view.name.normalize('NFC').toLowerCase()===name.normalize('NFC').toLowerCase())){setNameDraft({...nameDraft,invalid:'A view with this name already exists.'});return;}
  const id=nameDraft.kind==='create'?`saved-${crypto.randomUUID()}`:nameDraft.id!;
  const next=nameDraft.kind==='create'?[...saved.views,{id,name,query:copyCollectionQuery(nameDraft.snapshot)}]:saved.views.map(view=>view.id===id?{...view,name}:view);
  if(persist(next)){setNameDraft(null);setSelectedId(id);}else setNameDraft({...nameDraft,error:'The view could not be saved. Try again.'});
 }
 function action(id:string){
  if(id==='reset'){onValueChange(copyCollectionQuery(selected.query));setOperationError(error=>error?.kind==='update'?null:error);return;}
  if(id==='create'||id==='rename'||id==='delete')viewInput.current?.focus({preventScroll:true});
  if(id==='create')setNameDraft({kind:'create',name:'',snapshot:copyCollectionQuery(value)});
  else if(id==='rename'&&custom)setNameDraft({kind:'rename',id:custom.id,name:custom.name,snapshot:copyCollectionQuery(custom.query)});
  else if(id==='update'&&custom){if(!persist(saved.views.map(view=>view.id===custom.id?{...view,query:copyCollectionQuery(value)}:view)))setOperationError({kind:'update',message:'The view could not be updated. Try again.'});}
  else if(id==='delete'&&custom)setConfirmation({kind:'delete',id:custom.id,name:custom.name});
 }
 function confirm(){
  const pending=confirmation;setConfirmation(null);if(!pending)return;
  if(pending.kind==='delete'){
   if(persist(saved.views.filter(view=>view.id!==pending.id))){setSelectedId(presets[0].id);onValueChange(copyCollectionQuery(presets[0].query));}
   else setOperationError({kind:'delete',message:'The view could not be deleted. Try again.'});
  }else{
   try{(storage??window.localStorage).setItem(storageKey,JSON.stringify({version:1,views:[]}));setSaved({state:'ready',views:[]});setSelectedId(presets[0].id);setOperationError(null);}
   catch{setOperationError({kind:'replace',message:'Saved views could not be replaced.'});}
  }
 }
 function exportSnapshot(){
  if(saved.state!=='error'||saved.raw===null)return;
  try{const url=URL.createObjectURL(new Blob([saved.raw],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='saved-views-recovery.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),0);}catch{setOperationError({kind:'export',message:'The snapshot could not be exported.'});}
 }
 const actions:OverflowAction[]=[
  ...(custom&&dirty?[{id:'update',label:'Update view',priority:20,disabled:saved.state!=='ready'}]:[]),
  {id:'create',label:'Save as new view',priority:10,disabled:saved.state!=='ready'},
  ...(dirty?[{id:'reset',label:'Reset view'}]:[]),
  ...(custom?[{id:'rename',label:'Rename',disabled:saved.state!=='ready'},{id:'delete',label:'Delete view',tone:'danger' as const,disabled:saved.state!=='ready'}]:[]),
 ];
 return <Stack gap="4" className="collection-view-controls" aria-label={`${label} collection controls`}>
  <Inline gap="3" align="center">
   <div style={{flex:'0 1 16rem',minWidth:0,maxWidth:'100%'}}><Field label={`${label} view`} hideLabel>{props=><Select {...props} ref={viewInput} value={selected.id} onChange={event=>{const next=views.find(view=>view.id===event.target.value);if(next){setSelectedId(next.id);setOperationError(null);onValueChange(copyCollectionQuery(next.query));}}}>{views.map(view=><option key={view.id} value={view.id}>{view.name}</option>)}</Select>}</Field></div>
   <div style={{flex:'1 1 24rem',minWidth:0,maxWidth:'36rem'}}>{actions.length===1?<Button variant="subtle" size="sm" disabled={actions[0].disabled} onClick={()=>action(actions[0].id)}>{actions[0].label}</Button>:<OverflowActions label={`${label} view actions`} moreLabel="View actions" items={actions} onAction={action} size="sm"/>}</div>
  </Inline>
  {saved.state==='error'&&<Stack gap="3"><Alert tone="error">Saved views could not be read.</Alert><Inline gap="3"><Button size="sm" variant="subtle" onClick={()=>setReadAttempt(attempt=>attempt+1)}>Retry saved views</Button>{saved.raw!==null&&<Button size="sm" variant="subtle" onClick={exportSnapshot}>Export snapshot</Button>}<Button size="sm" variant="subtle" tone="danger" onClick={()=>{viewInput.current?.focus({preventScroll:true});setConfirmation({kind:'replace'});}}>Replace saved views</Button></Inline></Stack>}
  {operationError&&<Alert tone="error" announcement="polite"><Inline gap="3">{operationError.message}<Button size="sm" variant="ghost" onClick={()=>setOperationError(null)}>Dismiss</Button></Inline></Alert>}
  <Inline gap="3" align="center">
   <div style={{flex:'1 1 16rem',minWidth:0}}><Field label={`Search ${label.toLowerCase()}`} hideLabel>{props=><SearchInput {...props} placeholder={`Search ${label.toLowerCase()}…`} value={value.search} clearLabel={`Clear ${label.toLowerCase()} search`} onChange={event=>onValueChange({...value,search:event.target.value})}/>}</Field></div>
   <Popover title={`${label} filters`} open={editing} onOpenChange={requestEditor} className="collection-filter-editor" trigger={props=><Button {...props} variant="subtle">Filters</Button>}>
    <form onSubmit={apply}><Stack gap="4">
     {draft.conditions.length>1&&<SegmentedControl label="Match conditions" name={`filter-mode-${generated}`} hideLabel value={draft.match} onValueChange={match=>setDraft({...draft,match:match as CollectionQuery['match']})} options={[{value:'all',label:'All conditions'},{value:'any',label:'Any condition'}]}/>}
     {draft.conditions.map((condition,index)=><Fieldset key={condition.id} legend={`Condition ${index+1}`} hideLabel><Stack gap="3">
      {index>0&&<Divider/>}
      <Grid columns={2} gap="3">
       <Field label={`Condition ${index+1} property`} hideLabel>{props=><Select {...props} value={condition.property} onChange={event=>changeProperty(condition.id,event.target.value)}>{schema.properties.map(property=><option key={property.id} value={property.id} disabled={draft.conditions.some(other=>other.id!==condition.id&&other.property===property.id)}>{property.label}</option>)}</Select>}</Field>
       <Field label={`Condition ${index+1} operator`} hideLabel>{props=><Select {...props} value={condition.operator} onChange={event=>setDraft({...draft,conditions:draft.conditions.map(row=>row.id===condition.id?{...row,operator:event.target.value as 'is'|'is-not'}:row)})}><option value="is">is any of</option><option value="is-not">is none of</option></Select>}</Field>
      </Grid>
      <Inline gap="3" align="center"><div style={{flex:'1 1 12rem',minWidth:0}}><Field label={`Condition ${index+1} values`} hideLabel>{props=><MultiSelect {...props} placeholder="Choose values…" value={condition.values} options={schema.properties.find(property=>property.id===condition.property)!.options} onValueChange={values=>setDraft({...draft,conditions:draft.conditions.map(row=>row.id===condition.id?{...row,values}:row)})}/>}</Field></div><IconButton label={`Remove condition ${index+1}`} variant="subtle" onClick={()=>setDraft({...draft,conditions:draft.conditions.filter(row=>row.id!==condition.id)})}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></IconButton></Inline>
     </Stack></Fieldset>)}
     {draft.conditions.length<schema.properties.length&&<Button variant="subtle" onClick={()=>{const property=schema.properties.find(property=>!draft.conditions.some(condition=>condition.property===property.id))!;setDraft({...draft,conditions:[...draft.conditions,{id:`condition-${generated}-${crypto.randomUUID()}`,property:property.id,operator:'is',values:[]}]});setDraftError('');}}>Add condition</Button>}
     {draftError&&<Alert tone="error" announcement="polite">{draftError}</Alert>}
     <Inline gap="3"><Button type="submit">Apply filters</Button><Button variant="subtle" onClick={()=>setEditing(false)}>Cancel</Button></Inline>
    </Stack></form>
   </Popover>
  </Inline>
  {(value.conditions.length>0||value.search)&&<Inline gap="2">{value.conditions.length>1&&<Text size="compact" tone="subtle">{value.match==='all'?'All:':'Any:'}</Text>}{value.conditions.map(condition=>{const property=schema.properties.find(property=>property.id===condition.property)!;return <Tag key={condition.id} onRemove={()=>onValueChange({...value,conditions:value.conditions.filter(row=>row.id!==condition.id)})} removeLabel={`Remove ${property.label.toLowerCase()} filter`}>{property.label}{condition.operator==='is'?' is ':' excludes '}{condition.values.map(id=>property.options.find(option=>option.value===id)!.label).join(condition.operator==='is'?' or ':', ')}</Tag>;})}<Button variant="ghost" size="sm" onClick={()=>onValueChange({...value,search:'',conditions:[]})}>Clear filters</Button></Inline>}
  {nameDraft&&<Dialog title={nameDraft.kind==='create'?'Save view':'Rename view'} open onOpenChange={next=>{if(!next)setNameDraft(null);}} trigger={()=>null} initialFocusRef={nameInput}>
   <form onSubmit={saveName}><Stack gap="6"><Field label="View name" required error={nameDraft.invalid}>{props=><Input {...props} ref={nameInput} maxLength={80} value={nameDraft.name} onChange={event=>setNameDraft({...nameDraft,name:event.target.value,invalid:undefined})}/>}</Field>{nameDraft.error&&<Alert tone="error" announcement="polite">{nameDraft.error}</Alert>}<Inline gap="3"><Button type="submit">{nameDraft.kind==='create'?'Save view':'Rename view'}</Button><Button variant="subtle" onClick={()=>setNameDraft(null)}>Cancel</Button></Inline></Stack></form>
  </Dialog>}
  {confirmation&&<AlertDialog open onOpenChange={next=>{if(!next)setConfirmation(null);}} trigger={()=>null} title={confirmation.kind==='delete'?`Delete “${confirmation.name}”?`:'Replace saved views?'} description={confirmation.kind==='delete'?'The saved view will be removed. Collection records are unchanged.':'Unreadable saved views will be replaced with an empty set. Export the snapshot first if you need it.'} confirmLabel={confirmation.kind==='delete'?'Delete view':'Replace saved views'} cancelLabel="Keep views" onConfirm={confirm}/>}
 </Stack>;
}
