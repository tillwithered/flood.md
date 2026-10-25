# Hosting the public website

The website is a static React application with public agent guides and a JSON
schema. The production container serves only its built dist directory through a
dependency-free Node HTTP server. It runs as an unprivileged user and needs no
database, account system, volume or application secrets.

## Local production build

```sh
npm ci
npm run build
npm start
```

The server listens on PORT, defaulting to 4173. The root Dockerfile builds the same
output in a Node 24 image and starts the server. Container runtime contents are
limited to the built website and server entry; source and build dependencies stay
in the build stage.

The runtime also includes `apps/website/routes.mjs` and its catalog JSON inventory,
which define the explicit page allowlist.
Known `/docs` and `/components` pages serve their own prerendered HTML; unknown paths
return 404. Documentation Markdown is bundled at build time from `docs/` and
does not depend on a live GitHub connection.

The build also emits canonical Markdown counterparts for the documentation and
component pages. For example `/docs/installation.md` and `/components/button.md`
return `text/markdown` with the default documented example. The contextual Copy for agent action includes the current lab settings and
links to the installed-version rules. Raw files keep the default example.

## Search indexing

The build generates visible page content before JavaScript runs, individual
titles/descriptions, canonical URLs and Open Graph metadata for public pages.
`/sitemap.xml` lists the home, guides, catalog and components from the shared
route inventory; `/robots.txt` advertises it. Canonical URLs use `https://flood.md`
and omit query strings and trailing slashes. No artificial last-modified dates
are emitted. Update the shared siteOrigin if the public domain changes.

Catalog growth needs no separate SEO registration or page-count update. Adding a
component requires its source export, catalog entry, category and working recipe;
the existing build contract rejects missing documentation or recipe coverage.
Each successful build regenerates HTML, metadata, Markdown and the sitemap from
that inventory, and indexing tests visit every current public route. Keep stable
component slugs across releases so existing search links keep working. A renamed
or removed public URL needs an explicit redirect decision in the same change.
New content reaches the public site through the normal verified main deployment;
adding it only to a local branch does not publish or index it.

`/playground` and `/playground/content` remain client-rendered verification
surfaces and return `noindex, follow` in HTML and HTTP headers. Do not block them
in robots.txt, which would prevent crawlers from seeing noindex. Markdown
counterparts remain available for agent use and return noindex plus an HTTP
canonical Link to their HTML equivalent. HTML path aliases redirect permanently;
unknown paths retain real 404 responses.

After deployment, check the raw response of a guide and a component, not only
the browser DOM: the heading, text/API, description and canonical must already
be present. Also check sitemap/robots, a Markdown response, redirects and 404s.
`site:verify-deploy` probes representative prerendered pages and search files.

If a CDN or hosting layer generates robots.txt, inspect the public response and
ensure it retains sitemap discovery and permits the public pages. A locally
correct file does not prove the edge serves it unchanged.

Search Console can be used by the domain owner to submit the sitemap and inspect
the indexed/rendered HTML. That account setup is separate from the repository.
Successful build, deployment or sitemap submission does not guarantee indexing
or a particular ranking. No analytics service is added by this work.

For an isolated browser run alongside another checkout, set
`FLOOD_WEBSITE_TEST_URL=http://127.0.0.1:4273` and
`FLOOD_NEXT_TEST_URL=http://127.0.0.1:3101` using your shell's environment syntax,
then run `npm run test:browser`. The test servers use the selected ports; defaults
remain 4173 and 3001. Use free loopback ports for local verification.

## Hosting contract

- Build from the repository root using the Dockerfile.
- Set the hosting platform's port to match PORT and configure /health as the probe.
- Wait for the required verify check before deploying a public source commit.
- Keep credentials in service secret stores, never source or build assets.
- Configure TLS and domain routing in the hosting platform.

Account-specific infrastructure and operational records are maintained separately
from this repository. Contributors do not need access to those records to build
or test the site. Do not deploy a private operations checkout as website source.

## Verification

Check /, /health, /llms.txt, /agent/DESIGN.md, /agent/SKILL.md and
/schema/config.json. Missing paths should return 404. Verify the installed npm
packages and real CLI installation before enabling the site's installation command
in apps/website/src/release.json. A successful local build is not proof of a live
deployment; inspect the deployed endpoints after the rollout.


## CI and rollout verification

The required `verify` job builds packages, declarations, the website and Next
example, tests safe installation and then runs `npm run site:check`. This last
check creates an isolated runtime-only bundle, starts its real Node server on an
ephemeral port and verifies agent manifest references, media types, actual guide
contents, health, HEAD, missing paths and rejected write methods. Browser checks
then verify UI behavior. Only successful CI uploads the checked runtime artifact.

Every website build emits `/site-release.json` with package version, source commit
and a dirty-source marker. Local previews can be dirty; deployment verification
requires the exact clean commit that passed CI. Docker declares Railway's commit
build argument so a source build without `.git` retains that provenance.

Railway continues to deploy protected `main` through its GitHub integration. Keep
Wait for CI enabled in the service settings; the setting is account-specific and
must be inspected on the service rather than inferred from a green PR. See the
[Railway documentation](https://docs.railway.com/deployments/github-autodeploys#wait-for-ci).
The read-only `Verify website deployment` workflow runs after successful main-push
CI, waits for that source commit and probes the actual public agent/doc endpoints.
A mismatched or missing commit marker fails this check; a green build alone is
not a successful rollout. This workflow never deploys or grants Railway access.

For a manual rollout check:

```sh
WEBSITE_URL=https://your-site.example EXPECTED_COMMIT=<full-git-sha> npm run site:verify-deploy
```

Set the same variables through your shell's environment mechanism on Windows.
The verifier needs Node24 and no npm dependencies. Its default deadline is ten
minutes. Hosting supplies rollback/redeploy; rerun the endpoint/commit check after
any rollback using its intended commit. Keep npm publication and website rollout
separate: the installation command is enabled only after real registry checks.

Runtime artifacts contain built public assets, server/routes and catalog data,
plus a non-root runtime Dockerfile. They contain no account configuration, npm
credentials, source dependency tree or private Design Lab notes. Inspect a local
artifact with `npm run site:bundle`; this does not upload or deploy anything.
