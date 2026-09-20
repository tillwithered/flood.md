---
name: flood-ui-feedback
description: Design or review Flood loading, progress, skeleton, inline feedback, notices and toasts before composing full screens.
---

# Flood feedback primitives

Read `docs/ui/feedback.md` and its lab/checks only when the task concerns loading, progress or operation feedback.

Preserve approved monochrome themes, semantic Danger/Warning/Success, Heroicons Solid, double focus and flat controls. Do not reintroduce blue accents or control shadows.

Choose the primitive by state: first-load skeleton; refresh keeps existing data; determinate progress only with a real denominator; spinner/status for indeterminate work; inline feedback for one action; banner for persistent area state; toast for brief confirmed outcomes.

Never invent progress, hide actionable errors in auto-dismiss toast, steal focus for passive feedback, or duplicate the same outcome across toast/banner/badge. Respect reduced motion and forced colors. Labs use synthetic timers; do not copy them into production.
