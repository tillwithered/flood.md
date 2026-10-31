# Grouped form

Use a shared outer grid for peer groups, with the same surface padding and field
spacing. Each group owns its title and reading order. Two short fields stack
inside each group; the next row reuses the same tracks instead of inventing a
new four-column or uneven grid. This recipe illustrates workspace preferences,
not an invoice-specific screen or a universal two-column requirement.

Choose the number of tracks from the task and declared viewport. A long-address
group may span the row; a short field does not need its own column. Keep related
fields together in DOM order, including when an optional field disappears.
Use Grid, Fieldset, Surface and Field rather than recreating their recipes.

Import the shared stylesheet once and render inside FloodRoot. onApply receives
native FormData in the host; this recipe implements no persistence or permissions.
Those limits belong here in documentation, not as repeated captions in the form.

## Source

<!-- flood:grouped-form -->

## Review

Compare left/right edges and gutters in both rows, label/control associations,
native required submission and omitted optional content. Inspect long labels and
enlarged text at the host's declared widths. Do not judge a form by zero page
overflow alone. Read the [forms workflow](/agent/references/flood-forms/SKILL.md)
and [content workflow](/agent/references/flood-interface-content/SKILL.md) before
adapting it. A useful form does not need a helper paragraph under every title.

Independent sections use Fieldset legendSize="section" and keep one shared outer
Grid across peer groups. Field labels retain the compact inner gap; Stack owns
row separation. The hierarchy workflow explains why section titles and choice
captions are different roles.
