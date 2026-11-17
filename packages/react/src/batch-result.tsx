import { forwardRef } from "react";
import { Button, DataList, DataListItem, Inline, Link, Section, Stack, StatusIndicator, Text,
  type BatchResultItem, type BatchResultProps, type BatchResultStatus, type SemanticTone } from "./index.js";

const outcomes: readonly BatchResultStatus[] = ["succeeded", "failed", "skipped"];
const appearance: Record<BatchResultStatus, { label: string; tone: SemanticTone }> = {
  succeeded: { label: "Succeeded", tone: "success" },
  failed: { label: "Failed", tone: "error" },
  skipped: { label: "Skipped", tone: "neutral" },
};

export const BatchResultPanel = /* @__PURE__ */ forwardRef<HTMLElement, BatchResultProps>(function BatchResultPanel(
  { items, onRetry, retryPending = false, showSucceeded = false, labels, headingSize = "group", ...props }, ref,
) {
  const ids = new Set(items.map(item => item.id));
  if (ids.size !== items.length || items.some(item => !item.id.trim() || !item.label.trim())) {
    throw new Error("Flood BatchResult requires unique item IDs and readable item labels");
  }
  const totals: Record<BatchResultStatus, number> = { succeeded: 0, failed: 0, skipped: 0 };
  const retryIds: string[] = [];
  const details: BatchResultItem[] = [];
  for (const item of items) {
    totals[item.status] += 1;
    if (item.status === "failed" && item.retryable) retryIds.push(item.id);
    if (showSucceeded || item.status !== "succeeded") details.push(item);
  }
  const retry = onRetry && retryIds.length ? <Button size="sm" variant="subtle"
    loading={retryPending ? "retain-focus" : false}
    onClick={() => onRetry(retryIds)}>
    {labels?.retry?.(retryIds.length) ?? `Retry (${retryIds.length})`}
  </Button> : undefined;

  return <Section {...props} ref={ref} headingSize={headingSize} actions={retry}>
    {items.length ? <Stack gap="2">
      <Inline gap="3">
        {outcomes.filter(status => totals[status] > 0).map(status => <StatusIndicator key={status} size="sm"
          tone={appearance[status].tone} presentation="wrap"
          label={labels?.count?.(status, totals[status]) ?? `${totals[status]} ${status}`} />)}
      </Inline>
      {details.length > 0 && <DataList className="flood-batch-result__items"
        aria-label={labels?.details ?? (showSucceeded ? "Item results" : "Items not completed")}
        density="compact" dividers={false}>
        {details.map(item => <DataListItem key={item.id} layout="content"
          title={item.href ? <Link href={item.href}>{item.label}</Link> : item.label}
          description={item.reason}
          metadata={<StatusIndicator size="sm" presentation="wrap" tone={appearance[item.status].tone}
            label={onRetry && item.status === "failed" && item.retryable ? labels?.retryable ?? "Can retry"
              : labels?.status?.[item.status] ?? appearance[item.status].label} />} />)}
      </DataList>}
    </Stack> : <Text as="p" size="compact" tone="subtle">{labels?.empty ?? "No item results yet."}</Text>}
  </Section>;
});
