# Iconography lab 0.6.5 — проверки

[Контракт](../iconography.md) · [lab](iconography.html) · 2026-09-19 · approved design snapshot; browser checks only.

Локально выполнен Chromium runner: **50 assertions** и **24 desktop layout cases** (4 раздела × 960/1180/1440 × light/dark), без page overflow, JS errors и external requests.

Проверены:
- Heroicons Solid paths без stroke;
- glyph16 внутри target36/R10;
- rest без border/shadow;
- selected через `aria-pressed`, без смены family;
- keyboard focus и прежний двухслойный ring;
- tooltip по focus/hover, Escape, pointerleave, gap≈6 и отсутствие shadow;
- pointer delay: tooltip не появляется до300ms и появляется после полного450ms окна;
- `aria-disabled` пример остаётся focusable, но activation блокируется и accessible name существует;
- B/H1/U остаются typographic controls;
- forced-colors сохраняет видимый focus.

Визуально просмотрены light icon-only toolbar и dark tooltip surface.

Ограничения: Chromium only; нет Tauri/WebView2/Safari/screen-reader/native zoom, production migration или полной карты всех current Lucide use-sites. Timing/surface были приняты владельцем в составе0.6.5; target-platform behavior всё ещё требует Tauri/WebView/SR проверки. 20px Heroicons master в 16px slot требует ещё проверки с настоящим Golos/Tauri.
