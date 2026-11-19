---
name: flood-typography
description: Choose and review type roles, line length, wrapping and numeric alignment in Flood. Use when text hierarchy is flat, dense labels break badly, or content is difficult to scan.
---

# Make the type roles readable

Identify the job of each role before choosing a style. Use installed Heading,
Text, Field and table anatomy for their documented roles. Keep semantic heading
order independent of visual size. Determine whether the hierarchy problem can be
fixed with one change in weight, size, supporting contrast or separation.
Compare it on the surrounding surface. If labels still compete with a group
heading, strengthen the group cue before shrinking the labels.

| Content | Treatment | Review |
| --- | --- | --- |
| Page title, group title, field label | The title establishes scope. A group title should be distinct from a field label at a glance. Adjacent labels and values remain readable on the surface. | View the full region with actual values and remove redundant title levels. |
| Explanatory prose in a drawer, settings page or doc | Let sentences wrap at meaningful places and keep a comfortable measure. Give a separate consequence or qualification its own paragraph when that makes the decision easier to read. | Read the entire text at normal and enlarged sizes. Check narrow and translated text for awkward isolated words. |
| Status, short header or action in a repeated row | Keep the compact label together. Prefer a meaningful short label or supported compact variant. Use ellipsis when the visible part still identifies the item, and provide the full value on hover and keyboard focus where supported. | Compare long and short entries. If different values become indistinguishable, allocate more space or change representation. Essential decisions remain legible without opening a tooltip. |

Use TruncatedText for a passive plain-text value once its visible prefix is
enough to recognize it. In SettingRow, opt in with valueOverflow=truncate.
Tabs reach the full-value tooltip only when the line clips. For a command,
keep the tooltip on the existing action target.

Use Heading wrap=balance for short multiline titles, and Text as=p wrap=pretty
for supporting prose when the final line reads awkwardly. Compare the same
copy and width before choosing. Keep normal wrapping for controls and dense
data. Browser-specific wrapping improvements fall back to ordinary wrapping.

Use HighlightText to show the matching part of a visible search result.
Keep the title or excerpt readable with an empty query and where the result
matched a synonym or metadata that is absent from the visible text.
| Amounts, timings and counts compared down a column | Align values to the same edge, use tabular figures when supported, and place a shared unit in the header when the scope stays clear. Keep sign and value together. | Check missing, signed and larger values using the host locale. Preserve an explicit currency on mixed-currency rows. |

Use NumericValue for locale-formatted numbers. When updates move nearby
content, reserve a representative width that includes the sign, separators
and unit in the active locale. Check a digit-count boundary and a value
that legitimately exceeds the reservation.

Review the glyphs on the rendered surface. Font size declarations alone miss
weight, line height, contrast and the space a line break occupies. Use softer
text for subordinate information that remains readable. Give essential states
and actions a readable label or shape as well as their color. Keep settings
scoped through Flood's typography roles and token customizations.

Use ExpandableText for an optional, multi-line plain-text excerpt in a card,
comment or feed. Keep the first lines useful and the full passage available
in place. Render text needed for the next decision in full. Use Collapsible
for rich content with links or controls. Reserve space on the final line for
the ellipsis and inline disclosure label. Keep the line height the same as
the surrounding prose. Check short copy, long copy and keyboard focus after
expanding or collapsing, then widen the example until the toggle disappears.

Typographic roles and readable measure draw on Ruder and Lupton. Use them to
choose which role to change, and exercise both scanning and full reading with
real strings before claiming an improvement.
