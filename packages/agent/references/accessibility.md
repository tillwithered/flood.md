# Preserve interaction and perception

Read the installed component contract before changing its behavior. Do not add
ARIA to replace functioning native semantics or describe behavior that is absent.

- Every field needs a visible associated label. Spread Field callback props;
  preserve id, required, aria-describedby and aria-invalid. Hint/error content
  must describe the field. A placeholder is not its label.
- Keep the visible 2px focus perimeter with zero offset, including invalid and
  selected states. Focus should not move layout or create another noisy contour.
  Verify the actual foreground/background when overriding its accent.
- Checkbox, Radio and Switch keep native inputs, values, reset and keyboard.
  Radios share name and use a host fieldset/legend. Disabled and readOnly differ;
  Select has no native readOnly behavior.
- If installed Select exists: single choice uses Flood's custom popup, not an OS
  dropdown. Arrows/Home/End highlight; Enter/Space/Tab commits; Escape cancels.
  The native select bridge owns the form/ref contract. Multiple or size>1 is an
  inline listbox. Do not turn the option text into another interactive control.
- Name icon-only actions by their effect, not glyph. Keep decorative SVGs out of
  accessible names. Loading disables activation; announce host completion/errors
  separately. Explain disabled actions in text outside the disabled element.
- Evaluate text contrast using WCAG and APCA guidance with actual size, weight
  and background. APCA does not replace applicable WCAG requirements. Decorative
  separators differ from necessary control boundaries; never mute a whole
  component with opacity just to soften a border.
- Root font sizing belongs to the host. Preserve rem geometry, text wrapping,
  forced-colors indicators and reduced-motion preferences.

Test keyboard start-to-finish, focus visibility, labels and descriptions,
validation, native form reset, long text, 320px layout and root text enlargement.
An automated scanner alone cannot establish application accessibility or WCAG 3
conformance. Record what was actually checked; see [verification](verification.md).
## Field status and read-only values

Use status on Field/Input/Textarea/Select for error, warning, success or info.
With Field, provide message and spread its callback props onto the Flood control.
Only error marks aria-invalid; warning/success/info are advisory. Existing error
or invalid takes precedence. Include a useful description instead of relying on
color alone. Status does not implement host validation or native constraints.

readOnly on text-like Input/Textarea prevents editing while preserving focus,
selection, copy and submission. Do not substitute disabled or apply readOnly to
Select/checkboxes. Explain the restriction. Preserve the solid accent focus even
when a read-only field uses a dashed resting perimeter.

External-label visibility: source Field/Fieldset hideLabel preserves the actual
label/legend and accessible name while removing its visual row. RadioGroup,
CheckboxGroup and SegmentedControl inherit it. Keep label/legend supplied and
textual and keep actions visibly discoverable. In 0.2.4 a hidden Field label or
Fieldset legend reveals while its descendant has focus, preserving native names
and child state. Use hideLabel only where surrounding context supplies the
visible meaning. Input/Textarea/Select/InputGroup configure
this on their Field wrapper, not the control. Placeholder never replaces naming;
choice option labels and button names have separate contracts. Available in 0.2.3.

Overlay source APIs: forward trigger render props/ref onto one actual button;
keep trigger mounted/visible. Tooltip is noninteractive text help, not the only
name/instruction; hover/focus opens, Escape dismisses, focus stays. Popover is a
named nonmodal dialog; outside/focus-leave/Escape close without trapping Tab.
Dialog uses native showModal and inert background, cycles focus, restores scroll
and opener. Escape dismisses the top layer; outside closing is independently
configurable. Provide a visible title and safe initialFocusRef when needed. Closed
Popover/Dialog children unmount; host owns persistent values and controlled open.
Modern native APIs required. DOM/theme scope stays intact; no body portal needed.
Available in 0.2.3.


For 0.2.4 loading primitives: localize standalone Spinner label, avoid duplicate live announcements, and keep Skeleton hidden from AT. Reduced motion stops their animations. Avatar exposes one named image, or decorative presentation when the adjacent text already supplies identity. Badge text must express status without relying on its color.


Progress and Meter are not live regions. Keep their labels even with hideLabel, and provide meaningful valueText when percentages would be misleading. Unknown Progress omits aria-valuenow; Meter has no unknown state. Alert defaults to silent static content; opt into announcement=polite (status) or assertive (alert) only for the required urgency. Do not move focus to these messages or claim every screen reader announces initial markup. Verify with actual assistive technology.


Retain DescriptionList native dl/dt/dd semantics without redundant ARIA term/definition roles. Table needs a meaningful caption (hideCaption keeps its name) and host-owned header associations; never convert table rows into display:block cards without preserving relationships. Name the horizontal scroll viewport, retain keyboard scrolling and check that focusable cell controls remain reachable. Native table ref points to table, not viewport.


Menu: preserve menu/menuitem/separator semantics and trigger aria-haspopup/expanded/controls. Disabled items remain arrow-focusable with aria-disabled and must never activate. Use arrows/Home/End/typeahead within the menu, Escape to close, Tab out and Shift+Tab to trigger. Do not turn ordinary navigation lists into application menus. Restore focus unless the host deliberately moved it; test nested Dialog behavior and actual assistive technology separately.

Toolbar requires a meaningful label. After hydration it manages child tabIndex, skips hidden/disabled actions, supports Home/End, orientation and RTL, and restores original child tabIndex attributes on cleanup. Native child handlers/refs remain attached. Before JavaScript native child Tab order remains. Kbd has native keyboard-input semantics and adds no focus stop or handler; do not present unimplemented bindings as working shortcuts.
