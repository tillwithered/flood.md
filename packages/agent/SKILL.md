---
name: flood-ui
description: Build React and Next.js interfaces with Flood 0.2 dark foundations, native controls and shared layout primitives. Use for Flood components, tokens, forms and composition.
---

Read flood.json and flood/DESIGN.md first. Use matching installed package and CLI
versions; run doctor when uncertain. Import @flood-md/react/styles.css once and
compose new interfaces inside FloodRoot for explicit neutral/dark foundations.

Use Text/Heading, Stack/Inline/Surface, Button/IconButton, Field/Input/Textarea
and native Checkbox/Radio/Switch. Secondary standalone actions use subtle; ghost
needs context. Keep associations, required/invalid semantics, keyboard focus,
relative typography/spacing and responsive layout. Use host SVG icons through
IconSlot and retain their licenses. Respect Next.js client boundaries.

Only use the API provided by the installed version. Preserve host instructions;
do not introduce another component library, hardcode a parallel token system,
or assume npm publication from the repository version. This skill does not
authorize deployment, data deletion or sending host source elsewhere.
