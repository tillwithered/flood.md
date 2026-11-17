"use client";

import { DataFreshness, DataTable, Inline, SplitButton, Text, type DataFreshnessProps, type DataTableRow, type MenuRadioItem } from "@flood-md/react";

const cadences = [
  { seconds: 0, label: "Manual only" },
  { seconds: 30, label: "Every 30 seconds" },
  { seconds: 120, label: "Every 2 minutes" },
] as const;
export type RefreshCadence = typeof cadences[number]["seconds"];

export function RefreshableIncidents({ rows, refreshing, cadence, freshness, onRefresh, onCadenceChange }: {
  rows: readonly DataTableRow[];
  refreshing: boolean;
  cadence: RefreshCadence;
  freshness?: Pick<DataFreshnessProps, "state" | "updatedAt" | "relativeTo">;
  onRefresh: () => void;
  onCadenceChange: (cadence: RefreshCadence) => void;
}) {
  const items: MenuRadioItem[] = cadences.map(({ seconds, label }) => ({
    id: String(seconds), label, type: "radio", group: "cadence", checked: cadence === seconds, closeOnSelect: true,
    onCheckedChange: () => onCadenceChange(seconds),
  }));

  return <DataTable caption="Incidents" rows={rows} refreshing={refreshing} minWidth="16rem"
    columns={[{ id: "incident", label: "Incident" }, { id: "status", label: "Status" }]}
    toolbar={<Inline gap="3">
      <SplitButton label="Refresh controls" menuLabel="Refresh interval" size="sm" variant="subtle"
        items={items} primaryButtonProps={{ onClick: onRefresh, loading: refreshing ? "retain-focus" : false }}>
        Refresh
      </SplitButton>
      {cadence > 0 && <Text as="span" size="helper" tone="subtle">{cadences.find(item => item.seconds === cadence)?.label}</Text>}
      {freshness && <DataFreshness {...freshness} state={refreshing ? "refreshing" : freshness.state} />}
    </Inline>}/>;
}
