# Flood brand language

The selected [Quiet Workbench](quiet-workbench.md) direction retains the original blobs with sparse identity use. This chapter specifies that direction without claiming a completed new asset family.

## Separate meaning

| Layer | Question answered | Visual carrier | Required text |
| --- | --- | --- | --- |
| Brand | Which product is this? | Existing flood master/glyph | Product name when needed for identification |
| Agent identity | Who is doing the work? | Stable chosen blob/glyph | Agent name and “Агент” |
| Run state | What is happening? | Neutral text plus optional semantic icon/progress | “Выполняется”, “Нужен ответ”, “Результат готов”, etc. |
| Task state | Is this task open or completed? | Explicit completion control and state text | Accessible open/completed name |
| Urgency | How urgent is this task? | Compact semantic signal | “Обычная”, “Важная”, “Срочная” |

An agent's identity shape/color does not change into success/error. A blob cannot be the only clue that work is running. The present manifest includes `normal`, `important`, `urgent`, `completed`, `connected` and `info` glyphs; these are **legacy semantic assets**, not proof that every state should become a blob. Preserve asset identity and provenance while migrating. Do not repurpose an urgent glyph as an agent avatar. Quiet Workbench removes repetitive per-task priority blobs: important/urgent values have compact text and optional small semantic icons, ordinary urgency remains available in the editor without a list badge. Existing connection/info uses outside this slice remain separately scoped.

## Existing assets first

Inspect `src/assets/flood-material/manifest.json` and `src/components/FloodGlyph.svelte` before selecting imagery. Use local files, actual connector logos and a neutral missing-image fallback. Do not simulate the supplied raster blobs with CSS gradients, random SVG, emoji or unrelated generated art. Color inside a real connector logo may remain branded; its action surface stays monochrome.

| Scale | Range | Intended use | Exclusions |
| --- | --- | --- | --- |
| Glyph | 16–20px | Product/agent identity next to text; supported legacy semantic use | Tiny detailed master scaled down to illegibility |
| Motif | 24–48px | An agent introduction or contextual identity | Repeated decoration in every task row |
| Master | 64–160px | First launch, meaningful empty state or brand presentation | Populated list chrome, backdrop, ordinary error |

One large brand object per view at most. A populated workspace normally needs none. The approved companion is a scoped exception: one 32–40px static blob trigger may sit at the lower workspace edge and opens C25. It does not breathe while idle, multiply per task, or communicate state without text. An identity glyph may repeat where actual different agents require it, but never replaces explicit naming. The asset must reserve its dimensions before loading; missing assets do not move labels.

## Material grammar

Retain a recognizable family: a soft volumetric form, coral/pink/violet material and a dark core. Work on silhouettes, controlled highlights and consistent optical weight at each size. Keep lighting and edge treatment coherent across the set. The surrounding interface stays flat and neutral so the material is intentional.

Potential extensions are studies, not requirements: stable agent identities, onboarding illustrations, a small “work in progress” reaction and branded handoff moments. Do not create a new blob for every backend state. Avoid anthropomorphic claims, fake emotion, reward theatrics or persistent “breathing” when no work is happening.

## Motion and accessibility

Identity is stable. Use a short reaction to an explicit event; sustained progress is owned by the progress component, not decorative background motion. Reduced motion uses the same static asset and text. Decorative imagery has empty alt text; meaningful imagery has a concise accessible name or relies on adjacent text without duplicate announcements.

Test each asset on light/dark surfaces, at actual 1×/2× scale, with adjacent 14px Cyrillic text and in forced colors. A raster can keep its colors, but no required state may disappear if it is hidden or indistinguishable.

## Evolution gate

For a new family member record role, source file, license/provenance, optical size, supported surfaces, accessible meaning and fallback. Compare existing and proposed assets on the three populated anchors. Promote only after the family is legible and coherent at real sizes. New asset-family design is later work. Quiet Workbench changes repetition and usage while retaining the supplied original brand files.
