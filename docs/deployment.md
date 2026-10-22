# Railway deployment

The Docker image builds the site and runs a dependency-free Node HTTP server as
an unprivileged user. It honors PORT, exposes /health and returns real 404s for
missing machine-readable files. No database or volume is required.

Connect `tillwithered/flood.md`, branch `main`, repository root, with railway.json.
Enable Wait for CI. Attach the existing flood.md custom domain after verifying
the new service on its generated domain. Inspect existing service/domain ownership
before replacing anything. Preserve the old deployment until the new one passes.

Check /, /health, /llms.txt, /agent/DESIGN.md and /schema/config.json. Test the
installation command against published npm packages before announcing the site.

Existing Railway project: `flood-md` (`d77af5a1-bd0e-4a80-aaae-cce206a48bf9`).
The custom domain currently belongs to `web` in **staging**, not production.
Preserve that domain attachment while replacing the web source and Dockerfile
configuration. Legacy backend services and their data are outside this migration.
Do not treat local build success as evidence of a public deployment.
