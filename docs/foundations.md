# Experimental foundations tokens

Unreleased API. These subpaths are not in npm release 0.1.1. The next publication
containing them requires an aligned minor release of the Flood packages.

Foundations separates fixed reference values (`ref`) from semantic roles (`sys`).
The compiler also supports component aliases (`comp`) and isolated experiments
(`exp`); no component-specific tokens are shipped in this first profile.

## Use the neutral dark profile

```tsx
import "@flood-md/tokens/foundations.css";

<section data-flood-foundations="neutral" data-flood-theme="dark">
  <p className="example">Content</p>
</section>;
```

```css
.example {
  color: var(--flood-sys-color-content-default);
  background: var(--flood-sys-color-surface-canvas);
}
```

Both attributes belong on the same scope element. This opt-in stylesheet only
defines tokens and `color-scheme`; it does not style elements, replace React
component tokens or enable an incomplete light theme. The preset and theme are
separate dimensions. Only `neutral` + `dark` is currently supplied.

## Inspect names and decisions

```ts
import { tokenNames, type TokenName } from "@flood-md/tokens/foundations";

const role: TokenName = "sys.color.content.default";
const cssVariable = tokenNames[role]; // --flood-sys-color-content-default
```

`foundations.manifest.json` describes public roles, types, status, usage limits,
resolved values, aliases and dependencies for each supplied context. Internal
reference tokens are absent from the TypeScript lookup and are not listed as
public manifest entries; alias/dependency metadata can still name their IDs.
`neutral.dark.tokens.json` is a resolved diagnostic DTCG document including the
internal reference graph's values. Internal names are not customization promises.

The initial public roles cover canvas/default/raised/overlay surfaces,
default/subtle content, decorative borders/dividers, and focus width/offset.
Subtle content is for short supplementary labels and metadata. It is not a
universal small-body-text color or an automatic APCA pass. Decorative borders
must not be used as the sole required control boundary. No action, field-border,
focus-color or material palette is implied by this subset.

## Override and scope

Override a public `sys` variable on its scope element, using inline styles or a
stylesheet loaded afterward. Aliases remain CSS `var()` references. Nested
scopes repeat both attributes so dependent aliases resolve against the nested
values rather than inheriting already computed aliases from the parent.

Arbitrary descendant overrides without a new scope are not supported. Portal
containers must explicitly receive the same scope attributes and overrides.
Changing an internal `ref` value is useful for diagnostics but not a stable API.

## Source and compiler profile

Only `packages/tokens/src/tokens.json` authors values. Its versioned Flood
envelope contains `legacy`, `sets.shared`, `sets.palette`, `sets.theme` and
`presets`. This envelope is not itself a DTCG Format document. Sets contain
nested tokens with explicit `$type`, `$value`, `$description` and `md.flood`
metadata. Build artifacts are generated and must not be edited.

The first compiler profile supports sRGB color, nonnegative px/rem dimension,
ms/s duration, finite number, numeric fontWeight, fontFamily and cubicBezier.
Aliases refer to whole tokens using `{sys.color.content.default}` syntax.
Composite types, JSON Pointer references, group inheritance, density modifiers,
other color spaces and the full DTCG Resolver API are not supported; unsupported
input fails instead of being silently coerced. This is not a full DTCG
implementation or a claim of accessibility conformance.

Build rejects missing/cyclic references, mismatched types, overlapping sets,
invalid names and CSS-name collisions, disallowed layer dependencies,
cross-component aliases, and stable-to-experimental dependencies. All supplied
contexts must expose the same public role/type contract. Palette/reference
values are fixed; themes choose roles instead of changing reference values.

## Compatibility

Existing `@flood-md/tokens` JSON and `tokens.css` retain their shared/light/dark
contract and `--flood-*` names. Existing React controls still use those tokens;
old custom overrides continue to apply. There is no automatic bridge that
pretends a legacy override also changes a new, separately scoped role.

Adding these exports is an unreleased additive change. All package versions
remain aligned until release preparation; no existing npm version is replaced.
