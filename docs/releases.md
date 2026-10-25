# Release process

During the pre-1.0 0.2 stabilization series, an explicitly documented patch can
add compatible primitives or opt-in roles alongside corrections. Existing
signatures, defaults and token values must remain compatible. Any breaking
change needs a separate minor-version decision. Types, user/agent docs and exact
internal versions remain aligned for every release.

1. Confirm ownership of npm scope `@flood-md` (or update all names consistently).
2. Authenticate npm for the first publication. Run `npm run verify` and browser CI.
3. Review package tarballs (`npm pack --dry-run --workspace=<name>`).
4. Configure npm trusted publishers for each package, repository
   `tillwithered/flood.md`, workflow `release.yml`, environment `npm-release`.
   Staged package placeholders allow trust to be configured before the first
   public version. No long-lived npm token is required for this OIDC path.
5. Create a GitHub Release with the aligned version tag, such as `v0.2.0`; the release workflow verifies tag and
   package versions and publishes tokens → React → agent → CLI.
6. Configure required reviewers for GitHub environment `npm-release` if desired.
7. Verify the actual registry versions, install into a clean React project, and
   check the deployed landing page and its command.

After publishing, the release workflow runs `release:verify-registry` against the
actual npm versions. It creates a consumer outside the checkout, uses the installed
CLI for init/doctor, compares registry integrity and every installed agent file,
then builds Next.js and runs desktop/mobile hydration, form and foundation tests.
The consumer receives no publisher credentials. Its report is retained as a CI
artifact. Keep the website installation gate disabled until this step succeeds.

Do not create a release until scope ownership and authentication are ready.
After a partially completed publication, rerun the same workflow: it skips already
published versions only after comparing package integrity with the local tarball.
Different existing bytes fail the release instead of silently accepting a collision.

For an interactive first release, npm 12 staged publishing can submit tarballs
without bypass tokens: `npx npm@12.2.1 stage publish <tarball> --access public`.
After automated review, the owner approves each staged version with 2FA on npm.
Configure OIDC after a new package exists; do not upload a duplicate staged
version just to retry. Account-specific setup records belong outside this repo.

The website's src/release.json published flag must remain false until all public
package versions and a real CLI installation have been verified.

Later releases bump all four package versions, CLI VERSION and shipped docs/site
command together, update CHANGELOG.md and test the migration. `release:check`
checks package versions and internal dependency pins; reviewers must check docs.

## Releasing 0.2.0

The 0.2.0 release process verifies actual registry availability. New
public React APIs and the foundation profile require a minor release rather
than a 0.1.x correction. All four packages, private workspaces, CLI version,
agent guide/manifest and website command belong to the same release train.

Keep `apps/website/src/release.json` at `published: false` until tokens, React,
agent and CLI 0.2.0 are verified on npm and a real CLI installation succeeds.
The candidate's site and plain-text endpoint must say that publication is
pending. After registry verification, enable the installation command in a
separate change. Do not describe an unsubmitted candidate as staged on npm.

## Numeric controls: next small cohort

The 0.2.5 source candidate adds NumberInput and Slider. These are compatible
additions under the documented pre-1.0 patch policy; existing component APIs and
token values remain unchanged. Prepare all four packages together and keep the
website publication flag false until actual registry installation is verified.
NumberInput/Slider behavior and limitations are documented in base-components.md.
