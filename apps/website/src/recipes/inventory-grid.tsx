"use client";

import { useMemo, useState } from "react";
import { EditableGrid, Inline, SearchInput, Select, Stack, Text, type EditableGridColumn, type EditableGridRow } from "@flood-md/react";

const quantity = (value: string) => {
  if (!/^\d+$/.test(value) || Number(value) > 1_000_000) return "Enter a quantity from 0 to 1,000,000.";
};
const columns: readonly EditableGridColumn[] = [
  {id:"name", label:"Product", width:220, resizable:true, readOnly:true},
  {id:"stock", label:"In stock", width:150, resizable:true, validate:quantity, inputMode:"numeric", align:"end"},
  {id:"reserved", label:"Reserved", width:150, resizable:true, validate:quantity, inputMode:"numeric", align:"end"},
];
const sample: readonly EditableGridRow[] = Array.from({length:1600}, (_, index) => {
  const family = ["Notebook", "Pen", "Folder", "Label roll"][index % 4];
  const label = `${family} ${Math.floor(index / 4) + 1}`;
  return {id:`sku-${index+1}`, label, values:{name:label, stock:String(index % 164), reserved:String(index % 39)}};
});

export function InventoryGrid() {
  const [rows, setRows] = useState(sample);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("source");
  const [visibleRows, totalLabel] = useMemo(() => {
    const query = filter.trim().toLocaleLowerCase("en");
    const matching = rows.filter(row => row.label?.toLocaleLowerCase("en").includes(query));
    if (sort === "stock") matching.sort((a,b)=>Number(b.values.stock)-Number(a.values.stock));
    const units = matching.reduce((total,row)=>total+Number(row.values.stock),0);
    const count = `${matching.length.toLocaleString("en")} ${matching.length === 1 ? "product" : "products"}`;
    return [matching, `${count} · ${units.toLocaleString("en")} units in stock`] as const;
  }, [rows, filter, sort]);

  return <Stack gap="3" style={{inlineSize:"44rem", maxInlineSize:"100%"}}>
    <Inline gap="2">
      <SearchInput aria-label="Filter products" placeholder="Filter products" value={filter} onChange={event=>setFilter(event.currentTarget.value)} />
      <Select aria-label="Sort products" value={sort} onChange={event=>setSort(event.currentTarget.value)}>
        <option value="source">Catalog order</option>
        <option value="stock">Highest stock</option>
      </Select>
    </Inline>
    <EditableGrid caption="Inventory" columns={columns} rows={visibleRows}
      virtualRows={{height:360}} stickyHeader pinFirstColumn onChanges={changes=>{
        const updates = new Map<string, Record<string,string>>();
        for (const change of changes) {
          updates.set(change.rowId,{...updates.get(change.rowId),[change.columnId]:change.value});
        }
        setRows(current=>current.map(row=>{
          const values=updates.get(row.id);
          return values ? {...row,values:{...row.values,...values}} : row;
        }));
      }} />
    <Text role="status" size="helper" tone="subtle">{totalLabel}</Text>
  </Stack>;
}
