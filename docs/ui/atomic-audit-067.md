# Atomic audit после 0.6.7

2026-09-19. Это карта оставшихся базовых пробелов, не новый экран.

## Уже устойчиво
- clean light/dark + semantic Warning/Danger/Success;
- typography/list density/control geometry;
- menu/dialog/recovery patterns;
- Heroicons Solid + icon-only + tooltip;
- checkbox/radio/switch;
- nested radii, soft borders, two-layer focus, contained scrollbars;
- banner material + contextual action direction;
- raster brand roles candidate.

## Осталось до закрытия atomic gate
1. P-04: button/input corner cases — long paste, prefix/suffix collisions, autofill, selection/caret, locale numeric entry, pressed/disabled/pending combinations.
2. Feedback0.6.6: approve/revise skeleton, progress, toast timing and live-region semantics.
3. Brand0.6.7: approve exact roles and runtime split from status glyphs.
4. Runtime plan: wrapper for Heroicons + BrandMaterial/AgentIdentity without importing docs fixtures.
5. Tauri/WebView/zoom/SR acceptance for a representative subset.

После этого можно возвращаться к compound/workspace, не расширяя atomic catalog ради каталога.
