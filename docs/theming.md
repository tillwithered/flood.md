# Theming

Flood styles use semantic CSS custom properties prefixed with `--flood-`.
Import the Flood stylesheet before your project overrides.

```tsx
import "@flood-md/react/styles.css";
import "./theme.css";
```

Without an explicit theme, Flood follows `prefers-color-scheme`. Set
`data-flood-theme="light"` or `data-flood-theme="dark"` on the root element to
choose a theme. In Next.js, set the initial attribute consistently on the server
and client to avoid a hydration mismatch.

```css
/* theme.css: choose colors with sufficient contrast in each theme. */
:root,
[data-flood-theme="light"] {
  --flood-action: #174a37;
  --flood-action-text: #ffffff;
  --flood-focus: #174a37;
}

[data-flood-theme="dark"] {
  --flood-action: #b7e5cb;
  --flood-action-text: #132a20;
  --flood-focus: #b7e5cb;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-flood-theme="light"]) {
    --flood-action: #b7e5cb;
    --flood-action-text: #132a20;
    --flood-focus: #b7e5cb;
  }
}
```

Useful tokens include `canvas`, `surface`, `text`, `muted`, `border`, `action`,
`action-text`, `focus`, `danger`, `disabled`, `disabled-text`, spacing, radii and
control height. See the [authored token definitions](../packages/tokens/src/tokens.json)
for exact names and defaults. The npm tokens package exports CSS through
`@flood-md/tokens/tokens.css` and JSON through its package entry `@flood-md/tokens`.

Prefer token overrides for project styling. You can also pass className and native
HTML props to controls. Flood does not provide a theme editor or project-specific
token generation in v0.1.
