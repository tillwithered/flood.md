"use client";

import { useState } from "react";
import {
  Button, Container, EditableGrid, Fieldset, FormActions, Grid, PageHeader, SaveStatus, Stack, Surface, TagInput,
  type EditableGridChange, type EditableGridColumn, type EditableGridRow,
} from "@flood-md/react";

type Dimensions = { colors: readonly string[]; sizes: readonly string[] };
const initialDimensions: Dimensions = { colors: ["Slate", "Sand"], sizes: ["S", "M", "L"] };
const editableColumns = ["sku", "price", "stock"];
const optionKey = (option: string) => option.trim().normalize("NFKC").toLowerCase();
const optionSku = (option: string) => optionKey(option).toUpperCase().replace(/[^A-Z0-9]+/g, "-").slice(0, 8);
const stockBySize: Record<string, string> = { s: "18", m: "6", l: "12" };

function matrix(dimensions: Dimensions, prior: readonly EditableGridRow[]) {
  const byId = new Map(prior.map(row => [row.id, row]));
  return dimensions.colors.flatMap(color => dimensions.sizes.map(size => {
    // The example uses canonical option values as keys. A host with renameable options supplies stable option IDs.
    const colorId = optionKey(color), sizeId = optionKey(size);
    const id = JSON.stringify([colorId, sizeId]);
    const label = `${color}, ${size}`;
    if (colorId === "sand" && sizeId === "xl") {
      return { id, label: `${label}, unavailable`, readOnlyColumns: editableColumns,
        values: { color, size: `${size} · unavailable`, sku: "—", price: "—", stock: "—" } };
    }
    const previous = byId.get(id);
    return { id, label, values: {
      sku: `CT-${optionSku(color)}-${optionSku(size)}`, price: "38.00", stock: stockBySize[sizeId] ?? "0",
      ...previous?.values, color, size,
    } };
  }));
}

const initialRows: readonly EditableGridRow[] = matrix(initialDimensions, []);

const columns: readonly EditableGridColumn[] = [
  { id: "color", label: "Color", readOnly: true },
  { id: "size", label: "Size", readOnly: true },
  { id: "sku", label: "SKU", validate: value => /^[a-z0-9-]{1,24}$/i.test(value.trim())
    ? undefined : "Enter 1–24 letters, numbers, or hyphens for the SKU." },
  { id: "price", label: "Price (USD)", align: "end", inputMode: "decimal",
    validate: value => /^\d{1,9}(?:\.\d{1,2})?$/.test(value.trim())
      ? undefined : "Enter a price with up to two decimal places." },
  { id: "stock", label: "Stock", align: "end", inputMode: "numeric",
    validate: value => /^\d{1,9}$/.test(value.trim()) ? undefined : "Enter a whole number from 0 to 999,999,999." },
];

function normalize(column: string, input: string) {
  const value = input.trim();
  if (column === "sku") return value.toUpperCase();
  if (column === "stock") return BigInt(value).toString();
  if (column === "price") {
    const [whole, fraction = ""] = value.split(".");
    return `${BigInt(whole)}.${fraction.padEnd(2, "0")}`;
  }
  return value;
}

function applyChanges(rows: readonly EditableGridRow[], batch: readonly EditableGridChange[]):
  { rows: EditableGridRow[] } | { error: string } {
  const complete = new Map<string, Record<string, string>>();
  for (const change of batch) {
    const row = rows.find(item => item.id === change.rowId);
    if (!row || row.values[change.columnId] !== change.previousValue) {
      return { error: "A variant changed while you were editing. Check its current value." };
    }
    const values = complete.get(row.id) ?? { ...row.values };
    values[change.columnId] = normalize(change.columnId, change.value);
    complete.set(row.id, values);
  }
  const result = rows.map(row => {
    const values = complete.get(row.id);
    return values ? { ...row, values } : row;
  });
  const error = duplicateSku(result);
  return error ? { error } : { rows: result };
}

function duplicateSku(rows: readonly EditableGridRow[]) {
  const seen = new Set<string>();
  for (const row of rows) {
    if (row.readOnlyColumns?.includes("sku")) continue;
    if (seen.has(row.values.sku)) return `SKU ${row.values.sku} is already used by another variant.`;
    seen.add(row.values.sku);
  }
}

export function ProductVariants() {
  const [accepted, setAccepted] = useState({ dimensions: initialDimensions, rows: initialRows });
  const [dimensions, setDimensions] = useState(initialDimensions);
  const [draft, setDraft] = useState(initialRows);
  const [saved, setSaved] = useState(false);
  const dirty = JSON.stringify(dimensions) !== JSON.stringify(accepted.dimensions) ||
    draft.some((row, index) => columns.some(column => row.values[column.id] !== accepted.rows[index]?.values[column.id]));
  const skuConflict = duplicateSku(draft);
  const eligible = draft.filter(row => !row.readOnlyColumns).length;

  function changeOptions(axis: keyof Dimensions, options: string[]) {
    const unique = new Map(options.map(option => [optionKey(option), option]));
    const next = { ...dimensions, [axis]: [...unique.values()] };
    setDimensions(next);
    setDraft(matrix(next, draft));
    setSaved(false);
  }

  function change(batch: readonly EditableGridChange[]) {
    const proposal = applyChanges(draft, batch);
    if ("error" in proposal) return proposal.error;
    setDraft(proposal.rows);
    setSaved(false);
  }

  return <Container size="md" gutter="4">
    <Stack gap="6">
      <PageHeader title="Canvas tote" metadata={`${eligible} ${eligible === 1 ? "variant" : "variants"}`} headingSize="page" />
      <Surface elevation="raised" padding="4">
        <Stack gap="4">
          <Fieldset legend="Options" legendSize="section">
            <Grid maxColumns={2} minItemWidth="12rem" gap="4">
              <TagInput label="Colors" placeholder="Add a color" value={dimensions.colors}
                onValueChange={options => changeOptions("colors", options)} />
              <TagInput label="Sizes" placeholder="Add a size" value={dimensions.sizes}
                onValueChange={options => changeOptions("sizes", options)} />
            </Grid>
          </Fieldset>
          <EditableGrid caption="Product variants" hideCaption density="compact"
            columns={columns} rows={draft} onChanges={change} labels={{empty:"Add a color and a size to create variants."}} />
          <FormActions status={<SaveStatus state={skuConflict ? "error" : dirty ? "dirty" : saved ? "saved" : "idle"} label={skuConflict} />}
            secondary={<Button variant="subtle" disabled={!dirty} onClick={() => {
              setDimensions(accepted.dimensions); setDraft(accepted.rows); setSaved(false);
            }}>Discard changes</Button>}
            primary={<Button disabled={!dirty || !eligible || Boolean(skuConflict)} onClick={() => {
              setAccepted({ dimensions, rows: draft }); setSaved(true);
            }}>Save variants</Button>} />
        </Stack>
      </Surface>
    </Stack>
  </Container>;
}
