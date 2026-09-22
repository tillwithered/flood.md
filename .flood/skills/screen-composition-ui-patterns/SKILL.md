# Flood screen design

Complete the [project bootstrap](docs/design/agent-contract.md#bootstrap). Read [ownership and disclosure](docs/design/principles.md), the matching R01–R13 [recipe](docs/design/flows.md) and its referenced C01–C24 [components](docs/design/components.md).

## Compose from the user job

Write one brief: owner → user question → primary action → result → return location. Keep application accounts, project source scope, tasks, artifacts and agent runs distinct. Each editable object has one canonical home; other views link to it.

Use the selected projects-only sidebar and dominant task list. Task detail and project context are separate pages. One project heading/count and one New task action suffice; Context is quiet and rare management actions use overflow. Preserve completion as a separate task-row control. Normal urgency and repeated metadata do not fill empty row space.

For every proposed region classify it as **default**, **on demand** or **omitted**, using the disclosure matrix. An empty optional region does not reserve space. Errors, unsaved work and pending human decisions remain visible when present. Do not achieve minimalism by hiding the next action, requiring hover or shrinking text.

## Select the surface

| Need | Surface and boundary |
| --- | --- |
| Persistent project/task/context/settings workspace | Dedicated page; predictable return to parent/list |
| Substantial project document/rule/skill with content, history, access and explicit save | Shared artifact modal with stable header/footer and one scrolling body; near full window when narrow |
| Temporary source inspection that benefits from neighboring context | Modal or transient drawer; never a permanent task-detail/chat column |
| Short local choice or rare commands | Popover/menu with complete keyboard behavior; move search, multiple selection or a substantial form to a focused dialog |
| Brief optional explanation or diagnostics of an existing object | Inline disclosure; never an entire artifact editor between list rows |
| Indexed object | Compact row leading to its working surface; no nested editor or nested buttons |

## Specify before rendering

1. Define reading order and action order. Use semantic type/space roles and the bounded list/reader widths from foundations. Keep the parent responsible for outer gaps.
2. Define populated, empty, loading, partial/unavailable, validation, pending, failure and conflict states where meaningful. Write `not applicable` with a reason for irrelevant states.
3. Define trigger, acknowledged result, retry/cancel behavior, preserved data and next focus. For navigation, record list position and the originating object to return to. A dirty draft cannot disappear on route or window changes.
4. Describe minimum-window behavior and long Russian content at 200% text enlargement. Do not squeeze competing panes or truncate essential decision text without a way to read it.
5. For new compound compositions use [the reference procedure](docs/design/research.md); established Quiet Workbench recipes can proceed from the existing study.

Deliver a concrete screen contract: brief, element/disclosure decisions, component IDs, state/transition table, copy and acceptance scenarios. In design-only mode stop here. Implementation and review use their respective skills; a mockup does not verify interactions.


Repository workflow: `docs/design/skills/flood-screen-design/SKILL.md`. Relative repository paths in this project material resolve from the flood.md repository root. Read the local source through an authorized repository resource; missing access is not permission to guess its contents.
