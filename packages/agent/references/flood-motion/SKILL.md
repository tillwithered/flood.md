---
name: flood-motion
description: Design and verify motion for Flood controls, overlays, disclosure, feedback and loading states. Use for animation, transitions, reduced motion and component motion reviews.
---

# Choose the event before the animation

Read the installed motion tokens and the component's behavior contract.
Choose motion by what changed and how far the eye needs to travel.

| Event | Flood recipe |
| --- | --- |
| Hover, press, current or checked | Brief paint transition. Standalone controls may compress slightly while held, then return to rest. Selection can move a glyph or thumb that represents the state. |
| Disclosure | Change content availability immediately. Rotate the indicator and reveal newly shown content only where the component owns that region. |
| Anchored popup, modal or drawer | Start from the anchor direction, a small opacity change, or the drawer edge. Larger layers get more time. Dismissal should be shorter where the lifecycle can preserve it safely. |
| Progress, loading or result | Animate the indicator or arriving message. Keep text and state legible during the motion. |
| Focus, validation, drag, resize, scrubbing or text input | Immediate focus, feedback and geometry. The pointer and selection own their position. |
| Typography, layout and static content | Inherit motion from the interactive owner. Avoid mount effects on structural wrappers and ordinary rows. |

Use Flood semantic timing roles and narrow transition-property lists. Prefer
opacity and transform on bounded visual parts. Keep an anchored overlay's
positioning root stable while a child moves. Animate color only where the old and
new colors keep required information legible. Keep focus outlines and error
messages immediate. Apply hover treatment only to devices that can hover.
For ToastRegion, animate each arriving card as a unit from its placement edge.
Keep the region anchored and its announcement available as soon as it appears.
Inline toasts can fade without moving surrounding content.
Keep compression off disabled controls, text editors and joined control
surfaces. Verify release and cancellation without a layout shift.
Treat disclosure headers as part of their enclosing surface. Keep their
background flush during press and rotate the centered glyph around its own center.

Keep focus, ARIA, routing, scroll locks and form state independent from animation
completion. For native top-layer exits, verify that content, inertness and focus
all remain correct. Use an immediate close when an exit would keep an empty or
interactive shell visible. Rapid reversal must settle to the accepted state.

Honor `prefers-reduced-motion: reduce` with immediate state changes and static
loading indicators. Never require motion to distinguish two states. For infinite
motion, verify the activity ends with its actual loading state.

Review actual controls in the same screen and at their supported density. Verify
pointer, keyboard, touch, interrupted transitions and reduced motion. For
overlays, also check repeated open/close, focus restoration and nested dismissal
in Chromium, Firefox and WebKit. Record deliberately static behavior by family.
Use the Motion guide in the matching catalog for the component-by-component
contract. When adding a component, give its states an owner in that guide.
