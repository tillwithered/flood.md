# Frequently asked questions

## Does Flood use shadcn, Radix, Base UI or Tailwind?

No. Flood's controls, CSS tokens and CLI are authored in this repository. React
and browser-native form elements provide the underlying platform APIs.

## Does it support Next.js?

Yes. Import the global stylesheet in app/layout.tsx. Flood's React entry preserves
its use-client boundary. Compose callbacks, state and Field's function child in
your own client component. The integration fixture tests React 19 and Next.js App
Router. Clean-package checks also exercise React 18.3 and 19 server rendering;
the full interactive Next.js fixture uses React 19.

## Is this the same installation model as shadcn?

Flood currently installs versioned npm dependencies. It does not copy editable
component source into your application or provide a source-file merge engine.
Customize semantic tokens and component props; use source changes in a fork when
you need behavior outside the public API.

## Why is there no add button command?

The base set ships together in @flood-md/react: ten foundation primitives and
eight native controls. Import the components you need; see the
[base component set](base-components.md). The CLI provides init, init --dry-run
and doctor.

## Which package managers work?

The installer uses npm. Other package managers can install the library manually,
but their integration is not currently covered by the installer tests.

## The controls look unstyled. What should I check?

Import @flood-md/react/styles.css once at the app root. Doctor checks package
versions and instruction files, not the application's stylesheet imports.
Wrap a new interface in FloodRoot to select the neutral dark foundations profile.
Outside that scope, controls retain the legacy theme. Check project CSS overrides
if the import and wrapper are already present.

## Can I rerun init or use it as an updater?

Init refuses existing flood.json or owned instruction files. It does not overwrite
project instructions. Follow the [upgrade guide](installation.md) and
review customized instructions when moving to a new release.

## Does making the website source public grant server access?

No. Source visibility does not grant GitHub write access, hosting credentials or
server execution. Browser-delivered HTML, JavaScript and CSS are visible to users
regardless of repository visibility. This does not make a website immune to bugs:
deployment permissions, dependencies and server behavior still need review.
Credentials belong in service secret stores, never in a public or private Git repo.

## Does Flood require an account or send my project to a service?

No Flood account, backend or telemetry is required. The installer contacts npm to
download packages. Components run inside your application and do not send project
contents to Flood.

## Where do I report problems?

Use [GitHub issues](https://github.com/tillwithered/flood.md/issues) for reproducible
bugs and API requests. For vulnerabilities, follow [SECURITY.md](../SECURITY.md)
and avoid posting exploit details or credentials in a public issue.

## Which fonts and icons does Flood use?

Flood's component implementations are original. Fonts and icon artwork have their
own authors and licenses:

| Asset | Where it is used | License |
| --- | --- | --- |
| [Inter](https://github.com/rsms/inter) | Locally bundled variable font in the React stylesheet | [SIL Open Font License 1.1](/licenses/inter.txt) |
| [Lucide](https://github.com/lucide-icons/lucide) | Website icons and documentation examples | [ISC, with included Feather-derived MIT notices](/licenses/lucide.txt) |
| [GitHub Primer Octicons](https://github.com/primer/octicons) | GitHub link mark on the website | [MIT](/licenses/github-mark.txt) |

The React component package does not depend on an icon pack. IconSlot and
IconButton accept SVG artwork from the host. Examples importing `lucide-react`
require that optional dependency in your project; you may substitute your own
icons. Preserve the corresponding license notices when redistributing assets.
The full Inter font provenance and license accompany the installed package.
