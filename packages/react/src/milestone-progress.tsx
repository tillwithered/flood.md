import {forwardRef} from "react";
import {Link, ProgressRing, Text, type MilestoneProgressProps} from "./index.js";

export const MilestoneWorkSummary = /* @__PURE__ */ forwardRef<HTMLDivElement, MilestoneProgressProps>(
  function MilestoneWorkSummary({
    name, completed, total, href, dueDate, formatProgress, emptyLabel, className, ...props
  }, ref) {
    if (!name.trim() || !Number.isSafeInteger(completed) || !Number.isSafeInteger(total) || completed < 0 || completed > total) {
      throw new Error("Flood MilestoneProgress requires a named milestone and whole counts from zero through total");
    }
    const progress = total === 0 ? emptyLabel : formatProgress?.(completed, total) ?? `${completed} of ${total} complete`;
    const tone = total === 0 ? "neutral" : completed === total ? "success" : "accent";

    return <div {...props} ref={ref} className={["flood-milestone-progress", className].filter(Boolean).join(" ")}>
      <ProgressRing aria-hidden="true" label={name} size="sm" hideLabel
        value={completed} max={total || 1} tone={tone} />
      <div className="flood-milestone-progress__body">
        {href ? <Link href={href} className="flood-milestone-progress__name">{name}</Link>
          : <Text size="label" className="flood-milestone-progress__name">{name}</Text>}
        <div className="flood-milestone-progress__facts">
          {dueDate && <Text size="helper" tone="subtle">
            <time dateTime={dueDate.dateTime}>{dueDate.label}</time>
          </Text>}
          <Text size="helper" tone="subtle" className="flood-milestone-progress__amount">{progress}</Text>
        </div>
      </div>
    </div>;
  },
);
