---
name: flood-ui-atomic-audit
description: Decide whether a Flood UI request needs a new primitive or can be expressed with the approved atomic design system.
---

# Flood atomic audit

Read docs/ui/atomic-audit-069.md and decisions.md before inventing a new primitive.

Default: reuse approved atomic contracts. A new generic primitive needs a concrete scenario that cannot be expressed by existing buttons, fields, boolean controls, select/combobox, menu/dialog, tooltip, feedback or brand roles.

Do not block compound design on Tauri/WebView/SR acceptance; track those separately. Do not declare production readiness from browser labs.

Feedback0.6.6 remains the only owner-review package before the atomic design gate can be called closed.
