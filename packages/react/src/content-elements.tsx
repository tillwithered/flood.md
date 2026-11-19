import {forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState, type CSSProperties} from "react";
import {AuthorMeta, Avatar, Badge, Button, IconSlot, InlineCode, List, MetricDelta, Popover, ScrollArea, Skeleton, Text, Timestamp, TruncatedText, VisuallyHidden} from "./index.js";
import type {AvatarGroupProps, StatusIndicatorProps, FigureProps, BlockquoteProps, InlineCodeProps, MetricProps, TimelineProps, ExpandableTextProps, TruncatedTextProps} from "./index.js";
import {useInlineOverflow} from "./use-inline-overflow.js";
import {AnchoredOverlay} from "./overlays.js";
const cx = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(" ");
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export const OverflowingText = /* @__PURE__ */ forwardRef<HTMLSpanElement, TruncatedTextProps & {appearance?: "text" | "code"}>(function OverflowingText(
  {children, className, dir, hidden, appearance, preserveEnd = 0, tooltipSide = "bottom", ...props}, forwardedRef,
) {
  if (!Number.isSafeInteger(preserveEnd) || preserveEnd < 0) throw new RangeError("Flood TruncatedText expects a nonnegative preserveEnd count");
  const characters = preserveEnd ? (typeof Intl.Segmenter === "function"
    ? Array.from(new Intl.Segmenter().segment(children), part => part.segment) : Array.from(children)) : [];
  const split = preserveEnd > 0 && characters.length > preserveEnd;
  const prefix = split ? characters.slice(0, -preserveEnd).join("") : children;
  const suffix = split ? characters.slice(-preserveEnd).join("") : "";
  const head = useInlineOverflow(prefix, !hidden, split);
  const tail = useInlineOverflow(suffix, split && !hidden);
  const root = useRef<HTMLSpanElement>(null);
  const overflow = head.overflow || tail.overflow;
  useImperativeHandle(forwardedRef, () => root.current!, []);
  return <AnchoredOverlay kind="tooltip" inlineTooltip className="flood-truncated-text__tooltip"
    content={children} dir={dir} side={tooltipSide} align="center" disabled={!overflow} trigger={trigger => {
      const triggerProps = {
        ...props, ...trigger, ref: (node: HTMLSpanElement | null) => {
          root.current = node;
          if (!split) head.ref.current = node;
          trigger.ref(node);
        },
        "aria-describedby": undefined, dir, hidden, tabIndex: overflow ? 0 : undefined, "data-preserve-end": split || undefined,
        className: cx("flood-truncated-text", className),
      };
      const content = split ? <><span ref={head.ref}>{prefix}</span><span ref={tail.ref}>{suffix}</span></> : children;
      if (appearance === "code") return <InlineCode {...triggerProps} size="sm" wrap={false}>{content}</InlineCode>;
      if (appearance === "text") return <Text {...triggerProps} size="compact">{content}</Text>;
      return <span {...triggerProps}>{content}</span>;
    }} />;
});

// Join the ellipsis to the excerpt and the action to the ellipsis.
const excerptEnding = "\u2060…\u00a0";

export const ExpandableParagraph = /* @__PURE__ */ forwardRef<HTMLDivElement, ExpandableTextProps>(function ExpandableParagraph(
  {children, lines = 3, size, tone, expanded, defaultExpanded = false, onExpandedChange,
    moreLabel = "Show more", lessLabel = "Show less", className, ...props}, ref,
) {
  if (!Number.isInteger(lines) || lines < 1) throw new RangeError("Flood ExpandableText lines must be a positive integer");
  const paragraphId = useId();
  const paragraph = useRef<HTMLElement>(null);
  const probe = useRef<HTMLElement>(null);
  const probeText = useRef<HTMLSpanElement>(null);
  const probeTail = useRef<HTMLSpanElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const [localExpanded, setLocalExpanded] = useState(defaultExpanded);
  const [excerpt, setExcerpt] = useState<string | null>(null);
  const open = expanded ?? localExpanded;
  const collapsed = excerpt !== null && !open;

  useBrowserLayoutEffect(() => {
    const node = paragraph.current;
    const view = node?.ownerDocument.defaultView;
    const measurement = probe.current;
    const text = probeText.current;
    const tail = probeTail.current;
    if (!node || !view || !measurement || !text || !tail) return;
    let boundaries: number[] | undefined;
    const measure = () => {
      const typography = view.getComputedStyle(node);
      const lineHeight = Number.parseFloat(typography.lineHeight);
      if (!Number.isFinite(lineHeight) || !node.getBoundingClientRect().width) return;
      measurement.style.inlineSize = typography.inlineSize;
      const limit = lineHeight * lines + 0.5;
      const fits = () => Number.parseFloat(view.getComputedStyle(measurement).height) <= limit
        && measurement.scrollWidth <= measurement.clientWidth;
      tail.hidden = true;
      text.textContent = children;
      if (fits()) {
        if (toggle.current === node.ownerDocument.activeElement) node.focus({preventScroll:true});
        setExcerpt(null);
      } else {
        // Fit the real localized ending and never cut a grapheme in half.
        if (!boundaries) {
          boundaries = [0];
          const pieces = typeof Intl.Segmenter === "function"
            ? Array.from(new Intl.Segmenter().segment(children), part => part.segment)
            : Array.from(children);
          for (const piece of pieces) boundaries.push(boundaries[boundaries.length - 1] + piece.length);
        }
        tail.hidden = false;
        let low = 0;
        let high = boundaries.length - 1;
        while (low < high) {
          const middle = Math.ceil((low + high) / 2);
          text.textContent = children.slice(0, boundaries[middle]).trimEnd();
          if (fits()) low = middle;
          else high = middle - 1;
        }
        setExcerpt(children.slice(0, boundaries[low]).trimEnd());
      }
      text.textContent = "";
      tail.hidden = true;
    };
    measure();
    const Observer = view.ResizeObserver;
    const observer = Observer && new Observer(measure);
    observer?.observe(node);
    node.ownerDocument.fonts?.addEventListener("loadingdone", measure);
    return () => {
      observer?.disconnect();
      node.ownerDocument.fonts?.removeEventListener("loadingdone", measure);
    };
  }, [children, lines, size, moreLabel, props.dir, props.lang]);

  return <div {...props} ref={ref} className={cx("flood-expandable-text", className)}>
    <Text as="p" id={paragraphId} ref={paragraph} tabIndex={-1} size={size} tone={tone} className="flood-expandable-text__passage">
      {collapsed && <VisuallyHidden className="flood-expandable-text__accessible">{children}</VisuallyHidden>}
      <span className="flood-expandable-text__copy" aria-hidden={collapsed || undefined}>{collapsed ? excerpt : children}</span>
      {excerpt !== null && <span className="flood-expandable-text__tail">
        {collapsed ? <span aria-hidden="true">{excerptEnding}</span> : " "}
        <Button ref={toggle} size="xs" variant="ghost" aria-controls={paragraphId} aria-expanded={open}
          className="flood-expandable-text__toggle"
          onClick={() => {
            if (expanded === undefined) setLocalExpanded(!open);
            onExpandedChange?.(!open);
          }}>{open ? lessLabel : moreLabel}</Button>
      </span>}
    </Text>
    <div aria-hidden="true" className="flood-expandable-text__probe">
      <Text as="p" ref={probe} size={size} tone={tone} className="flood-expandable-text__passage">
        <span ref={probeText}/>
        <span ref={probeTail} hidden className="flood-expandable-text__tail">
          <span>{excerptEnding}</span>
          <Button tabIndex={-1} size="xs" variant="ghost" className="flood-expandable-text__toggle">{moreLabel}</Button>
        </span>
      </Text>
    </div>
  </div>;
});

export const GroupedAvatars = /* @__PURE__ */ forwardRef<HTMLUListElement, AvatarGroupProps>(function GroupedAvatars(
  {items, label, max = 4, size = "md", spacing = "auto", layout = "wrap", overflowLabel, overflowPresentation = "count",
    overflowTitle = "More people", className, tabIndex, ...props}, ref,
) {
  if (!Number.isInteger(max) || max < 1) throw new Error("Flood AvatarGroup max must be a positive integer");
  if (!label.trim() || items.some(item => !item.id.trim() || !item.name.trim()) || new Set(items.map(item => item.id)).size !== items.length) throw new Error("Flood AvatarGroup needs a label and unique nonempty item IDs/names");
  const root = useRef<HTMLUListElement>(null);
  const probe = useRef<HTMLUListElement>(null);
  const overflowItem = useRef<HTMLLIElement>(null);
  const restoreFocus = useRef(false);
  const [capacity, setCapacity] = useState<number>();
  const fit = layout === "fit";
  const visible = items.slice(0, fit ? Math.min(max, capacity ?? max) : max);
  const remaining = items.length - visible.length;
  const opensList = overflowPresentation === "popover";
  const spaced = spacing === "separated" || (fit ? items.slice(0,max) : visible).some(item => item.presence);
  useImperativeHandle(ref, () => root.current!, []);
  useBrowserLayoutEffect(() => {
    const group = root.current, strip = probe.current, view = group?.ownerDocument.defaultView;
    if (!fit || !group || !strip || !view) return;
    const [first, second, ...counts] = Array.from(strip.children) as HTMLLIElement[];
    const update = () => {
      const gap = Number.parseFloat(view.getComputedStyle(strip).columnGap) || 0;
      const spacing = (node: HTMLElement) => Number.parseFloat(view.getComputedStyle(node).marginInlineStart) + gap;
      const width = first.offsetWidth;
      const step = second.offsetWidth + spacing(second);
      const style = view.getComputedStyle(group);
      const available = group.clientWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight);
      let next = Math.min(max, items.length);
      while (next > 0) {
        const faces = width + (next - 1) * step;
        const count = counts[String(items.length - next).length - 1];
        const overflow = next < items.length ? count.offsetWidth + spacing(count) : 0;
        if (faces + overflow <= available) break;
        next--;
      }
      if (next === items.length && overflowItem.current?.contains(group.ownerDocument.activeElement)) restoreFocus.current = true;
      setCapacity(next);
    };
    update();
    const Observer = view.ResizeObserver;
    const observer = Observer && new Observer(update);
    observer?.observe(group);
    observer?.observe(strip);
    group.ownerDocument.fonts?.addEventListener("loadingdone", update);
    return () => {
      observer?.disconnect();
      group.ownerDocument.fonts?.removeEventListener("loadingdone", update);
    };
  }, [fit, max, items.length, opensList, size, spaced]);
  useBrowserLayoutEffect(() => {
    if (!remaining && restoreFocus.current) {
      restoreFocus.current = false;
      root.current?.focus({preventScroll: true});
    }
  }, [remaining]);
  const countLabel = remaining === 1 ? "1 more person" : `${remaining} more people`;
  if (remaining > 0 && overflowLabel !== undefined && !overflowLabel.trim()) throw new Error("Flood AvatarGroup overflowLabel must be nonempty");
  if (opensList && remaining > 0 && !overflowTitle.trim()) throw new Error("Flood AvatarGroup overflowTitle must be nonempty");
  return <ul role="list" {...props} ref={root} aria-label={label} className={cx("flood-avatar-group", className)} data-size={size}
    data-spaced={spaced || undefined} data-fit={(fit && capacity !== undefined) || undefined} tabIndex={tabIndex ?? (fit ? -1 : undefined)}>
    {visible.map(({id, name, src, fallback, presence}) => <li key={id}><Avatar name={name} src={src} fallback={fallback} presence={presence} size={size} /></li>)}
    {remaining > 0 && <li ref={overflowItem} className={opensList ? "flood-avatar-group__interactive" : undefined}>
      {opensList ? <Popover title={overflowTitle} chrome="title-only" align="end" focusOnOpen={false} className="flood-avatar-group__people"
        trigger={trigger => <Button {...trigger} variant="subtle" size={size === "lg" ? "xl" : size}
          aria-label={overflowLabel ?? `Show ${countLabel}`} className="flood-avatar-group__trigger">+{remaining}</Button>}>
        <ScrollArea className="flood-avatar-group__people-viewport" aria-label={overflowTitle}>
          <List marker={false} gap="2">
            {items.slice(visible.length).map(({id, name, src, fallback, presence}) => <li key={id}><AuthorMeta name={name} src={src} fallback={fallback} presence={presence} size="sm" /></li>)}
          </List>
        </ScrollArea>
      </Popover> : <span className="flood-avatar flood-avatar-group__overflow" data-size={size} role="img"
        aria-label={overflowLabel ?? countLabel}>+{remaining}</span>}
    </li>}
    {fit && items.length > 0 && <li className="flood-avatar-group__measure" aria-hidden="true" key="avatar-fit-measure">
      <ul ref={probe} className="flood-avatar-group" data-spaced={spaced || undefined}>
        <li><span className="flood-avatar" data-size={size}/></li>
        <li><span className="flood-avatar" data-size={size}/></li>
        {Array.from({length:String(items.length).length}, (_,index) => {
          // Both overflow treatments use tabular figures, so only the digit count changes geometry.
          const sample = `+${"1".repeat(index+1)}`;
          return <li key={sample} className={opensList ? "flood-avatar-group__interactive" : undefined}>
            {opensList ? <Button variant="subtle" size={size === "lg" ? "xl" : size} tabIndex={-1} className="flood-avatar-group__trigger">{sample}</Button>
              : <span className="flood-avatar flood-avatar-group__overflow" data-size={size}>{sample}</span>}
          </li>;
        })}
      </ul>
    </li>}
  </ul>;
});

export const NamedStatus = /* @__PURE__ */ forwardRef<HTMLSpanElement, StatusIndicatorProps & {showLabelIcon?: boolean}>(function NamedStatus({label, tone = "neutral", size = "md", announce = false, presentation = "label", icon, showLabelIcon = false, className, role, tabIndex, ...props}, forwardedRef) {
  const root = useRef<HTMLSpanElement>(null);
  useImperativeHandle(forwardedRef, () => root.current!, []);
  const {ref: text, overflow} = useInlineOverflow(label, presentation === "label" || presentation === "chip");
  if (!label.trim()) throw new Error("Flood StatusIndicator requires a label");
  const iconOnly = presentation === "icon";
  if (iconOnly && (icon == null || typeof icon === "boolean")) throw new Error("Flood StatusIndicator icon presentation requires an icon");
  const hasTooltip = !props.hidden && (iconOnly || overflow);

  const Indicator = presentation === "chip" ? Badge : "span";
  return <AnchoredOverlay kind="tooltip" inlineTooltip side="top" align="center" content={presentation === "wrap" ? "" : label} disabled={!hasTooltip} trigger={trigger => <Indicator {...props}
    {...(presentation === "chip" ? {tone, size} : {})}
    ref={node => {root.current = node; trigger.ref(node);}}
    onPointerEnter={event => {props.onPointerEnter?.(event); trigger.onPointerEnter?.(event);}}
    onPointerLeave={event => {props.onPointerLeave?.(event); trigger.onPointerLeave?.(event);}}
    onFocus={event => {props.onFocus?.(event); trigger.onFocus?.(event);}}
    onBlur={event => {props.onBlur?.(event); trigger.onBlur?.(event);}}
    role={announce ? "status" : role} tabIndex={tabIndex ?? (hasTooltip ? 0 : undefined)}
    className={cx("flood-status-indicator", className)} data-tone={tone} data-size={size} data-presentation={presentation}>
    <span className="flood-status-indicator__mark" aria-hidden="true">
      {iconOnly || showLabelIcon ? <IconSlot size={size}>{icon}</IconSlot> : <span className="flood-status-indicator__dot"/>}
    </span>
    {iconOnly ? <VisuallyHidden>{label}</VisuallyHidden> : <span ref={text} className="flood-status-indicator__label">{label}</span>}
  </Indicator>}/>;
});

export const CaptionedFigure = /* @__PURE__ */ forwardRef<HTMLElement, FigureProps>(function CaptionedFigure({caption, captionPosition = "after", children, className, ...props}, ref) {
  const content = caption !== undefined && caption !== null && caption !== false ? <figcaption className="flood-figure__caption">{caption}</figcaption> : null;
  return <figure {...props} ref={ref} className={cx("flood-figure", className)}>{captionPosition === "before" && content}{children}{captionPosition === "after" && content}</figure>;
});

export const AttributedQuote = /* @__PURE__ */ forwardRef<HTMLQuoteElement, BlockquoteProps>(function AttributedQuote({attribution, children, className, ...props}, ref) {
  return <blockquote {...props} ref={ref} className={cx("flood-blockquote", className)}><div className="flood-blockquote__quote">{children}</div>{attribution !== undefined && attribution !== null && attribution !== false && <footer className="flood-blockquote__attribution">{attribution}</footer>}</blockquote>;
});

export const InlineCodeText = /* @__PURE__ */ forwardRef<HTMLElement, InlineCodeProps>(function InlineCodeText({size = "md", wrap = true, className, ...props}, ref) {
  return <code {...props} ref={ref} className={cx("flood-inline-code", className)} data-size={size} data-wrap={wrap}/>;
});

export const MeasuredValue = /* @__PURE__ */ forwardRef<HTMLDListElement, MetricProps>(function MeasuredValue({
  label, value, unit, hint, trend, size = "md", state = "ready", loadingLabel = "Loading", unavailableLabel = "Unavailable",
  className, "aria-busy":busy, ...props
}, ref) {
  if (!label.trim() || (trend && !trend.label.trim())) throw new Error("Flood Metric requires a label and meaningful trend text");
  const loading = state === "loading";
  const ready = state === "ready";
  return <dl {...props} ref={ref} className={cx("flood-metric", className)} data-size={size}
    data-state={state} aria-busy={busy ?? (loading || undefined)}>
    <dt className="flood-metric__label"><TruncatedText tooltipSide="top">{label}</TruncatedText></dt>
    <dd className="flood-metric__value">
      {ready ? <>{value}{unit && <span className="flood-metric__unit">{" "}<bdi>{unit}</bdi></span>}</> : <>
        {loading ? <Skeleton className="flood-metric__placeholder"/> : <span className="flood-metric__unavailable" aria-hidden="true">—</span>}
        <VisuallyHidden>{loading ? loadingLabel : unavailableLabel}</VisuallyHidden>
      </>}
    </dd>
    {trend && (ready || loading) && <dd className="flood-metric__trend" data-variant={trend.variant} aria-hidden={loading || undefined}>
      <MetricDelta {...trend}/>
      {loading && <Skeleton className="flood-metric__trend-placeholder"/>}
    </dd>}
    {hint !== undefined && hint !== null && hint !== false && <dd className="flood-metric__hint">{hint}</dd>}
  </dl>;
});

export const EventTimeline = /* @__PURE__ */ forwardRef<HTMLOListElement, TimelineProps>(function EventTimeline({items, label, mode = "progress", layout = "stacked", density = "comfortable", stateLabels, className, ...props}, ref) {
  if (!label.trim() || items.some(item => !item.id.trim() || !item.title.trim()) || new Set(items.map(item => item.id)).size !== items.length) throw new Error("Flood Timeline needs a label and unique nonempty item IDs/titles");
  const showProgress = mode === "progress";
  if (showProgress && items.filter(item => item.state === "current").length > 1) throw new Error("Flood Timeline has at most one current event");
  const labels = {complete:stateLabels?.complete ?? "Complete", current:stateLabels?.current ?? "Current", upcoming:stateLabels?.upcoming ?? "Upcoming"};
  if (showProgress && Object.values(labels).some(value => !value.trim())) throw new Error("Flood Timeline state labels must be nonempty");
  const activityLayout = showProgress ? "stacked" : layout;
  return <ol {...props} ref={ref} role={props.role ?? (showProgress ? undefined : "list")} aria-label={label} className={cx("flood-timeline", className)} data-mode={showProgress ? undefined : "activity"} data-layout={activityLayout} data-density={density}>{items.map(item => {
    const state = showProgress ? item.state ?? "upcoming" : undefined;
    const title = <div className="flood-timeline__title">{state && <VisuallyHidden>{labels[state]}: </VisuallyHidden>}{showProgress ? item.title : item.summary ?? item.title}</div>;
    const timestamp = item.timeLabel && (item.dateTime
      ? <Timestamp className="flood-timeline__time" dateTime={item.dateTime}>{item.timeLabel}</Timestamp>
      : <span className="flood-timeline__time">{item.timeLabel}</span>);
    return <li key={item.id} className="flood-timeline__item" data-state={state} data-connector={activityLayout === "stacked" ? undefined : item.connector} aria-current={state === "current" ? "step" : undefined}>
      {activityLayout === "schedule" && timestamp}
      <span className="flood-timeline__marker" aria-hidden="true">
        {item.icon != null ? <IconSlot size="2xs">{item.icon}</IconSlot>
          : state === "complete" ? <IconSlot size="2xs"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 12 4 4 8-8"/></svg></IconSlot>
          : state === "current" ? <span/> : null}
      </span>
      <div className="flood-timeline__content">
        {activityLayout === "feed" ? <div className="flood-timeline__header">{title}{timestamp}</div> : title}
        {item.description !== undefined && item.description !== null && <div className="flood-timeline__description">{item.description}</div>}
        {activityLayout === "stacked" && timestamp}
        {!showProgress && item.content}
      </div>
    </li>;
  })}</ol>;
});
