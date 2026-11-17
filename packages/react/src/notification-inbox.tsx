import {forwardRef, useEffect, useId, useLayoutEffect, useRef, useState} from "react";
import {Button, EmptyState, ErrorState, Inline, NotificationItem, NotificationList, NotificationListSkeleton, ScrollArea, SegmentedControl, Stack} from "./index.js";
import type {NotificationInboxFilter, NotificationInboxProps} from "./index.js";
import {hasFieldContent} from "./field-state.js";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export const InboxContent = /* @__PURE__ */ forwardRef<HTMLDivElement, NotificationInboxProps>(function InboxContent(
  {label, items, filter, defaultFilter = "all", onFilterChange, onUnreadChange, onMarkAllRead,
    markingAllRead = false, state = "ready", loadingPlaceholder, onRetry, retrying = false,
    density = "compact", appearance = "default", maxListHeight, labels = {}, className, onFocusCapture, onBlurCapture, ...props}, ref,
) {
  if (!label.trim() || items.some(item => !item.id.trim()) || new Set(items.map(item => item.id)).size !== items.length) {
    throw new Error("Flood NotificationInbox needs a label and unique nonempty item IDs");
  }
  const [localFilter, setLocalFilter] = useState(defaultFilter);
  const selected = filter ?? localFilter;
  const filterName = useId();
  const toggle = useRef<HTMLFieldSetElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const previousOrder = useRef<string[]>([]);
  const listHeight = maxListHeight ?? (appearance === "overlay" ? "min(18rem, 45dvh)" : undefined);
  const available = items.filter(item => !item.hidden);
  const unread = available.filter(item => item.unread);
  const visible = selected === "unread" ? unread : available;
  const reserveMedia = items.some(item => hasFieldContent(item.media));

  useBrowserLayoutEffect(() => {
    if (viewport.current) viewport.current.scrollTop = 0;
  }, [selected]);

  useBrowserLayoutEffect(() => {
    const order = previousOrder.current;
    previousOrder.current = state === "ready" ? visible.map(item => item.id) : [];
    const previous = lastFocus.current;
    const active = previous?.ownerDocument.activeElement;
    if (!previous || (previous.isConnected && !previous.matches(":disabled")) ||
        (active !== previous && active !== previous.ownerDocument.body)) return;
    lastFocus.current = null;
    // Continue through surviving records in their earlier order, even if the host reordered the list.
    const rowId = previous.closest<HTMLElement>("[data-notification-inbox-row]")?.dataset.notificationInboxRow;
    const index = rowId === undefined ? -1 : order.indexOf(rowId);
    if (list.current && index >= 0 && previous.matches("[data-notification-read-action]")) {
      const rows = new Map(Array.from(list.current.children, row => [(row as HTMLElement).dataset.notificationInboxRow, row]));
      for (const id of [...order.slice(index+1), ...order.slice(0,index).reverse()]) {
        const action = rows.get(id)?.querySelector<HTMLButtonElement>("[data-notification-read-action]:not(:disabled)");
        if (action) {
          action.focus();
          return;
        }
      }
    }
    toggle.current?.querySelector<HTMLInputElement>("input:checked")?.focus({preventScroll:true});
  });

  let body;
  if (state === "loading") {
    body = <NotificationListSkeleton rows={loadingPlaceholder?.rows} density={density}
      label={labels.loading ?? "Loading notifications…"} reserveMediaSpace={loadingPlaceholder?.media ?? reserveMedia}
      row={{media: loadingPlaceholder?.media ?? reserveMedia, descriptionLines: loadingPlaceholder?.description ? 1 : undefined,
        metadata: loadingPlaceholder?.metadata, action: Boolean(onUnreadChange)}} />;
  } else if (state === "error") {
    body = <ErrorState density={density} layout="row" headingLevel={3}
      title={labels.error ?? "Could not load notifications."} onRetry={onRetry} retryLabel={labels.retry} retrying={retrying} />;
  } else if (visible.length > 0) {
    body = <NotificationList ref={list} label={label} density={density} reserveMediaSpace={reserveMedia}>
      {visible.map(({id, ...item}) => <NotificationItem key={id} {...item} data-notification-inbox-row={id}
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
    }}
    onBlurCapture={event => {
      if (event.relatedTarget && event.relatedTarget !== event.currentTarget.ownerDocument.body &&
          !event.currentTarget.contains(event.relatedTarget)) lastFocus.current = null;
      onBlurCapture?.(event);
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
    {listHeight === undefined ? body : <ScrollArea ref={viewport} contentInset="none" tabIndex={-1}
      className="flood-notification-inbox__viewport" style={{maxBlockSize:listHeight}}>{body}</ScrollArea>}
  </Stack>;
});
