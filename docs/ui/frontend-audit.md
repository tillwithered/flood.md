# Frontend audit и порядок внедрения

[Индекс](README.md) · исходная версия: `933df40cfac97cc0b1a25bb52e76ccfd383bcd48` · проверка 2026-09-19.

Это **направленный аудит исходников и правил**, не полный визуальный аудит приложения и не измерение скорости агента. Не выполнялся запуск desktop UI. Размер файла сам по себе не доказывает причину задержек модели или runtime.

## Что уже существует

В `.flood/` есть пять rules и шесть skills, включая design system, screen composition, implementation, human–agent interaction, copy и information architecture. Не нужно создавать конкурирующую философию с нуля. Их достоинства — собственный характер, работа с состояниями и ориентация на сценарии; проблемы — противоречия, повторения и отсутствие самостоятельной repo-local точки входа.

## Проверенные расхождения

| Наблюдение | Риск | Решение этого предложения |
| --- | --- | --- |
| `soft-utility-quality-bar-v1.md`: пункт 11 blue-violet accent, далее monochrome contract | Агент выбирает противоположные оформления | Поддержать поздние монохромные правила и текущие neutral tokens; старый пункт убрать при согласованном live update |
| Диапазон 14–15 / 24–28 в quality bar против точной type scale | Локальные magic sizes | Использовать точную scale Visual foundations |
| Требование читать `Design.md`, `Stack.md`, живые документы, которых нет в repository snapshot | Поиск несуществующего контекста, ложное чувство прочитанного | Новые dev-skills имеют реальные относительные ссылки; live документы не подменяются выдуманными |
| Запрет поиска в popover и предел 5–7 вариантов как общее правило | Modal даже для простого значения | Различить menu, select, combobox и содержательный selection flow |
| Одновременно compact rows и запрет dividers для любой clickable row | Раздувание списков | Отдельно standalone action row и dense collection/table |
| `.flood/README.md` называет live MCP workspace каноническим | Перезапись export создаёт рассинхронизацию | Snapshot/manifest не менять; явно запланировать перенос одобренного |

## Проверка кода

Просмотрены начальные sections `src/styles.css`, imports/types `src/App.svelte`, `src/components/IntegrationModal.svelte` и `src/integrations/registry.ts`, а также структура repository. Не заявляется, что просмотрен каждый handler или все CSS overrides.

В начале CSS уже есть Golos Text, neutral light/dark tokens, spacing roles и content widths. Существуют также literal light-hover значения у отдельных sidebar controls. Это **кандидаты на аудит**: перед исправлением проверить cascade и реальное computed style, поскольку поздний override может менять результат.

`IntegrationModal.svelte` задаёт dialog semantics, header, close и body, принимает optional onkeydown. Сам компонент не содержит полного механизма initial focus, trap, restore focus и inert background. Нужно проверить callers и выбрать одного владельца этого поведения; это не доказательство, что всё уже сломано в runtime.

`App.svelte` объединяет множество domain types и surfaces. В нём есть GitHub catalog types, достаточные для проектирования UI, но это не подтверждает полноту API. `registry.ts` описывает реальные GitHub/Telegram providers и capabilities — не добавлять фиктивные интеграции для красивого экрана.

## Почему не декомпозиция всего сразу

Перемещение тысяч строк без проверенного поведения может сохранить проблемы в большем числе файлов. Сначала выбрать границу одного законченного flow, сохранить API и покрыть состояния. Не смешивать полный визуальный restyle, перенос state, новый backend contract и обновление зависимостей в одном PR.

Предлагаемая структура при реализации, не уже созданные компоненты:

```text
src/
  components/ui/        # только действительно общие primitives
    Dialog.svelte
  features/integrations/github/
    RepositoryPicker.svelte
    repository-picker-state.ts
    repository-catalog.ts
```

Импорт domain types/commands оформить по текущему проекту. Не создавать общий state framework до второго реального use case. `App.svelte` временно остаётся orchestration layer.

## Пилот 1 — repository picker

1. Найти реальный trigger, bindings, catalog handler и callers modal точечным поиском.
2. Зафиксировать before: normal, empty, loading, error, keyboard, обе темы.
3. Выделить typed adapter без изменения backend semantics. Подтвердить scope/fullness каталога и version checks.
4. Реализовать [picker contract](github-repository-picker.md), включая focus и recovery. Общий Dialog выделять только в объёме реально нужного поведения.
5. Пройти [acceptance](acceptance.md) в браузерной итерации и реальном Tauri-окне.
6. Получить подтверждение направления; только затем распространять contract.

## Следующие независимые этапы

Artifact editor → project overview/task index → task editor и agent review. На каждом этапе проверять, что extracted state не дублирует canonical state и подписки освобождаются. Новые substantial UI blocks не увеличивают App.svelte без причины.

CSS переносить по владельцу: tokens/base остаются глобальными; feature/component styles постепенно локализуются. Перед удалением selector проверить использование. Не менять весь набор radius/spacing только ради соответствия предложенной таблице. Живые exceptions должны быть объяснены и ограничены.

## Как измерить пользу

Сравнить одинаковые сценарии до/после: время открытия picker, ввод query на большом каталоге, объём DOM, latency commit, число потерянных drafts/selection, keyboard completion. Для coding agent отдельно измерять время до первого релевантного изменения и число повторных чтений; не обещать коэффициент ускорения от одного AGENTS.md.

## Граница этого PR

Добавлены только руководство, dev-skills и frontend routing instructions. Нет runtime imports, новых dependencies, изменений permissions, `.flood` versions, backend, actual screens или CSS tokens. UI validation ещё предстоит в implementation PR.
