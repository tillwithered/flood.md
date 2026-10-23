# @flood-md/tokens

Semantic Flood CSS custom properties. Import `@flood-md/tokens/tokens.css`, or
import the React package stylesheet, which includes these tokens. Default theme
follows the OS; root `data-flood-theme="light"` / `"dark"` chooses a theme.
Override semantic variables after the import. JSON export contains shared, light
and dark maps. Source values live in src/tokens.json in the repository.

## Experimental foundations (unreleased)

The source envelope also compiles typed reference/semantic tokens. The additive
`./foundations`, `./foundations.css`, `./foundations.manifest.json` and
`./neutral.dark.tokens.json` exports are unreleased and require the next aligned
minor release; npm 0.1.1 does not contain them. The existing exports keep their
original contract. See [the foundations guide](../../docs/foundations.md) for
scope attributes, supported types, public roles and usage limitations.
