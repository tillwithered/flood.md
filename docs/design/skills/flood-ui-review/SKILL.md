---
name: flood-ui-review
description: Audit flood.md UI against its approved design contract and verify an implemented slice in Tauri. Use for visual or interaction review, regression checks and acceptance decisions; a review request alone does not authorize fixes.
---

# Flood UI review

Complete [the bootstrap](../../agent-contract.md#bootstrap). Load the affected [rule rows](../../rule-matrix.md), [component contracts](../../components.md), [flow recipes](../../flows.md) and [verification matrix](../../verification.md). Identify the code revision/working-tree state being reviewed. Historical specimen images are not observations of that revision.

## Inspect the full user decision

Start with the principal job on a realistic populated screen, then its empty and recovery states. Compare with [Quiet Workbench](../../quiet-workbench.md) and [progressive disclosure](../../principles.md#progressive-disclosure-matrix). Assess hierarchy, duplication, next action and return path before cosmetic details.

For each issue capture: scenario and trigger; expected contract/rule ID; observed behavior; user impact; evidence; severity. Separate a measured defect from a hypothesis. Do not prescribe a restyle from personal preference when the existing pattern satisfies the contract.

## Apply the relevant gates

- **Visual:** both themes; actual normal/minimum windows; long Russian text; missing optional values; neutral control states; semantic contrast; 12px floor; no decorative nested containers or per-row blobs.
- **Interaction:** forward/reverse Tab, Enter/Space, pattern-appropriate arrows and Escape; focus after close/save/delete/complete; discoverability without hover; text resize/spacing; reduced motion and forced colors where relevant.
- **Persistence:** delayed acknowledgement, save failure/retry, external file change while dirty or pending, navigation/close guard, and stale async response arriving after the user edits or changes objects. Verify preserved content, not just the presence of an error banner.
- **Agent work:** provider/object/scope, needs input, result review, cancellation, failure and stale version; no invented progress or concealed compound operation.

Mark inapplicable cases with a reason. Follow the detailed fixtures and expected outcomes in verification rather than creating a ceremonial checklist. Use synthetic local data; do not perform destructive tests on the user's tasks.

## Decide honestly

Block acceptance for data loss, broken core journeys or inaccessible required actions. Major findings prevent acceptance of the affected contract; minor findings can be recorded with a bounded correction. Automated checks complement visual and keyboard inspection.

Report `specified`, `implemented`, `checked in browser`, `verified in Tauri`, and `user-accepted implementation` as separate facts. A selected direction is already a user decision; do not ask for it again. If native inspection is unavailable, report that gap and stop short of native acceptance. For documents-only work, validate contracts/links/skills and do not launch the app merely to validate prose.

Deliver reproducible findings ordered by severity, the exact tested scenarios and remaining gaps. Apply fixes only within the user's authorized scope.
