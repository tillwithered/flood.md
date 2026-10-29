# Release process

During the pre-1.0 0.2 stabilization series, an explicitly documented patch can
add compatible primitives or opt-in roles alongside corrections. Existing
signatures, defaults and token values must remain compatible. Any breaking
change needs a separate minor-version decision. Types, user/agent docs and exact
internal versions remain aligned for every release.

1. Confirm ownership of npm scope `@flood-md` (or update all names consistently).
2. Authenticate npm for the first publication. Merge the candidate through the
   required `verify` check and wait for its exact protected-main CI to succeed.
3. Review package tarballs (`npm pack --dry-run --workspace=<name>`).
4. Configure npm trusted publishers for each package, repository
   `tillwithered/flood.md`, workflow `release.yml`, environment `npm-release`.
   Staged package placeholders allow trust to be configured before the first
   public version. No long-lived npm token is required for this OIDC path.
5. Create a GitHub Release with the aligned version tag targeting that exact
   successful main commit. The publisher downloads the candidate from that CI
   run, validates its commit, tree, lockfile, version and archive hashes, then
   publishes tokens → React → agent → CLI. It does not rebuild or repeat the
   candidate's browser suite. Missing, expired or mismatched artifacts fail closed.
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

To recover a workflow failure before or during publication, dispatch Publish
packages with the existing stable release tag. It validates that the GitHub
Release is published, checks out that tag and promotes only its successful exact
main candidate. It never moves the tag or rebuilds archives. The container trusts
only its mounted checkout for Git ownership checks; neighboring directories are
not trusted. Resume with the corrected workflow definition when the tagged
workflow itself caused the failure.

## Verification and promotion

Ordinary implementation-only PRs use the public component dependency closure to
select exhaustive catalog variants, including composites. Shared behavior and
indirect fixture suites remain enabled: literal component-name matching is not
treated as a complete test dependency graph. Unknown paths, shared styles,
tokens, recipes, dependency updates and workflow changes retain full coverage.
Type checks, unit tests, clean tarball consumers and the Next build remain gates.
Explicit per-component playground recipe/control edits use a bounded AST comparison:
only the named slug branches can narrow coverage. Shared rendering, helpers,
defaults, unknown registries and fallthrough retain the full suite. Direct-page
checks are individual tests per route, so catalog growth is shardable and a
single route failure does not restart a complete catalog traversal.
The CI workflow can also be dispatched manually for a full regression. Manual
runs do not produce promotable npm candidates; publication still requires the
successful push run for that exact main commit.
The generated CI plan is visible in logs and the build artifact. A local preview
does not require a release or version bump.

Protected-main CI runs the complete candidate. One build feeds Chromium and
Firefox/WebKit shards. At 120 components this is four Chromium shards and two
shards for each other engine. Full-candidate runner counts grow with the catalog,
bounded at twelve Chromium and four shards per other engine; scoped PRs retain
a fixed runner budget. The pinned Playwright image provides
matching browsers and system dependencies. Updating Playwright also requires
updating that image and digest. `verify` aggregates every applicable job and
fails on a failed, cancelled or unexpectedly skipped dependency.

`package-smoke` creates the npm archives it tests. `ci:candidate` retains those
same bytes, not a later repack. The publisher only accepts artifacts from a
successful push CI on main for the exact tag commit in this repository; PR
artifacts cannot become npm releases. Candidate artifacts expire after 14 days.
If expired, prepare a new reviewed main candidate; do not silently rebuild at
publication time. Registry consumer verification remains a separate real npm
installation check, including equality to the candidate's package integrity.

Releases remain explicit GitHub Release events. Merging component or website
work does not publish npm or automatically increase a version. Group compatible
changes into a reviewed candidate and choose its version deliberately.

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

Version 0.2.5 adds NumberInput and Slider. These are compatible
additions under the documented pre-1.0 patch policy; existing component APIs and
token values remain unchanged. Prepare all four packages together and keep the
website publication flag false until actual registry installation is verified.
NumberInput/Slider behavior and limitations are documented in base-components.md.
