# Tree

An application hierarchy with explicit item selection and expansion. Use
NavigationTree for ordinary nested website links.

```tsx
<Tree
  label="Project files"
  defaultExpandedValues={["source"]}
  items={[
    {value:"source", label:"Source", selectable:false, children:[
      {value:"button", label:"Button.tsx"},
      {value:"input", label:"Input.tsx"},
    ]},
    {value:"readme", label:"README.md"},
  ]}
/>
```

Item values must be globally unique and nonempty, labels nonempty and children
acyclic. Selection does not cascade through folders. A grouping branch can use
`selectable={false}`. Icons and descriptions are supporting noninteractive content;
do not put links, buttons or inputs inside them.

Descriptions participate in the row's accessible name. They wrap in normal layout
flow, while an expanded child group is associated separately. Collapsing a branch
retains known selected descendants; removing items excludes their values from
subsequent selection requests.

`value`/`defaultValue` accept a string for single selection or an array for
`multiple`. `onValueChange` requests a string or array respectively. Controlled
refusal preserves the host's value. Expansion has its own
`expandedValues`/`defaultExpandedValues`/`onExpandedValuesChange` contract.

Up/Down move through visible rows; Home/End reach their bounds. Logical forward
opens a branch or moves to its first child; logical backward closes a branch or
moves to its parent. RTL reverses these horizontal arrows. Typing finds visible
labels. Focus moves independently from selection: Enter/Space selects, and Space
toggles in multiple mode. The branch chevron toggles expansion without selecting.

`readOnly` blocks selection while allowing browsing and expansion. Disabled rows
remain discoverable but cannot select or expand; item restrictions are explicit,
not inherited through the hierarchy. The application supplies `disabled` itself;
Tree is not a native form control and does not inherit a fieldset's disabled
state. It writes no hidden form values. Compose host validation and submission
when application selection belongs to a form.

For deferred branches use `hasChildren` and `loading`; respond to expansion by
loading children in the host. Flood does not fetch, virtualize or invent child
nodes. Translate `emptyMessage`, `loadingMessage`, `unloadedMessage` and
`readOnlyMessage` (the associated read-only explanation). Collapsed
children leave keyboard navigation. Item removal or external collapse repairs
focus only when focus belonged to the affected tree.

Introduced in the aligned 0.2.7 source candidate. Publication is verified separately.
