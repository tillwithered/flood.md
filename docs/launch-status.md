# Launch status · 22 October 2026

## Completed

- Public source: https://github.com/tillwithered/flood.md
- Previous desktop repo renamed flood-desktop and archived; private flood-dev and
  flood.md-web archived. Verified mirror backups are local in ignored .backups/.
- Original React/TypeScript components, semantic tokens, CLI and agent packages.
- React build, TypeScript checks, 10 unit/contract tests, clean tarball installation,
  Next.js production build, and 6 desktop/mobile browser tests passed locally.
- GitHub CI passed at commit 141e24d.
- Free npm organization flood-md belongs to tillwithered.
- Four 0.1.0 packages submitted to npm staged publishing; not publicly installable yet.
- Railway web source switched to this repository, main branch. Typed infrastructure
  applied as partial flood-design-web: only web, no resource deletions.

## Publication still pending

npm requires a completed security-key/passkey 2FA setup. Email login approval alone
does not satisfy publication requirements. The user must complete credential setup
on npm; never collect a password, OTP or recovery codes in project files or chat.

Staged release IDs:

| Package          | Stage ID                             |
| ---------------- | ------------------------------------ |
| @flood-md/tokens | e9833a6b-4791-4d26-a5bf-8492b7e80761 |
| @flood-md/react  | 47b6360b-7fdb-43a3-91f3-e4168ce6b154 |
| @flood-md/agent  | 55317230-f515-4d23-85e2-ae099434fbf0 |
| @flood-md/cli    | 4dd82fa5-e5b7-49ae-b49e-f4898911719d |

After npm automated review and owner approval, verify all four 0.1.0 versions on
the public registry and test `npx @flood-md/cli@0.1.0 init` in a clean consumer.
Configure trusted publishers for release.yml and npm-release, then set
apps/website/src/release.json published=true and deploy. Do not announce the command
as available before those checks pass.

## Hosting still pending

Railway reports a platform outage: https://status.railway.com . Latest website
deployment at this checkpoint: cfe00184-5f20-4f23-9f0c-bffc1e2dae57, queued for
commit 141e24d. Do not keep submitting identical deployments. Domain flood.md and
generated web-staging-2548.up.railway.app remain attached to web in staging, port 3000.
Verify actual deployment and endpoints after the queue clears. The new site has
not been verified live; existing backend services/volumes have not been deleted.

This is a dated checkpoint, not live service state. Re-read GitHub, npm and Railway
before continuing external mutations.
