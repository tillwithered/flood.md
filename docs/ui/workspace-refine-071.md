# Current Flood → DS refined — 0.7.1

[Индекс](README.md) · [lab](recipes/workspace-refine-071.html) · [checks](recipes/workspace-refine-071-checks.md) · 2026-09-19.

**Candidate: W-BASELINE-071 / W-POLISH-071.** Это не новая IA и не production migration.

## Structural baseline from main

Источник — текущий `src/styles.css` и App.svelte, а не выдуманный shell:
- window bar 52px;
- sidebar width304px, collapsed58px;
- sidebar содержит New task, search, project tree и nested tasks;
- main workspace остаётся task/editor surface;
- reading width720px;
- task sequence: metadata → title → relations/context → editor → checkpoints/agent work.

0.7.0 rejected именно потому, что заменил эти сильные стороны generic SaaS list/detail layout.

## Что разрешено менять в0.7.1

- light workspace canvas #fafafa вместо более грязного #f4f4f2;
- decorative lines тише, но required field/focus boundaries сохраняются;
- approved double neutral focus вместо старого single outline;
- approved Heroicons Solid direction вместо случайной icon mixture;
- search/controls используют approved field geometry;
- metadata остаются text-first;
- project Flood может получить small raster identity;
- agent-work получает stable raster identity, но не status-colored blob;
- existing editor reading width, title size and shell geometry не уменьшаются.

## Что запрещено

- новый project header, local tabs или split list/detail по умолчанию;
- отдельный overview dashboard / KPI cards;
- перенос task list из existing project tree в новую центральную колонку;
- большие декоративные blobs;
- card вокруг agent result просто ради визуального separation;
- изменение runtime route/state model в specimen.

## Brand placement

Raster — маленький identity mark у Flood project и Flood agent. Один и тот же agent asset не меняется между working/ready/error. Quote/empty-state material допустим отдельно, но не должен повторяться в каждом блоке.

## Review method

Lab переключает `Current structure → DS refined` на одном DOM. Это принципиально: нельзя объяснить улучшение изменением данных или IA.

Проверять:
- стало ли светлее/чище без потери различимости;
- сохранилась ли сильная editor-first композиция;
- sidebar по-прежнему читается быстрее, чем в0.7.0;
- brand присутствует, но не конкурирует с task content;
- agent work остаётся продолжением задачи, а не отдельной card.

## Reference note

Mobbin просмотрен 2026-09-19: [Linear issue/editor](https://mobbin.com/screens/874d65bf-1c4d-47c8-9a01-5cb67e38084f), capture date unknown/provisional. Используется только как подтверждение ценности спокойной editor surface и локальных actions. Структурный источник истины для0.7.1 — текущий Flood.

## После review

Если0.7.1 нравится — следующий compound-шаг не новый shell, а W-03 agent result review внутри этой же task flow. После этого можно планировать targeted runtime migration.
