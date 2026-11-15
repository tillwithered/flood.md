import {forwardRef, useEffect, useId, useLayoutEffect, useRef, useState} from "react";
import {Button, EmptyState, ErrorState, Inline, ListSkeleton, NotificationItem, NotificationList, SegmentedControl, Stack} from "./index.js";
import type {NotificationInboxFilter, NotificationInboxProps} from "./index.js";
import {hasFieldContent} from "./field-state.js";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export const InboxContent = /* @__PURE__ */ forwardRef<HTMLDivElement, NotificationInboxProps>(function InboxContent(
  {label, items, filter, defaultFilter = "all", onFilterChange, onUnreadChange, onMarkAllRead,
    markingAllRead = false, state = "ready", loadingPlaceholder, onRetry, retrying = false,
    density = "compact", appearance = "default", labels = {}, className, onFocusCapture, ...props}, ref,
) {
  if (!label.trim() || items.some(item => !item.id.trim()) || new Set(items.map(item => item.id)).size !== items.length) {
    throw new Error("Flood NotificationInbox needs a label and unique nonempty item IDs");
  }
  const [localFilter, setLocalFilter] = useState(defaultFilter);
  const selected = filter ?? localFilter;
  const filterName = useId();
  const toggle = useRef<HTMLFieldSetElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const available = items.filter(item => !item.hidden);
  const unread = available.filter(item => item.unread);
  const visible = selected === "unread" ? unread : available;
  const reserveMedia = items.some(item => hasFieldContent(item.media));

  useBrowserLayoutEffect(() => {
    const previous = lastFocus.current;
    const active = previous?.ownerDocument.activeElement;
    if (!previous || (previous.isConnected && !previous.matches(":disabled")) ||
        (active !== previous && active !== previous.ownerDocument.body)) return;
    lastFocus.current = null;
    toggle.current?.querySelector<HTMLInputElement>("input:checked")?.focus({preventScroll:true});
  }, [items, selected, state, markingAllRead]);

  let body;
  if (state === "loading") {
    body = <ListSkeleton {...loadingPlaceholder} density={density} dividers={false}
      label={labels.loading ?? "Loading notifications…"} className="flood-notification-inbox__skeleton"
      media={loadingPlaceholder?.media ?? reserveMedia} />;
  } else if (state === "error") {
    body = <ErrorState density={density} layout="row" headingLevel={3}
      title={labels.error ?? "Could not load notifications."} onRetry={onRetry} retryLabel={labels.retry} retrying={retrying} />;
  } else if (visible.length > 0) {
    body = <NotificationList label={label} density={density} reserveMediaSpace={reserveMedia}>
      {visible.map(({id, ...item}) => <NotificationItem key={id} {...item}
        onUnreadChange={onUnreadChange && (next => onUnreadChange(id, next))} />)}
    </NotificationList>;
  } else {
    const emptyTitle = available.length ? labels.caughtUp ?? "No unread notifications" : labels.empty ?? "No notifications yet";
    body = <EmptyState density={density} headingLevel={3} title={emptyTitle} />;
  }

  return <Stack {...props} ref={ref} role="region" aria-label={label} data-density={density} data-appearance={appearance}
    gap={appearance==="overlay"?"1":"2"}
    className={["flood-notification-inbox", className].filter(Boolean).join(" ")}
    onFocusCapture={event => {
      lastFocus.current = event.target;
      onFocusCapture?.(event);
    }}>
    <Inline gap="2" className="flood-notification-inbox__header">
      <SegmentedControl ref={toggle} name={filterName} label={labels.filter ?? "Show notifications"} hideLabel
        controlSize="sm" value={selected} options={[
          {value:"all",label:labels.all ?? "All"}, {value:"unread",label:labels.unread ?? "Unread"},
        ]} onValueChange={value => {
          const next = value as NotificationInboxFilter;
          if (filter === undefined) setLocalFilter(next);
          onFilterChange?.(next);
        }} />
      {onMarkAllRead && <Button size={density === "compact" ? "xs" : "sm"} variant="ghost" disabled={state !== "ready" || !unread.length && !markingAllRead}
        loading={state === "ready" && markingAllRead && "retain-focus"} onClick={onMarkAllRead}>{labels.markAllRead ?? "Mark all as read"}</Button>}
    </Inline>
    {body}
  </Stack>;
});
