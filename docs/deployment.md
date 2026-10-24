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

The runtime also includes `apps/website/routes.mjs`, the explicit page allowlist.
Known `/docs` and `/components` pages serve the website entry; unknown paths
return 404. Documentation Markdown is bundled at build time from `docs/` and
does not depend on a live GitHub connection.

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
