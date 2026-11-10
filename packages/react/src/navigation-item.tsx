import {forwardRef,useCallback,useRef,type Ref,type RefCallback} from 'react';
import {Button,IconButton,IconSlot,Link,Text,Tooltip,type TooltipTriggerProps} from './index.js';

import type {NavigationItemProps} from "./index.js";

function assignRef<T>(ref:Ref<T>|undefined,node:T|null){if(typeof ref==='function')ref(node);else if(ref)ref.current=node;}
const classes=(...values:Array<string|undefined|false>)=>values.filter(Boolean).join(' ');

/** Shared anatomy for destinations, commands and navigation disclosures. */
export const NavigationRow=/* @__PURE__ */ forwardRef<HTMLDivElement,NavigationItemProps>(function NavigationRow({
  label,description,icon,reserveIcon=false,trailing,trailingAction,href,linkProps,onAction,actionProps,disclosure,
  current=false,currentKind='page',ancestorCurrent=false,disabled=false,size='md',compact=false,
  variant='quiet',tooltip=true,tooltipSide='right',controlRef,disclosureRef,className,...props
},ref){
  if(!label.trim())throw new Error('Flood NavigationItem requires a nonempty label');
  if(href!==undefined&&!href.trim())throw new Error('Flood NavigationItem requires a nonempty destination');
  if(href!==undefined&&onAction)throw new Error('Flood NavigationItem uses either a destination or a command');
  if(compact&&disclosure&&(href!==undefined||onAction||actionProps?.onClick))throw new Error('Flood compact rows with separate actions and disclosure require a branch composition such as NavigationTree');
  if(disclosure&&!disclosure.label.trim())throw new Error('Flood NavigationItem requires a named disclosure');
  const toggleOnly=Boolean(disclosure&&href===undefined&&!onAction);
  const hasAction=!compact&&trailingAction!=null;
  const unavailable=disabled||Boolean(toggleOnly&&disclosure?.disabled)||Boolean(href===undefined&&actionProps?.disabled);
  const hintRef=useRef<RefCallback<HTMLElement>|undefined>(undefined);
  const setControl=useCallback((node:HTMLElement|null)=>{assignRef(controlRef,node);hintRef.current?.(node);},[controlRef]);
  const glyph=icon??(compact?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="4"/></svg>:null);
  const chevron=<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>;
  const content=<>
    {(icon!=null||reserveIcon||compact)&&<IconSlot size={size}>{glyph}</IconSlot>}
    <span className="flood-navigation-item__content"><Text as="span" className="flood-navigation-item__label">{label}</Text>{!compact&&description&&<Text as="span" size="helper" tone="subtle" className="flood-navigation-item__description">{description}</Text>}</span>
    {!compact&&!hasAction&&trailing!=null&&<span className="flood-navigation-item__trailing">{trailing}</span>}
    {!compact&&toggleOnly&&<span className="flood-navigation-item__indicator"><IconSlot size={size==='lg'?'xs':'2xs'}>{chevron}</IconSlot></span>}
  </>;
  const primary=(hint?:TooltipTriggerProps)=>{
    hintRef.current=hint?.ref;
    const hintEvents={
      onPointerEnter:(event:React.PointerEvent<HTMLElement>)=>{if(href!==undefined)linkProps?.onPointerEnter?.(event as React.PointerEvent<HTMLAnchorElement>);else actionProps?.onPointerEnter?.(event as React.PointerEvent<HTMLButtonElement>);if(!event.defaultPrevented)hint?.onPointerEnter?.(event);},
      onPointerLeave:(event:React.PointerEvent<HTMLElement>)=>{if(href!==undefined)linkProps?.onPointerLeave?.(event as React.PointerEvent<HTMLAnchorElement>);else actionProps?.onPointerLeave?.(event as React.PointerEvent<HTMLButtonElement>);hint?.onPointerLeave?.(event);},
      onFocus:(event:React.FocusEvent<HTMLElement>)=>{if(href!==undefined)linkProps?.onFocus?.(event as React.FocusEvent<HTMLAnchorElement>);else actionProps?.onFocus?.(event as React.FocusEvent<HTMLButtonElement>);if(!event.defaultPrevented)hint?.onFocus?.(event);},
      onBlur:(event:React.FocusEvent<HTMLElement>)=>{if(href!==undefined)linkProps?.onBlur?.(event as React.FocusEvent<HTMLAnchorElement>);else actionProps?.onBlur?.(event as React.FocusEvent<HTMLButtonElement>);hint?.onBlur?.(event);},
    };
    const source=href!==undefined?linkProps:actionProps;
    const descriptionIds=[source?.['aria-describedby'],hint?.['aria-describedby']].filter(Boolean).join(' ')||undefined;
    const controlClass=classes('flood-navigation-item__control',source?.className);
    if(href!==undefined){
      if(unavailable)return <span ref={setControl} role="link" aria-disabled="true" aria-label={compact?linkProps?.['aria-label']??label:linkProps?.['aria-label']} aria-current={current?currentKind:undefined} className={controlClass}>{content}</span>;
      return <Link {...linkProps} {...hintEvents} ref={setControl} href={href} variant="ghost" size={size} className={controlClass} title={hint?undefined:linkProps?.title}
        aria-label={compact?linkProps?.['aria-label']??label:linkProps?.['aria-label']} aria-describedby={descriptionIds} aria-current={current?currentKind:undefined}>{content}</Link>;
    }
    if(onAction||toggleOnly||actionProps?.onClick)return <Button {...actionProps} {...hintEvents} ref={setControl} type="button" variant="ghost" size={size} className={controlClass} disabled={unavailable||actionProps?.disabled}
      aria-label={actionProps?.['aria-label']??(toggleOnly?disclosure!.label:compact?label:undefined)} aria-describedby={descriptionIds} aria-current={current?currentKind:undefined}
      aria-expanded={toggleOnly?disclosure!.expanded:actionProps?.['aria-expanded']} aria-controls={toggleOnly?disclosure!.controls:actionProps?.['aria-controls']}
      onClick={event=>{actionProps?.onClick?.(event);if(event.defaultPrevented)return;if(toggleOnly)disclosure!.onExpandedChange(!disclosure!.expanded);else onAction?.();}}>{content}</Button>;
    return <span ref={setControl} className={controlClass} aria-disabled={unavailable||undefined} aria-current={current?currentKind:undefined}>{content}</span>;
  };
  return <div {...props} ref={ref} className={classes('flood-navigation-item',className)} data-size={size} data-variant={variant} data-compact={compact||undefined}
    data-current={current||undefined} data-ancestor-current={ancestorCurrent||undefined} data-disabled={unavailable||undefined}
    data-disclosure={disclosure&&!toggleOnly&&!compact||undefined} data-trailing-action={hasAction||undefined} data-expanded={disclosure?.expanded}>
    {compact?<Tooltip content={label} side={tooltipSide} disabled={!tooltip||unavailable} trigger={hint=>primary(hint)}/>:primary()}
    {hasAction&&<div className="flood-navigation-item__accessories">
      {trailing!=null&&<span className="flood-navigation-item__metadata">{trailing}</span>}
      <div className="flood-navigation-item__action">{trailingAction}</div>
    </div>}
    {disclosure&&!toggleOnly&&!compact&&<IconButton ref={disclosureRef} label={disclosure.label} size={size} iconSize={size==='lg'?'xs':'2xs'} variant="ghost"
      className="flood-navigation-item__disclosure" disabled={disabled||disclosure.disabled} aria-expanded={disclosure.expanded} aria-controls={disclosure.controls}
      onClick={()=>disclosure.onExpandedChange(!disclosure.expanded)}>{chevron}</IconButton>}
  </div>;
});
