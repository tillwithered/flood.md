# Flood UI — Soft Utility

2026-09-19 · clean-light0.3.1, precision0.4, interaction0.5 и metadata0.5.1 сохраняются. **Atomic design gate закрыт. Текущий compound review: 0.7.1 — current Flood UI refined in place.**

Контент, задачи и решения человека важнее декоративного chrome.

## Текущий review · 0.7.1

[Current → Refined](workspace-refine-071.md): тот же 52px window bar, sidebar304/58, project tree/nested tasks и task editor. Меняются только light material, border/focus/control polish, Heroicons direction и sparse raster identity. [Lab](recipes/workspace-refine-071.html), [checks](recipes/workspace-refine-071-checks.md). **W-BASELINE-071 / W-POLISH-071 — candidate.**

Workspace0.7.0 остаётся rejected historical experiment: не использовать как implementation baseline.

## Atomic audit · 0.6.9

[Итоговый atomic audit](atomic-audit-069.md) сводит foundation, controls, selection, iconography, brand и feedback в одну карту. **0.6.8 принят в показанном объёме:** BUTTON/FIELD/AUTOFILL-068 больше не candidate.

Вывод аудита: новые generic primitives сейчас не нужны. Feedback0.6.6 после просмотра владельцем approved в показанном объёме. Atomic design gate закрыт; platform acceptance остаётся отдельным runtime track. Tauri/WebView/SR/native zoom — отдельный runtime acceptance track, а calendar/editor/attachments/navigation/workspace уже не atomic blockers.

0.6.7 принят в показанном объёме: contextual banner action и raster roles accent / empty / stable identity сохраняются. Runtime FloodGlyph/masters по-прежнему не мигрированы.

## Предыдущий review · 0.6.7

[Баннеры и бренд](brand-and-notices.md): contextual action вместо нейтральной плашки внутри semantic banner; raster blobs как accent / empty state / stable identity. [Desktop lab](recipes/brand-notices.html), [аудит](atomic-audit-067.md). Розово-красный материал Danger сохраняется; новый action и brand-роли проходят review. Runtime FloodGlyph/masters пока не меняются.

## Сохранённый review feedback0.6.6

[Feedback primitives0.6.6](feedback.md): first load vs refresh, spinner, честный progress, skeleton, inline feedback, persistent notice и toast. [Desktop lab](recipes/feedback.html), [проверки](recipes/feedback-checks.md). **LOAD-066 / PROGRESS-066 / NOTICE-066 / TOAST-066 — approved в показанном объёме.**

Iconography0.6.5 после просмотра владельцем отмечена approved в показанном объёме: Heroicons mapping, icon-only36/16 и tooltip contract сохраняются. Это не production migration: Tauri/SR/WebView acceptance остаётся отдельно.

## Последние решения

Heroicons Solid — выбранное семейство. Вложенные параллельные контуры: B-вариант `inner=max(0,outer−visible inset)`. Нет нижней подошвы, bevel и inset-underline у controls. Тихий rest edge не заменяет необходимую границу или focus.

После desktop-review0.6.2 владелец запросил собственный вид без системных степперов/уголков/select, двухслойный концентрический focus, scrollbar внутри popup и option без рамки. См. [refinement0.6.3](primitives-refinement.md). Точные значения focus остаются визуальным пилотом, не утверждённым на всех платформах токеном.

[Lab0.6.3](recipes/primitives-refined.html) сохраняется для полей/выбора/прокрутки. Input/textarea и scroll engine настоящие; системный внешний вид заменён. Forced-colors использует пользовательские системные цвета. Ни один lab не импортируется приложением.

## Сохраняем

Монохромные light/dark controls, существующие цветные blobs и отдельные Warning/розово-красный Danger/Success. Нет синего primary/selected/focus вне high-contrast режима пользователя. Light canvas#fafafa и локальные края; тёплый#e9e9e6 отвергнут. Не затемнять страницу ради поля.

T/L/C/S и M/V/D/F приняты в показанном объёме, но не сертифицируют все атомарные states. Privacy/linked независимы и остаются рядом с названием. Readonly не disabled; pending не success; active suggestion не committed selection.

## Быстрый маршрут

| Задача | Читать |
| --- | --- |
| Banner action / raster brand | [0.6.7](brand-and-notices.md), [lab](recipes/brand-notices.html), [аудит](atomic-audit-067.md) |
| Loading/progress/inline/banner/toast | [Feedback0.6.6](feedback.md), [lab](recipes/feedback.html), [проверки](recipes/feedback-checks.md) |
| Icon map, icon-only, tooltip | [Iconography0.6.5](iconography.md), [lab](recipes/iconography.html), [проверки](recipes/iconography-checks.md) |
| Checkbox/radio/switch, state sheets, label target | [Boolean0.6.4](boolean-controls.md), [lab](recipes/boolean-controls.html), [проверки](recipes/boolean-checks.md) |
| Фокус, chrome, scrollbar, option без рамки | [Refinement0.6.3](primitives-refinement.md), [lab](recipes/primitives-refined.html), [проверки](recipes/primitives-refined-checks.md) |
| Current→Refined0.7.1 | [Контракт](workspace-refine-071.md), [lab](recipes/workspace-refine-071.html), [checks](recipes/workspace-refine-071-checks.md) |
| Rejected compound0.7.0 | [Historical contract](workspace-070.md), [lab](recipes/workspace-070.html) — не implementation baseline |
| Atomic gate / что закрыто | [Audit0.6.9](atomic-audit-069.md), [решения](decisions.md), [покрытие](coverage.md) |
| Исторические кандидаты примитивов | [Primitive controls0.6](primitive-controls.md), [lab](recipes/primitives.html) |
| Heroicons и лицензии | [Контракт](primitives-refinement.md), [источники](recipes/icon-sources.md) |
| Typography и коллекции | [Precision](precision.md), [lab0.4](recipes/precision.html) |
| Menu/dialog/recovery | [Interaction](interaction-components.md), [lab0.5](recipes/flows.html) |
| Имя и признаки репозитория | [Metadata](repository-metadata.md) |
| Материалы, геометрия, цвет | [Foundations](foundations.md), [materials](materials-and-borders.md), [geometry](geometry.md), [color](color-and-state.md) |
| Чистая светлая основа | [Light/polish](light-theme-and-polish.md), [образец](recipes/polish.html) |
| Выбор компонента | [Components](components.md), [поведение](interaction.md) |
| GitHub source binding | [Полный modal contract](github-repository-picker.md) |
| Отложенные компаунды | [Workspace](next-workspace.md), [composition](composition.md), [human–agent](human-agent.md) |
| Исследование и приёмка | [Референсы](references.md), [аудит](frontend-audit.md), [acceptance](acceptance.md) |

Читать один применимый контракт и его проверки, не весь handbook. Skills `flood-ui-iconography` и `flood-ui-booleans` направляют к своим узким контрактам. Исторические native-select, outline-offset и неопределённая icon family не источник новых defaults.

## Источники истины

`src/styles.css` — production tokens. `docs/ui/recipes/` — изолированные образцы. `primitives-refined.html/css/js` сохраняют0.6.3; `boolean-controls.html/css/js` — specimen0.6.4; `iconography.html` — approved standalone specimen0.6.5; `feedback.html` — standalone candidate0.6.6. При внедрении переносить согласованные контракты, не цепочку lab overrides/fixtures/таймеры. Production Lucide не удалён.

`.flood/` — экспортированный snapshot; [его README](../../.flood/README.md) оставляет live MCP workspace каноническим. Не менять manifest, hashes, receipts или permissions побочно; нужен отдельный version-checked workflow. Отсутствующие Design.md/Stack.md не повод для бесконечного поиска; карта здесь.

Новых generic primitive-family аудит0.6.9 не требует. Atomic design gate закрыт после review feedback0.6.6; compound exploration активирован; production-ready по-прежнему требует representative Tauri/WebView/SR acceptance. Desktop-превью и решение владельца остаются отдельными от разрешения публиковать. Отзывы локальны до экспорта. Новый specimen не доказывает Tauri/Safari/SR readiness и не переутверждает прошлые кандидаты.
