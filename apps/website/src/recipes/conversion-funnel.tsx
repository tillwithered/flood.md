import { BarList, EmptyState, Section, Text } from "@flood-md/react";

export interface FunnelStage {
  id: string;
  label: string;
  count: number;
}

export function ConversionFunnel({ stages, title = "Signup funnel", rate = "cohort", locale = "en" }: {
  stages: readonly FunnelStage[];
  title?: string;
  /** Rate against the starting cohort or against the previous stage. */
  rate?: "cohort" | "previous";
  locale?: string;
}) {
  if (!stages.length) return <EmptyState title="No funnel data" density="compact" layout="inline"/>;
  if (stages.some((stage, index) => !stage.id.trim() || !stage.label.trim() || !Number.isSafeInteger(stage.count) ||
    stage.count < 0 || (index > 0 && stages[index - 1].count < stage.count)) ||
    new Set(stages.map(stage => stage.id)).size !== stages.length) {
    throw new RangeError("Funnel stages require unique IDs and nonincreasing counts for the same cohort.");
  }

  const cohort = stages[0].count;
  const formatCount = new Intl.NumberFormat(locale).format;
  const formatRate = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format;
  const items = stages.map(({ id, label, count }, index) => {
    const baseline = rate === "previous" ? stages[index - 1]?.count : cohort;
    return { id, label, value: count, valueText: baseline ? `${formatCount(count)} · ${formatRate(count / baseline)}` : formatCount(count) };
  });

  return <Section title={title} description={<Text size="helper" tone="subtle">
    {rate === "previous" ? "Conversion from the previous stage" : "Share of the starting cohort"}
  </Text>}>
    <BarList label={`${title} stages`} items={items} max={Math.max(1, cohort)}/>
  </Section>;
}
