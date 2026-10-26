import {forwardRef} from "react";
import {Avatar, VisuallyHidden} from "./index.js";
import type {AvatarGroupProps, StatusIndicatorProps, FigureProps, BlockquoteProps, InlineCodeProps, MetricProps, TimelineProps} from "./index.js";
const cx = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(" ");

export const GroupedAvatars = forwardRef<HTMLUListElement, AvatarGroupProps>(function GroupedAvatars({items, label, max = 4, size = "md", overflowLabel, className, ...props}, ref) {
  if (!Number.isInteger(max) || max < 1) throw new Error("Flood AvatarGroup max must be a positive integer");
  if (!label.trim() || items.some(item => !item.id.trim() || !item.name.trim()) || new Set(items.map(item => item.id)).size !== items.length) throw new Error("Flood AvatarGroup needs a label and unique nonempty item IDs/names");
  const visible = items.slice(0, max), remaining = items.length - visible.length;
  if (remaining > 0 && overflowLabel !== undefined && !overflowLabel.trim()) throw new Error("Flood AvatarGroup overflowLabel must be nonempty");
  return <ul {...props} ref={ref} aria-label={label} className={cx("flood-avatar-group", className)} data-size={size}>
    {visible.map(item => <li key={item.id}><Avatar name={item.name} src={item.src} fallback={item.fallback} size={size}/></li>)}
    {remaining > 0 && <li><span className="flood-avatar flood-avatar-group__overflow" data-size={size} role="img" aria-label={overflowLabel ?? `${remaining} more people`}>+{remaining}</span></li>}
  </ul>;
});

export const NamedStatus = forwardRef<HTMLSpanElement, StatusIndicatorProps>(function NamedStatus({label, tone = "neutral", size = "md", announce = false, className, role, ...props}, ref) {
  if (!label.trim()) throw new Error("Flood StatusIndicator requires a visible label");
  return <span {...props} ref={ref} role={announce ? "status" : role} className={cx("flood-status-indicator", className)} data-tone={tone} data-size={size}><span className="flood-status-indicator__dot" aria-hidden="true"/>{label}</span>;
});

export const CaptionedFigure = forwardRef<HTMLElement, FigureProps>(function CaptionedFigure({caption, captionPosition = "after", children, className, ...props}, ref) {
  const content = caption !== undefined && caption !== null && caption !== false ? <figcaption className="flood-figure__caption">{caption}</figcaption> : null;
  return <figure {...props} ref={ref} className={cx("flood-figure", className)}>{captionPosition === "before" && content}{children}{captionPosition === "after" && content}</figure>;
});

export const AttributedQuote = forwardRef<HTMLQuoteElement, BlockquoteProps>(function AttributedQuote({attribution, children, className, ...props}, ref) {
  return <blockquote {...props} ref={ref} className={cx("flood-blockquote", className)}><div className="flood-blockquote__quote">{children}</div>{attribution !== undefined && attribution !== null && attribution !== false && <footer className="flood-blockquote__attribution">{attribution}</footer>}</blockquote>;
});

export const InlineCodeText = forwardRef<HTMLElement, InlineCodeProps>(function InlineCodeText({size = "md", wrap = true, className, ...props}, ref) {
  return <code {...props} ref={ref} className={cx("flood-inline-code", className)} data-size={size} data-wrap={wrap}/>;
});

export const MeasuredValue = forwardRef<HTMLDListElement, MetricProps>(function MeasuredValue({label, value, hint, trend, size = "md", className, ...props}, ref) {
  if (!label.trim() || (trend && !trend.label.trim())) throw new Error("Flood Metric requires a label and meaningful trend text");
  return <dl {...props} ref={ref} className={cx("flood-metric", className)} data-size={size}><dt className="flood-metric__label">{label}</dt><dd className="flood-metric__value">{value}</dd>{trend && <dd className="flood-metric__trend" data-tone={trend.tone ?? "neutral"}><span aria-hidden="true">{trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"}</span>{trend.label}</dd>}{hint !== undefined && hint !== null && hint !== false && <dd className="flood-metric__hint">{hint}</dd>}</dl>;
});

export const EventTimeline = forwardRef<HTMLOListElement, TimelineProps>(function EventTimeline({items, label, stateLabels, className, ...props}, ref) {
  if (!label.trim() || items.some(item => !item.id.trim() || !item.title.trim()) || new Set(items.map(item => item.id)).size !== items.length) throw new Error("Flood Timeline needs a label and unique nonempty item IDs/titles");
  if (items.filter(item => item.state === "current").length > 1) throw new Error("Flood Timeline has at most one current event");
  const labels = {complete:stateLabels?.complete ?? "Complete", current:stateLabels?.current ?? "Current", upcoming:stateLabels?.upcoming ?? "Upcoming"};
  if (Object.values(labels).some(value => !value.trim())) throw new Error("Flood Timeline state labels must be nonempty");
  return <ol {...props} ref={ref} aria-label={label} className={cx("flood-timeline", className)}>{items.map(item => {
    const state = item.state ?? "upcoming";
    return <li key={item.id} className="flood-timeline__item" data-state={state} aria-current={state === "current" ? "step" : undefined}>
      <span className="flood-timeline__marker" aria-hidden="true">{item.icon ?? (state === "complete" ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 12 4 4 8-8"/></svg> : state === "current" ? <span/> : null)}</span>
      <div className="flood-timeline__content"><div className="flood-timeline__title"><VisuallyHidden>{labels[state]}: </VisuallyHidden>{item.title}</div>{item.description !== undefined && item.description !== null && <div className="flood-timeline__description">{item.description}</div>}{item.timeLabel && (item.dateTime ? <time className="flood-timeline__time" dateTime={item.dateTime}>{item.timeLabel}</time> : <span className="flood-timeline__time">{item.timeLabel}</span>)}</div>
    </li>;
  })}</ol>;
});
