---
name: flood-ui-booleans
description: Design, implement or review Flood checkbox, radio and switch primitives, including mixed selection, group validation, pending state, focus and measurable label targets.
---

# Boolean controls

Start with `docs/ui/README.md` and `docs/ui/decisions.md`. Read only the relevant P-01/P-02/P-03 section of `docs/ui/boolean-controls.md`; inspect the specimen and `recipes/boolean-checks.md` when needed.

The 0.6.4 shapes/state sheets are candidates, not automatically approved because they are on main. Preserve current palette, Heroicons, focus0.6.3 and no native chrome. Native inputs retain semantics; decorative marks do not create additional controls. Mixed is derived from explicitly scoped children. Radio has one value. Switch separates confirmed, requested and operation state; unknown requires reconciliation, not blind retry.

Measure mark, label target, first-line alignment and switch insets. Preserve readable disabled explanations, keyboard focus and system high-contrast colors. Never copy mock timers/data into application code or claim Tauri/SR readiness from Chromium checks. Compounds remain deferred. Deliver the relevant desktop preview and actual checks; no separate mobile exports unless requested.
