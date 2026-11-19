# DualListSelector

Use DualListSelector when people need to compare available and assigned records before moving several at once. Use MultiSelect for a compact choice that does not need a side-by-side view. Supply stable option IDs and meaningful labels for both lists. The host controls committed membership through `value` and `onValueChange`.

Search filters only the current list and clears its temporary selections. Select all applies to enabled rows shown in that list. Move actions report the requested membership to the host. A rejected move preserves selection so the person can retry. A locked record remains on its current side. Supply `name` to submit one native form value for each assigned ID.
