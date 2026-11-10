import {forwardRef,useEffect,useImperativeHandle,useLayoutEffect,useRef,useState,type CSSProperties} from 'react';
import {IconButton,NavigationTree,NavigationGroup,ScrollArea,Stack,type SidebarProps} from './index.js';
const useBrowserLayoutEffect=typeof window==='undefined'?useEffect:useLayoutEffect;

export const WorkspaceSidebar=/* @__PURE__ */ forwardRef<HTMLElement,SidebarProps>(function WorkspaceSidebar({
  label,groups,currentValue,currentKind="page",collapsed:controlled,defaultCollapsed=false,onCollapsedChange,collapsible=true,
  collapseLabel='Collapse sidebar',expandLabel='Expand sidebar',expandedValues,defaultExpandedValues=[],onExpandedValuesChange,expandItemLabel,
  size='md',variant='quiet',side='start',width='16rem',header,headerLayout='stacked',footer,footerSeparator=false,headerSeparator=false,className,style,...props
},ref){
  if(!label.trim()||!collapseLabel.trim()||!expandLabel.trim()||new Set(groups.map(group=>group.id)).size!==groups.length||groups.some(group=>!group.id.trim()||!group.label.trim()))throw new Error('Flood Sidebar requires named unique groups and controls');
  const known=new Set<string>(),pending=groups.flatMap(group=>[...group.items]);
  while(pending.length){const item=pending.pop()!;if(known.has(item.value))throw new Error('Flood Sidebar item values must be globally unique');known.add(item.value);if(item.children)pending.push(...item.children);}
  const [local,setLocal]=useState(defaultCollapsed),[expanded,setExpanded]=useState<readonly string[]>(defaultExpandedValues);
  const collapsed=controlled??local,root=useRef<HTMLElement>(null),toggle=useRef<HTMLButtonElement>(null),body=useRef<HTMLDivElement>(null);
  const lastOwnedFocus=useRef<HTMLElement|null>(null);const [rtl,setRtl]=useState(false);
  useImperativeHandle(ref,()=>root.current!,[]);
  useBrowserLayoutEffect(()=>{
    const node=root.current;if(!node)return;
    const view=node.ownerDocument.defaultView!,update=()=>setRtl(view.getComputedStyle(node).direction==='rtl');
    update();const observer=new view.MutationObserver(update);
    for(let ancestor:HTMLElement|null=node;ancestor;ancestor=ancestor.parentElement)observer.observe(ancestor,{attributes:true,attributeFilter:['dir','style','class']});
    view.addEventListener('resize',update);
    return()=>{observer.disconnect();view.removeEventListener('resize',update);};
  },[]);
  useBrowserLayoutEffect(()=>{
    const node=root.current;if(!node)return;const document=node.ownerDocument;
    const track=(event:FocusEvent)=>{const target=event.target as HTMLElement;lastOwnedFocus.current=node.contains(target)?target:null;};
    document.addEventListener('focusin',track,true);
    return()=>document.removeEventListener('focusin',track,true);
  },[]);
  useBrowserLayoutEffect(()=>{
    const node=root.current,previous=lastOwnedFocus.current;
    if(node&&previous&&!previous.isConnected&&node.ownerDocument.activeElement===node.ownerDocument.body)(toggle.current??node).focus({preventScroll:true});
  },[collapsed]);
  const slot=(value:SidebarProps['header'])=>typeof value==='function'?value({collapsed}):value;
  const headerContent=slot(header),footerContent=slot(footer),panelOnLeft=(side==='start')!==rtl;
  return <aside {...props} ref={root} aria-label={label} tabIndex={-1} data-footer-separator={footerSeparator} data-header-separator={headerSeparator} data-header-layout={headerLayout} data-flood-surface="filled" data-size={size} data-variant={variant} data-collapsed={collapsed} data-side={side}
    className={['flood-sidebar',className].filter(Boolean).join(' ')}
    style={{'--flood-sidebar-width':typeof width==='number'?`${width}px`:width,...style} as CSSProperties}>
    {(headerContent!=null||collapsible)&&<div className="flood-sidebar__header" data-collapsible={collapsible}>
      {collapsible&&<IconButton ref={toggle} className="flood-sidebar__toggle" label={collapsed?expandLabel:collapseLabel} title={collapsed?expandLabel:collapseLabel} size={size} variant="ghost" aria-expanded={!collapsed}
        onClick={()=>{toggle.current?.focus({preventScroll:true});if(controlled===undefined)setLocal(!collapsed);onCollapsedChange?.(!collapsed);}}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="4"/><path d={panelOnLeft?'M9 4v16':'M15 4v16'}/><path d={panelOnLeft?(collapsed?'m14 9 3 3-3 3':'m17 9-3 3 3 3'):(collapsed?'m10 9-3 3 3 3':'m7 9 3 3-3 3')}/></svg>
      </IconButton>}
      {headerContent!=null&&<div className="flood-sidebar__identity">{headerContent}</div>}
    </div>}
    <ScrollArea ref={body} className="flood-sidebar__body" contentInset="none" onFocus={event=>{
      // WebKit can focus the tree landmark on pointer down. Keep the row under
      // the pointer instead of scrolling to reveal the entire tree.
      if((event.target as HTMLElement).matches('nav.flood-navigation-tree'))event.preventDefault();
    }}><Stack gap="4" className="flood-sidebar__navigation">
      {groups.map(group=><NavigationGroup key={group.id} label={group.label} hideLabel={group.hideLabel} headingAction={group.headingAction} separator={group.separator} collapsible={group.collapsible} expanded={group.expanded} defaultExpanded={group.defaultExpanded} onExpandedChange={group.onExpandedChange} compact={collapsed} size={size} className="flood-sidebar__group" data-icon-column={group.items.some(item=>item.icon!=null)||undefined}>
        <NavigationTree label={group.label} items={group.items} currentValue={currentValue} currentKind={currentKind} size={size} variant={variant} compact={collapsed} branchGuides={group.branchGuides}
          flyoutSide={panelOnLeft?'right':'left'} expandedValues={expandedValues??expanded}
          onExpandedValuesChange={values=>{if(expandedValues===undefined)setExpanded(values);onExpandedValuesChange?.(values);}} expandLabel={expandItemLabel}/>
      </NavigationGroup>)}
    </Stack></ScrollArea>
    {footerContent!=null&&<div className="flood-sidebar__footer">{footerContent}</div>}
  </aside>;
});
