# Покрытие дизайн-системы

[Индекс](README.md) · 2026-09-19 · [решения](decisions.md) · [iconography lab](recipes/iconography.html).

**Atomic design gate закрыт. Active compound candidate0.7.1 refines current production Flood in place.** Различать направление, точную state sheet, исполнимый пример, проверки и production-внедрение.

| Слой | Что есть сейчас | Что осталось |
| --- | --- | --- |
| Палитра/типографика/spacing | Принятые clean-light/dark,T/L/C/S | Все соседства, Golos metrics, native zoom/Tauri |
| Иконки | Heroicons Solid; mapping/icon-only/tooltip0.6.5 approved в показанном объёме | 24px masters, surface-by-surface runtime plan; production Lucide сохранён |
| Checkbox P-01 | Approved0.6.4:24 сочетания, scoped mixed/all/none, label target, group error | Target WebView/SR и runtime |
| Radio P-02 | Approved0.6.4:16 сочетаний, no default/group error/arrows/disabled/Tab | Cross-browser initial focus, SR и runtime |
| Switch P-03 | Approved0.6.4:22 сочетания, confirmed/requested/operation, retry/readback | Все recovery outcomes и реальные операции |
| Поля |0.6.3 baseline + FIELD-068 approved; AUTOFILL-068 direction | Tauri/WebView autofill/password-manager/IME acceptance |
| Select/combobox | Custom popup0.6.3; local async/no-results/error/stale/IME | SR/target WebView, real async/pagination/offline |
| Focus | Два слоя0.6.3; boolean mark — единственный focus owner | Визуальное утверждение точных значений, target WebView/zoom |
| Option selection | Без border/outline; check+fill, committed ≠ active | Все будущие states |
| Scrollbar | Inset viewport отдельно от rounded shell; gutter/drag проверены | Safari/WebView2 и CSS fallback |
| Радиусы | B-формула; panel/viewport/action и switch insets измеряются | Внедрение в реальные компоненты |
| Effects/buttons | Icon-only/tooltip + BUTTON-068 approved | Runtime wrapper/component extraction and Tauri acceptance |
| Progress/skeleton | Approved0.6.6: first-load skeleton, refresh busy, determinate/indeterminate split | Tauri/background/SR acceptance |
| Inline/banner/toast | Approved0.6.6 + contextual action0.6.7 | live-region/SR and runtime |
| Raster brand | Approved0.6.7: accent / empty / stable identity на existing masters | Runtime component split, asset sizing/perf, Tauri/WebView |
| Menu/dialog/recovery | M/V/D/F и metadata приняты в показанном объёме | Permissions/bindings, внутренние primitives |
| Calendar/attachments/editor | Общие принципы | Отдельные будущие задачи |
| AppShell / project flow |0.7.0 rejected;0.7.1 candidate current→refined | Preserve 52px bar, sidebar304/58, nested project tasks and editor flow; review polish before any IA change |
| Agent result review | Deferred W-03 | Add after 0.7.0 composition review |

Boolean0.6.4 и iconography0.6.5 одобрены в показанном объёме, но не равны production-библиотеке. Feedback0.6.6 — текущий candidate. Код0.6.3 не изменён. `.flood`, backend, runtime CSS и приложение не менялись.

## Следующая работа

1. Audit current production shell/task flow and define what must be preserved.
2. Build before→refined specimen on the same structure/data; do not add overview/tabs/split-view unless a concrete problem requires them.
3. Параллельно — representative Tauri/WebView/SR/native-zoom acceptance; это не блокирует design exploration и не создаёт новые arbitrary primitives.

[Atomic audit0.6.9](atomic-audit-069.md) остаётся канонической границей atomic layer.
