# Customize without a parallel system

Use FloodRoot for the neutral/dark foundations profile. The new light foundations
profile is not supplied; do not infer it from legacy controls outside FloodRoot.

Read the installed @flood-md/tokens foundation manifest and matching DESIGN.md.
Override semantic --flood-sys-* variables on a deliberate host scope after the
Flood stylesheet. Reuse existing content, surface, state, typography, spacing,
radius and control roles before adding a local application token. State which
role changes, why and which components consume it.

Do not edit generated node_modules assets, paste a second raw color scale into
components or invent unsupported token names. In the Flood source repository,
tokens are authored only in packages/tokens/src/tokens.json; generated files
are outputs. A consuming application's overrides remain application-owned.

Keep reference values separate from semantic roles. Component recipes consume
roles, and screen composition consumes components. An accent/material experiment
must be scoped; it must not silently alter ordinary fields, text or focus.

Keep layout/typography in rem, role line heights and tracking intact unless the
task explicitly changes them. Never impose a root 16px or 62.5% reset. Bundled
Inter retains its OFL notice; external icon/font assets keep their own notices.

Verify resolved token values, all affected states and surfaces, WCAG/APCA text
context, focus/non-text contrast, forced colors, narrow layout and text scaling.
An attractive default screenshot does not validate an override across a product.
