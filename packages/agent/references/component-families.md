# Author a component that belongs to Flood

Use when adding a reusable primitive, extending its visual contract or composing
a new shared component. This applies inside Flood itself and to project-owned
composites. Keep the installed/source distinction: a consumer cannot invent a new
package export or edit an installed dependency to implement these decisions.

## Choose the family before choosing values

Identify the component's role and compare the closest existing owners in their
rendered states. A new name is not a reason for a new visual recipe. Record the
chosen siblings and intentional differences in development notes, outside the UI.

| Relationship | What should be shared |
| --- | --- |
| Action and icon action | Button/IconButton height, text, icon scale, insets and focus treatment |
| Text/selection/number field | Field label relationship, control height and field-state semantics |
| Command collection | Toolbar/Menu owners, action sizes and keyboard ownership |
| Floating surface | Existing overlay material, layer placement, inset and focus restoration |
| Named content or record | Typography, hierarchy and metadata owners, not a new title scale |

Reuse these owners inside the new component. Extend the smallest missing owner
before adding a composite override. For example, the Toolbar that draws an
OverflowActions background owns its shape; a playground-only border-radius does
not establish that capability for other consumers.

## Define the visual and behavioral contract together

- Use matching semantic token roles. Equal-looking values are not necessarily
  interchangeable roles; a field radius and an action radius can evolve separately.
- Derive sizes from the family's controls. Label line height, explicit icon box,
  interactive height and optical insets must still agree at every exposed size.
- Name variants by a meaningful role or shape. Keep appearance separate from
  state: selected, read-only, disabled, invalid and focus are not interchangeable.
- Make the outer geometry deliberate. A single-row capsule action rail can use
  a pill shape; a wrapping or vertical group may need rounded geometry. Do not
  blindly apply a pill to a multi-row surface. Use the spacing workflow to assess
  nested radii and the actual inset; independently interactive neighbours need
  not share a concentric-radius formula.
- Account for padding and stroke in the space available to children. Overflow
  calculations use the content box, not the outer border rectangle. Check the
  threshold at which an item moves into the overflow owner.
- Keep behaviour in the component that owns it. A focusable read-only text field
  still needs a visible focus indicator and selection/copy. It blocks edits and
  its chooser; disabled has a different native contract. Do not erase focus to
  make a state look quieter or add helper copy merely to explain that contract.

## Compare the family in one scene

Render the new control beside its nearest sibling, with the same label/content,
size, surface and root text scale. Review rest, hover, keyboard focus and the
states the component actually supports. Include long content, empty/optional
slots, narrow tracks and enlarged text. The scene is verification tooling, not a
new runtime wrapper or a mandatory product screen.

Measure what looked wrong: glyph/text centres, visible insets, nested curves,
focus bounds and overflow thresholds. Exercise resize while an action or popup
has focus. After a shared-owner correction, inspect another consumer. A green
build or token reuse alone does not establish visual kinship.

## Keep the contract discoverable

In Flood source, update declarations, component examples, applicable guidance
and the version decision together; regenerate the existing knowledge catalog.
In a host, document the project-owned composite and its actual dependencies.
Do not add unsupported props to examples or a parallel handwritten API index.
Report executed behavioural/visual checks separately from guidance that was
merely read. Record deliberate family exceptions instead of making an isolated
fix the next component's accidental default.

Track actual consumers and interactions for a proposed atom. Demonstrate a shared
responsibility in different compositions before promoting a recipe helper into
the package. Do not insert an owner merely to increase its usage count: one
command can remain Button while a constrained command collection uses
OverflowActions. Reuse is judged by correct roles and reachable behaviour, not
the length of an import list.
