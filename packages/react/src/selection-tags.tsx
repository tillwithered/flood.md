import { useState } from "react";
import { Button, type ControlSize } from "./index.js";

export interface SelectionTagDisplay {
  maxVisibleTags?: number;
  moreTagsLabel?: (hiddenCount: number) => string;
  fewerTagsLabel?: string;
}

export function useSelectionTags<T>(values: readonly T[], {
  maxVisibleTags, moreTagsLabel, fewerTagsLabel = "Show fewer",
}: SelectionTagDisplay, disabled?: boolean, onToggle?: () => void, toggleSize: ControlSize = "xs") {
  if (maxVisibleTags !== undefined && (!Number.isSafeInteger(maxVisibleTags) || maxVisibleTags < 0)) {
    throw new Error("Flood maxVisibleTags must be a nonnegative safe integer");
  }
  if (!fewerTagsLabel.trim()) throw new Error("Flood selection disclosure requires a nonempty collapse label");
  const [expanded, setExpanded] = useState(false);
  const hiddenCount = disabled || maxVisibleTags === undefined ? 0 : Math.max(0, values.length - maxVisibleTags);
  const visible = hiddenCount && !expanded ? values.slice(0, maxVisibleTags) : values;
  const overflow = hiddenCount > 0 && <Button type="button" size={toggleSize} variant="subtle"
    className="flood-selection-tags__toggle" aria-expanded={expanded}
    aria-label={expanded ? fewerTagsLabel : moreTagsLabel?.(hiddenCount)?.trim() || `Show ${hiddenCount} more`}
    onClick={() => { setExpanded(previous => !previous); onToggle?.(); }}>
    {expanded ? fewerTagsLabel : `+${hiddenCount}`}
  </Button>;
  return {visible, overflow, setExpanded};
}
