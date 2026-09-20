---
name: flood-ui-workspace
description: Design or review Flood compound workspace layouts using the approved atomic design system.
---

# Flood workspace compounds

Read docs/ui/workspace-070.md and atomic-audit-069.md. Reuse approved atomic contracts; do not invent new generic primitives unless a real compound scenario cannot be expressed.

For W-01/W-02 preserve:
- global nav / project header / content as separate hierarchy levels;
- one scroll owner per region;
- project overview without KPI-card dashboard;
- list/detail state preservation;
- narrow desktop detail replaces list with Back;
- raster brand only as a sparse accent or stable identity.

W-03 agent result review is a separate next package. Do not smuggle apply/reject semantics into the first list/detail review.
