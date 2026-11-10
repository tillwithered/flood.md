import { useEffect, useRef, useState, type FormEvent } from "react";
import { Alert, Button, Dialog, Field, Inline, Input, Select, Stack } from "@flood-md/react";
import { emptyCollectionQuery, readCollectionViews, type CollectionQuery, type CollectionView } from "./recipes/collection-views-model";

type FileFilters = { format: string; team: string };

const storageKey = "flood-file-filter-preview-views-v1";
const allFiles = { id: "all", name: "All files", query: emptyCollectionQuery() };
const currentFiltersLabel = "Current filters";

function filtersFromQuery(query: CollectionQuery): FileFilters {
  return {
    format: query.conditions.find(condition => condition.property === "format")?.values[0] ?? "",
    team: query.conditions.find(condition => condition.property === "team")?.values[0] ?? "",
  };
}

function readFileViews(formats: readonly string[], teams: readonly string[]) {
  const options = (values: readonly string[]) => values.map(value => ({ value, label: value }));
  const saved = readCollectionViews(storageKey, {
    properties: [
      { id: "format", label: "Format", options: options(formats) },
      { id: "team", label: "Team", options: options(teams) },
    ],
    sortColumns: [],
  }, window.localStorage, [allFiles.name, currentFiltersLabel]);

  if (saved.state === "error" || saved.views.some(({ query }) =>
    query.search !== "" || query.match !== "all" ||
    query.conditions.some(condition => condition.operator !== "is" || condition.values.length !== 1),
  )) throw new Error("Unreadable file views");

  return saved.views;
}

export function FileSavedViews({ formats, teams, filters, onChange }: {
  formats: readonly string[];
  teams: readonly string[];
  filters: FileFilters;
  onChange: (filters: FileFilters) => void;
}) {
  const [saved, setSaved] = useState<CollectionView[]>([]);
  const [readFailed, setReadFailed] = useState(false);
  const [selectedId, setSelectedId] = useState(allFiles.id);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string>();
  const [writeFailed, setWriteFailed] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      setSaved(readFileViews(formats, teams));
    } catch {
      setReadFailed(true);
    }
  }, [formats, teams]);

  const views = [allFiles, ...saved];
  const selected = views.find(view => view.id === selectedId) ?? allFiles;
  const selectedFilters = filtersFromQuery(selected.query);
  const hasChanges = filters.format !== selectedFilters.format || filters.team !== selectedFilters.team;

  function saveView(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Enter a view name.");
      return;
    }

    setWriteFailed(false);
    try {
      const latest = readFileViews(formats, teams);
      const usedNames = [allFiles.name, currentFiltersLabel, ...latest.map(view => view.name)];
      if (usedNames.some(used => used.normalize("NFC").toLowerCase() === trimmedName.normalize("NFC").toLowerCase())) {
        setNameError("That name is already in use.");
        return;
      }
      const query = emptyCollectionQuery();
      for (const [property, value] of Object.entries(filters)) {
        if (value) query.conditions.push({ id: property, property, operator: "is", values: [value] });
      }
      const view = { id: `saved-${crypto.randomUUID()}`, name: trimmedName, query };
      const next = [...latest, view];
      window.localStorage.setItem(storageKey, JSON.stringify({ version: 1, views: next }));
      setSaved(next);
      setSelectedId(view.id);
      setOpen(false);
    } catch {
      setWriteFailed(true);
    }
  }

  return (
    <Stack gap="2">
      <Inline gap="2">
        <div className="format-filter-preview__view">
          <Select aria-label="File view" controlSize="sm" value={hasChanges ? "current" : selected.id} onChange={event => {
            const view = views.find(candidate => candidate.id === event.currentTarget.value);
            if (!view) return;
            setSelectedId(view.id);
            onChange(filtersFromQuery(view.query));
          }}>
            {hasChanges && <option value="current" disabled>{currentFiltersLabel}</option>}
            {views.map(view => <option key={view.id} value={view.id}>{view.name}</option>)}
          </Select>
        </div>
        <Dialog title="Save view" open={open} initialFocusRef={nameInput} onOpenChange={next => {
          if (next) {
            setName("");
            setNameError(undefined);
            setWriteFailed(false);
          }
          setOpen(next);
        }} trigger={props => (
          <Button {...props} variant="subtle" size="sm" disabled={readFailed || (!filters.format && !filters.team)}>Save view</Button>
        )}>
          <form onSubmit={saveView}>
            <Stack gap="4">
              <Field label="View name" required error={nameError}>{props => (
                <Input {...props} ref={nameInput} maxLength={80} value={name} onChange={event => {
                  setName(event.currentTarget.value);
                  setNameError(undefined);
                }} />
              )}</Field>
              {writeFailed && <Alert tone="error" announcement="polite">Couldn’t save the view. Try again.</Alert>}
              <Inline gap="2">
                <Button type="submit">Save view</Button>
                <Button variant="subtle" onClick={() => setOpen(false)}>Cancel</Button>
              </Inline>
            </Stack>
          </form>
        </Dialog>
      </Inline>
      {readFailed && <Alert tone="error" announcement="polite">Couldn’t load saved views.</Alert>}
    </Stack>
  );
}
