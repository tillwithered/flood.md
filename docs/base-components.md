# Base component architecture

The 0.2.4 source candidate uses original React18.3/19 components and TypeScript
declarations. The [catalog](../components.md) and individual component pages are
generated from the same source and declarations; use them as the inventory.
Source availability does not establish npm publication. Match installed versions.

## Compose responsibilities

| Layer | Responsibility and examples |
| --- | --- |
| Scope and tokens | FloodRoot selects semantic roles from the single token source |
| Geometry and type | Container, Grid, Stack, Inline, Surface, Divider, AspectRatio, Text, Heading |
| Accessible/media atoms | VisuallyHidden, IconSlot, Image, List with native li children |
| Actions | Button → IconButton/Toggle; Link retains real anchor semantics |
| Structured forms | Label/Fieldset/Field → Input/Textarea/Select and native choices → groups/InputGroup/SegmentedControl |
| Disclosure/navigation | Collapsible/Accordion/Tabs/Pagination reuse Button and Link while owning their specific keyboard semantics |
| Feedback/content | Spinner, Progress/Meter, Alert, Badge, Skeleton, Avatar, Card, EmptyState compose shared type, surface and icon geometry |
| Layers and scrolling | ScrollArea supplies protected scrolling; Menu/Popover/Tooltip/Dialog share layer mechanics with distinct contracts |

A native form is still the host's form. Card is structured Surface containment,
not another control. A native list is not ListBox; Table is not a sorting/fetching
DataTable engine. Group categories are search/navigation aids, not architecture
levels, and variants do not count as independent components.

## Shared contracts

Import @flood-md/react/styles.css once and opt into FloodRoot. Relative geometry
follows host root text size. Keep semantic tokens separate from internal reference
values; customize scoped public roles. Normal and italic Inter faces are bundled.

Controls retain native refs, form names, constraints and browser behavior. Choice
mixed state belongs to Checkbox; checked still determines submitted data. Loading,
readonly, disabled, validation errors and advisory tones are distinct contracts.
Quiet decorative borders are not an automatic accessibility certification.

Use component-specific keyboard behavior and let modified keys/IME reach the host.
Hidden slots must not reserve empty visual groups. Preserve labels, descriptions,
focus, RTL and narrow-width access. Keep specialized native structures (caption,
legend, li, th) rather than replacing them with generic wrappers for apparent reuse.
See [foundations](foundations.md), [layout](layout.md) and [agent guide](agents.md).
