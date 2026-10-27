import {forwardRef, useEffect, useId, useImperativeHandle, useRef} from "react";
import type {ErrorSummaryProps} from "./index.js";
import {Alert, Link, List, Text} from "./index.js";
import {hasFieldContent, mergeDescriptions} from "./field-state.js";

/** A host-owned validation summary; errors are never inferred from the form. */
export const ValidationErrorSummary = /* @__PURE__ */ forwardRef<HTMLDivElement, ErrorSummaryProps>(function ValidationErrorSummary({
  title, errors, description, announcement = "off", autoFocus = false, onSelect,
  className, id: explicitId, tabIndex = -1, "aria-labelledby": labelledBy,
  "aria-describedby": describedBy, ...props
}, forwardedRef) {
  if (!title.trim()) throw new Error("Flood ErrorSummary requires a nonempty title");
  if (errors.some(error => !error.id.trim() || !error.fieldId.trim() || !error.message.trim()) || new Set(errors.map(error => error.id)).size !== errors.length)
    throw new Error("Flood ErrorSummary requires unique nonempty error IDs, target IDs and messages");
  if (!["off", "polite", "assertive"].includes(announcement)) throw new Error("Flood ErrorSummary announcement is unsupported");
  const generated = useId(), id = explicitId ?? `flood-error-summary-${generated}`;
  const root = useRef<HTMLDivElement>(null), present = errors.length > 0;
  useImperativeHandle(forwardedRef, () => root.current!, [present]);
  const hasDescription = hasFieldContent(description), descriptionId = hasDescription ? `${id}-description` : undefined;
  const live = autoFocus ? "off" : announcement;
  useEffect(() => {
    if (autoFocus && present) root.current?.focus({preventScroll:true});
  }, [autoFocus, present]);
  if (!present) return null;
  return <div {...props} id={id} ref={root} role="region" tabIndex={tabIndex}
    aria-labelledby={labelledBy ?? `${id}-title`} aria-describedby={mergeDescriptions(describedBy, descriptionId)}
    aria-live={live === "off" ? undefined : live} aria-atomic={live === "off" ? undefined : true}
    className={["flood-error-summary", className].filter(Boolean).join(" ")}>
    <Alert tone="error" announcement="off">
      <Text as="div" size="label" id={`${id}-title`} className="flood-error-summary__title">{title}</Text>
      {hasDescription && <Text as="div" size="compact" tone="subtle" id={descriptionId} className="flood-error-summary__description">{description}</Text>}
      <List gap="1" className="flood-error-summary__list">
        {errors.map(error => <li key={error.id}><Link href={`#${encodeURIComponent(error.fieldId)}`} onClick={event => {
          onSelect?.(error, event);
          if (event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
          const document = event.currentTarget.ownerDocument, target = document.getElementById(error.fieldId);
          if (!target || typeof target.focus !== "function" || target.matches(":disabled") || target.closest("[inert]")) return;
          const before = document.activeElement;
          target.focus({preventScroll:true});
          const focused = document.activeElement;
          // Hidden native bridges can redirect focus to their visible Flood control.
          if (focused && focused !== before && focused !== event.currentTarget && "scrollIntoView" in focused)
            focused.scrollIntoView({block:"nearest", behavior:"auto"});
          // Keep native fragment navigation and modifier/new-tab behavior intact.
        }}>{error.message}</Link></li>)}
      </List>
    </Alert>
  </div>;
});
