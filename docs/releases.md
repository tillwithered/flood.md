# Release process

1. Confirm ownership of npm scope `@flood-md` (or update all names consistently).
2. Authenticate npm for the first publication. Run `npm run verify` and browser CI.
3. Review package tarballs (`npm pack --dry-run --workspace=<name>`).
4. Configure npm trusted publishers for each package, repository
   `tillwithered/flood.md`, workflow `release.yml`, environment `npm-release`.
   Staged package placeholders allow trust to be configured before the first
   public version. No long-lived npm token is required for this OIDC path.
5. Create a GitHub Release with tag `v0.1.0`; the release workflow verifies tag and
   package versions and publishes tokens → React → agent → CLI.
6. Configure required reviewers for GitHub environment `npm-release` if desired.
7. Verify the actual registry versions, install into a clean React project, and
   check the deployed landing page and its command.

Do not create a release until scope ownership and authentication are ready.
After a partially completed publication, rerun the same workflow: it skips already
published versions only after comparing package integrity with the local tarball.
Different existing bytes fail the release instead of silently accepting a collision.

For an interactive first release, npm 12 staged publishing can submit tarballs
without bypass tokens: `npx npm@12.2.1 stage publish <tarball> --access public`.
After automated review, the owner approves each staged version with 2FA on npm.
Existing staged versions are listed in docs/launch-status.md. Configure OIDC
after the packages exist; do not upload a duplicate staged version just to retry.

The website's src/release.json published flag must remain false until all public
package versions and a real CLI installation have been verified.

Later releases bump all four package versions, CLI VERSION and shipped docs/site
command together, update CHANGELOG.md and test the migration. `release:check`
checks package versions and internal dependency pins; reviewers must check docs.
