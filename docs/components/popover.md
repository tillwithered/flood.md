# Popover

Popover owns anchored placement, dismissal, accessible naming and focus return.
Its default chrome includes a visible title and an IconButton close action.

For compact selection surfaces use `chrome="minimal"`: the required `title`
remains available to assistive technology, while the title row and close button
are omitted. Escape, outside interaction and the trigger still dismiss the
popover. TimePicker composes this mode. Calendar switches views internally and
does not open a nested Popover. Ordinary Popover
consumers keep their existing default appearance and behavior.
