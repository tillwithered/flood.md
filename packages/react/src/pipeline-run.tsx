import { forwardRef } from "react";
import { Collapsible, StatusIndicator, Text, type PipelineRunProps, type PipelineStageStatus, type SemanticTone } from "./index.js";

const appearance: Record<PipelineStageStatus, { label: string; tone: SemanticTone }> = {
  queued: { label: "Queued", tone: "neutral" },
  running: { label: "Running", tone: "info" },
  succeeded: { label: "Succeeded", tone: "success" },
  warning: { label: "Warning", tone: "warning" },
  failed: { label: "Failed", tone: "error" },
  skipped: { label: "Skipped", tone: "neutral" },
  canceled: { label: "Canceled", tone: "neutral" },
};

export const ExecutionStages = /* @__PURE__ */ forwardRef<HTMLDivElement, PipelineRunProps>(function ExecutionStages(
  { label, stages, statusLabels, emptyContent = <Text size="compact" tone="subtle">No stages to show.</Text>, className, ...props }, ref,
) {
  if (!label.trim() || stages.some(stage => !stage.id.trim() || !stage.label.trim()) ||
      new Set(stages.map(stage => stage.id)).size !== stages.length) {
    throw new Error("Flood PipelineRun requires a label and unique nonempty stage IDs and labels");
  }

  return <div {...props} ref={ref} className={["flood-pipeline-run", className].filter(Boolean).join(" ")}>
    {stages.length ? <ol className="flood-pipeline-run__stages" role="list" aria-label={label}>
      {stages.map(stage => {
        const { label: defaultStatus, tone } = appearance[stage.status];
        const status = statusLabels?.[stage.status] ?? defaultStatus;
        if (!status.trim() || (stage.details && !stage.details.label.trim())) {
          throw new Error("Flood PipelineRun requires readable status and disclosure labels");
        }

        return <li key={stage.id} className="flood-pipeline-run__stage">
          <Text size="label" className="flood-pipeline-run__name">{stage.label}</Text>
          <StatusIndicator label={status} tone={tone} presentation="wrap" className="flood-pipeline-run__status" />
          {stage.duration && <Text size="compact" tone="subtle" className="flood-pipeline-run__duration">{stage.duration}</Text>}
          {stage.description && <Text as="p" size="compact" tone="subtle" className="flood-pipeline-run__description">{stage.description}</Text>}
          {stage.details && <Collapsible title={stage.details.label} variant="flush" controlSize="sm" triggerWidth="fit"
            className="flood-pipeline-run__details">
            {stage.details.content}
          </Collapsible>}
        </li>;
      })}
    </ol> : emptyContent}
  </div>;
});
