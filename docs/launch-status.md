# Launch status · 22 October 2026

## Completed

- Public source: https://github.com/tillwithered/flood.md
- Previous desktop repo renamed flood-desktop and archived; private flood-dev and
  flood.md-web archived. Verified mirror backups are local in ignored .backups/.
- Original React/TypeScript components, semantic tokens, CLI and agent packages.
- React build, TypeScript checks, 10 unit/contract tests, clean tarball installation,
  Next.js production build, and 8 desktop/mobile browser tests passed locally.
- GitHub CI passed at commit e974c09 (run 39777348689).
- Free npm organization flood-md belongs to tillwithered.
- All four packages publicly published at 0.1.0: @flood-md/tokens, @flood-md/react,
  @flood-md/agent and @flood-md/cli.
- Clean public-registry consumer passed CLI dry-run, real init, doctor, exact
  package versions, preservation of host AGENTS.md and component SSR.
- Railway web source switched to this repository, main branch. Typed infrastructure
  applied as partial flood-design-web: only web, no resource deletions.

## Publication verified

npm security-key 2FA is configured. All four packages trust GitHub repository
tillwithered/flood.md, workflow release.yml and environment npm-release. Initial
staged uploads were individually approved by the owner. The first GitHub publish
attempt authenticated but encountered the staged-version lock. On retry, tokens,
React and agent matched exactly; CLI differed only in the executable file mode
between the Windows-staged archive and Linux build. Version 0.1.1 was accepted by
npm entirely from Linux GitHub Actions with provenance. Release workflow passed:
https://github.com/tillwithered/flood.md/actions/runs/39777351243 .

At this checkpoint the public registry still returns 404 for 0.1.1. npm reports
degraded publishing, package views and installation: https://status.npmjs.org/ .
Do not submit duplicate versions. Recheck actual public availability before
enabling the 0.1.1 website command and repeat the clean registry consumer check.

Approved staged release IDs (historical):

| Package          | Stage ID                             |
| ---------------- | ------------------------------------ |
| @flood-md/tokens | e9833a6b-4791-4d26-a5bf-8492b7e80761 |
| @flood-md/react  | 47b6360b-7fdb-43a3-91f3-e4168ce6b154 |
| @flood-md/agent  | 55317230-f515-4d23-85e2-ae099434fbf0 |
| @flood-md/cli    | 4dd82fa5-e5b7-49ae-b49e-f4898911719d |

All four 0.1.0 versions and a clean public-registry installation are verified.
The website's release availability flag remains disabled for 0.1.1 until the new
registry versions and installation are checked. First release:
https://github.com/tillwithered/flood.md/releases/tag/v0.1.0 .

## Hosting verified

Railway deployment cfe00184-5f20-4f23-9f0c-bffc1e2dae57 succeeded for commit 141e24d.
https://flood.md/health and /llms.txt respond successfully. Domain flood.md and
generated web-staging-2548.up.railway.app remain attached to web in staging, port 3000.
The updated e974c09 deployment cc1c400a-b775-4f07-a64e-cac95dffe755 is queued.
Railway reports an ongoing platform outage: https://status.railway.com/ . Do not
submit the same deployment repeatedly. A CLI upload was skipped by the old watch
filter; the reviewed infrastructure plan now clears watchPatterns so all changes
can trigger builds. Existing backend services/volumes have not been deleted.

This is a dated checkpoint, not live service state. Re-read GitHub, npm and Railway
before continuing external mutations.
