# @flood-md/tokens

Typed reference values and semantic CSS roles for Flood **0.2.4 source candidate**. Keep Flood
package versions aligned. Existing 0.1.1 installs use their earlier token contract.

React consumers import @flood-md/react/styles.css and use FloodRoot. Token-only
consumers import @flood-md/tokens/foundations.css and set both attributes on the
same scope element: data-flood-foundations="neutral" data-flood-theme="dark".
Only the neutral/dark foundations profile is supplied.

Exports include ./foundations (typed tokenNames lookup), ./foundations.css,
./foundations.manifest.json and ./neutral.dark.tokens.json. Values are authored
only in src/tokens.json. Generated artifacts must not be edited.

Roles cover surfaces/content, primary/subtle/contextual actions, fields,
selection/feedback/focus, Inter typography, relative spacing/radii, control/icon
sizes, motion and local layer order. Override public semantic --flood-sys-* roles
on their scope; repeat both attributes for nested scopes. See the
[foundations guide](../../docs/foundations.md) for supported types and limits.

The React package bundles Inter and its OFL license. Token-only consumers provide
their own font setup. Version 0.2.3 maps the quiet field.border role to the
container-outline tone. field.boundary remains a stronger opt-in; the quiet
default does not establish 3:1 non-text contrast. Evaluate actual recognition
and accessibility for the host composition.

Legacy ./tokens.css and JSON retain the earlier shared/light/dark contract and
--flood-* names. Legacy controls outside FloodRoot remain compatible; legacy
overrides do not automatically change separately scoped foundations roles.

Version 0.2.3 adds scrollbar size/inset/min-thumb roles and semantic thumb/hover
colors, expanding the profile to 168 roles. Install matching package versions.


The 0.2.4 source candidate adds `sys.color.accent.content` for accent metadata and `sys.color.loading.placeholder` for decorative loading fills (170 public roles total). Accent content is independent from the focus ring. Existing role values remain unchanged.

The same 0.2.4 candidate adds sys.color.indicator.track/fill/accent and sys.size.indicator.sm/md/lg: 176 public roles total. These separate indicator styling from action, focus and loading-placeholder roles. Existing role values stay unchanged.
