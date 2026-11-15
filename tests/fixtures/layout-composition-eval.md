# Flood layout composition evaluation

Run each prompt in a clean copy of the same Flood consumer with the same
package version, records, model and browser viewport settings. Compare the
prior and revised layout-composition material with other instructions held
constant. Keep the expected outcomes below out of the prompts. Let the agent
find the material through the ordinary Flood entry. Record which guide it
actually opened and capture the rendered result before any manual correction.

## Combined query

> Build a service-order queue in Flood. Staff usually have part of the order
> number and look it up using the customer and appointment week together.
> They occasionally change which columns are shown.

Expected layout: search, customer and week read as one group. Columns stays
with the table controls and remains reachable independently of the query.

## Search-first work area

> Build a wide Flood inventory workspace. People usually start by typing a
> SKU or item name. They occasionally limit results to a warehouse or
> stock status and change which columns they see.

Expected layout: search has its own leading anchor. Warehouse, stock status
and columns form a group at the trailing edge of the same working frame.
Where groups first collide, keep search usable and keep secondary controls
reachable through reflow or Filters. Apply and clear a filter and compare the
positions of persistent controls at the same width.

## Boundary case

> On the existing Flood queue the value “Waiting for supplier confirmation”
> is cut off inside its select. The row fits comfortably. Please fix it.

Expected layout: retain the existing group placement. Use the installed
Select contract and typography guidance to make the value readable.

For the first two cases, inspect screenshots at normal and constrained widths.
Exercise search, filtering and reset in the browser. Score discovery, grouping,
anchor stability and access to controls independently. Repeat comparable
runs before treating a single pass as a reliable improvement.
