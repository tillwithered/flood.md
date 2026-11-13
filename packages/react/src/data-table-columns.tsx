import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { IconSlot, type DataTableColumn, type DataTableProps } from "./index.js";

const defaultMinWidth = 64;
const defaultMaxWidth = 960;
const columnKey = (id: string) => `column:${id}`;
const utilityKey = (id: string) => `utility:${id}`;
const validWidth = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;
function bounds(column: DataTableColumn) {
  const min = validWidth(column.minWidth) ? Math.ceil(column.minWidth) : defaultMinWidth;
  const max = validWidth(column.maxWidth) ? Math.floor(column.maxWidth) : defaultMaxWidth;
  return { min, max: Math.max(min, max) };
}
function clampWidth(value: number, { min, max }: ReturnType<typeof bounds>) {
  return Math.max(min, Math.min(max, Math.round(value)));
}
function normalizeWidths(columns: readonly DataTableColumn[], widths: DataTableProps["columnWidths"]) {
  return new Map(columns.flatMap(column => {
    const value = widths && Object.prototype.hasOwnProperty.call(widths, column.id) ? widths[column.id] : undefined;
    return column.resizable && validWidth(value) ? [[column.id, clampWidth(value, bounds(column))] as const] : [];
  }));
}
function equalWidths(a: ReadonlyMap<string, number>, b: ReadonlyMap<string, number>) {
  return a.size === b.size && [...a].every(([key, width]) => b.get(key) === width);
}

function measuredColumnWidth(header: HTMLTableCellElement) {
  const style = header.ownerDocument.defaultView?.getComputedStyle(header);
  if (!style) return header.offsetWidth;
  const inlineSize = Number.parseFloat(style.inlineSize);
  if (!Number.isFinite(inlineSize)) return header.offsetWidth;
  const borderBox = style.boxSizing === "border-box" ? inlineSize : inlineSize +
    Number.parseFloat(style.paddingInlineStart) + Number.parseFloat(style.paddingInlineEnd) +
    Number.parseFloat(style.borderInlineStartWidth) + Number.parseFloat(style.borderInlineEndWidth);
  // Avoid shaving a fraction of a pixel from untouched labels when switching to fixed tracks.
  return Math.ceil(borderBox * 100) / 100;
}

interface ColumnMetrics {
  widths: ReadonlyMap<string, number>;
  utilityKeys: readonly string[];
  viewport: number;
}

interface ResizeGesture {
  handle: HTMLDivElement;
  id: number;
  origin: number;
  width: number;
  direction: number;
  scale: number;
}

function ColumnResizeHandle({ column, label, width, disabled, onPreview, onResize }: {
  column: DataTableColumn;
  label: string;
  width: number | undefined;
  disabled: boolean;
  onPreview: (width: number | undefined) => void;
  onResize: (width: number) => void;
}) {
  const gesture = useRef<ResizeGesture | null>(null);
  const [dragging, setDragging] = useState(false);
  const limits = bounds(column);
  const direction = (node: HTMLElement) => {
    const rtl = node.ownerDocument.defaultView?.getComputedStyle(node).direction === "rtl";
    return (rtl ? -1 : 1) * (column.pinned === "end" ? -1 : 1);
  };
  const cancel = () => {
    const active = gesture.current;
    if (!active) return;
    gesture.current = null;
    if (active.handle.hasPointerCapture(active.id)) active.handle.releasePointerCapture(active.id);
    setDragging(false);
    onPreview(undefined);
  };
  useEffect(() => {
    if (disabled) cancel();
  }, [disabled]);
  useEffect(() => () => {
    if (gesture.current) onPreview(undefined);
  }, []);
  useEffect(() => {
    if (!dragging) return;
    const document = gesture.current?.handle.ownerDocument;
    const view = document?.defaultView;
    const hide = () => { if (document?.hidden) cancel(); };
    view?.addEventListener("blur", cancel);
    document?.addEventListener("visibilitychange", hide);
    return () => {
      view?.removeEventListener("blur", cancel);
      document?.removeEventListener("visibilitychange", hide);
    };
  }, [dragging]);

  const requestedWidth = (event: PointerEvent<HTMLDivElement>) => {
    const active = gesture.current;
    if (active?.id !== event.pointerId) return undefined;
    return clampWidth(active.width + (event.clientX - active.origin) * active.direction / active.scale, limits);
  };
  const value = width === undefined ? limits.min : clampWidth(width, limits);
  return <div role="separator" aria-label={label} title={label} aria-orientation="vertical" aria-valuemin={limits.min}
    aria-valuemax={limits.max} aria-valuenow={value} aria-valuetext={`${value} px`}
    tabIndex={disabled ? -1 : 0} aria-disabled={disabled || undefined}
    className="flood-data-table__resize" data-dragging={dragging || undefined}
    onKeyDown={event => {
      if (event.defaultPrevented || disabled || event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) return;
      if (event.key === "Escape" && gesture.current) {
        event.preventDefault();
        cancel();
        return;
      }
      if (gesture.current) return;
      let next: number;
      if (event.key === "Home") next = limits.min;
      else if (event.key === "End") next = limits.max;
      else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        const step = event.shiftKey ? 24 : 8;
        next = clampWidth((width ?? value) + (event.key === "ArrowRight" ? step : -step) * direction(event.currentTarget), limits);
      } else return;
      event.preventDefault();
      if (next !== width) onResize(next);
    }}
    onPointerDown={event => {
      const handle = event.currentTarget;
      const header = handle.closest("th");
      if (event.defaultPrevented || disabled || gesture.current || event.button !== 0 || !event.isPrimary || !header?.offsetWidth) return;
      try { handle.setPointerCapture(event.pointerId); } catch { return; }
      event.preventDefault();
      handle.focus({ preventScroll: true });
      gesture.current = {
        handle, id: event.pointerId, origin: event.clientX, width: header.offsetWidth,
        direction: direction(handle), scale: header.getBoundingClientRect().width / header.offsetWidth || 1,
      };
      setDragging(true);
    }}
    onPointerMove={event => {
      const next = requestedWidth(event);
      if (next !== undefined && !disabled) onPreview(event.clientX === gesture.current?.origin ? undefined : next);
    }}
    onPointerUp={event => {
      const next = requestedWidth(event);
      if (next === undefined) return;
      const moved = event.clientX !== gesture.current?.origin && next !== gesture.current?.width;
      cancel();
      if (!disabled && moved) onResize(next);
    }}
    onPointerCancel={event => { if (gesture.current?.id === event.pointerId) cancel(); }}
    onLostPointerCapture={event => { if (gesture.current?.id === event.pointerId) cancel(); }}>
    <span className="flood-data-table__resize-icon">
      <IconSlot size="sm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 12h18m-14-4-4 4 4 4m10-8 4 4-4 4" />
        </svg>
      </IconSlot>
    </span>
  </div>;
}

export function useDataTableColumnLayout(columns: readonly DataTableColumn[], visibleColumns: readonly DataTableColumn[], {
  columnWidths, defaultColumnWidths, onColumnWidthsChange, measureViewport = false,
}: Pick<DataTableProps, "columnWidths" | "defaultColumnWidths" | "onColumnWidthsChange"> & { measureViewport?: boolean }) {
  const [local, setLocal] = useState(defaultColumnWidths);
  const [draft, setDraft] = useState<{ id: string; width: number }>();
  const [metrics, setMetrics] = useState<ColumnMetrics>({ widths: new Map(), utilityKeys: [], viewport: 0 });
  const table = useRef<HTMLTableElement>(null);
  const baseline = useRef(new Map<string, number>());
  const accepted = normalizeWidths(columns, columnWidths ?? local);
  const defaults = normalizeWidths(columns, defaultColumnWidths);
  const activeDraft = draft && visibleColumns.some(column => column.resizable && column.id === draft.id) ? draft : undefined;
  const visibleSizes = new Map(visibleColumns.flatMap(column => {
    const width = activeDraft?.id === column.id ? activeDraft.width : accepted.get(column.id);
    return width === undefined ? [] : [[columnKey(column.id), width] as const];
  }));
  const active = measureViewport || columns.some(column => column.resizable || column.pinned);
  const hasSizes = visibleSizes.size > 0;
  const columnOrder = JSON.stringify(visibleColumns.map(column => column.id));

  useLayoutEffect(() => {
    const node = table.current;
    const viewport = node?.closest<HTMLElement>(".flood-scroll-area__viewport");
    const headerRow = node?.tHead?.rows[0];
    if (!active || !node || !viewport || !headerRow) return;
    let headers = Array.from(headerRow.cells);
    const measure = () => {
      const widths = new Map<string, number>();
      const utilityKeys: string[] = [];
      for (const header of headers) {
        const id = header.dataset.dataTableColumn;
        const utility = header.dataset.dataTableUtility;
        const key = id !== undefined ? columnKey(id) : utilityKey(utility ?? `unknown-${header.cellIndex}`);
        if (id === undefined) utilityKeys.push(key);
        if (header.offsetWidth === 0) continue;
        widths.set(key, header.offsetWidth);
        if (!hasSizes || !baseline.current.has(key)) baseline.current.set(key, measuredColumnWidth(header));
      }
      setMetrics(previous =>
        previous.viewport === viewport.clientWidth && equalWidths(previous.widths, widths) &&
        previous.utilityKeys.join("|") === utilityKeys.join("|")
          ? previous : { widths, utilityKeys, viewport: viewport.clientWidth });
    };
    measure();
    const Observer = node.ownerDocument.defaultView?.ResizeObserver;
    if (!Observer) return;
    const observer = new Observer(measure);
    const observeHeaders = () => {
      observer.disconnect();
      headers = Array.from(headerRow.cells);
      observer.observe(viewport);
      for (const header of headers) observer.observe(header, { box: "border-box" });
      measure();
    };
    observeHeaders();
    const HeaderObserver = node.ownerDocument.defaultView?.MutationObserver;
    const headerObserver = HeaderObserver && new HeaderObserver(observeHeaders);
    headerObserver?.observe(headerRow, { childList: true });
    return () => {
      observer.disconnect();
      headerObserver?.disconnect();
    };
  }, [active, hasSizes, columnOrder]);

  const sizes = hasSizes ? new Map([...baseline.current, ...visibleSizes]) : metrics.widths;
  const keys = [...metrics.utilityKeys, ...visibleColumns.map(column => columnKey(column.id))];
  const fixedWidth = hasSizes && keys.every(key => sizes.has(key))
    ? keys.reduce((total, key) => total + sizes.get(key)!, 0)
    : undefined;
  const start = visibleColumns.filter(column => column.pinned === "start").map(column => columnKey(column.id));
  const end = visibleColumns.filter(column => column.pinned === "end").map(column => columnKey(column.id)).reverse();
  if (start.length) start.unshift(...metrics.utilityKeys);
  const pinned = new Map<string, { edge: "start" | "end"; offset: number; boundary: boolean }>();
  const pinnedKeys = [...start, ...end];
  const pinnedWidth = pinnedKeys.reduce((total, key) => total + (metrics.widths.get(key) ?? 0), 0);
  if (pinnedKeys.every(key => metrics.widths.has(key)) && pinnedWidth + defaultMinWidth <= metrics.viewport) {
    for (const [edge, group] of [["start", start], ["end", end]] as const) {
      let offset = 0;
      group.forEach((key, index) => {
        pinned.set(key, { edge, offset, boundary: index === group.length - 1 });
        offset += metrics.widths.get(key)!;
      });
    }
  }
  function cell(key: string, header: boolean, width?: CSSProperties["width"]) {
    const pin = pinned.get(key);
    const inlineSize = header ? (fixedWidth === undefined ? width : sizes.get(key)) : undefined;
    return {
      "data-pin-edge": pin?.edge,
      "data-pin-boundary": pin?.boundary || undefined,
      style: inlineSize !== undefined || pin
        ? { inlineSize, "--flood-data-table-pin-offset": pin ? `${pin.offset}px` : undefined } as CSSProperties
        : undefined,
    };
  }
  function publish(next: Map<string, number>) {
    if (equalWidths(accepted, next)) return;
    const widths = Object.fromEntries(next);
    if (columnWidths === undefined) setLocal(widths);
    onColumnWidthsChange?.(widths);
  }
  return {
    table, fixedWidth,
    viewportWidth: metrics.viewport || undefined,
    disclosureWidth: metrics.widths.get(utilityKey("expansion")),
    atDefaults: equalWidths(accepted, defaults),
    reset: () => { setDraft(undefined); publish(defaults); },
    utilityCell: (id: string, header = false) => ({
      ...cell(utilityKey(id), header),
      "data-data-table-utility": id,
    }),
    columnCell: (column: DataTableColumn, header = false) => ({
      ...cell(columnKey(column.id), header, header ? (accepted.get(column.id) ?? column.width) : undefined),
      "data-data-table-column": column.id,
    }),
    renderHandle: (column: DataTableColumn, label: string, disabled: boolean) => column.resizable &&
      <ColumnResizeHandle column={column} label={label} disabled={disabled}
        width={visibleSizes.get(columnKey(column.id)) ?? metrics.widths.get(columnKey(column.id))}
        onPreview={width => setDraft(previous => {
          if (width === undefined) return previous?.id === column.id ? undefined : previous;
          if (previous?.id === column.id && previous.width === width) return previous;
          return { id: column.id, width };
        })}
        onResize={width => publish(new Map(accepted).set(column.id, width))}/>,
  };
}
