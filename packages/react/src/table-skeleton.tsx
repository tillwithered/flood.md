import {forwardRef} from "react";
import {Skeleton, Table, TruncatedText, VisuallyHidden, type TableSkeletonProps} from "./index.js";

export function CellPlaceholder({align, lines = 1, wide = false, animate = true}: {
  align?: "start" | "center" | "end";
  lines?: 1 | 2;
  wide?: boolean;
  animate?: boolean;
}) {
  return <div className="flood-table-placeholder" data-align={align}>
    <span className="flood-table-placeholder__line">
      <Skeleton width={align === "end" ? "48%" : wide ? "76%" : "62%"} animate={animate} />
    </span>
    {lines === 2 && <span className="flood-table-placeholder__line flood-table-placeholder__line--secondary">
      <Skeleton width="40%" animate={animate} />
    </span>}
  </div>;
}

type ResolvedSkeletonProps = TableSkeletonProps & Required<Pick<TableSkeletonProps, "rows" | "announce" | "loadingLabel" | "animate">>;

export const SkeletonTable = /* @__PURE__ */ forwardRef<HTMLTableElement, ResolvedSkeletonProps>(function SkeletonTable(
  {columns, rows, announce, loadingLabel, animate, hidden, className, style, ...props}, ref,
) {
  if (!Number.isSafeInteger(rows) || rows < 1 || !columns.length || !loadingLabel.trim()) {
    throw new Error("Flood TableSkeleton requires columns, a positive row count and a loading label");
  }
  const ids = new Set<string>();
  for (const column of columns) {
    if (!column.id.trim() || !column.label.trim() || ids.has(column.id)) {
      throw new Error("Flood TableSkeleton needs unique column IDs and nonempty labels");
    }
    ids.add(column.id);
  }
  return <>
    {announce && !hidden && <VisuallyHidden role="status">{loadingLabel}</VisuallyHidden>}
    <Table {...props} ref={ref} hidden={hidden} aria-busy="true"
      className={["flood-table-skeleton", className].filter(Boolean).join(" ")} style={{tableLayout:"fixed", ...style}}>
      <colgroup>{columns.map(column => <col key={column.id} style={{width:column.width}} />)}</colgroup>
      <thead><tr>{columns.map(column => <th key={column.id} scope="col" data-align={column.align}>
        <TruncatedText>{column.label}</TruncatedText>
      </th>)}</tr></thead>
      <tbody>{Array.from({length:rows}, (_, index) => <tr key={index} aria-hidden="true">
        {columns.map((column, order) => <td key={column.id}>
          <CellPlaceholder align={column.align} lines={column.placeholderLines} wide={(index + order) % 3 === 0} animate={animate} />
        </td>)}
      </tr>)}</tbody>
    </Table>
  </>;
});
