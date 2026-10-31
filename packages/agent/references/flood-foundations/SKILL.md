---
name: flood-foundations
description: Apply Flood's existing dark semantic surfaces, typography, control sizing and icon geometry. Use for foundation consistency or token-consumer review.
---

# Apply the dark foundations

Use the installed declarations, token manifest and DESIGN contract. This workflow
applies the existing dark base; it does not start a palette, theme or motion redesign.

## Decide the role before the value

- FloodRoot owns the dark profile; import the shared stylesheet once in the host.
  A legacy light control outside it is not evidence of a supported new theme.
- Distinguish reference values, semantic roles, component recipes and host layout.
  In a consumer override an existing semantic role on a deliberate scope; never
  edit node_modules. In Flood source, author tokens only in tokens.json.
- Choose canvas, container, field and floating-surface roles from their actual
  context. A floating surface must remain legible over its parent; inspect alpha
  compositing, its perimeter and shadow together rather than darkening everything.
- Decorative dividers, necessary control boundaries, selection and keyboard focus
  have different jobs. Do not substitute an emphasized border for a quiet divider
  or mute an entire control to soften one line. Focus remains a clear accent.
- Heading level expresses document structure; visual size is a separate decision.
  Supporting labels/descriptions stay subordinate without becoming unreadable.
- Preserve rem sizing, the host root font, role line height and tracking. IconSlot
  owns explicit artwork dimensions; IconButton owns the accessible action/target.
  A large control does not mean an unconstrained SVG or oversized supporting copy.

Action icons are artwork with an explicit IconSlot size, not a plus, arrow or
cross typed into the label. Font glyph bounds vary even at the same font size.
Use the project's licensed icon pack or an original SVG in IconSlot; text-only
actions can omit the icon. Keep real symbols that are content, such as currency,
phone prefixes or mathematical expressions, as text. Inspect the actual artwork
and its centre relative to the label at the chosen Button size.

## Evidence

Trace a changed role to its consumers and compare resting, hover, selected,
focused, disabled and advisory/error states where applicable. Inspect a field on
a Surface and a popup over that field; inspect long text and enlarged root text.
Do not claim visual consistency from token names or matching hex values alone.
See [customization](../customization.md) and
[accessibility](../accessibility.md) for perception/override details.

## Destructive action tone

Button and IconButton accept tone="danger" for an actual destructive command,
independent of solid/subtle/outline/ghost prominence. It uses existing semantic
color roles in FloodRoot; keep the normal accent focus and disabled behavior.
A red label is not confirmation or permission to delete. Preserve that intent
when OverflowActions moves the command into Menu.

A numeric stepper is one horizontal control, not three wrapping fields. Keep its
minimum action/value budget inside a dense table's local scroll region. Test the
actual control at enlarged text in its narrowest repeated track; widening an
unrelated outer wrapper is not evidence that its internal geometry is sound.
