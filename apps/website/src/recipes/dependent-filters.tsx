"use client";

import { useEffect, useState } from "react";
import { Alert, Button, CollectionToolbar, Field, Inline, Select, Stack } from "@flood-md/react";

interface Site {
  id: string;
  label: string;
}

interface Region {
  id: string;
  label: string;
  sites: readonly Site[];
  sitesState?: "loading" | "ready" | "error";
}

export interface SiteFilters {
  regionId: string;
  siteId: string;
}

const noFilters: SiteFilters = { regionId: "", siteId: "" };

export function DependentFilters({ regions, filters, onFiltersChange, search, onSearchChange, onLoadSites }: {
  regions: readonly Region[];
  filters: SiteFilters;
  onFiltersChange: (filters: SiteFilters) => void;
  search: string;
  onSearchChange: (search: string) => void;
  /** The host loads or retries sites for this region and updates its entry by ID. */
  onLoadSites?: (regionId: string) => void;
}) {
  const [editing, setEditing] = useState<{ baseline: SiteFilters; value: SiteFilters } | null>(null);
  const activeDraft = editing?.baseline.regionId === filters.regionId && editing.baseline.siteId === filters.siteId
    ? editing.value : null;
  useEffect(() => {
    if (editing && !activeDraft) setEditing(null);
  }, [activeDraft, editing]);
  const draft = activeDraft ?? filters;
  const selectedRegion = regions.find(region => region.id === draft.regionId);
  const selectedSite = selectedRegion?.sites.find(site => site.id === draft.siteId);
  const sitesLoading = selectedRegion?.sitesState === "loading";
  const sitesFailed = selectedRegion?.sitesState === "error";
  const acceptedRegion = regions.find(region => region.id === filters.regionId);
  const acceptedSite = acceptedRegion?.sites.find(site => site.id === filters.siteId);
  const canApply = !sitesLoading && !sitesFailed && (!draft.regionId || Boolean(selectedRegion));
  const siteHint = !selectedRegion ? "Choose a region first."
    : sitesLoading ? "Loading sites…" : sitesFailed ? undefined
    : !selectedRegion.sites.length ? "No sites in this region." : undefined;

  useEffect(() => {
    if (!activeDraft?.siteId || selectedSite || !selectedRegion || sitesLoading || sitesFailed) return;
    setEditing(current => current?.value === activeDraft && current
      ? { ...current, value: { ...activeDraft, siteId: "" } }
      : current);
  }, [activeDraft, selectedRegion, selectedSite, sitesLoading, sitesFailed]);

  function updateDraft(value: SiteFilters) {
    setEditing(current => current && { ...current, value });
  }

  return <CollectionToolbar label="Deployment filters" searchLabel="Search deployments"
    searchValue={search} onSearchValueChange={onSearchChange}
    appliedFilters={[
      ...(acceptedRegion ? [{ id: "region", label: `Region: ${acceptedRegion.label}`, removeLabel: "Remove region and site filters" }] : []),
      ...(acceptedSite ? [{ id: "site", label: `Site: ${acceptedSite.label}`, removeLabel: "Remove site filter" }] : []),
    ]}
    onRemoveFilter={id => onFiltersChange(id === "region" ? noFilters : { ...filters, siteId: "" })}
    canClear={Boolean(filters.regionId || filters.siteId)} onClear={() => onFiltersChange(noFilters)}
    filtersOpen={activeDraft !== null}
    onFiltersOpenChange={open => setEditing(open ? { baseline: filters, value: filters } : null)}
    filterContent={<form onSubmit={event => {
      event.preventDefault();
      if (canApply && activeDraft) {
        setEditing(null);
        onFiltersChange({ ...activeDraft, siteId: selectedSite?.id ?? "" });
      }
    }}><Stack gap="4">
      <Field label="Region">{field => <Select {...field} controlSize="sm" value={selectedRegion?.id ?? ""}
        onChange={event => {
          const regionId = event.currentTarget.value;
          const region = regions.find(option => option.id === regionId);
          const preserve = region && (region.sitesState === "loading" || region.sitesState === "error"
            || region.sites.some(site => site.id === draft.siteId));
          updateDraft({ regionId, siteId: preserve ? draft.siteId : "" });
          if (regionId) onLoadSites?.(regionId);
        }}>
        <option value="">All regions</option>
        {regions.map(region => <option key={region.id} value={region.id}>{region.label}</option>)}
      </Select>}</Field>
      <Field label="Site" hint={siteHint}>
        {field => <Select {...field} controlSize="sm" value={selectedSite?.id ?? ""} disabled={sitesLoading || sitesFailed || !selectedRegion?.sites.length}
          onChange={event => updateDraft({ ...draft, siteId: event.currentTarget.value })}>
          <option value="">All sites</option>
          {selectedRegion?.sites.map(site => <option key={site.id} value={site.id}>{site.label}</option>)}
        </Select>}
      </Field>
      {sitesFailed && <Alert tone="error" appearance="inline"
        action={onLoadSites && <Button size="sm" variant="ghost" onClick={() => onLoadSites(draft.regionId)}>Retry</Button>}>
        Could not load sites.
      </Alert>}
      {draft.regionId && !selectedRegion && <Alert tone="warning" appearance="inline">Choose an available region.</Alert>}
      <Inline gap="2">
        <Button type="submit" size="sm" disabled={!canApply}>Apply filters</Button>
        <Button size="sm" variant="subtle" onClick={() => setEditing(null)}>Cancel</Button>
      </Inline>
    </Stack></form>}/>;
}
