import { forwardRef } from "react";
import { IconButton, OverflowActions, Text, VisuallyHidden, type BulkActionBarProps } from "./index.js";

/** Selection owns the count; the host owns accepted record updates and focus after removal. */
export const SelectionActionBar = /* @__PURE__ */ forwardRef<HTMLDivElement, BulkActionBarProps>(function SelectionActionBar({
  label, selectionCount, selectionLabel = `${selectionCount} selected`, items, onAction, onClear,
  counter = "label", counterWidth,
  clearLabel = "Clear selection", moreLabel = "More", size = "sm", maxVisibleActions = 2,
  disabled = false, pending = false, className, ...props
}, ref) {
  if (!Number.isSafeInteger(selectionCount) || selectionCount < 0) throw new Error("Flood BulkActionBar selectionCount must be a nonnegative safe integer");
  if (!selectionLabel.trim() || !clearLabel.trim()) throw new Error("Flood BulkActionBar requires named selection and clear action");
  if (![1, 2, 3].includes(maxVisibleActions)) throw new Error("Flood BulkActionBar keeps one to three commands visible");
  if (!["label", "number", "none"].includes(counter)) throw new Error("Flood BulkActionBar counter must be label, number or none");
  if (selectionCount === 0) return null;
  return <OverflowActions {...props} ref={ref} label={label} items={items} onAction={onAction}
    moreLabel={moreLabel} size={size} variant="subtle" shape="pill" maxVisibleActions={maxVisibleActions}
    disabled={disabled || pending} aria-busy={pending || undefined}
    className={["flood-bulk-action-bar", className].filter(Boolean).join(" ")}
    leading={counter === "none" ? undefined : <Text size="compact" className="flood-bulk-action-bar__selection" data-counter={counter}
      style={counterWidth === undefined ? undefined : { inlineSize: counterWidth }} title={selectionLabel}>
      {counter === "number" ? <><span aria-hidden="true">{selectionCount}</span><VisuallyHidden>{selectionLabel}</VisuallyHidden></> : selectionLabel}
    </Text>}
    trailing={<IconButton label={clearLabel} size={size} variant="subtle" disabled={disabled || pending} onClick={onClear}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
    </IconButton>}
  />;
});
