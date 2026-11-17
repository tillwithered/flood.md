import { forwardRef } from "react";
import { Collapsible, DataList, DataListItem, Inline, StatusIndicator, Text, Timestamp,
  type DeliveryAttemptsProps, type DeliveryAttemptStatus, type SemanticTone } from "./index.js";
import { parseInstant } from "./timestamp.js";

const appearance: Record<DeliveryAttemptStatus, { label: string; tone: SemanticTone }> = {
  pending: { label: "Pending", tone: "info" },
  delivered: { label: "Delivered", tone: "success" },
  failed: { label: "Failed", tone: "error" },
};

export const DeliveryAttemptList = /* @__PURE__ */ forwardRef<HTMLDivElement, DeliveryAttemptsProps>(function DeliveryAttemptList(
  { label, attempts, timeZone = "UTC", lang = "en", statusLabels, formatAttemptLabel = number => `Attempt ${number}`,
    retryAction, emptyContent = <Text size="compact" tone="subtle">No delivery attempts yet.</Text>, className, ...props }, ref,
) {
  if (!label.trim() || attempts.some(attempt => !attempt.id.trim() || !Number.isSafeInteger(attempt.number) || attempt.number < 1) ||
      new Set(attempts.map(attempt => attempt.id)).size !== attempts.length ||
      new Set(attempts.map(attempt => attempt.number)).size !== attempts.length) {
    throw new Error("Flood DeliveryAttempts requires a label and unique IDs and positive attempt numbers");
  }
  const timeFormat = new Intl.DateTimeFormat(lang, { dateStyle: "medium", timeStyle: "medium", timeZone });

  return <div {...props} lang={lang} ref={ref} className={["flood-delivery-attempts", className].filter(Boolean).join(" ")}>
    {attempts.length ? <DataList density="compact" aria-label={label}>
      {attempts.map(attempt => {
        const { label: defaultStatus, tone } = appearance[attempt.status];
        const status = statusLabels?.[attempt.status] ?? defaultStatus;
        const title = formatAttemptLabel(attempt.number);
        const instant = parseInstant(attempt.dateTime, "DeliveryAttempts");
        const time = attempt.timeLabel ?? timeFormat.format(instant);
        if (!status.trim() || !title.trim() || !time.trim() || (attempt.details && !attempt.details.label.trim())) {
          throw new Error("Flood DeliveryAttempts requires readable outcome, attempt, time and disclosure labels");
        }

        return <DataListItem key={attempt.id} layout="content"
          title={<Inline gap="2" align="baseline" className="flood-delivery-attempts__heading">
            <Text size="label">{title}</Text>
            <Timestamp dateTime={attempt.dateTime} lang={lang}>{time}</Timestamp>
          </Inline>}
          description={<Inline gap="2" align="baseline" className="flood-delivery-attempts__summary">
            <StatusIndicator label={status} tone={tone} presentation="wrap" />
            {attempt.response && <Text size="compact" tone="subtle">{attempt.response}</Text>}
          </Inline>}
          details={attempt.details && <Collapsible title={attempt.details.label} variant="flush" controlSize="sm" triggerWidth="fit">
            {attempt.details.content}
          </Collapsible>} />;
      })}
    </DataList> : emptyContent}
    {retryAction != null && <Inline className="flood-delivery-attempts__retry">{retryAction}</Inline>}
  </div>;
});
