"use client";

import { useRef, type ReactNode } from "react";
import { Alert, Button, EmptyState, ListBox, Section, Split } from "@flood-md/react";

export interface LocationRecord {
  id: string;
  name: string;
  address: string;
  /** Geographic coordinates in longitude, latitude order. */
  coordinates: readonly [longitude: number, latitude: number];
}

export interface LocationMapAdapter {
  locations: readonly LocationRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function MapAndList({ locations, selectedId, onSelectionChange, renderMap }: {
  /** The host's accepted search results. */
  locations: readonly LocationRecord[];
  selectedId: string | null;
  onSelectionChange: (id: string | null, source: "list" | "map") => void;
  renderMap?: (adapter: LocationMapAdapter) => ReactNode;
}) {
  const results = useRef<HTMLDivElement>(null);
  const selected = locations.find(location => location.id === selectedId);
  const list = <Section title="Locations" actions={<Button size="sm" variant="ghost" disabled={!selected}
    aria-hidden={!selected} style={{ visibility: selected ? undefined : "hidden" }} onClick={() => {
      results.current?.focus({ preventScroll: true });
      onSelectionChange(null, "list");
    }}>Clear selection</Button>}>
    {locations.length ? <ListBox ref={results} label="Location results" hideLabel appearance="plain" controlSize="sm"
      selectionBehavior="manual" value={selected?.id ?? ""}
      options={locations.map(location => ({ value: location.id, label: location.name, description: location.address }))}
      onValueChange={id => { if (typeof id === "string" && id !== selected?.id) onSelectionChange(id, "list"); }}/>
      : <EmptyState title="No matching locations" headingLevel={3} density="compact" layout="inline"/>}
  </Section>;

  return <Split gap="6" collapseAt="md" ratio="aside" main={list} aside={renderMap
    ? renderMap({ locations, selectedId: selected?.id ?? null, onSelect: id => {
      if (locations.some(location => location.id === id)) onSelectionChange(id, "map");
    } })
    : <Alert appearance="inline" tone="neutral">Map unavailable.</Alert>}/>;
}
