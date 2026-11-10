import {forwardRef} from 'react';
import {Button,Field,IconSlot,Inline,OverflowActions,Select,type CollectionViewSwitcherProps} from './index.js';

/** Presentation of accepted definitions; the host owns their queries and persistence. */
export const CollectionViewSelector = /* @__PURE__ */ forwardRef<HTMLDivElement,CollectionViewSwitcherProps>(function CollectionViewSelector({
  label,views,value,onValueChange,actions=[],onAction,actionsLabel=`${label} actions`,moreLabel='View actions',
  controlSize='sm',disabled=false,selectRef,className,...props
},ref){
  if(!label.trim()||!actionsLabel.trim()||!moreLabel.trim()||new Set(views.map(view=>view.id)).size!==views.length||
    views.some(view=>!view.id.trim()||!view.name.trim())||new Set(actions.map(action=>action.id)).size!==actions.length||
    actions.some(action=>!action.id.trim()||!action.label.trim()))throw new Error('Flood CollectionViewSwitcher requires unique named views and actions');
  const single=actions.length===1?actions[0]:undefined;
  return <Inline {...props} ref={ref} role="group" aria-label={`${label} controls`} gap="3" align="center"
    className={['flood-collection-view-switcher',className].filter(Boolean).join(' ')}>
    <div className="flood-collection-view-switcher__select"><Field label={label} hideLabel>{field=><Select {...field} ref={selectRef}
      controlSize={controlSize} disabled={disabled} value={value} onChange={event=>{
        const next=views.find(view=>view.id===event.currentTarget.value);
        if(!disabled&&next&&!next.disabled)onValueChange(next.id);
      }}>{views.map(view=><option key={view.id} value={view.id} disabled={view.disabled}>{view.name}</option>)}</Select>}</Field></div>
    {actions.length>0&&<div className="flood-collection-view-switcher__actions">{single?
      <Button size={controlSize} variant="subtle" tone={single.tone} disabled={disabled||single.disabled}
        onClick={()=>{if(!disabled&&!single.disabled)onAction?.(single.id);}}>
        {single.icon&&<IconSlot size={controlSize}>{single.icon}</IconSlot>}{single.label}
      </Button>:<OverflowActions label={actionsLabel} moreLabel={moreLabel} size={controlSize} items={actions} containerVariant="plain"
        disabled={disabled} onAction={id=>{if(!disabled)onAction?.(id);}}/>}</div>}
  </Inline>;
});
