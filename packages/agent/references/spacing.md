# Spacing, density and nested geometry

Use this guide when composing Flood controls or correcting excessive gaps,
inconsistent grouping or shifting previews. Start with host instructions, the
installed declarations and token manifest. User-approved geometry takes precedence
over a generic recipe; newer website examples do not add APIs to an older package.

## Identify the relationship

Decide what each space separates: an indicator and its label, a title and its
description, choices in one group, independent actions, sections or nested surfaces.
Keep related content together and give unrelated sections a stronger separation.
One gap value should not be repeated indiscriminately through nested wrappers.

| Relationship | Starting point; check the installed recipe |
| --- | --- |
| Indicator and its own label | Existing choice component geometry; do not add another wrapper gap |
| Title and supporting description | A close pair, typically space-1 in the current Fieldset recipe |
| Repeated choices | Group row height already provides separation; inspect it before adding gap |
| Separate horizontal actions | Explicit parent spacing; space-4 is a starting point |
| Sections | Host content hierarchy and available width |

These are contextual defaults rather than a universal scale. Prefer supported
Stack/Inline spacing props and scoped semantic tokens. Host layout CSS owns host
spacing. Do not edit installed package files or invent unavailable component props
to change density. Use relative units and preserve the host's root font size.

## Measure visible geometry

Inspect the rendered interface, wrapper tree and computed gap, padding, margin,
line-height, minimum height and alignment. Measure the visible indicator/text as
well as the full interactive row. A zero flex gap can still look widely spaced.

For equal centered rows, indicator separation is approximately row height minus
indicator height plus row gap. A 40px row plus an 8px gap creates 48px row pitch;
the gap declaration alone does not describe perceived density. Those numbers
illustrate the calculation, not a fixed recipe for every installed release.

Remove redundant space at its owning layer. Preserve explicit icon dimensions,
the relationship between indicator and label, and independent form semantics.
Avoid negative margins or transforms that conceal a layout problem or overlap
click targets. For nested surfaces, compare inner radius with outer radius minus
padding and stroke; independent controls retain their own radius recipe.
When a circular avatar sits against the rounded end of a pill control, use the
same inset at the top, bottom and avatar-side edge. Keep the label gap and the
trailing action inset separate from that geometry.

## Check the composition

- Inspect short and wrapping labels, narrow/wide widths and larger root text.
  Rows may grow for content; do not clip text to enforce a compact height.
- Check hint, error, status, loading and disabled cases where applicable.
  Different content must not unexpectedly reposition an unrelated demo control.
- Distinguish the component from its preview host. Fixed scenes and reserved
  message rows belong to a demo when needed, not automatically to a host product.
- Check fine and coarse pointers separately. Compact mouse geometry must preserve
  the supported touch-target minimum and nonoverlapping hit areas on touch.
- Recheck keyboard focus, label activation and a sibling that shares the recipe.

Use actual screenshots and measured geometry to judge the result. Follow the
host's verification workflow; add a regression check for a repeated failure rather
than a test that merely repeats a CSS declaration. Report what was measured and
what remains unverified. See [accessibility](accessibility.md) and
[verification](verification.md) for related contracts.

## Judge the space you can see

1. Name what should read together, what starts a new group, and what should
   catch the eye first. Start with shared edges and the actual reading order.
2. Inspect the screen at its working size. Compare the painted edges of text,
   icons, fills and rules as well as their layout boxes. Line boxes, internal
   padding and hit areas already contribute space. A strong fill or divider
   also changes how much separation the eye sees.
3. Compare two plausible treatments with the same content and viewport.
   Change one lever at a time: space, measure, weight, tone or a boundary.
   Pick the token that makes the intended grouping read clearly, then recheck
   with the actual token applied. Keep stable alignment for repeated elements.
4. Compare short and wrapped content and the presence or absence of optional
   content. Recheck narrow layouts, enlarged text and text spacing overrides.
   Keep focus visible, hit areas usable and reading order intact.

For example, if a heading appears closer to the previous section than to its
own controls, inspect the heading line box and the first control's top inset
before increasing the section gap. If an icon looks off-center inside a
centered slot, compare its visible outline with a sibling icon before adjusting
the icon artwork. Keep the slot and click area on the shared track.

In review notes, name the visual problem, the competing treatments and the
reason one reads better. A passing geometry check supports that judgment.
For text beside an icon, inspect the actual baseline and visible glyphs,
including accents and wrapped labels. [CSS Inline Layout](https://www.w3.org/TR/css-inline-3/#leading-trim)
