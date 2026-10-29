---
name: flood-navigation
description: Choose and verify Flood links, tabs, disclosure and hierarchical navigation. Use when destination, selection and expansion semantics can be confused.
---

# Separate destination, selection and disclosure

Use installed declarations and the [composition reference](../composition.md).
Choose Link/NavigationList/NavigationTree for destinations; Tree for application
object selection; Tabs for associated panels; Accordion/Collapsible for disclosure.
SegmentedControl selects one value and is not a tab panel controller. Do not use
Menu just because links appear vertically.

## Preserve browser and keyboard behavior

- Links retain real href, modifier/open-in-new-tab behavior and current-page
  indication. A route change and a selection change are not interchangeable.
- Hierarchical items need stable unique values and readable labels. Expansion,
  current destination, selection and keyboard focus have separate owners. Do not
  infer cascading selection, automatic fetching or ancestor expansion.
- Apply each component's keyboard contract. ButtonGroup keeps ordinary Tab
  navigation; Toolbar, Tabs and selection widgets have their own focus models.
  Avoid adding generic arrow-key handlers around nested interactive content.
- Disclosure state must match its trigger and panel. Check whether content remains
  mounted, and preserve any native form/focus consequences of the installed API.

## Evidence

Exercise forward/back navigation, current state, disabled/empty items, long labels,
both orientations when supported and keyboard entry/exit. For breadcrumbs, check
intrinsic text width and wrapping in each supported browser: a final letter on a
new line can indicate a sizing error rather than a legitimate responsive layout.
For sidebar navigation, scroll/focus the final item and keep its selected surface
clear of the scrollbar. Verify the actual navigation composition at narrow width
and enlarged text; an isolated item's screenshot is insufficient.
