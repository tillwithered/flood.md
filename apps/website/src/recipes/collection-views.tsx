"use client";
import {useEffect,useRef,useState,type FormEvent,type ReactNode} from 'react';
import {Alert,AlertDialog,Button,CollectionToolbar,CollectionViewSwitcher,Dialog,Field,FilterGroup,IconSlot,Inline,Input,Menu,Select,Stack,Tag,type OverflowAction} from '@flood-md/react';
import {collectionQueryKey,copyCollectionQuery,parseCollectionQuery,readCollectionViews,type CollectionQuery,type CollectionSchema,type CollectionView,type FilterProperty,type ViewRead,type ViewStorage} from './collection-views-model';

export function AppliedFilterControl({ property, value, onChange }: {
  property: FilterProperty;
  value: string;
  onChange: (value: string) => void;
}) {
  const trigger = useRef<HTMLButtonElement | null>(null);
  const { id, label, options } = property;
  const selected = options.find(option => option.value === value);

  return (
   <Inline gap="2" align="center">
      <Menu
        label={label}
        trigger={({ ref, ...props }) => (
          <Button {...props} ref={node => { trigger.current = node; ref(node); }} variant="subtle" size="sm">
            {label} <IconSlot size="xs"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></IconSlot>
          </Button>
        )}
        items={[{ value: '', label: 'All', disabled: false }, ...options].map(option => ({
          id: option.value ? `option-${option.value}` : 'all',
          label: option.label,
          type: 'radio',
          group: id,
          disabled: option.disabled,
          checked: value === option.value,
          closeOnSelect: true,
          onCheckedChange: () => onChange(option.value),
        }))}
      />
      {selected && (
        <Tag size="md" removeLabel={`Remove ${label.toLowerCase()} filter: ${selected.label}`} onRemove={() => {
          trigger.current?.focus({ preventScroll: true });
          onChange('');
        }}>
          {selected.label}
        </Tag>
      )}
    </Inline>
  );
}

interface CollectionViewControlsProps {
 label:string;schema:CollectionSchema;presets:readonly CollectionView[];
 value:CollectionQuery;onValueChange:(query:CollectionQuery)=>void;storageKey:string;storage?:ViewStorage;toolbarActions?:ReactNode;
}
type NameDraft={kind:'create'|'rename';id?:string;name:string;snapshot:CollectionQuery;error?:string;invalid?:string};
const inlineFilterLimit = 2;

/** Host recipe: shared behaviour, not a second Flood component implementation. */
export function CollectionViewControls({label,schema,presets,value,onValueChange,storageKey,storage,toolbarActions}:CollectionViewControlsProps){
 const [saved,setSaved]=useState<ViewRead|{state:'loading';views:[]}>({state:'loading',views:[]}),[selectedId,setSelectedId]=useState(presets[0].id);
 const [editing,setEditing]=useState(false),[draft,setDraft]=useState(()=>copyCollectionQuery(value)),[draftError,setDraftError]=useState('');
 const [advancedEditor, setAdvancedEditor] = useState(false);
 const editorPanel = useRef<HTMLDivElement>(null);
 const [nameDraft,setNameDraft]=useState<NameDraft|null>(null),[confirmation,setConfirmation]=useState<{kind:'delete';id:string;name:string}|{kind:'replace'}|null>(null);
 const [operationError,setOperationError]=useState<{kind:'update'|'delete'|'replace'|'export';message:string}|null>(null),[readAttempt,setReadAttempt]=useState(0);
 const nameInput=useRef<HTMLInputElement>(null),viewInput=useRef<HTMLSelectElement>(null);
 const schemaKey=JSON.stringify({properties:schema.properties.map(property=>[property.id,property.options.map(option=>option.value)]),sort:schema.sortColumns});
 const appliedKey=collectionQueryKey(value);
 const compactConditions = (value.match === 'all' || value.conditions.length < 2) &&
   value.conditions.every(condition => condition.operator === 'is' && condition.values.length === 1);
 const collapseFilters = schema.properties.length > inlineFilterLimit;
 const canClearFilters = value.conditions.length > 0 || Boolean(value.search);
 const simpleEditor = collapseFilters && compactConditions && !advancedEditor;

 useEffect(() => {
   if (advancedEditor) editorPanel.current?.focus({ preventScroll: true });
 }, [advancedEditor]);

 function changeSimpleDraft(property: string, option: string) {
   setDraft(current => {
     const existing = current.conditions.find(condition => condition.property === property);
     const conditions = current.conditions.filter(condition => condition.property !== property);
     if (option) conditions.push({ id: existing?.id ?? crypto.randomUUID(), property, operator: 'is', values: [option] });
     return { ...current, match: 'all', conditions };
   });
 }

 function changeQuickFilter(property: string, option: string) {
   const existing = value.conditions.find(condition => condition.property === property);
   const conditions = value.conditions.filter(condition => condition.property !== property);
   if (option) conditions.push({ id: existing?.id ?? crypto.randomUUID(), property, operator: 'is', values: [option] });
   onValueChange({ ...value, match: 'all', conditions });
 }
 useEffect(()=>setEditing(false),[appliedKey]);
 useEffect(()=>{try{setSaved(readCollectionViews(storageKey,schema,storage??window.localStorage,presets.map(preset=>preset.name)));}catch{setSaved({state:'error',views:[],raw:null});}},[storageKey,storage,schemaKey,readAttempt]);
 const views=[...presets,...saved.views],selected=views.find(view=>view.id===selectedId)??presets[0];
 const dirty=collectionQueryKey(value)!==collectionQueryKey(selected.query),custom=saved.views.find(view=>view.id===selected.id);
 function persist(views:CollectionView[]){
  if(saved.state!=='ready')return false;
  try{(storage??window.localStorage).setItem(storageKey,JSON.stringify({version:1,views}));setSaved({state:'ready',views});setOperationError(null);return true;}catch{return false;}
 }
 const requestEditor=(next:boolean)=>{if(next){setDraft(copyCollectionQuery(value));setDraftError('');setAdvancedEditor(false);}setEditing(next);};
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
 return <Stack gap="3" className="collection-view-controls" aria-label={`${label} collection controls`}>
  <CollectionViewSwitcher label={`${label} view`} selectRef={viewInput} controlSize="sm"
    views={views.map(view=>({id:view.id,name:view.name}))} value={selected.id}
    onValueChange={id=>{const next=views.find(view=>view.id===id);if(next){setSelectedId(next.id);setOperationError(null);onValueChange(copyCollectionQuery(next.query));}}}
    actions={actions} actionsLabel={`${label} view actions`} moreLabel="View actions" onAction={action}/>
  {saved.state==='error'&&<Stack gap="3"><Alert tone="error">Saved views could not be read.</Alert><Inline gap="3"><Button size="sm" variant="subtle" onClick={()=>setReadAttempt(attempt=>attempt+1)}>Retry saved views</Button>{saved.raw!==null&&<Button size="sm" variant="subtle" onClick={exportSnapshot}>Export snapshot</Button>}<Button size="sm" variant="subtle" tone="danger" onClick={()=>{viewInput.current?.focus({preventScroll:true});setConfirmation({kind:'replace'});}}>Replace saved views</Button></Inline></Stack>}
  {operationError&&<Alert tone="error" announcement="polite"><Inline gap="3">{operationError.message}<Button size="sm" variant="ghost" onClick={()=>setOperationError(null)}>Dismiss</Button></Inline></Alert>}
  <CollectionToolbar label={label+' collection toolbar'} searchValue={value.search}
    actions={toolbarActions}
    onSearchValueChange={search=>onValueChange({...value,search})}
    searchLabel={'Search '+label.toLowerCase()} searchPlaceholder={'Search '+label.toLowerCase()+'…'} clearSearchLabel={'Clear '+label.toLowerCase()+' search'}
    appliedFiltersLabel={label+' applied filters'}
    quickFilters={compactConditions&&!collapseFilters?schema.properties.map(property=><AppliedFilterControl key={property.id}
      property={property} value={value.conditions.find(condition=>condition.property===property.id)?.values[0]??''}
      onChange={option=>changeQuickFilter(property.id,option)} />):undefined}
    appliedFilters={compactConditions&&!collapseFilters?[]:value.conditions.map(condition=>{
      const property=schema.properties.find(property=>property.id===condition.property)!;
      const labels=condition.values.map(id=>property.options.find(option=>option.value===id)!.label);
      return {id:condition.id,label:property.label+(compactConditions?': ':condition.operator==='is'?' is ':' excludes ')+labels.join(condition.operator==='is'?' or ':', '),
        removeLabel:'Remove '+property.label.toLowerCase()+' filter'+(compactConditions?': '+labels[0]:'')};
    })}
    summaryPrefix={!compactConditions&&value.conditions.length>1?(value.match==='all'?'All:':'Any:'):undefined}
    onRemoveFilter={id=>onValueChange({...value,conditions:value.conditions.filter(condition=>condition.id!==id)})}
    onClear={()=>onValueChange({...value,search:'',conditions:[]})} canClear={canClearFilters}
    filterTitle={label+' filters'} filtersOpen={editing} onFiltersOpenChange={requestEditor}
    filterPanelRef={editorPanel} filterPanelClassName={simpleEditor?undefined:'collection-filter-editor'}
    filterContent={
    <form onSubmit={apply}><Stack gap="4">
     {simpleEditor ? <>
       {schema.properties.map(property => (
         <Field key={property.id} label={property.label}>{props => (
           <Select {...props} controlSize="sm"
             value={draft.conditions.find(condition => condition.property === property.id)?.values[0] ?? ''}
             onChange={event => changeSimpleDraft(property.id, event.currentTarget.value)}>
             <option value="">All</option>
             {property.options.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
           </Select>
         )}</Field>
       ))}
       <Button variant="subtle" size="sm" onClick={() => setAdvancedEditor(true)}>Advanced conditions</Button>
     </> : <>
     <FilterGroup label={`${label} conditions`} properties={schema.properties}
       value={{match:draft.match,conditions:draft.conditions}}
       onValueChange={next=>{setDraft(current=>({...current,...next}));setDraftError('');}} />
     </>}
     {draftError&&<Alert tone="error" announcement="polite">{draftError}</Alert>}
     <Inline gap="3"><Button type="submit">Apply filters</Button><Button variant="subtle" onClick={()=>setEditing(false)}>Cancel</Button></Inline>
    </Stack></form>
    } />
  {nameDraft&&<Dialog title={nameDraft.kind==='create'?'Save view':'Rename view'} open onOpenChange={next=>{if(!next)setNameDraft(null);}} trigger={()=>null} initialFocusRef={nameInput}>
   <form onSubmit={saveName}><Stack gap="6"><Field label="View name" required error={nameDraft.invalid}>{props=><Input {...props} ref={nameInput} maxLength={80} value={nameDraft.name} onChange={event=>setNameDraft({...nameDraft,name:event.target.value,invalid:undefined})}/>}</Field>{nameDraft.error&&<Alert tone="error" announcement="polite">{nameDraft.error}</Alert>}<Inline gap="3"><Button type="submit">{nameDraft.kind==='create'?'Save view':'Rename view'}</Button><Button variant="subtle" onClick={()=>setNameDraft(null)}>Cancel</Button></Inline></Stack></form>
  </Dialog>}
  {confirmation&&<AlertDialog open onOpenChange={next=>{if(!next)setConfirmation(null);}} trigger={()=>null} title={confirmation.kind==='delete'?`Delete “${confirmation.name}”?`:'Replace saved views?'} description={confirmation.kind==='delete'?'The saved view will be removed. Collection records are unchanged.':'Unreadable saved views will be replaced with an empty set. Export the snapshot first if you need it.'} confirmLabel={confirmation.kind==='delete'?'Delete view':'Replace saved views'} cancelLabel="Keep views" onConfirm={confirm}/>}
 </Stack>;
}
