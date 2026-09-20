# Atomic design-system audit — 0.6.9

[Индекс](README.md) · [решения](decisions.md) · [покрытие](coverage.md) · 2026-09-19.

## Вывод

**Новой generic primitive-family перед compounds сейчас не требуется.** Мы уже определили визуальный материал, геометрию, focus, buttons, fields, boolean controls, select/combobox, menu/dialog, iconography, brand raster roles и основные error/recovery contracts.

Atomic gate **closed for design exploration**: владелец отдельно принял feedback0.6.6 после preview. Banner material/action уже уточнены и приняты; остаётся review first-load/refresh, progress и toast timing/semantics.

Runtime/Tauri/WebView/SR/native zoom — acceptance, а не повод проектировать ещё один набор control shapes.

## Карта

| Слой | Design status | Evidence / остаток |
| --- | --- | --- |
| Light/dark, semantic color | closed | clean-light, monochrome controls, Warning/Danger/Success |
| Typography / spacing / density | closed | T-01/L-01/C-01 |
| Materials / borders / focus / radii | closed direction | B-radius, soft edge, double neutral focus; platform validation отдельно |
| Buttons | closed | text roles0.6.8 + icon-only0.6.5 |
| Input / textarea / numeric | closed |0.6.3 + FIELD-068; autofill platform direction |
| Checkbox / radio / switch | closed |0.6.4 |
| Select / combobox | design-covered | V-01 +0.6.3; real async/pagination/SR runtime |
| Menu / tooltip | closed | M-01 +0.6.5 |
| Dialog / modal / destructive confirm | closed | D-01 / interaction0.5 |
| Scrollbar / popup containment | closed direction |0.6.3; Safari/WebView acceptance |
| Iconography | closed | Heroicons Solid map + exceptions |
| Raster brand | closed in roles | accent / empty / stable identity; runtime component split |
| Loading / progress | **review pending** | feedback0.6.6 |
| Inline/banner | mostly closed | persistent notice + contextual0.6.7 action; broader feedback review remains |
| Toast | **review pending** | feedback0.6.6 timing/live-region |
| Tables / bulk actions | compound/domain | not atomic blocker |
| Calendar / date-time | domain-specific | add only when real workflow needs it |
| Attachments / editor | domain-specific compound | not atomic blocker |
| AppShell / navigation / agent review | compound | next phase after feedback review |

## Что больше не делать

- Не добавлять «ещё один» radius, button variant, border token или generic input без сценария, который не выражается текущими контрактами.
- Не строить библиотеку из 80 controls перед рабочими экранами.
- Не путать platform acceptance с design invention.
- Не переносить demo fixtures/timers в runtime.

## Feedback decision

Feedback0.6.6 принят в показанном объёме. Зафиксированные решения:
1. skeleton/refresh — сохраняем ли принцип first-load skeleton + non-destructive refresh;
2. progress — только честный denominator;
3. toast — stack/timing/live-region и Undo duration.

Banner action/brand0.6.7 уже не пересматриваются в этом review.

## Parallel runtime track

Не блокирует следующий design exploration, но обязателен до production claim:
- representative Tauri light/dark + focus;
- WebView autofill/password manager/native zoom;
- screen-reader keyboard pass на checkbox/radio/switch/combobox/dialog/toast;
- runtime Heroicons wrapper и BrandMaterial/AgentIdentity split;
- targeted component extraction из монолита без глобальной rewrite.

Статус: **atomic design gate closed**. Активны W-01/W-02 через workspace0.7.0; W-03 следует после их review.
