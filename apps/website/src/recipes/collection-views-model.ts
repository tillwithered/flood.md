import type {ComboboxOption,DataTableSort} from '@flood-md/react';

export interface FilterProperty {id:string;label:string;options:readonly ComboboxOption[];}
export interface CollectionSchema {properties:readonly FilterProperty[];sortColumns:readonly string[];}
export interface FilterCondition {id:string;property:string;operator:'is'|'is-not';values:string[];}
export interface CollectionQuery {search:string;match:'all'|'any';conditions:FilterCondition[];sort:DataTableSort|null;}
export interface CollectionView {id:string;name:string;query:CollectionQuery;}
export type ViewStorage=Pick<Storage,'getItem'|'setItem'>;
export type ViewRead={state:'ready';views:CollectionView[]}|{state:'error';views:[];raw:string|null};
const object=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
export const emptyCollectionQuery=():CollectionQuery=>({search:'',match:'all',conditions:[],sort:null});
export const copyCollectionQuery=(query:CollectionQuery):CollectionQuery=>({...query,conditions:query.conditions.map(condition=>({...condition,values:[...condition.values]})),sort:query.sort?{...query.sort}:null});

/** Validate persisted definitions instead of silently dropping unknown predicates. */
export function parseCollectionQuery(value:unknown,schema:CollectionSchema):CollectionQuery {
 if(!object(value)||typeof value.search!=='string'||(value.match!=='all'&&value.match!=='any')||!Array.isArray(value.conditions))throw Error('Unsupported view query');
 const ids=new Set<string>(),properties=new Set<string>();
 const conditions=value.conditions.map((condition:unknown):FilterCondition=>{
  if(!object(condition)||typeof condition.id!=='string'||!condition.id.trim()||ids.has(condition.id)||typeof condition.property!=='string'||properties.has(condition.property)||(condition.operator!=='is'&&condition.operator!=='is-not')||!Array.isArray(condition.values)||!condition.values.length)throw Error('Unsupported view condition');
  const property=schema.properties.find(property=>property.id===condition.property);
  if(!property||new Set(condition.values).size!==condition.values.length||condition.values.some(value=>typeof value!=='string'||!property.options.some(option=>option.value===value)))throw Error('Unknown view values');
  ids.add(condition.id);properties.add(condition.property);
  return {id:condition.id,property:condition.property,operator:condition.operator as FilterCondition['operator'],values:[...condition.values] as string[]};
 });
 let sort:DataTableSort|null=null;
 if(value.sort!==null){if(!object(value.sort)||typeof value.sort.column!=='string'||!schema.sortColumns.includes(value.sort.column)||(value.sort.direction!=='ascending'&&value.sort.direction!=='descending'))throw Error('Unsupported view sort');sort={column:value.sort.column,direction:value.sort.direction};}
 return {search:value.search,match:value.match as CollectionQuery['match'],conditions,sort};
}

/** Row IDs and condition UI IDs do not define a saved query's meaning. */
export function collectionQueryKey(query:CollectionQuery){return JSON.stringify({search:query.search.trim(),match:query.conditions.length>1?query.match:'all',conditions:query.conditions.map(({property,operator,values})=>({property,operator,values:[...values].sort()})).sort((a,b)=>a.property.localeCompare(b.property)),sort:query.sort});}

export function matchesCollectionQuery(query:CollectionQuery,searchText:string,read:(property:string)=>string|readonly string[]|null){
 if(!searchText.toLocaleLowerCase().includes(query.search.trim().toLocaleLowerCase()))return false;
 const tests=query.conditions.map(condition=>{const raw=read(condition.property),values=raw===null?[]:typeof raw==='string'?[raw]:raw;const includes=condition.values.some(value=>values.includes(value));return condition.operator==='is'?includes:!includes;});
 return !tests.length||(query.match==='all'?tests.every(Boolean):tests.some(Boolean));
}

export function readCollectionViews(key:string,schema:CollectionSchema,storage:ViewStorage,reservedNames:readonly string[]=[]):ViewRead {
 let raw:string|null=null;
 try{
  raw=storage.getItem(key);if(raw===null)return {state:'ready',views:[]};
  const value:unknown=JSON.parse(raw);
  if(!object(value)||value.version!==1||!Array.isArray(value.views))throw Error('Unsupported saved views');
  const ids=new Set<string>(),names=new Set(reservedNames.map(name=>name.normalize('NFC').toLowerCase()));
  const views=value.views.map((view:unknown):CollectionView=>{
   if(!object(view)||typeof view.id!=='string'||!view.id.startsWith('saved-')||ids.has(view.id)||typeof view.name!=='string'||!view.name.trim()||view.name.length>80||names.has(view.name.trim().normalize('NFC').toLowerCase()))throw Error('Unsupported saved view');
   ids.add(view.id);names.add(view.name.trim().normalize('NFC').toLowerCase());
   return {id:view.id,name:view.name.trim(),query:parseCollectionQuery(view.query,schema)};
  });
  return {state:'ready',views};
 }catch{return {state:'error',views:[],raw};}
}
