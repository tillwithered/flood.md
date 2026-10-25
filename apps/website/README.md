# Flood website

The website uses the current Flood packages and original page compositions.
Home, guides, component pages and /playground share one SiteHeader composition.
Its navigation uses Flood Link button variants and IconSlot; only brand and
page layout remain website styles. Header dimensions are shared across routes.
The reader composes Breadcrumb, SegmentedControl (import mode), Collapsible
(mobile navigation and adapter source), Surface/Stack/Inline/Text (catalog cards),
Link button variants (sidebar, categories and previous/next), and Label (lab
controls). Markdown prose, semantic HTML tables and page grids remain website
content rather than pretending to be library components. Document scrollbars use
the same foundation tokens through the explicit dark scope on the HTML root;
page scrolling remains native with forced-color fallback and a stable gutter.
It has a focused home page, eight documentation guides and an overview plus a
detail page for each of the 62 exports in the 0.2.5 source candidate. Installation availability follows
the verified publication gate in src/release.json.

## Content

User guides are authored in the repository's `docs/` Markdown files. Vite bundles
the guides listed in routes.mjs at build time; rendering needs no GitHub API,
account, runtime fetch or CMS. GitHub remains the editing and review interface.
Relative guide links become website routes; other repository links lead to
GitHub. Raw HTML in Markdown is skipped. Tables and fenced code are supported.

`src/component-catalog.json` contains component descriptions, explicit import
names and editorial examples. API tables and explicit defaults come from the
React TypeScript source through the AST-based contract reader, not a duplicated
manual list. The build emits ignored generated reader data and Markdown files.
`src/component-groups.json` supplies stable category IDs, labels, descriptions
and ordering for the sidebar, overview, pagination and generated catalog Markdown.
Each available component has one primary category; categories describe purpose,
not an atomic-design implementation tier. Unknown categories fail the build.
The sidebar search matches names, descriptions and categories; the overview
uses the same filter. No unavailable components are advertised as installable.
`src/component-workbench.tsx` describes
supported controls and declarative example recipes. The same recipe renders the
real Flood components and prints valid TSX, so the selected props and copied
example stay aligned. Reset restores inputs; ordinary state changes preserve
native focus. Examples do not persist data or call a backend. Markdown rendering
uses react-markdown and remark-gfm, not a third-party UI component implementation.

Preview scenes have a fixed relative height for each example category. Prop
changes do not resize the scene; oversized content scrolls inside it. Live
feedback stays in a separate positioned region and does not enter the sample's
layout. This preview-only presentation is not added to the printed recipe.
Field examples reserve description rows so validation does not shift the control.

The build compares public runtime exports, catalog entries, routes and live
recipe coverage. Undocumented exports or missing recipes block the build and
therefore the existing verify/release workflow. Version labels follow release.json;
stale pinned installation commands in guides also block the build. Explanatory
prose and new examples still need review in the patch that adds the behavior.
Generating pages does not itself deploy a website or publish a package.

Package and Project UI modes print the same recipe with different imports.
The optional `@/ui/button` boundary uses small project-owned re-exports and a
CSS bridge. It does not copy component implementations or change their platform.
The reader includes only the adapters needed by its current recipe.

There is no separate reader-format mode. Copy for agent sits beside Reset in the
playground and includes the current lab example, API, notes and governing guide
links. Code blocks independently offer Copy code. Canonical `/docs.md`, `/docs/installation.md`,
`/components.md` and `/components/button.md` files are generated at build time
from the same repository content and contain default examples. They are served
as `text/markdown`; unknown files keep returning 404. No code is evaluated from
Markdown. Raw HTML is skipped.

`src/code-block.tsx` highlights supported code with local, lazy Shiki grammars
and a bundled engine. It renders safe React spans and copies the untouched
original text. Plain text remains available if highlighting fails. The language,
filename and copy action have a separate toolbar instead of covering the code.

`routes.mjs` is the shared explicit page allowlist. Component routes come from
the catalog slugs; a new documented component does not need a second route list.
Unknown documentation/component paths keep returning 404. The runtime container
needs `server.mjs`, `routes.mjs` and the small public catalog JSON.

The website's GitHub mark comes from GitHub's Primer Octicons, pinned at
`9a274e212ee25c400ff666ce25a57866b7eacc25/icons/mark-github-16.svg`.
The original MIT notice is retained in `public/licenses/github-mark.txt`.
The asset is used to link to the Flood repository, not as Flood branding.

Inter is bundled with the React stylesheet under SIL OFL 1.1; Lucide supplies
website/example SVGs under ISC with upstream Feather MIT notices. Full notices
are served at `/licenses/inter.txt`, `/licenses/lucide.txt` and
`/licenses/github-mark.txt`. The FAQ identifies their roles. No icon pack is a
runtime dependency of the React component package.

## Verification

Run `npm run verify` and `npm run test:browser` from the repository root.
Browser checks cover all direct guide/component URLs, code disclosure and copy,
native interactions, mobile navigation, relative text scaling and missing paths.
See [deployment](../../docs/deployment.md) for the hosting contract.

ScrollArea powers bounded code, table and navigation regions; the website uses
Flood controls for its own playground settings. npm run site:check tests a
runtime-only deploy artifact; /site-release.json identifies its source commit.
