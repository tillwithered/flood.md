# Generated runtime token reference

Version: **1.2.0**. Status: **runtime-quiet-workbench-anchor**.

Generated from [the single authored token source](../../../src/design/tokens.json); edit that source and run `node scripts/design-contract.mjs --write`.
The application imports [generated runtime CSS](../../../src/design/tokens.css) through `src/styles.css`. The documentation specimen receives the same generated values. The former candidate path is a [compatibility pointer](../tokens.target.json), not a second token source.
This initial foundation migration preserves current page gutters, content widths and desktop sidebar geometry. Native visual and interaction acceptance is separate from token validation.

## Semantic colors

| Token | Light | Dark | Purpose |
| --- | --- | --- | --- |
| `--background` | `#ffffff` | `#141414` | — |
| `--canvas` | `#f7f7f7` | `#101010` | Neutral outer shell without a warm or cool cast; shared runtime foundation. |
| `--canvas-depth` | `#eeeeee` | `#090909` | Subtle darker endpoint for the outer shell's vertical depth gradient; never a page or working-surface fill. |
| `--surface` | `#f7f7f7` | `#1c1c1c` | Subtle grouping; not a requirement to put every row on a card. |
| `--elevated` | `#ffffff` | `#242424` | — |
| `--field` | `#f7f7f7` | `#1c1c1c` | — |
| `--hover` | `#f0f0f0` | `#282828` | — |
| `--selected` | `#e8e8e8` | `#303030` | — |
| `--pressed` | `#dedede` | `#383838` | Ordinary control pressed background; state is not conveyed by color alone. |
| `--selection` | `#dedede` | `#383838` | — |
| `--ink` | `#171717` | `#f5f5f5` | — |
| `--muted` | `#525252` | `#c2c2c2` | — |
| `--faint` | `#626262` | `#a3a3a3` | Optional metadata only, while retaining 4.5:1 on supported neutral surfaces. |
| `--on-ink` | `#ffffff` | `#141414` | — |
| `--line` | `#e5e5e5` | `#383838` | Decorative structural divider only; never the sole meaningful field boundary. |
| `--soft-line` | `#ededed` | `#292929` | Low-emphasis internal divider; not an accessibility indicator. |
| `--line-strong` | `#737373` | `#919191` | Meaningful boundary against supported neutral backgrounds. |
| `--focus-ring` | `#171717` | `#f5f5f5` | — |
| `--focus-halo` | `#d4d4d4` | `#525252` | Low-emphasis outer layer of the two-layer focus treatment; the inner focus-ring remains the decisive boundary. |
| `--notice-info-action` | `#171717` | `#f5f5f5` | Dedicated action material for informational notices; notice actions do not reuse ordinary button variants. |
| `--notice-info-action-hover` | `#303030` | `#e5e5e5` | — |
| `--notice-info-action-pressed` | `#404040` | `#d4d4d4` | — |
| `--on-notice-info-action` | `#ffffff` | `#141414` | — |
| `--danger-surface` | `#fef2f2` | `#301b1b` | — |
| `--danger-hover` | `#fee2e2` | `#452020` | Hover surface for destructive controls; interaction changes the surface and never adds link underlining. |
| `--danger-pressed` | `#fed8d8` | `#5a2424` | Pressed surface for destructive controls with retained danger-ink contrast. |
| `--danger-focus-halo` | `#fecaca` | `#5a2424` | Soft outer layer for destructive and invalid focus; pair with danger-ink as the inner boundary. |
| `--danger-ink` | `#b91c1c` | `#fca5a5` | — |
| `--notice-danger-action` | `#b91c1c` | `#fca5a5` | Dedicated destructive action material owned by a danger notice. |
| `--notice-danger-action-hover` | `#991b1b` | `#fecaca` | — |
| `--notice-danger-action-pressed` | `#7f1d1d` | `#fee2e2` | — |
| `--on-notice-danger-action` | `#ffffff` | `#141414` | — |
| `--success-surface` | `#f0fdf4` | `#17291d` | — |
| `--success-ink` | `#166534` | `#86efac` | — |
| `--notice-success-action` | `#166534` | `#86efac` | Dedicated success action material owned by a success notice. |
| `--notice-success-action-hover` | `#14532d` | `#bbf7d0` | — |
| `--notice-success-action-pressed` | `#123f25` | `#dcfce7` | — |
| `--on-notice-success-action` | `#ffffff` | `#141414` | — |
| `--attention-surface` | `#fffbeb` | `#2c2517` | — |
| `--attention-ink` | `#854d0e` | `#fcd34d` | — |
| `--notice-attention-action` | `#854d0e` | `#fcd34d` | Dedicated amber action material owned by an attention notice. |
| `--notice-attention-action-hover` | `#713f12` | `#fde68a` | — |
| `--notice-attention-action-pressed` | `#5f350f` | `#fef3c7` | — |
| `--on-notice-attention-action` | `#ffffff` | `#141414` | — |
| `--scrollbar-thumb` | `#737373` | `#919191` | — |
| `--scrollbar-thumb-hover` | `#525252` | `#c2c2c2` | — |
| `--shadow` | `rgb(0 0 0 / 12%)` | `rgb(0 0 0 / 36%)` | — |
| `--scrim` | `rgb(0 0 0 / 32%)` | `rgb(0 0 0 / 56%)` | — |

## Common scales

| Token | Value | Purpose |
| --- | --- | --- |
| `--font-family-ui` | `"Golos Text", "Segoe UI", sans-serif` | — |
| `--font-family-code` | `"Cascadia Code", Consolas, monospace` | — |
| `--font-size-min` | `0.75rem` | — |
| `--type-caption-size` | `0.75rem` | — |
| `--type-caption-line` | `1rem` | — |
| `--type-compact-size` | `0.8125rem` | — |
| `--type-compact-line` | `1.125rem` | — |
| `--type-body-size` | `0.875rem` | — |
| `--type-body-line` | `1.25rem` | — |
| `--type-lead-size` | `1rem` | — |
| `--type-lead-line` | `1.5rem` | — |
| `--type-section-size` | `1.25rem` | — |
| `--type-section-line` | `1.625rem` | — |
| `--type-page-size` | `1.5rem` | — |
| `--type-page-line` | `2rem` | — |
| `--type-project-size` | `1.75rem` | — |
| `--type-project-line` | `2.125rem` | — |
| `--type-display-size` | `2rem` | Rare onboarding brand moment; never ordinary workspace chrome. |
| `--type-display-line` | `2.5rem` | — |
| `--weight-regular` | `400` | — |
| `--weight-medium` | `500` | — |
| `--weight-strong` | `600` | — |
| `--space-1` | `4px` | — |
| `--space-2` | `8px` | — |
| `--space-3` | `12px` | — |
| `--space-4` | `16px` | — |
| `--space-6` | `24px` | — |
| `--space-8` | `32px` | — |
| `--space-12` | `48px` | — |
| `--space-16` | `64px` | — |
| `--space-control` | `8px` | — |
| `--space-construct` | `16px` | — |
| `--space-cluster` | `24px` | — |
| `--space-section` | `32px` | — |
| `--space-region` | `48px` | — |
| `--page-gutter` | `clamp(24px, 4vw, 56px)` | Preserves the current adaptive page gutters during the initial token migration. |
| `--content-reading` | `720px` | — |
| `--content-project` | `960px` | Quiet Workbench project list maximum; task documents and settings retain their 720px reading measure. |
| `--content-settings` | `720px` | — |
| `--sidebar-expanded` | `224px` | Quiet Workbench: compact projects-only navigation selected by the user on 2026-09-20. |
| `--sidebar-collapsed` | `58px` | Preserves the existing 58px collapsed desktop shell. |
| `--modal-compact` | `400px` | — |
| `--modal-form` | `560px` | — |
| `--modal-review` | `720px` | — |
| `--target-min` | `24px` | — |
| `--control-compact` | `32px` | — |
| `--control-default` | `36px` | — |
| `--control-comfortable` | `40px` | — |
| `--row-min` | `40px` | — |
| `--icon-small` | `16px` | — |
| `--icon-default` | `20px` | — |
| `--icon-large` | `24px` | — |
| `--radius-none` | `0px` | — |
| `--radius-control` | `8px` | — |
| `--radius-action-row` | `10px` | — |
| `--radius-panel` | `16px` | Maximum routine compound radius; do not add panels only to use the radius. |
| `--radius-pill` | `999px` | — |
| `--corner-shape-rounded` | `squircle` | Progressive enhancement for every rounded UI contour. Keep border-radius as the complete fallback; true circles and source artwork retain their native geometry. |
| `--panel-inset` | `6px` | Named 6px optical exception for concentric panel geometry; not part of the spacing scale. |
| `--panel-inner-radius` | `max(0px, calc(var(--radius-panel) - var(--panel-inset)))` | — |
| `--border-width` | `1px` | — |
| `--focus-width` | `2px` | — |
| `--focus-offset` | `2px` | — |
| `--duration-instant` | `0ms` | — |
| `--duration-fast` | `100ms` | — |
| `--duration-normal` | `140ms` | — |
| `--duration-enter` | `180ms` | Maximum routine transition duration; disable nonessential motion for reduced motion. |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | — |
| `--ease-linear` | `linear` | — |
| `--elevation-overlay` | `0 8px 24px var(--shadow)` | For genuinely overlapping surfaces only; none for ordinary containers. |
| `--layer-content` | `0` | — |
| `--layer-sticky` | `10` | — |
| `--layer-popover` | `20` | — |
| `--layer-modal` | `30` | — |
| `--layer-toast` | `40` | — |
| `--layer-tooltip` | `50` | Local stacking token, not a substitute for native top-layer and modal focus ownership. |
| `--content-wide` | `1160px` | Retained legacy wide content role; ordinary task and settings pages use 720px. |

## Registered legacy brand exceptions

These existing gradient values are retained for compatibility. They are not ordinary interface color roles and must not replace supplied raster blobs. New consumers require a brand-contract decision.

| Token | Value | Purpose |
| --- | --- | --- |
| `--flood-gradient` | `radial-gradient(circle at 34% 28%, #ff765f 0 8%, transparent 38%), radial-gradient(circle at 72% 76%, #7767ff 0 10%, transparent 42%), radial-gradient(circle at 56% 48%, #251629 0 8%, transparent 36%), linear-gradient(145deg, #ffb067 0%, #ff477e 48%, #675cff 100%)` | Registered legacy brand-material exception, preserved unchanged; not a neutral control role or a replacement for the supplied raster blobs. |
| `--priority-important` | `linear-gradient(90deg, #ffb067 0%, #ff755f 52%, #f14f86 100%)` | Legacy priority treatment retained for unmigrated consumers; new anchors use explicit urgency text and the existing supported glyph or semantic ink. |
| `--priority-urgent` | `linear-gradient(90deg, #a9142f 0%, #ff355f 48%, #b735d5 100%)` | Legacy priority treatment retained for unmigrated consumers; do not use as agent identity or ordinary control color. |

## Declared contrast pairs

Ratios use opaque sRGB colors. Alpha compositing, rendered states, images, overlays and focus geometry require separate UI verification.

| Theme | Foreground | Background | Measured | Minimum |
| --- | --- | --- | --- | --- |
| light | `--ink` | `--background` | 17.93:1 | 7:1 |
| dark | `--ink` | `--background` | 16.90:1 | 7:1 |
| light | `--ink` | `--surface` | 16.73:1 | 7:1 |
| dark | `--ink` | `--surface` | 15.63:1 | 7:1 |
| light | `--ink` | `--selected` | 14.63:1 | 7:1 |
| dark | `--ink` | `--selected` | 12.11:1 | 7:1 |
| light | `--on-ink` | `--ink` | 17.93:1 | 7:1 |
| dark | `--on-ink` | `--ink` | 16.90:1 | 7:1 |
| light | `--muted` | `--background` | 7.81:1 | 4.5:1 |
| dark | `--muted` | `--background` | 10.34:1 | 4.5:1 |
| light | `--muted` | `--surface` | 7.29:1 | 4.5:1 |
| dark | `--muted` | `--surface` | 9.57:1 | 4.5:1 |
| light | `--muted` | `--pressed` | 5.81:1 | 4.5:1 |
| dark | `--muted` | `--pressed` | 6.58:1 | 4.5:1 |
| light | `--faint` | `--background` | 6.10:1 | 4.5:1 |
| dark | `--faint` | `--background` | 7.30:1 | 4.5:1 |
| light | `--faint` | `--surface` | 5.69:1 | 4.5:1 |
| dark | `--faint` | `--surface` | 6.76:1 | 4.5:1 |
| light | `--faint` | `--elevated` | 6.10:1 | 4.5:1 |
| dark | `--faint` | `--elevated` | 6.15:1 | 4.5:1 |
| light | `--faint` | `--hover` | 5.35:1 | 4.5:1 |
| dark | `--faint` | `--hover` | 5.84:1 | 4.5:1 |
| light | `--faint` | `--selected` | 4.98:1 | 4.5:1 |
| dark | `--faint` | `--selected` | 5.23:1 | 4.5:1 |
| light | `--faint` | `--pressed` | 4.53:1 | 4.5:1 |
| dark | `--faint` | `--pressed` | 4.65:1 | 4.5:1 |
| light | `--focus-ring` | `--background` | 17.93:1 | 3:1 |
| dark | `--focus-ring` | `--background` | 16.90:1 | 3:1 |
| light | `--focus-ring` | `--selected` | 14.63:1 | 3:1 |
| dark | `--focus-ring` | `--selected` | 12.11:1 | 3:1 |
| light | `--line-strong` | `--background` | 4.74:1 | 3:1 |
| dark | `--line-strong` | `--background` | 5.85:1 | 3:1 |
| light | `--line-strong` | `--field` | 4.43:1 | 3:1 |
| dark | `--line-strong` | `--field` | 5.41:1 | 3:1 |
| light | `--line-strong` | `--pressed` | 3.52:1 | 3:1 |
| dark | `--line-strong` | `--pressed` | 3.72:1 | 3:1 |
| light | `--danger-ink` | `--danger-surface` | 5.91:1 | 4.5:1 |
| dark | `--danger-ink` | `--danger-surface` | 8.52:1 | 4.5:1 |
| light | `--danger-ink` | `--danger-hover` | 5.30:1 | 4.5:1 |
| dark | `--danger-ink` | `--danger-hover` | 7.47:1 | 4.5:1 |
| light | `--danger-ink` | `--danger-pressed` | 4.94:1 | 4.5:1 |
| dark | `--danger-ink` | `--danger-pressed` | 6.46:1 | 4.5:1 |
| light | `--danger-ink` | `--background` | 6.47:1 | 4.5:1 |
| dark | `--danger-ink` | `--background` | 9.71:1 | 4.5:1 |
| light | `--success-ink` | `--success-surface` | 6.81:1 | 4.5:1 |
| dark | `--success-ink` | `--success-surface` | 10.91:1 | 4.5:1 |
| light | `--success-ink` | `--background` | 7.13:1 | 4.5:1 |
| dark | `--success-ink` | `--background` | 13.12:1 | 4.5:1 |
| light | `--attention-ink` | `--attention-surface` | 6.61:1 | 4.5:1 |
| dark | `--attention-ink` | `--attention-surface` | 10.52:1 | 4.5:1 |
| light | `--attention-ink` | `--background` | 6.85:1 | 4.5:1 |
| dark | `--attention-ink` | `--background` | 12.78:1 | 4.5:1 |
| light | `--on-notice-info-action` | `--notice-info-action` | 17.93:1 | 4.5:1 |
| dark | `--on-notice-info-action` | `--notice-info-action` | 16.90:1 | 4.5:1 |
| light | `--on-notice-danger-action` | `--notice-danger-action` | 6.47:1 | 4.5:1 |
| dark | `--on-notice-danger-action` | `--notice-danger-action` | 9.71:1 | 4.5:1 |
| light | `--on-notice-success-action` | `--notice-success-action` | 7.13:1 | 4.5:1 |
| dark | `--on-notice-success-action` | `--notice-success-action` | 13.12:1 | 4.5:1 |
| light | `--on-notice-attention-action` | `--notice-attention-action` | 6.85:1 | 4.5:1 |
| dark | `--on-notice-attention-action` | `--notice-attention-action` | 12.78:1 | 4.5:1 |
