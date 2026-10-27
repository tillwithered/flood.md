# Website privacy

The footer on flood.md shows an approximate all-time count of unique browsers
since the counter was enabled. It is not a count of people or page views.

The website stores one random identifier in your browser's local storage under
`flood.visitor.v1`. It sends this identifier to a same-origin endpoint to avoid
counting repeat visits. The counter database stores only a SHA-256 hash of the
identifier, the aggregate total and the date counting began. It does not store
IP addresses, page history, referrers, account information or device fingerprints.
Hashed browser identifiers are retained for deduplication while the counter runs.

Clearing website storage, using private browsing or another browser/device can
count as another visitor. Known automated user agents are excluded, but the number
is not audited analytics or an abuse-proof measurement. If local storage is
unavailable, the site displays the total without registering a visitor. Requests
that only read HTML or Markdown do not increment the counter.

The hosting provider can maintain its own operational request logs. This counter
does not control those logs. No third-party analytics script is loaded.

This feature is specific to flood.md. Installing Flood's npm packages does not
add visitor tracking to your project.
