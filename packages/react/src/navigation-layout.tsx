import {forwardRef, useId} from "react";
import type {CSSProperties} from "react";
import type {NavigationListProps, NavigationListItem, StepsProps, SectionProps, SplitProps, CenterProps, SkipLinkProps} from "./index.js";
import {IconSlot,Heading} from "./index.js";

const classes = (...names: Array<string | undefined | false>) => names.filter(Boolean).join(" ");
function uniqueValues(items: readonly {value:string}[], component:string) {
  if (items.some(item => !item.value.trim()) || new Set(items.map(item => item.value)).size !== items.length) throw new Error(`Flood ${component} items require unique nonempty values`);
}

export const NavigationMenu = /* @__PURE__ */ forwardRef<HTMLElement, NavigationListProps>(function NavigationMenu({
  items, label, currentValue, size = "md", className, ...props
}, ref) {
  uniqueValues(items, "NavigationList");
  if (!label.trim() || items.some(item => !item.label.trim() || !item.href.trim())) throw new Error("Flood NavigationList requires a name and labelled links with destinations");
  const id = useId();
  const groups: Array<{label:string;items:NavigationListItem[]}> = [];
  for (const item of items) {
    const previous = groups.at(-1);
    if (previous?.label === (item.group ?? "")) previous.items.push(item);
    else groups.push({label:item.group ?? "",items:[item]});
  }
  const links = (entries: NavigationListItem[]) => entries.map(item => <li key={item.value}>
    <a {...item.linkProps} href={item.href} aria-current={item.value === currentValue ? "page" : undefined} className={classes("flood-navigation-list__link",item.linkProps?.className)}>
      {item.icon != null && <IconSlot size={size}>{item.icon}</IconSlot>}
      <span className="flood-navigation-list__text"><span className="flood-navigation-list__label">{item.label}</span>{item.description && <span className="flood-navigation-list__description">{item.description}</span>}</span>
    </a>
  </li>);
  return <nav {...props} ref={ref} aria-label={label} className={classes("flood-navigation-list",className)} data-size={size}>
    <ul role="list" className="flood-navigation-list__groups">{groups.map((group,index) => group.label ? <li key={index} className="flood-navigation-list__group">
      <p className="flood-navigation-list__group-title" id={`${id}-${index}`}>{group.label}</p>
      <ul role="list" aria-labelledby={`${id}-${index}`}>{links(group.items)}</ul>
    </li> : links(group.items))}</ul>
  </nav>;
});

export const StepSequence = /* @__PURE__ */ forwardRef<HTMLOListElement, StepsProps>(function StepSequence({
  items, label, currentValue = items[0]?.value, orientation = "horizontal", onStepChange,
  statusLabels = {complete:"Completed",current:"Current step",upcoming:"Upcoming",error:"Needs attention"}, className, ...props
}, ref) {
  uniqueValues(items, "Steps");
  if (!label.trim() || items.some(item => !item.title.trim())) throw new Error("Flood Steps requires a sequence name and step titles");
  const currentIndex = items.findIndex(item => item.value === currentValue);
  if (currentValue !== undefined && currentIndex < 0) throw new Error("Flood Steps currentValue must identify a step");
  return <ol {...props} ref={ref} role="list" aria-label={label} data-orientation={orientation} className={classes("flood-steps",className)}>
    {items.map((item,index) => {
      const current = index === currentIndex;
      const state = item.status === "error" ? "error" : current ? "current" : item.status ?? (index < currentIndex ? "complete" : "upcoming");
      const content = <><span className="flood-steps__indicator" aria-hidden="true">{state === "complete" ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4 10-10"/></svg> : state === "error" ? "!" : index + 1}</span>
        <span className="flood-steps__text"><span className="flood-steps__title">{item.title}</span><span className="flood-visually-hidden">{statusLabels[state]}</span>{item.description && <span className="flood-steps__description">{item.description}</span>}</span></>;
      return <li key={item.value} data-state={state} aria-current={current ? "step" : undefined}>
        {onStepChange ? <button type="button" className="flood-steps__content flood-steps__action" disabled={item.disabled} onClick={() => onStepChange(item.value)}>{content}</button> : <div className="flood-steps__content">{content}</div>}
      </li>;
    })}
  </ol>;
});

export const ContentSection = /* @__PURE__ */ forwardRef<HTMLElement, SectionProps>(function ContentSection({
  title, description, actions, headingLevel = 2, headingSize = "section", children, id: explicitId, className,
  "aria-labelledby": labelledBy, ...props
}, ref) {
  if (!title.trim() || ![2,3,4,5,6].includes(headingLevel)) throw new Error("Flood Section requires a nonempty title and headingLevel from 2 to 6");
  const generated = useId(), headingId = `${explicitId ?? `flood-section-${generated}`}-title`;
  return <section {...props} ref={ref} id={explicitId} aria-labelledby={labelledBy ?? headingId} className={classes("flood-section",className)}>
    <header className="flood-section__header"><div className="flood-section__heading">
      <Heading id={headingId} level={headingLevel} size={headingSize} className="flood-section__title">{title}</Heading>
      {description != null && <div className="flood-section__description">{description}</div>}
    </div>{actions != null && <div className="flood-section__actions">{actions}</div>}</header>
    {children != null && <div className="flood-section__body">{children}</div>}
  </section>;
});

export const SplitLayout = /* @__PURE__ */ forwardRef<HTMLDivElement, SplitProps>(function SplitLayout({
  main, aside, side = "end", ratio = "main", collapseAt = "md", gap = "6", className, style, ...props
}, ref) {
  const primary = <div key="main" className="flood-split__main">{main}</div>, secondary = <div key="aside" className="flood-split__aside">{aside}</div>;
  return <div {...props} ref={ref} className={classes("flood-split",className)} style={{"--flood-layout-gap":`var(--flood-sys-space-${gap})`,...style} as CSSProperties}>
    <div className="flood-split__layout" data-side={side} data-ratio={ratio} data-collapse={collapseAt}>{side === "start" ? [secondary,primary] : [primary,secondary]}</div>
  </div>;
});

export const CenterLayout = /* @__PURE__ */ forwardRef<HTMLDivElement, CenterProps>(function CenterLayout({
  inline = false, maxWidth, minHeight, className, style, children, ...props
}, ref) {
  return <div {...props} ref={ref} className={classes("flood-center",className)} data-inline={inline || undefined}
    style={{minBlockSize:minHeight,"--flood-center-max":maxWidth,...style} as CSSProperties}>
    <div className="flood-center__content">{children}</div>
  </div>;
});

export const SkipNavigation = /* @__PURE__ */ forwardRef<HTMLAnchorElement, SkipLinkProps>(function SkipNavigation({
  children = "Skip to content", className, onClick, href, ...props
}, ref) {
  if (!href.startsWith("#") || href.length < 2) throw new Error("Flood SkipLink requires a nonempty same-page fragment href");
  return <a {...props} ref={ref} href={href} className={classes("flood-skip-link",className)} onClick={event => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || (props.target && props.target !== "_self")) return;
    const document = event.currentTarget.ownerDocument, view = document.defaultView;
    let id: string;
    try { id = decodeURIComponent(href.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target || !view) return;
    view.requestAnimationFrame(() => {
      if (!target.isConnected) return;
      target.focus({preventScroll:true});
      target.scrollIntoView({block:"start",behavior:view.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "auto"});
    });
  }}>{children}</a>;
});
