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
Known `/docs` and `/components` pages serve the website entry; unknown paths
return 404. Documentation Markdown is bundled at build time from `docs/` and
does not depend on a live GitHub connection.

The build also emits canonical Markdown counterparts for the documentation and
component pages. For example `/docs/installation.md` and `/components/button.md`
return `text/markdown` with the default documented example. The contextual Copy for agent action includes the current lab settings and
links to the installed-version rules. Raw files keep the default example.

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

Publication-only website checks: CI uses a smaller route only when the entire diff
is the boolean published switch in apps/website/src/release.json at the same
version, with no extra fields. It still builds packages/site, checks TypeScript,
runs unit and isolated-runtime checks and exercises landing/docs/playgrounds in
Chromium. Mixed, unknown, version, dependency and component changes retain full
React consumer, Next and browser-engine verification. Release publication always
uses the full pipeline. The required verify status and checked runtime artifact
remain unchanged.
