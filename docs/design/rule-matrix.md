# Agent rule matrix

Use IDs in design briefs, reviews and migration evidence. **Every applicable row is a requirement for new or changed UI.** Source/status describes provenance, not optionality. **Blocker** means data loss, broken core flow or serious access failure; **major** means a repeatable usability/system failure; **minor** means a local visual/content inconsistency. Implementation targets are binding specifications, not claims that current code passes. Existing requirements remain active through the live project context.

| ID | Requirement | Applies when | Level | Source/status | Required evidence |
| --- | --- | --- | --- | --- | --- |
| CTX-01 | Obtain current context and read all mandatory rules | Every project design/implementation task | Blocker | Existing; [agent route](agent-contract.md) | Revision, relevant item IDs, no unread rule |
| CTX-02 | Keep live, exported, target and verified states distinct | Any contract update | Major | Existing; [adoption](adoption.md) | Version map and actual publication status |
| CTX-03 | Resolve contradictory rules explicitly | Competing design instructions | Major | Contract; [adoption](adoption.md) | Decision, rationale, superseded text and owner |
| PRD-01 | Keep project/task/run/source ownership distinct | Navigation and feature composition | Major | Existing; [principles](principles.md) | Owner and primary job in brief |
| PRD-02 | Preserve open/completed and three urgencies | Task visualization/filtering | Blocker | Existing; [flows](flows.md) | No visual grouping changes persisted model |
| PRD-03 | Local core works offline without integrations | Startup and core task flow | Blocker | Existing; [flows](flows.md) | Create/edit/read/complete with network unavailable |
| PRD-04 | Expose the frequent task; disclose rare controls in context | Screen composition and added controls | Major | Selected direction; [disclosure matrix](principles.md#progressive-disclosure-matrix) | Default/on-demand/omitted decision; keyboard access; no hidden error or pending decision |
| PRD-05 | Keep flood-buddy application-owned, transient and non-canonical | Companion UI or assistant entry | Major | User-selected target; [buddy](buddy.md) | No reserved workspace width, duplicate source of truth or task-embedded agent |
| VIS-01 | Use semantic roles; no local repeated color/size vocabulary | All components | Major | Existing; [foundations](foundations.md) | Named role and no duplicate source |
| VIS-02 | All visible text ≥12px; one semantic ramp | Text-bearing UI | Major | Existing; [foundations](foundations.md) | Font check plus actual computed text/zoom |
| VIS-03 | Normal text ≥4.5:1; meaningful non-text ≥3:1 | Both themes and all states | Major | Existing; [foundations](foundations.md) | Measured actual/composited pairs |
| VIS-04 | Ordinary controls are monochrome | Buttons, fields, tabs, focus, selection | Major | Selected direction; publication recorded in adoption; [foundations](foundations.md) | Light/dark state comparison |
| VIS-05 | Parent owns gaps; inner relationships are tighter | Compound layouts | Minor | Existing; [foundations](foundations.md) | Named space levels and measured layout |
| VIS-06 | Radius follows real geometry; no unnecessary nested cards | Nested rounded contours | Minor | Existing; [foundations](foundations.md) | Visible inset and valid exception |
| VIS-07 | One bottom boundary on open navigation strip | Horizontal navigation | Minor | Selected direction; publication recorded in adoption; [components](components.md) | Header/tab boundary review |
| VIS-08 | Distinguish data, navigation and action-row anatomy | Lists and context material controls | Major | Selected direction amendment; [components](components.md) | Purpose, row behavior and migration decision |
| VIS-09 | Project task-list width 880–960px; R02 Home shelves up to 1040px; reader/context/settings 720px; sidebar about 224px | Home, project, editor, context, settings | Major | User-selected Quiet Workbench; [flows](flows.md) | Normal/compact layout evidence and no page-level horizontal overflow |
| VIS-10 | Meaningful overlay only; flat working surfaces | Containers and transient layers | Minor | Contract; [foundations](foundations.md) | Reason for each surface/shadow |
| BRD-01 | Blobs identify the brand/agent; text explains the state | Brand or agent imagery | Major | Selected direction clarification; [brand](brand.md) | Role, scale, adjacent label, static fallback |
| BRD-02 | Preserve existing assets; evolve from an inventory | Brand iteration | Minor | Existing; [brand](brand.md) | Asset manifest/version, usage comparison |
| INT-01 | Use appropriate semantics and complete keyboard behavior | Any interaction | Major | Existing; [components](components.md) | Enter/Space/arrows/Escape by pattern |
| INT-02 | Focus remains visible, logical and restored | Navigation, close, delete, save | Major | Existing; [components](components.md) | Keyboard trace including reverse Tab |
| INT-03 | Text zoom, long content and narrow windows retain function | Every changed surface | Major | Existing; [verification](verification.md) | Matrix evidence, no page overflow |
| INT-04 | Custom appearance retains native semantics where useful | Select/menu/form work | Major | Contract clarification; [components](components.md) | Labels, roles, state and AT behavior |
| INT-05 | Reduced motion removes nonessential animation | Animated/pending UI | Major | Existing; [foundations](foundations.md) | OS/app preference, static feedback |
| INT-06 | Essential actions do not depend on hover | Rows and toolbars | Major | Existing; [components](components.md) | Mouse/keyboard/no-hover discoverability |
| DAT-01 | Keep drafts until acknowledged persistence | Editors/forms | Blocker | Existing; [flows](flows.md) | Slow save, failure, retry, close scenarios |
| DAT-02 | Detect version conflict; never overwrite unseen edits | File-changing action | Blocker | Existing; [flows](flows.md) | External edit during dirty/pending state |
| DAT-03 | UI and MCP use shared validation and mutation rules | Data-access implementation | Blocker | Existing; [agent contract](agent-contract.md) | Core path, expected version and atomic write tests |
| DAT-04 | Source snapshot works independently of original | Task source UI | Major | Existing; [flows](flows.md) | Offline, removed message, missing media |
| AGT-01 | Agent identity, run state and task status are separate | Agent-enabled view | Major | Existing; [flows](flows.md) | Running/needs-input/review/completed combinations |
| AGT-02 | Scope, effects and provenance visible at decision | Grant/review/apply | Blocker | Existing; [components](components.md) | Before/after and version-bound decision |
| AGT-03 | No task/source data sent externally without explicit choice | Research, cloud, integration | Blocker | Existing; [research](research.md) | Sanitized inputs and authorized scope |
| AGT-04 | No fake progress, silent provider or automatic completion | Delegation/automation | Major | Existing; [flows](flows.md) | Actual events, explicit result state |
| AGT-05 | Companion mutations use existing domain/MCP paths and explicit review | Buddy proposal or action | Blocker | Repository target; [buddy](buddy.md) | Visible scope/effect/version, confirmation where consequential, readback |
| TXT-01 | English instructions; Russian product labels | Docs and product copy | Minor | User request; [content](content.md) | Terminology and context review |
| TXT-02 | Error gives cause, preserved state and next step | Error/conflict/denial | Major | Existing; [content](content.md) | Real actionable message; no raw error primary |
| REF-01 | Observe a reference image before describing it | Mobbin research | Major | Existing; [research](research.md) | Canonical link, observation, rejection, decision |
| REF-02 | External aesthetics never become implicit rules | External source use | Major | Existing; [research](research.md) | Flood-specific reason and scope |
| QA-01 | Evidence matches the completion claim | Every delivery | Blocker | Existing; [verification](verification.md) | Spec/browser/Tauri/accepted labels |
| QA-02 | Prove new shared patterns on anchors before broad migration | System-level UI change | Major | Existing; [adoption](adoption.md) | Populated project/editor/context evidence |
| QA-03 | Performance is measured; no invented budget claim | Release readiness | Major | Existing; [verification](verification.md) | Hardware, build, dataset and measurements |

## Component/flow cross-check

Every changed component records: owner; anatomy; variant; token roles; normal/hover/focus/pressed/disabled/pending; empty/error/conflict where applicable; keyboard semantics; focus destination; Russian copy; long-content/zoom/compact behavior; implementation location; evidence status. Use `not applicable — reason` rather than forcing a meaningless state or silently omitting it.

Every changed flow records: trigger; precondition; pending behavior; acknowledged success; failure; external change; cancellation; retry semantics; data preserved; next focus; verification. A flow that writes files cannot omit conflict handling.

## Exception record

An exception contains rule ID, concrete scenario, reason, chosen alternative, affected files, approving user decision when necessary, expiry/removal condition and evidence. Purely optical adjustments can become named tokens with rationale. Exceptions cannot waive file safety, application permissions or disclose private data. Do not turn a temporary exception into another contradictory general rule.
