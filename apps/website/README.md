# Flood website

The website uses the current Flood packages and original page compositions.
It has a focused home page, six documentation guides and an overview plus a
detail page for each of the 18 exported components. This website-only change
keeps the published npm release at 0.2.2; it changes no library API or token values.

## Content

User guides are authored in the repository's `docs/` Markdown files. Vite bundles
the six explicitly selected guides at build time; rendering needs no GitHub API,
account, runtime fetch or CMS. GitHub remains the editing and review interface.
Relative guide links become website routes; other repository links lead to
GitHub. Raw HTML in Markdown is skipped. Tables and fenced code are supported.

`src/component-catalog.tsx` contains component descriptions, API tables and
simple examples alongside richer live previews. Examples use the same shipped
Flood controls as consumers. Clipboard and demo state belong to the website;
interactive examples do not persist data or call a backend. Markdown rendering
uses react-markdown and remark-gfm, not a third-party UI component implementation.

`routes.mjs` is the shared explicit page allowlist. Add a component route there
when adding a catalog entry. Unknown documentation/component paths keep returning
404. The runtime container needs both `server.mjs` and `routes.mjs`.

The website's GitHub mark comes from GitHub's Primer Octicons, pinned at
`9a274e212ee25c400ff666ce25a57866b7eacc25/icons/mark-github-16.svg`.
The original MIT notice is retained in `public/licenses/github-mark.txt`.
The asset is used to link to the Flood repository, not as Flood branding.

## Verification

Run `npm run verify` and `npm run test:browser` from the repository root.
Browser checks cover all direct guide/component URLs, code disclosure and copy,
native interactions, mobile navigation, relative text scaling and missing paths.
See [deployment](../../docs/deployment.md) for the hosting contract.
