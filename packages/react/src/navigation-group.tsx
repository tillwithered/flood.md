import {forwardRef} from "react";
import {Collapsible, Text} from "./index.js";

import type {NavigationGroupProps} from "./index.js";

/** Related navigation with optional presentation and an independent disclosure owner. */
export const NavigationSection = /* @__PURE__ */ forwardRef<HTMLDivElement, NavigationGroupProps>(function NavigationSection({
  label, hideLabel = false, headingAction, separator = false, collapsible = false,
  expanded, defaultExpanded = true, onExpandedChange, compact = false, size = "md", collapseDisabled = false,
  className, children, ...props
}, ref) {
  if (label !== undefined && !label.trim()) throw new Error("Flood NavigationGroup label must be nonempty when provided");
  if (collapsible && !label?.trim()) throw new Error("Flood collapsible NavigationGroup requires a nonempty label");
  const action = headingAction == null ? undefined : <div className="flood-navigation-group__action">{headingAction}</div>;
  const body = <div className="flood-navigation-group__body">{children}</div>;
  return <div {...props} ref={ref} role={label ? "group" : props.role} aria-label={props["aria-label"] ?? label}
    data-size={size} data-compact={compact || undefined} data-hide-label={hideLabel || undefined}
    data-separator={separator || undefined} data-collapsible={collapsible || undefined}
    className={["flood-navigation-group", className].filter(Boolean).join(" ")}>
    {collapsible ? <Collapsible title={label!} open={compact ? true : expanded} defaultOpen={defaultExpanded}
      onOpenChange={compact ? undefined : onExpandedChange} disabled={collapseDisabled} controlSize={size}
      headerAction={action} className="flood-navigation-group__disclosure">
      {body}
    </Collapsible> : <>
      {(!compact && label && !hideLabel || action) && <div className="flood-navigation-group__heading">
        {!compact && label && !hideLabel && <Text size="helper" tone="subtle" className="flood-navigation-group__label">{label}</Text>}
        {action}
      </div>}
      {body}
    </>}
  </div>;
});
