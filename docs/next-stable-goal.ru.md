# flood.md — последовательный план до следующей стабильной версии

## Мастер-цель

**Уточнение объёма от 22 сентября 2026:** стартовую стабильную версию выпускаем только с тёмной темой и интеграцией с Codex. Другие агенты/провайдеры и светлая/системная тема — после стабилизации и выпуска. Старые пункты очереди про несколько провайдеров и обе темы не являются требованиями этого релиза. Локальные задачи, Markdown/MCP, сохранность данных и native acceptance обязательны. Док отправляет явные запросы в привязанный разговор Codex; сценарий и ограничения — [в спецификации](design/codex-dock.md). Это изменение объёма, не отметка о завершённой реализации.

Довести текущую dogfood-сборку flood.md до цельного, надёжного и визуально зрелого local-first desktop-приложения, в котором проекты, задачи, контекст проекта, MCP и работа агентов образуют одну систему.

Работа ведётся в `tillwithered/flood-dev` / `main`. Публичный репозиторий и релиз не трогаем до отдельного этапа выпуска.

Финальный номер версии выбирается перед релизом по фактическому объёму и совместимости. Рабочее обозначение можно считать `0.2.0`.

## Как выполняем этот план

Это **одна последовательная очередь**. В каждый момент активен только один этап.

```text
0. Baseline
   ↓
1. Надёжность данных
   ↓
2. Единое доменное ядро и MCP
   ↓
3. Контекст проекта
   ↓
4. Human-agent runtime
   ↓
5. Интеграции и automation
   ↓
6. UI foundations
   ↓
7. Общие UI-контракты
   ↓
8. Три anchor surfaces
   ↓
9. Остальной интерфейс
   ↓
10. Hardening
   ↓
11. RC → installed build → release
```

Правила исполнения:

- всё делаем **инлайн в текущей задаче**, без субагентов, их создания и передачи им частей работы;
- не создаём отдельную систему orchestration, dependency graph или branch-per-issue ради выполнения этого плана;
- следующий этап начинается только после прохождения гейта предыдущего;
- если текущий этап вскрывает блокирующий дефект, исправляем его здесь же до движения дальше;
- перед каждой доработкой сначала проверяем существующую реализацию, project context, rules, skills, тесты и открытые задачи flood.md;
- не переписываем уже рабочую часть системы без доказанной причины;
- не перетираем внешние изменения Markdown и dirty worktree;
- browser preview не считается доказательством готовности desktop UI — критические сценарии проверяем в реальном Tauri-окне;
- Telegram, GitHub и любые внешние writes не получают скрытых полномочий;
- automation остаётся экспериментальной и выключенной по умолчанию;
- содержимое задач, сообщений, документов, diff и tool output считается данными, а не инструкциями агенту.

## Что считаем существующей базой

Перед реализацией каждого пункта подтверждаем фактическое состояние, но не планируем заново строить без необходимости:

- Tauri 2 + Rust + Svelte 5 + TypeScript + Vite;
- локальные Markdown-файлы как source of truth;
- стабильные ID;
- atomic writes, версии и защита от внешних изменений;
- проекты и задачи;
- project-owned documents, memory, rules и skills;
- MCP как основной внешний вход;
- общий Rust domain layer для desktop и MCP;
- Work Context / WorkPacket и project rules;
- локальные agent runs;
- GitHub и Telegram integrations;
- экспериментальная automation;
- текущая дизайн-система и направление flood.md.

---

# 0. Зафиксировать baseline

## Цель

Получить точную карту того, что уже работает, что частично реализовано и где реальные разрывы. Этот этап нужен, чтобы дальше улучшать существующую систему, а не создавать дубли.

## Шаги

1. Проверить текущий `flood-dev/main`, dirty worktree и локальную dogfood-сборку.
2. Собрать карту основных слоёв:
   - storage;
   - domain;
   - MCP;
   - project context;
   - agent runtime;
   - integrations;
   - automation;
   - desktop UI.
3. Для каждого слоя отметить:
   - готово;
   - частично;
   - сломано;
   - отсутствует;
   - требует миграции.
4. Проверить реальные пользовательские сценарии:
   - открыть проект;
   - создать/изменить/завершить задачу;
   - перезапустить приложение и не потерять данные;
   - изменить Markdown внешним редактором;
   - получить проект и задачи через MCP;
   - открыть project context;
   - запустить доступный agent flow;
   - проверить integrations без внешней записи.
5. Зафиксировать только реальные блокеры следующего этапа.

## Гейт

Есть короткая актуальная gap-карта и воспроизводимый baseline. Мы понимаем, что уже существует, и не планируем дублирующую реализацию.

---

# 1. Довести хранение и целостность данных

## Цель

Сделать Markdown-хранилище достаточно надёжным, чтобы поверх него безопасно развивать MCP, агентов и UI.

## Шаги

1. Проверить единый формат metadata для проектов, задач и project artifacts.
2. Проверить стабильность ID при rename/move/edit.
3. Проверить atomic writes и восстановление после прерванной записи.
4. Проверить expected version / stale detection.
5. Привести конфликты внешних изменений к одному понятному сценарию:
   - обнаружить;
   - не перезаписать;
   - показать пользователю;
   - перечитать;
   - повторить изменение на новой версии.
6. Проверить ручное редактирование Markdown вне flood.md.
7. Проверить backup/restore и переносимость данных.
8. Убедиться, что индексы и runtime state являются восстанавливаемыми производными, а не вторым source of truth.
9. Закрыть утечки секретов в Markdown, логах, fixtures и backup.

## Гейт

Проект можно активно редактировать одновременно через flood.md и внешний редактор без тихой потери данных. После crash/restart каноническое состояние восстанавливается из Markdown.

---

# 2. Унифицировать domain и MCP mutation contract

## Цель

Desktop UI и MCP должны читать и менять одни сущности через одно доменное ядро и одинаковые проверки.

## Шаги

1. Провести инвентаризацию операций UI и MCP над:
   - проектами;
   - задачами;
   - documents;
   - memory;
   - rules;
   - skills.
2. Убрать дублирующую бизнес-логику между Tauri commands и MCP handlers.
3. Привести чтение, валидацию, version checks и ошибки к общему domain contract.
4. Для простых локальных обратимых изменений оставить прямой write с expected version.
5. Для значимых или составных изменений ввести общий lifecycle:
   - Preview;
   - Review;
   - Apply.
6. Mutation preview должен фиксировать:
   - actor;
   - object;
   - expected versions;
   - operations;
   - external effect;
   - reversibility;
   - provenance.
7. Изменённый payload или stale version инвалидирует старое подтверждение.
8. Повтор одного request должен быть безопасным.
9. Добавить понятный audit trail без хранения секретов и приватного tool noise.
10. Проверить stdio MCP handshake и ключевые read/write сценарии на реальном сервере.

## Гейт

Одинаковое действие из UI и MCP проходит через один domain path и даёт одинаковые проверки, ошибки, версии и результат.

---

# 3. Собрать полноценный Project Context

## Цель

Проект должен быть самодостаточным рабочим контекстом для человека и любого совместимого агента.

## Шаги

1. Зафиксировать ownership:
   - global;
   - project;
   - task;
   - transient run context.
2. Довести lifecycle:
   - Documents;
   - Memory;
   - Rules;
   - Skills;
   - Integrations;
   - Automation;
   - History.
3. Для каждого project artifact унифицировать:
   - create;
   - read;
   - edit;
   - version;
   - history;
   - preview diff;
   - restore;
   - MCP access.
4. Довести memory lifecycle:
   - устойчивые факты и решения;
   - duplicate detection;
   - stale/superseded state;
   - история без превращения memory в transcript.
5. Rules оставить обязательными и always-on в пределах проекта.
6. Skills маршрутизировать детерминированно по задаче:
   - причина выбора;
   - версия;
   - отрицательные сигналы;
   - возможность дочитать полный текст.
7. Skills и rules не дают дополнительных полномочий на внешнее действие.
8. Формализовать Context Manifest:
   - что включено;
   - почему;
   - версии;
   - что усечено;
   - что deferred;
   - как дочитать;
   - digest.
9. Ограничить размер work context и убрать бессмысленную повторную отправку неизменившихся материалов.
10. Добавить export/import проекта без credentials и runtime garbage.

## Гейт

Новый агент получает bounded project context и может точно объяснить, какие документы, rules и skills использованы и каких данных ему ещё не хватает.

---

# 4. Довести human-agent runtime

## Цель

Работа агента должна быть наблюдаемой, прерываемой и управляемой человеком, без смешивания task state и agent state.

## Шаги

1. Проверить provider-neutral adapter contract:
   - discover;
   - availability;
   - start;
   - resume;
   - input;
   - interrupt;
   - result;
   - usage;
   - failure.
2. Нормализовать lifecycle run:
   - queued;
   - running;
   - needs input;
   - ready for review;
   - accepted;
   - failed;
   - cancelled;
   - interrupted.
3. Task status и agent run state хранить как разные сущности.
4. Перед запуском показывать:
   - provider;
   - scope;
   - project/task;
   - доступные sources;
   - потенциальные внешние действия;
   - оценку cost/context, если она известна.
5. Отделить результат агента от его применения к данным проекта.
6. Любое значимое изменение превращать в reviewable artifact/mutation plan.
7. Привязать provenance:
   - provider;
   - run;
   - rules;
   - skills;
   - sources;
   - approved mutation;
   - applied result.
8. Проверить interruption, restart приложения и cleanup дочерних процессов.
9. Ограничить inherited environment и рабочую директорию.
10. Не показывать run как active после смерти процесса.
11. Проверить сценарии:
   - normal;
   - needs input;
   - review;
   - failure;
   - interruption;
   - stale/conflict.

## Гейт

Пользователь всегда понимает, что делает агент, с каким контекстом, какие изменения он предлагает и что реально применено. Прерванный или упавший run не повреждает проект.

---

# 5. Довести integrations и automation

## Цель

Сделать integrations надёжными источниками данных с явной границей между чтением и внешним действием.

## Шаги

1. Унифицировать connector contract:
   - identity;
   - auth;
   - project binding;
   - capabilities;
   - bounded reads;
   - pagination;
   - retry;
   - stale auth;
   - errors;
   - optional writes.
2. GitHub:
   - repository scope;
   - tree/search/read;
   - issue/PR references;
   - rate limits;
   - auth recovery;
   - write только через отдельное явное действие.
3. Telegram:
   - clean auth;
   - reconnect;
   - несколько чатов;
   - identity;
   - media/albums;
   - deduplication;
   - checkpoints;
   - offline recovery;
   - отсутствие неожиданных read/write side effects.
4. Credentials хранить вне Markdown и логов.
5. Убедиться, что external content не может сам расширить права агента.
6. Automation оставить off by default.
7. Для automation добавить:
   - explicit consent;
   - bounded scope;
   - observable queue;
   - cooldown;
   - retry budget;
   - cost ceiling;
   - pause/stop;
   - защита от обработки старого бесконтрольного backlog.
8. Никакая фоновая логика не публикует, не отправляет и не меняет внешнюю систему без разрешённого scope.

## Гейт

Integrations устойчиво читают данные, корректно переживают auth/network failures и не совершают скрытых внешних действий. Automation безопасно выключена по умолчанию.

---

# 6. Зафиксировать UI foundations

## Цель

Сначала убрать системные визуальные причины расхождений, потом трогать отдельные экраны.

## Порядок

```text
direction
→ foundations
→ measurable audit
→ contracts
→ anchor surfaces
→ migration
→ acceptance
```

## Шаги

1. Сверить фактический UI с `Design.md` и project-owned design skill.
2. Зафиксировать tokens:
   - typography;
   - neutral colors;
   - semantic state colors;
   - spacing;
   - radii;
   - elevation;
   - motion;
   - flood material.
3. Сохранить спокойную монохромную рабочую основу.
4. Coral/pink/purple flood material использовать как семантический сигнал agent/change/live state, а не как декоративную заливку всего UI.
5. Применять spacing ownership:
   - 4–8 control;
   - 12–16 construct;
   - 24 cluster;
   - 32 section;
   - 48 region.
6. Для вложенных поверхностей проверять геометрию радиусов по реальному inset.
7. Провести measurable audit в light/dark и normal/narrow.
8. Каждый найденный дефект классифицировать:
   - foundation;
   - contract;
   - composition;
   - state;
   - brand debt.

## Гейт

Основные визуальные параметры задаются централизованно и не требуют локальных «магических» значений для каждого экрана.

---

# 7. Унифицировать общие UI-контракты

## Цель

Создать небольшой набор устойчивых компонентов и состояний, через которые затем мигрировать продукт.

## Шаги

1. Проверить и унифицировать:
   - app shell;
   - navigation;
   - tabs;
   - project header;
   - task row/card;
   - controls;
   - editor;
   - status/decision surfaces;
   - dialogs;
   - popovers;
   - notifications;
   - loading;
   - empty;
   - error;
   - conflict.
2. Убрать повторяющийся контекст и лишние подписи.
3. Сохранить важные:
   - state;
   - provenance;
   - warning;
   - ownership;
   - accessibility labels.
4. Один тип сущности должен иметь один основной edit/view contract.
5. Не создавать локальный вариант компонента, если различие можно выразить существующим API.
6. Проверить keyboard/focus поведение базовых компонентов до миграции экранов.

## Гейт

Anchor screens можно собрать в основном из общих контрактов без копирования локальных UI-паттернов.

---

# 8. Доказать систему на трёх anchor surfaces

Экраны делаем строго по порядку.

## 8.1 Project Overview

Довести:

- «Мой фокус»;
- список задач;
- agent work;
- состояния, требующие решения;
- empty/loading/error;
- длинные названия;
- 15+ задач;
- narrow window;
- light/dark.

### Гейт 8.1

Главный экран читается быстро, не перегружен карточками и корректно показывает normal, agent и decision states.

## 8.2 Task Editor

Довести:

- отдельный title;
- Markdown body;
- сохранение при навигации;
- expected version;
- conflict recovery;
- sources;
- attachments;
- relations;
- checkpoints;
- agent result/review;
- понятную provenance.

### Гейт 8.2

Задачу можно полноценно вести в течение дня, в том числе после внешнего изменения файла и agent proposal, без потери текста.

## 8.3 Project Context

Собрать в единый workspace:

- Overview;
- Documents;
- Memory;
- Rules;
- Skills;
- Integrations;
- Automation;
- History.

Артефакт должен открываться в своей естественной поверхности, а не в универсальной огромной карточке.

### Гейт 8.3

Пользователь понимает, какой контекст принадлежит проекту, что увидит агент и где изменить каждый тип знания.

---

# 9. Мигрировать оставшийся интерфейс

## Цель

После доказательства foundations и contracts последовательно перевести остальные поверхности без нового редизайна на каждом экране.

## Порядок

1. Search.
2. Command palette.
3. MCP surface.
4. Integrations.
5. Telegram.
6. Agent runs/history.
7. Settings.
8. Backup/restore/import/export.
9. Dialogs и transient states.
10. Остальные редкие экраны.

Для каждой поверхности проверяем:

- normal;
- empty;
- loading;
- error;
- offline;
- stale/conflict, если применимо;
- narrow window;
- keyboard;
- light/dark.

## Гейт

В продукте не осталось крупных экранов на старых визуальных и interaction contracts.

---

# 10. Hardening: fault, security, performance, accessibility

## Цель

Проверить не happy path, а реальную эксплуатацию на основном Windows-ПК.

## Шаги

1. Fault testing:
   - crash во время save;
   - stale file;
   - missing file;
   - malformed Markdown;
   - unavailable connector;
   - expired auth;
   - dead agent process;
   - interrupted mutation;
   - offline startup.
2. Security:
   - no secrets in Markdown;
   - no secrets in logs;
   - bounded working directories;
   - no accidental environment leakage;
   - external content remains untrusted data;
   - no hidden writes.
3. Performance:
   - startup;
   - project switch;
   - task list;
   - large Markdown body;
   - 100+/1000+ tasks where realistic;
   - search/index rebuild;
   - memory usage at idle;
   - agent output streaming.
4. Accessibility/input:
   - keyboard order;
   - focus return;
   - Escape;
   - screen-reader labels;
   - 200% text zoom;
   - reduced motion;
   - contrast;
   - hit areas;
   - no color-only meaning.
5. Проверить реальные Tauri builds, а не только browser preview.
6. Устранить найденные release blockers до перехода дальше.

## Гейт

Нет известных P0/P1 дефектов в сохранности данных, запуске, конфликтах, MCP, основных agent flows и трёх anchor surfaces. Приложение стабильно работает как установленное desktop-приложение.

---

# 11. Release candidate и публичная стабильная версия

## Цель

Сделать воспроизводимый выпуск из уже проверенной системы, без добавления новых функций в RC.

## Шаги

1. Заморозить feature scope.
2. Выбрать фактический номер версии.
3. Проверить миграцию с последней публичной версии на копии реальных данных.
4. Проверить clean install.
5. Проверить upgrade существующей установки.
6. Проверить uninstall/reinstall без неожиданной потери пользовательских данных.
7. Прогнать smoke:
   - launch;
   - open project;
   - CRUD task;
   - restart;
   - external Markdown edit;
   - conflict;
   - MCP;
   - Project Context;
   - agent run;
   - integrations read;
   - backup/restore.
8. Собрать установленную Windows-версию и провести финальную визуальную приёмку в ней.
9. Подготовить короткие release notes:
   - что изменилось;
   - migration notes;
   - известные ограничения.
10. Только после успешного RC переносить проверенный результат из `flood-dev` в публичный release flow.

## Финальный гейт

Стабильной считаем только версию, которая:

- сохраняет пользовательские Markdown-данные;
- корректно переживает внешние изменения;
- имеет единый domain/MCP contract;
- даёт агенту bounded project context;
- отделяет proposal от apply;
- не скрывает external writes;
- проходит основные сценарии в реальном установленном Tauri-приложении;
- визуально целостна на основных и вторичных поверхностях.

---

## GitHub execution map — Stable 0.2.0

Канонический umbrella issue: `#11`. Milestone: `0.2.0 Stable`.

Epic/coordination issues используются только для навигации. Реализация идёт по leaf-очереди ниже, строго сверху вниз, по одному issue за раз.

```text
Stage 0 — Baseline
#21 → #22

Stage 1 — Storage Integrity
#116 → #117 → #118

Stage 2 — Shared Domain + MCP
#119 → #23 → #24 → #25 → #26 → #27 → #28

Stage 3 — Project Context
#120 → #30 → #31 → #32 → #33 → #34 → #40 → #44 → #29 → #42 → #47

Stage 4 — Human–Agent Runtime
#35 → #36 → #37 → #38 → #121

Stage 5 — Integrations + Automation
#49 → #51 → #52 → #54

Stage 6 — UI Foundations
#64 → #65

Stage 7 — Shared UI Contracts
#66

Stage 8 — Anchor Surfaces
#67 → #68 → #69

Stage 9 — Remaining UI
#85 → #86 → #87 → #122 → #89

Stage 10 — Hardening
#72 → #88 → #73 → #74 → #71 → #123

Stage 11 — RC → Stable
#96 → #75 → #76 → #90 → #77 → #79
```

### Что добавлено сверх старого backlog

- `#116` — канонический Markdown schema + stable identity audit;
- `#117` — external-edit conflicts и expected-version parity;
- `#118` — restart/index/backup recovery integrity;
- `#119` — доказательство общего domain path для Desktop и MCP;
- `#120` — ownership и canonical lifecycle Project Context;
- `#121` — сквозной Agent Proposal → Review → Apply;
- `#122` — отдельная миграция Agent Runs / History UI;
- `#123` — end-to-end offline/failure-state desktop matrix.

Эти задачи закрывают разрывы между старым backlog и текущим линейным планом. Они не заменяют существующие leaf issues, а связывают их в проверяемый путь до релиза.

### Правило закрытия leaf issue

Перед закрытием каждого leaf:

1. проверить существующую реализацию и не дублировать уже готовое;
2. выполнить acceptance конкретного issue;
3. прогнать затронутые проверки;
4. для UI подтвердить результат в реальном Tauri-приложении;
5. оставить checkpoint: что изменено, чем проверено, какие ограничения остались;
6. только после этого переходить к следующему номеру в очереди.

---

## Рабочий порядок после этого документа

При переходе к реализации берём **только пункт 0**. После его гейта — пункт 1, затем 2 и далее без перескоков.

Если внутри этапа уже есть реализованная часть, её не переписываем: проверяем, фиксируем разрыв и закрываем только недостающее. План должен сужаться по мере продвижения, а не превращаться в растущий backlog.
