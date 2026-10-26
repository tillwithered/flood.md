# NavigationTree

Nested native links with independent disclosure controls. Use Tree when choosing
application objects rather than navigating to destinations.

```tsx
<NavigationTree
  label="Documentation"
  currentValue="installation"
  defaultExpandedValues={["getting-started"]}
  items={[
    {value:"getting-started", label:"Getting started", children:[
      {value:"introduction", label:"Introduction", href:"/docs"},
      {value:"installation", label:"Installation", href:"/docs/installation"},
    ]},
    {value:"components", label:"Components", href:"/components"},
  ]}
/>
```

Values are globally unique and nonempty, labels nonempty and children acyclic.
A branch may have both its own `href` and children: its link navigates while a
separate button expands it. A branch without a destination has a plain label and
a separate disclosure button. `currentValue` marks the matching destination with `aria-current="page"`;
the host chooses current location and initially expanded ancestors.

Expansion uses `expandedValues`, `defaultExpandedValues` and
`onExpandedValuesChange`. Controlled refusal leaves the visible state unchanged.
The navigation uses native nav/list/link semantics and ordinary Tab order, without
pretending to be an application tree, menu or tablist. Browser modifier clicks,
targets and download behavior remain native through item `linkProps`.

Disabled destinations render without a navigable href, and disabled disclosures
cannot expand. Disabling a parent does not implicitly disable its descendants.
`content` is optional host-owned branch content for loading or empty states;
Flood does not fetch data. Translate disclosure names with `expandLabel`.
Use `size="sm" | "md" | "lg"` for row geometry. Nested indentation is logical
and follows RTL. Keep icons noninteractive and provide text labels.

Introduced in the aligned 0.2.7 source candidate. Publication is verified separately.
