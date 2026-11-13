import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode, type TdHTMLAttributes } from "react";
import { IconButton, type DataTableLabels, type DataTableRow } from "./index.js";
import { useLayerExitContent } from "./overlay-runtime.js";

function hasExpandedContent(row: DataTableRow) {
  return row.expandedContent != null && typeof row.expandedContent !== "boolean";
}

export function useDataTableExpansion(
  rows: readonly DataTableRow[],
  expandedIds: readonly string[] | undefined,
  defaultExpandedIds: readonly string[] | undefined,
  onExpandedChange: ((ids: string[]) => void) | undefined,
) {
  const [localExpandedIds, setLocalExpandedIds] = useState<readonly string[]>(defaultExpandedIds ?? []);
  const expanded = new Set(expandedIds ?? localExpandedIds);
  const enabled = expandedIds !== undefined || defaultExpandedIds !== undefined || rows.some(hasExpandedContent);

  function toggle(id: string) {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    const ids = [...next];
    if (expandedIds === undefined) setLocalExpandedIds(ids);
    onExpandedChange?.(ids);
  }

  return { enabled, expanded, toggle };
}

interface DataTableExpandableRowProps {
  row: DataTableRow;
  showDisclosure: boolean;
  expanded: boolean;
  colSpan: number;
  labels: DataTableLabels;
  onToggle: () => void;
  disclosureCellProps?: TdHTMLAttributes<HTMLTableCellElement>;
  viewportWidth?: number;
  disclosureWidth?: number;
  children: (disclosureCell: ReactNode) => ReactNode;
}

export function DataTableExpandableRow({ row, showDisclosure, expanded, colSpan, labels, onToggle, disclosureCellProps, viewportWidth, disclosureWidth, children }: DataTableExpandableRowProps) {
  const detailId = useId();
  const toggle = useRef<HTMLButtonElement>(null);
  const reveal = useRef<HTMLDivElement>(null);
  const detail = useRef<HTMLDivElement>(null);
  const lastFocusedDetail = useRef<Element | null>(null);
  const expandable = showDisclosure && hasExpandedContent(row);
  const open = expandable && expanded;
  const showDetail = useLayerExitContent(reveal, open, expandable, "grid-template-rows");

  useEffect(() => {
    const content = detail.current;
    const header = content?.querySelector("table")?.tHead?.rows[0];
    if (!content || !header) return;

    const alignBranch = () => {
      const bounds = content.getBoundingClientRect();
      if (!bounds.height) return;
      const heading = header.getBoundingClientRect();
      const center = (heading.top + heading.height / 2 - bounds.top) * content.offsetHeight / bounds.height;
      const value = `${center}px`;
      if (content.style.getPropertyValue("--flood-data-table-branch-target") !== value) {
        content.style.setProperty("--flood-data-table-branch-target", value);
      }
    };
    alignBranch();
    const observer = new ResizeObserver(alignBranch);
    observer.observe(content);
    observer.observe(header);
    return () => {
      observer.disconnect();
      content.style.removeProperty("--flood-data-table-branch-target");
    };
  }, [showDetail, row.expandedContent]);

  useEffect(() => {
    if (open) return;
    const previousFocus = lastFocusedDetail.current;
    lastFocusedDetail.current = null;
    const button = toggle.current;
    const active = button?.ownerDocument.activeElement;
    if (button && previousFocus && (active === button.ownerDocument.body || reveal.current?.contains(active ?? null))) {
      button.focus({ preventScroll: true });
    }
  }, [open]);

  const label = row.label ?? row.primaryAction?.title ?? row.id;
  const actionLabel = open ? labels.collapseRow ?? (name => `Collapse ${name}`) : labels.expandRow ?? (name => `Expand ${name}`);

  return <>
    {children(showDisclosure ? <td {...disclosureCellProps} data-data-table-utility="expansion"
      data-detail-visible={showDetail || undefined} className="flood-data-table__expand">
      {expandable && <IconButton ref={toggle} label={actionLabel(label)} size="sm" iconSize="xs" variant="ghost"
        className="flood-data-table__disclosure" type="button" aria-expanded={open} aria-controls={open ? detailId : undefined}
        onClick={onToggle}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </IconButton>}
    </td> : null)}
    {showDetail && <tr id={detailId} className="flood-data-table__expanded-row" aria-hidden={open ? undefined : true}
      onFocusCapture={event => {
        if (event.currentTarget.contains(event.target)) lastFocusedDetail.current = event.target;
      }}>
      <td colSpan={colSpan}>
        <div ref={reveal} className="flood-data-table__detail-reveal" data-open={open || undefined}>
          <div className="flood-data-table__detail-clip">
            <div ref={detail} className="flood-data-table__expanded-content" style={{
              maxInlineSize: viewportWidth ? `max(0px, calc(${viewportWidth}px - 2 * var(--flood-data-table-edge) - var(--flood-scroll-content-inline, 0px)))` : undefined,
              "--flood-data-table-disclosure-center": disclosureWidth === undefined ? undefined : `${disclosureWidth / 2}px`,
            } as CSSProperties}>{row.expandedContent}</div>
          </div>
        </div>
      </td>
    </tr>}
  </>;
}
