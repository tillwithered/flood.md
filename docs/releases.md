# Release process

1. Confirm ownership of npm scope `@flood-md` (or update all names consistently).
2. Authenticate npm for the first publication. Run `npm run verify` and browser CI.
3. Review package tarballs (`npm pack --dry-run --workspace=<name>`).
4. Create a GitHub Release with tag `v0.1.0`; the release workflow verifies tag and
   package versions and publishes tokens → React → agent → CLI.
5. Configure npm trusted publishers for each package, repository
   `tillwithered/flood.md`, workflow `release.yml`, environment `npm-release`.
   For the first publish only, configure environment secret NPM_TOKEN with a
   narrowly scoped npm token. Remove it after trusted publishing is configured.
6. Configure required reviewers for GitHub environment `npm-release` if desired.
7. Verify the actual registry versions, install into a clean React project, and
   check the deployed landing page and its command.

Do not create a release until scope ownership and authentication are ready.
After a partially completed publication, rerun the same workflow: it skips already
published versions only after comparing package integrity with the local tarball.
Different existing bytes fail the release instead of silently accepting a collision.

Later releases bump all four package versions, CLI VERSION and shipped docs/site
command together, update CHANGELOG.md and test the migration. `release:check`
checks package versions and internal dependency pins; reviewers must check docs.
