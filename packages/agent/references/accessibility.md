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
## Field status and read-only values (current source)

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
textual; do not hide interactive label content. Use it only where surrounding
context supplies the visible meaning. Input/Textarea/Select/InputGroup configure
this on their Field wrapper, not the control. Placeholder never replaces naming;
choice option labels and button names have separate contracts. Pending 0.2.3.
