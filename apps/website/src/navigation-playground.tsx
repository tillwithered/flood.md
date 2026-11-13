"use client";
import {useCallback,useEffect,useRef,useState,type Dispatch,type FormEvent,type RefCallback,type SetStateAction} from 'react';
import {Archive,ArrowLeft,Bell,Check,ChevronDown,Ellipsis,FileText,Folder,FolderKanban,Inbox,PanelLeftClose,PanelLeftOpen,LifeBuoy,Plus,Search,Settings,UserRound} from 'lucide-react';
import {AppShell,AppTopBar,Avatar,Badge,Breadcrumb,Button,CollectionToolbar,CommandPalette,DataList,DataListItem,DataTable,Dialog,EmptyState,Field,FileItem,FileList,FloodRoot,Heading,IconButton,IconSlot,Inline,Input,Link,Menu,NavigationGroup,NavigationTree,ScrollArea,SegmentedControl,Select,Sidebar,Stack,StatusIndicator,Text,Tooltip,type NavigationTreeItem,type SidebarGroup} from '@flood-md/react';
import './navigation-playground.css';

type WorkspaceId='studio'|'labs';
type Module='projects'|'inbox'|'files';
type Project={id:string;name:string;owner:string;status:'active'|'paused'|'archived';updated:string};
const initialProjects:Project[]=[
  {id:'design',name:'Design system',owner:'Maya Chen',status:'active',updated:'Today'},
  {id:'website',name:'Website refresh',owner:'Noah Williams',status:'active',updated:'Today'},
  {id:'onboarding',name:'Customer onboarding',owner:'Sam Rivera',status:'active',updated:'Yesterday'},
  {id:'mobile',name:'Mobile experience',owner:'Maya Chen',status:'paused',updated:'Yesterday'},
  {id:'analytics',name:'Product analytics',owner:'Noah Williams',status:'active',updated:'Nov 6'},
  {id:'portal',name:'Customer portal',owner:'Sam Rivera',status:'paused',updated:'Nov 5'},
  {id:'checkout',name:'Checkout',owner:'Maya Chen',status:'archived',updated:'Oct 29'},
];
const files=[{id:'brief',name:'Project brief.pdf',format:'PDF',size:840000},{id:'library',name:'Component library.fig',format:'FIG',size:12800000},{id:'notes',name:'Research notes.pdf',format:'PDF',size:1800000},{id:'assets',name:'Brand assets.zip',format:'ZIP',size:24600000}];
const initialMessages=[{id:'review',title:'Design review',body:'Maya requested feedback on Design system.',read:false},{id:'release',title:'Website refresh',body:'Noah shared the updated project brief.',read:false},{id:'handoff',title:'Customer onboarding',body:'Sam completed the handoff.',read:true}];
const moduleNames:Record<Module,string>={projects:'Projects',inbox:'Inbox',files:'Files'};
const routeTitles:Record<string,string>={'projects/all':'All projects','projects/active':'Active projects','projects/mine':'My projects','projects/archived':'Archived projects','inbox/all':'All messages','inbox/unread':'Unread','files/all':'All files','files/documents':'Documents'};
const labsProjects:Project[]=[
  'Research operations','Accessibility review','Partner onboarding','International customer support and documentation',
  'Experiment dashboard','Data quality','Service reliability','Design research archive',
  'Prototype library','Search relevance','Billing experiments','Workspace administration and access management',
  'Release readiness','Customer interviews','Internal reporting','Knowledge base',
].map((name,index)=>({id:`lab-${index+1}`,name,owner:index%2?'Noah Williams':'Maya Chen',status:index%3?'active':'paused',updated:'Today'}));
const workspaceIds=['studio','labs'] as const;
const workspaceNames={studio:'Flood Studio',labs:'Flood Labs'};
const defaultExpansion=['projects/all','inbox/all','files/all','lab-research','lab-delivery'];
const blankQueries:Record<Module,string>={projects:'',inbox:'',files:''};

function validRoute(workspace:WorkspaceId,route:string){
  if(workspace==='labs'&&route==='projects/archived')return 'projects/all';
  if(Object.hasOwn(routeTitles,route))return route;
  if(workspace==='labs'&&labsProjects.some(project=>route===`projects/${project.id}`))return route;
  return 'projects/all';
}

function readLocation(){
  const hash=typeof window==='undefined'?'':window.location.hash.replace(/^#\/?/,'');
  const workspace:WorkspaceId=hash.startsWith('labs/')?'labs':'studio';
  return {workspace,route:validRoute(workspace,workspace==='labs'?hash.slice(5):hash)};
}

function workspaceHref(workspace:WorkspaceId,route:string){
  return `#${workspace==='labs'?'labs/':''}${route}`;
}

function useWorkspaceState<T>(workspace:WorkspaceId,initial:Record<WorkspaceId,T>):[T,Dispatch<SetStateAction<T>>]{
  const [values,setValues]=useState(initial);
  return [values[workspace],next=>setValues(current=>({
    ...current,
    [workspace]:typeof next==='function'?(next as (previous:T)=>T)(current[workspace]):next,
  }))];
}
const glyph=(Icon:typeof Folder)=><Icon aria-hidden="true"/>;

function AccountControl({collapsed,value,names,onWorkspaceChange,onSettings}:{
  collapsed:boolean;value:WorkspaceId;names:Record<WorkspaceId,string>;
  onWorkspaceChange:(next:WorkspaceId)=>void;onSettings:()=>void;
}){
  const [open,setOpen]=useState(false),refs=useRef<{menu?:RefCallback<HTMLButtonElement>;hint?:RefCallback<HTMLElement>}>({});
  const attach=useCallback((node:HTMLButtonElement|null)=>{refs.current.menu?.(node);refs.current.hint?.(node);},[]);
  useEffect(()=>setOpen(false),[collapsed]);
  return <Tooltip content="Account" side="right" disabled={!collapsed||open} trigger={hint=><Menu label="Account" open={open} onOpenChange={setOpen} className="navigation-lab__account-menu" data-compact={collapsed}
    items={[
      ...workspaceIds.map(id=>({id,type:'radio' as const,group:'Workspaces',label:names[id],checked:value===id,closeOnSelect:true,onCheckedChange:()=>onWorkspaceChange(id)})),
      {id:'workspace-settings-divider',type:'separator'},
      {id:'settings',label:'Workspace settings',icon:glyph(Settings)},
    ]} onAction={onSettings} side="top" align="start" trigger={({ref,...trigger})=>{
    refs.current={menu:ref,hint:hint.ref};
    const shared={...trigger,ref:attach,onPointerEnter:hint.onPointerEnter,onPointerLeave:hint.onPointerLeave,onFocus:hint.onFocus,onBlur:hint.onBlur,'aria-describedby':hint['aria-describedby']};
    return collapsed?<IconButton {...shared} label="Account" variant="ghost" size="sm"><UserRound/></IconButton>:<Button {...shared} variant="subtle" size="sm" className="navigation-lab__account"><Avatar name="Maya Chen" fallback="MC" size="sm" decorative/><Text size="compact">Maya Chen</Text><IconSlot size="2xs"><ChevronDown/></IconSlot></Button>;
  }}/>} />;
}

function ServiceBrand({collapsed}:{collapsed:boolean}){
  return <Inline gap="2" className="navigation-lab__brand">
    <IconSlot size="sm"><img src="/flood-mark.png" width="16" height="16" alt={collapsed?'Flood':''}/></IconSlot>
    {!collapsed&&<Text size="label">Flood</Text>}
  </Inline>;
}

export default function NavigationPlayground(){
  const main=useRef<HTMLElement>(null),heading=useRef<HTMLHeadingElement>(null),lastFocused=useRef<HTMLElement|null>(null);
  const rail=useRef<HTMLElement>(null);
  const pendingNavigationFocus=useRef<string|null>(null);
  const [layout,setLayout]=useState('composed'),[contextVisible,setContextVisible]=useState(true),[compact,setCompact]=useState(false);
  const [{workspace:workspaceId,route},setLocation]=useState(readLocation);
  const lastRoutes=useRef<Partial<Record<WorkspaceId,string>>>({});
  const [projects,setProjects]=useWorkspaceState(workspaceId,{studio:initialProjects,labs:labsProjects});
  const [messages,setMessages]=useWorkspaceState(workspaceId,{studio:initialMessages,labs:[]});
  const [queries,setQueries]=useWorkspaceState(workspaceId,{studio:blankQueries,labs:blankQueries});
  const [expandedValues,setExpandedValues]=useWorkspaceState<readonly string[]>(workspaceId,{studio:defaultExpansion,labs:defaultExpansion});
  const [status,setStatus]=useWorkspaceState(workspaceId,{studio:'all',labs:'all'});
  const [draftStatus,setDraftStatus]=useState('all'),[filtersOpen,setFiltersOpen]=useState(false);
  const [creating,setCreating]=useState(false),[name,setName]=useState(''),[invalid,setInvalid]=useState<string>();
  const [workspaceLabels,setWorkspaceLabels]=useState(workspaceNames);
  const workspace=workspaceLabels[workspaceId];
  const [detail,setDetail]=useState<string|null>(null),[settings,setSettings]=useState(false),[workspaceDraft,setWorkspaceDraft]=useState(workspace);
  const [module,view]=route.split('/') as [Module,string];
  const projectPage=workspaceId==='labs'&&module==='projects'?labsProjects.find(project=>project.id===view):undefined;
  const title=projectPage?.name??routeTitles[route];
  const query=queries[module],unread=messages.filter(message=>!message.read).length;
  const href=(path:string)=>workspaceHref(workspaceId,path);

  useEffect(()=>{
    const update=()=>setLocation(readLocation());
    window.addEventListener('hashchange',update);
    return()=>window.removeEventListener('hashchange',update);
  },[]);
  useEffect(()=>{
    lastRoutes.current[workspaceId]=route;
    setFiltersOpen(false);
    setDetail(null);
    setCreating(false);
    setSettings(false);
    if(pendingNavigationFocus.current===route){
      heading.current?.focus({preventScroll:true});
    }
    pendingNavigationFocus.current=null;
  },[workspaceId,route]);

  function switchWorkspace(next:WorkspaceId){
    if(next===workspaceId)return;
    lastRoutes.current[workspaceId]=route;
    window.location.hash=workspaceHref(next,validRoute(next,lastRoutes.current[next]??'projects/all'));
  }
  useEffect(()=>{
    const previous=lastFocused.current,document=heading.current?.ownerDocument;
    if(previous&&!previous.isConnected&&document?.activeElement===document?.body)heading.current?.focus({preventScroll:true});
  });
  function focusSearch(){main.current?.querySelector<HTMLInputElement>('input[type="search"]')?.focus({preventScroll:true});}
  function changeQuery(next:string){setQueries(current=>({...current,[module]:next}));}
  function openSettings(){setWorkspaceDraft(workspace);setSettings(true);}
  function saveProject(event:FormEvent){event.preventDefault();const value=name.trim();if(!value){setInvalid('Enter a project name.');return;}setProjects(current=>[{id:crypto.randomUUID(),name:value,owner:'Maya Chen',status:'active',updated:'Just now'},...current]);setCreating(false);setName('');setInvalid(undefined);setQueries(current=>({...current,projects:''}));setStatus('all');window.location.hash=href('projects/all');}
  const contextItems:Record<Module,NavigationTreeItem[]>={
    projects:[{value:'projects/all',label:'All projects',href:href('projects/all'),icon:glyph(FolderKanban)},{value:'projects/active',label:'Active',href:href('projects/active'),icon:glyph(Check)},{value:'projects/mine',label:'Assigned to me',href:href('projects/mine'),icon:glyph(UserRound)},{value:'projects/archived',label:'Archived',href:href('projects/archived'),icon:glyph(Archive)}],
    inbox:[{value:'inbox/all',label:'All messages',href:href('inbox/all'),icon:glyph(Inbox)},{value:'inbox/unread',label:'Unread',href:href('inbox/unread'),icon:glyph(Bell),trailing:unread?<Badge size="sm">{unread}</Badge>:undefined}],
    files:[{value:'files/all',label:'All files',href:href('files/all'),icon:glyph(Folder)},{value:'files/documents',label:'Documents',href:href('files/documents'),icon:glyph(FileText)}],
  };
  const globalItems:NavigationTreeItem[]=[{value:'projects',label:'Projects',href:href('projects/all'),icon:glyph(FolderKanban)},{value:'inbox',label:'Inbox',href:href('inbox/all'),icon:glyph(Inbox)},{value:'files',label:'Files',href:href('files/all'),icon:glyph(Folder)}];
  if(workspaceId==='labs')contextItems.projects=contextItems.projects.filter(item=>item.value!=='projects/archived');
  const projectCollections:NavigationTreeItem[]=workspaceId==='labs'?[
    {value:'lab-research',label:'Research and operations',icon:glyph(Folder),trailing:<Badge size="sm">8</Badge>,children:labsProjects.slice(0,8).map(projectLink)},
    {value:'lab-delivery',label:'Product delivery',icon:glyph(Folder),trailing:<Badge size="sm">8</Badge>,children:labsProjects.slice(8).map(projectLink)},
  ]:[];
  function projectLink(project:Project):NavigationTreeItem{
    const destination=`projects/${project.id}`;
    return {value:destination,label:project.name,href:href(destination)};
  }
  const navigationDestinations=[
    ...Object.entries(contextItems).flatMap(([section,items])=>items.map(item=>({
      id:item.value,label:item.label,group:moduleNames[section as Module],
    }))),
    ...(workspaceId==='labs'?labsProjects.map(project=>({
      id:`projects/${project.id}`,label:project.name,group:'Project pages',
    })):[]),
  ];

  function goToDestination(destination:string){
    if(destination===route)return;
    const branch=destination.split('/')[0]+'/all';
    const collection=labsProjects.findIndex(project=>destination===`projects/${project.id}`);
    setExpandedValues(current=>[...new Set([
      ...current,branch,
      ...(collection<0?[]:[collection<8?'lab-research':'lab-delivery']),
    ])]);
    pendingNavigationFocus.current=destination;
    window.location.hash=href(destination);
  }

  const classicItems:NavigationTreeItem[]=globalItems.map(item=>({...item,value:`${item.value}/all`,children:item.value===module?contextItems[module].filter(child=>child.value!==`${module}/all`):undefined}));
  const groups:SidebarGroup[]=layout==='composed'?[{id:`${module}-views`,label:`${moduleNames[module]} views`,hideLabel:true,items:contextItems[module]}]:[{id:'workspace',label:'Workspace',hideLabel:true,items:classicItems}];
  if(module==='projects'&&projectCollections.length)groups.push({id:'project-collections',label:'Collections',separator:true,items:projectCollections});
  const drawerGroups: SidebarGroup[] = layout === 'composed'
    ? [{ id: 'modules', label: 'Workspace', items: globalItems.map(item => ({ ...item, value: `${item.value}/all` })) },
      ...groups.map(group => ({ ...group, hideLabel: false }))]
    : groups;
  const railItems= contextVisible ? globalItems : globalItems.map(item => {
    const section=item.value as Module;
    return {...item,href:undefined,flyout:{openOnHover:true,positionReference:rail},content:<ScrollArea tabIndex={-1} className="navigation-lab__rail-flyout-body"><Stack gap="4">
      <NavigationTree label={`${item.label} views`} items={contextItems[section]} currentValue={route} size="sm"/>
      {section==='projects'&&projectCollections.length>0&&<NavigationGroup label="Collections" separator size="sm">
        <NavigationTree label="Project collections" items={projectCollections} currentValue={route} size="sm"
          expandedValues={expandedValues} onExpandedValuesChange={setExpandedValues}/>
      </NavigationGroup>}
    </Stack></ScrollArea>};
  });
  const brand=({collapsed}:{collapsed:boolean})=><ServiceBrand collapsed={collapsed}/>;
  const account=({collapsed}:{collapsed:boolean})=><AccountControl collapsed={collapsed} value={workspaceId} names={workspaceLabels} onWorkspaceChange={switchWorkspace} onSettings={openSettings}/>;
  const visibleProjects=projectPage?projects.filter(project=>project.id===projectPage.id):projects.filter(project=>(view!=='active'||project.status==='active')&&(view!=='mine'||project.owner==='Maya Chen')&&(view!=='archived'||project.status==='archived')&&(status==='all'||project.status===status)&&`${project.name} ${project.owner}`.toLowerCase().includes(query.toLowerCase()));
  const visibleMessages=messages.filter(message=>(view!=='unread'||!message.read)&&`${message.title} ${message.body}`.toLowerCase().includes(query.toLowerCase()));
  const visibleFiles=(workspaceId==='labs'?files.slice(2):files).filter(file=>(view!=='documents'||file.format==='PDF')&&file.name.toLowerCase().includes(query.toLowerCase()));
  const clearFilters=()=>{focusSearch();changeQuery('');if(module==='projects')setStatus('all');};
  const canClearFilters=Boolean(query||module==='projects'&&status!=='all');
  const filteredEmpty=<EmptyState title="No matching projects" density="compact" actions={<Button variant="subtle" size="sm" onClick={clearFilters}>Clear filters</Button>}/>;
  function drawerItems(items: readonly NavigationTreeItem[], close: () => void): NavigationTreeItem[] {
    return items.map(item => ({
      ...item,
      children: item.children && drawerItems(item.children, close),
      linkProps: item.href ? { ...item.linkProps, onClick: event => {
        item.linkProps?.onClick?.(event);
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        close();
        if (item.value === route) requestAnimationFrame(() => heading.current?.focus({preventScroll:true}));
        else goToDestination(item.value);
      }} : item.linkProps,
    }));
  }
  return <FloodRoot className="navigation-lab" onFocusCapture={event=>{lastFocused.current=event.target as HTMLElement;}}>
    <div className="navigation-lab__controls">
      <Inline gap="3"><Link href="/components/sidebar" variant="ghost" size="sm"><IconSlot size="sm"><ArrowLeft/></IconSlot>Sidebar</Link><Text size="helper" tone="subtle">Design Lab</Text></Inline>
      <SegmentedControl name="navigation-layout" label="Navigation layout" hideLabel controlSize="sm" value={layout} onValueChange={setLayout} options={[{value:'classic',label:'Sidebar'},{value:'composed',label:'Rail + context'}]}/>
    </div>
    <AppShell className="navigation-lab__frame" mainRef={main} mainLabel={`${moduleNames[module]} workspace`} scrollLabel={`${moduleNames[module]} content`} scrollOrientation="vertical"
      navigationDrawer={{below:560,title:'Workspace navigation',renderContent:close=><Stack gap="4">
        {drawerGroups.map(group=><NavigationGroup key={group.id} label={group.label} hideLabel={group.hideLabel} separator={group.separator} size="sm">
          <NavigationTree label={group.label} items={drawerItems(group.items,close)} currentValue={group.id === 'modules' ? `${module}/all` : route} currentKind={group.id === 'modules' ? 'location' : 'page'} size="sm"
            expandedValues={expandedValues} onExpandedValuesChange={setExpandedValues}/>
        </NavigationGroup>)}
        {account({collapsed:false})}
      </Stack>}}
      navigation={<>
      {layout==='composed'&&<Sidebar ref={rail} label="Global navigation" groups={[{id:'modules',label:'Modules',hideLabel:true,items:railItems}]} currentValue={module} currentKind="location" collapsed collapsible={false} size="sm" header={state=><div className="navigation-lab__rail-header">
        <IconButton className="navigation-lab__pane-toggle" label={contextVisible?'Hide context navigation':'Show context navigation'}
          variant="ghost" size="sm" aria-expanded={contextVisible} aria-controls={contextVisible?'workspace-context':undefined}
          onClick={event=>{event.currentTarget.focus({preventScroll:true});setContextVisible(current=>!current);}}>
          {contextVisible?<PanelLeftClose/>:<PanelLeftOpen/>}
        </IconButton>
        {brand(state)}
      </div>} footer={account} className="navigation-lab__rail"/>}
      {(layout==='classic'||contextVisible)&&<Sidebar id={layout==='composed'?'workspace-context':undefined} label={layout==='composed'?`${moduleNames[module]} navigation`:'Workspace navigation'} groups={groups} currentValue={route} size="sm" width="15rem" collapsed={layout==='classic'&&compact} onCollapsedChange={setCompact} collapsible={layout==='classic'} headerLayout="inline" expandedValues={expandedValues} onExpandedValuesChange={setExpandedValues} header={layout==='composed'?<Inline gap="2"><IconSlot size="sm">{glyph(module==='projects'?FolderKanban:module==='inbox'?Inbox:Folder)}</IconSlot><Text size="label">{moduleNames[module]}</Text></Inline>:brand} footer={layout==='classic'?account:undefined} className={layout==='composed'?'navigation-lab__context':'navigation-lab__classic'}/>}
      </>} topBar={navigationTrigger=><AppTopBar className="navigation-lab__main-header" bordered start={
          <Breadcrumb label="Workspace path" items={[{label:workspace,href:href('projects/all')},{label:moduleNames[module],href:href(`${module}/all`)},{label:title}]}/>
        } end={<>
          {navigationTrigger}
          <CommandPalette title="Go to page" searchLabel="Search pages" placeholder="Search pages…"
            emptyMessage="No matching pages" items={navigationDestinations} onAction={goToDestination}
            trigger={props=><Button {...props} variant="subtle" size="sm">
              <IconSlot size="sm"><Search/></IconSlot><span className="navigation-lab__toolbar-label">Go to page</span>
            </Button>}/>
          <Link href="https://flood.md/docs" target="_blank" rel="noreferrer" variant="ghost" size="sm" className="navigation-lab__help"><IconSlot size="sm"><LifeBuoy/></IconSlot><span className="navigation-lab__toolbar-label">Help</span></Link></>} />}
    >
          <Stack gap="6" className="navigation-lab__content-inner">
            <Inline gap="4" className="navigation-lab__heading"><Heading ref={heading} tabIndex={-1} level={1} size="page">{title}</Heading>
              {module==='projects'?<Dialog title="New project" open={creating} onOpenChange={setCreating} trigger={props=><Button {...props} size="sm" onClick={event=>{props.onClick?.(event);setName('');setInvalid(undefined);}}><IconSlot size="sm"><Plus/></IconSlot>New project</Button>}>
                <form onSubmit={saveProject}><Stack gap="6"><Field label="Project name" required error={invalid}>{field=><Input {...field} value={name} onChange={event=>{setName(event.target.value);setInvalid(undefined);}} autoComplete="off"/>}</Field><Inline gap="2"><Button type="submit">Create project</Button><Button variant="subtle" onClick={()=>setCreating(false)}>Cancel</Button></Inline></Stack></form>
              </Dialog>:module==='inbox'&&unread>0?<Button size="sm" variant="subtle" onClick={()=>setMessages(current=>current.map(message=>({...message,read:true})))}>Mark all as read</Button>:null}
            </Inline>
            {!projectPage&&<CollectionToolbar label={`${moduleNames[module]} controls`} searchLabel={`Search ${moduleNames[module].toLowerCase()}`} searchPlaceholder={`Search ${moduleNames[module].toLowerCase()}…`} searchValue={query} onSearchValueChange={changeQuery} onClear={module==='projects'?clearFilters:undefined} canClear={canClearFilters} controlSize="sm"
              appliedFilters={module==='projects'&&status!=='all'?[{id:'status',label:`Status: ${status[0].toUpperCase()+status.slice(1)}`}]:[]} onRemoveFilter={()=>setStatus('all')}
              filtersOpen={filtersOpen} onFiltersOpenChange={open=>{setFiltersOpen(open);if(open)setDraftStatus(status);}} filterTitle="Project filters"
              filterContent={module==='projects'?<form onSubmit={event=>{event.preventDefault();setStatus(draftStatus);setFiltersOpen(false);}}><Stack gap="4"><Field label="Status">{field=><Select {...field} controlSize="sm" value={draftStatus} onChange={event=>setDraftStatus(event.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="paused">Paused</option><option value="archived">Archived</option></Select>}</Field><Inline gap="2"><Button type="submit" size="sm">Apply filters</Button><Button variant="subtle" size="sm" onClick={()=>setFiltersOpen(false)}>Cancel</Button></Inline></Stack></form>:undefined}/>}
            {module==='projects'?<DataTable caption="Projects" hideCaption minWidth="34rem" pageSize={8} density="comfortable" emptyContent={filteredEmpty} columns={[{id:'name',label:'Project',sortable:true},{id:'status',label:'Status',sortable:true},{id:'owner',label:'Owner',sortable:true},{id:'updated',label:'Updated',align:'end'},{id:'actions',label:'Actions',align:'end',width:'3rem'}]} rows={visibleProjects.map(project=>({id:project.id,label:project.name,cells:{name:project.name,status:<StatusIndicator label={project.status[0].toUpperCase()+project.status.slice(1)} tone={project.status==='active'?'success':project.status==='paused'?'warning':'neutral'} size="sm"/>,owner:<Text size="compact">{project.owner}</Text>,updated:<Text size="compact" tone="subtle">{project.updated}</Text>,actions:<Menu label={`${project.name} actions`} controlSize="sm" items={[{id:'active',label:'Set active'},{id:'paused',label:'Pause project'},{id:'archived',label:'Archive project'}]} onAction={id=>setProjects(current=>current.map(item=>item.id===project.id?{...item,status:id as Project['status'],updated:'Just now'}:item))} trigger={props=><IconButton {...props} label={`${project.name} actions`} variant="ghost" size="sm"><Ellipsis/></IconButton>}/>} ,sortValues:{name:project.name,status:project.status,owner:project.owner}}))}/>:module==='files'?visibleFiles.length?<FileList label="Files">{visibleFiles.map(file=><FileItem key={file.id} name={file.name} format={file.format} size={file.size}/>)}</FileList>:<EmptyState title="No matching files" density="compact" actions={<Button size="sm" variant="subtle" onClick={()=>changeQuery('')}>Clear search</Button>}/>:visibleMessages.length?<DataList aria-label="Messages" className="navigation-lab__messages">{visibleMessages.map(message=><DataListItem key={message.id} media={<IconSlot size="md"><Inbox/></IconSlot>} title={<Button variant="ghost" size="sm" onClick={()=>{setMessages(current=>current.map(item=>item.id===message.id?{...item,read:true}:item));setDetail(message.id);}}>{message.title}</Button>} description={message.body} metadata={!message.read?<StatusIndicator label="Unread" tone="accent" size="sm"/>:undefined}/>)}</DataList>:<EmptyState title={view==='unread'?'You’re all caught up':'No matching messages'} density="compact"/>}
          </Stack>
    </AppShell>
    {detail&&<Dialog title={messages.find(message=>message.id===detail)?.title??'Message'} open onOpenChange={open=>{if(!open)setDetail(null);}} trigger={()=>null}>
      <Text>{messages.find(message=>message.id===detail)?.body}</Text>
    </Dialog>}
    <Dialog title="Workspace settings" open={settings} onOpenChange={setSettings} trigger={()=>null}><form onSubmit={event=>{event.preventDefault();if(workspaceDraft.trim()){setWorkspaceLabels(current=>({...current,[workspaceId]:workspaceDraft.trim()}));setSettings(false);}}}><Stack gap="6"><Field label="Workspace name" required>{field=><Input {...field} value={workspaceDraft} onChange={event=>setWorkspaceDraft(event.target.value)}/>}</Field><Inline gap="2"><Button type="submit">Save changes</Button><Button variant="subtle" onClick={()=>setSettings(false)}>Cancel</Button></Inline></Stack></form></Dialog>
  </FloodRoot>;
}
