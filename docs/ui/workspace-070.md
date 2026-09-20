# Compound workspace — 0.7.0

[Индекс](README.md) · [desktop lab](recipes/workspace-070.html) · [checks](recipes/workspace-070-checks.md) · 2026-09-19.

**Candidate: W-01/W-02.** Atomic design gate закрыт; этот пакет проверяет, складываются ли утверждённые primitives в рабочую desktop-композицию. Никаких новых palette/radius/button tokens.

## W-01 · AppShell

Три уровня не смешиваются:
1. global sidebar — Tasks, projects, trash, settings;
2. project header — текущий проект, repo metadata, локальные tabs и page actions;
3. content — overview/list/detail.

Sidebar default 216px; collapsed 64px. Collapse меняет доступное пространство, но не размер типографики. Project tabs живут в header, а не создают второй глобальный sidebar. Один separator на стык.

Brand raster используется один раз как декоративный accent в project header; он не является project status/urgency.

## W-02 · Project overview + list/detail

Overview — не KPI dashboard. Три представления существующих данных:
- Требует решения;
- Мой фокус;
- Делегировано.

Это не новые task statuses. Count живёт в group heading.

Task row: title → source/time metadata → единственный полезный state справа. Никаких badges вокруг repo/time по умолчанию. Selected row получает neutral fill, focus остаётся independent.

На wide desktop list 400–440px остаётся рядом с detail. Detail — самостоятельная scroll surface. На narrow desktop sidebar collapses и выбранный detail заменяет list; кнопка Назад возвращает list без сброса query/filter/scroll.

Если выбранная задача скрыта фильтром, detail не закрывается молча; toolbar сообщает, что selection скрыт текущим filter.

## Project header

Title + краткий context + repo metadata. Privacy/linked рядом с repo identity, описание отдельно. Actions: New task primary и compact More. Local tabs: Обзор, Контекст, Интеграции, История. Это candidate grouping: не переписывает runtime section enum автоматически.

## Detail anatomy

Breadcrumb/context → task title → metadata → description/work → related agent state. Agent block использует stable raster identity; status text/Heroicons остаются отдельными.

0.7.0 намеренно не проектирует полный result review: button «Открыть результат» — teaser W-03, без apply/reject flow.

## State preservation

Query, filter, selected task and list scroll are independent state owners. Detail open/close не сбрасывает список. Search не удаляет selection. Theme/sidebar/narrow toggles не меняют synthetic data order.

## References

Mobbin просмотрен 2026-09-19, capture dates MCP не сообщает: provisional only.
- [Linear project overview](https://mobbin.com/screens/5039f323-d5f0-40cb-95c1-d1919177b236)
- [Linear list/detail](https://mobbin.com/screens/1a4540b2-6c15-49ff-a07f-4fddb7490e38)
- [Linear desktop shell](https://mobbin.com/screens/e91bee36-887c-4ad9-8be7-8d0475e84aa7)

Используем только hierarchy/locality/density observations. Не переносим их palette, sidebar IA, exact pixels или workflow assumptions.

## После review

Если W-01/W-02 утверждены: W-03 agent-result review добавляется на эту же shell и эти же data. Затем уже можно планировать Svelte implementation/extraction; browser specimen не production migration.
