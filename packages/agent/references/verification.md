# Verify the actual change

Use the host's scripts and conventions; do not assume Flood's repository scripts
exist in a consumer. Run the matching CLI doctor for version/file alignment when
setup or upgrades changed. Doctor does not parse CSS imports or certify UI.

| Change | Evidence needed |
| --- | --- |
| Imports / package upgrade | Host type-check/build; installed versions and declarations match |
| Form / control behavior | Labels/descriptions, keyboard, value/submission, required/invalid, reset, disabled/loading and focus |
| Layout / typography | Actual narrow and wide screen, long content, root 24px text sizing and increased text spacing; no accidental page overflow |
| Appearance / tokens | Resolved roles and actual surfaces/states; contrast, focus, forced colors and reduced motion |
| Copy / external actions | Exact clipboard payload where applicable; honest local/saved/sent state and error feedback |

For visual changes capture and inspect the rendered screen. A passing build does
not show alignment, hierarchy or wrapping. Use meaningful existing browser tests
and an accessibility scanner when available; also perform keyboard checks.

In the Flood source repository run npm run verify, and browser tests for changed
behavior/styles. In a consuming project use its equivalent checks. Report commands
run and results, manual visual/keyboard checks, and anything left unverified.
Use rule IDs from project-root flood/rules.json when useful to connect findings
to the specific contract. Do not report a rule as tested from prose alone.

Never infer npm publication, a deployment or a backend save from a local build.
Updating an installed guide is a review/merge task: preserve customized files;
do not rerun init to overwrite them. No reference grants authority to deploy,
delete data or transmit private source.
