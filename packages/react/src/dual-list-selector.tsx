import { forwardRef, useEffect, useRef, useState, type HTMLAttributes } from "react";
import { Button, Checkbox, Grid, Inline, ListBox, SearchInput, Stack, Surface, Text, type ComboboxOption } from "./index.js";

export interface DualListSelectorLabels {
  available: string;
  assigned: string;
  searchAvailable: string;
  searchAssigned: string;
  clearSearch: string;
  selectAll: string;
  add: string;
  remove: string;
}

export interface DualListSelectorProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onChange"> {
  label: string;
  options: readonly ComboboxOption[];
  /** The IDs committed to the assigned list. */
  value: readonly string[];
  onValueChange: (value: string[]) => void;
  disabled?: boolean;
  labels?: Partial<DualListSelectorLabels>;
  /** If supplied, contribute one value per assigned ID to the native form. */
  name?: string;
  form?: string;
}

type Side = "available" | "assigned";
const defaultLabels: DualListSelectorLabels = {
  available: "Available",
  assigned: "Assigned",
  searchAvailable: "Search available",
  searchAssigned: "Search assigned",
  clearSearch: "Clear search",
  selectAll: "Select all shown",
  add: "Add selected",
  remove: "Remove selected",
};

/** Transfer selected records between two lists without owning their committed membership. */
export const DualListSelector = /* @__PURE__ */ forwardRef<HTMLDivElement, DualListSelectorProps>(function DualListSelector(
  { label, options, value, onValueChange, disabled = false, labels, name, form, ...props }, ref,
) {
  const text = { ...defaultLabels, ...labels };
  const [filters, setFilters] = useState({ available: "", assigned: "" });
  const [highlighted, setHighlighted] = useState<Record<Side, string[]>>({ available: [], assigned: [] });
  const availableRef = useRef<HTMLDivElement>(null);
  const assignedRef = useRef<HTMLDivElement>(null);
  const assigned = new Set(value);

  useEffect(() => {
    const committed = new Set(value);
    setHighlighted(current => {
      const available = current.available.filter(id => !committed.has(id));
      const assigned = current.assigned.filter(id => committed.has(id));
      if (available.length === current.available.length && assigned.length === current.assigned.length) return current;
      return { available, assigned };
    });
  }, [value]);

  function pane(side: Side) {
    const isAssigned = side === "assigned";
    const searchLabel = isAssigned ? text.searchAssigned : text.searchAvailable;
    const query = filters[side].trim().toLocaleLowerCase(props.lang);
    const visible = options.filter(option => assigned.has(option.value) === isAssigned &&
      (!query || [option.label, option.description, ...(option.keywords ?? [])].some(term => term?.toLocaleLowerCase(props.lang).includes(query))));
    const enabled = visible.filter(option => !option.disabled).map(option => option.value);
    const selected = enabled.filter(id => highlighted[side].includes(id));
    const allSelected = enabled.length > 0 && selected.length === enabled.length;
    const listRef = isAssigned ? assignedRef : availableRef;

    function updateSelection(ids: string[]) {
      setHighlighted(current => ({ ...current, [side]: ids }));
    }

    function transfer() {
      if (!selected.length || disabled) return;
      const next = isAssigned ? [...assigned].filter(id => !selected.includes(id)) : [...assigned, ...selected];
      onValueChange(next);
      listRef.current?.focus({ preventScroll: true });
    }

    return <Surface padding="3" elevation="raised" style={{ minInlineSize: 0 }}>
      <Stack gap="2">
        <Inline align="baseline" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <Text size="label">{text[side]}</Text>
          <Text size="helper" tone="subtle">{visible.length.toLocaleString(props.lang)}</Text>
        </Inline>
        <SearchInput controlSize="sm" aria-label={searchLabel} placeholder={searchLabel} clearLabel={text.clearSearch}
          disabled={disabled} value={filters[side]} onChange={event => {
            const next = event.currentTarget.value;
            setFilters(current => ({ ...current, [side]: next }));
            updateSelection([]);
          }} />
        <ListBox ref={listRef} label={text[side]} hideLabel options={visible} value={selected} multiple disabled={disabled} controlSize="sm"
          style={{ blockSize: "12rem" }} onValueChange={ids => { if (Array.isArray(ids)) updateSelection(ids); }} />
        <Inline gap="2" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <Checkbox label={text.selectAll} checked={allSelected} indeterminate={selected.length > 0 && !allSelected}
            disabled={disabled || !enabled.length} onChange={() => updateSelection(allSelected ? [] : enabled)} />
          <Button type="button" size="sm" variant="outline" disabled={disabled || !selected.length} onClick={transfer}>
            {isAssigned ? text.remove : text.add}
          </Button>
        </Inline>
      </Stack>
    </Surface>;
  }

  return <Grid {...props} ref={ref} role="group" aria-label={label} maxColumns={2} minItemWidth="17rem" gap="3">
    {pane("available")}
    {pane("assigned")}
    {name && [...assigned].map(id => <input key={id} type="hidden" name={name} form={form} value={id} disabled={disabled} />)}
  </Grid>;
});
