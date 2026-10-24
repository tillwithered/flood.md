# @flood-md/tokens

Typed reference values and semantic CSS roles for Flood **0.2.2**. Keep Flood
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
their own font setup. Current source maps the quiet field.border role to the
container-outline tone. field.boundary remains a stronger opt-in; the quiet
default does not establish 3:1 non-text contrast. Evaluate actual recognition
and accessibility for the host composition.

Legacy ./tokens.css and JSON retain the earlier shared/light/dark contract and
--flood-* names. Legacy controls outside FloodRoot remain compatible; legacy
overrides do not automatically change separately scoped foundations roles.
