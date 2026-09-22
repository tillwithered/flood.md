# Interface content contract

Agent instructions and technical specifications are English. Product UI is Russian by default, with existing localization behavior preserved. All examples below are synthetic, not user task data.

## Vocabulary

| Concept | Product wording | Avoid |
| --- | --- | --- |
| Project | Проект | Чат when the object is a project; workspace/team jargon |
| Task | Задача | Issue, ticket, объект |
| Project settings | Настройки проекта | Контекст проекта |
| Create task | Добавить задачу | Создать сущность; redundant “новую новую” |
| Complete action / completed state | Завершить / Выполнено | Treating agent result as task completion |
| Urgency | Обычная / Важная / Срочная | P0–P4 or changing the model |
| Agent result | Результат готов / Посмотреть изменения | “Готово” when nothing has been applied |
| Local save acknowledged | Сохранено | “Синхронизировано” for a local file write |
| External conflict | Файл изменён вне приложения | “Версионный конфликт E409” as primary copy |

The action “Новая задача” can remain where it names a compact toolbar entry; choose one label for equivalent contexts rather than switching randomly. Use an infinitive for actions and factual language for states. A visible control label contains at most two words. Put object identity, explanation and consequence in the surrounding heading, row or confirmation copy; the accessible name may add context that is not visible inside the control.

## Inherit context

If a parent already says “Настройки проекта”, its tabs are simply “Контекст” and “Интеграции”; child sections say “Документы”, “Память” and “Автоматизация” without repeating the project scope. A control must still be understandable out of context to assistive technology. Give icon-only buttons a Russian accessible name; tooltips may explain but never provide the only name or essential instruction.

Use one sentence to explain an empty state and one next action. Avoid generic greetings, long introductions, motivational slogans and unnecessary technical implementation details. Explain technical terms only when the user must make a real decision about them.

## State copy matrix

| State | Example | Action / retained context |
| --- | --- | --- |
| Empty project | “Задач пока нет” | “Добавить задачу”; retain project name |
| Search empty | “Ничего не найдено” | “Сбросить поиск”; keep query editable |
| Saving | “Сохраняем…” | Keep editor usable when safe; show actual pending state |
| Save failure | “Не удалось сохранить. Текст остался в редакторе.” | “Повторить”; details on demand |
| External edit, clean buffer | “Файл обновлён вне приложения” | Refresh safely; preserve useful position |
| External edit, dirty buffer | “Файл изменён вне приложения. Ваш текст остался в редакторе.” | Review both versions; no silent overwrite |
| Missing task file | “Файл задачи не найден” | Preserve draft if any; return to project or authorized recovery |
| Offline source | “Оригинал сейчас недоступен” | Saved snapshot remains readable |
| Permission needed | “Агенту нужен доступ к выбранному источнику” | Explain exact source/scope and user-controlled grant |
| Run needs input | “Нужен ответ” plus the concrete question | Answer field; preserve response while sending |
| Result ready | “Результат готов к проверке” | “Посмотреть изменения”; explicit acceptance |
| Diagnostics failure | “MCP не удалось запустить” plus known cause | One useful recovery action, technical details collapsed |

Examples describe target behavior. Do not claim a recovery option exists unless the corresponding safe operation is implemented. Do not promise “текст сохранён” when it is only in memory across a possible application exit; distinguish “остался в редакторе” from durable draft storage.

## Forms and destructive operations

Every field has a persistent label. Hints precede likely mistakes; validation explains the correction next to the field and is programmatically associated. Preserve values after failure. A disabled action has an understandable reason when that reason is not obvious.

Use specific destructive copy: affected object and consequence, e.g. “Переместить задачу в корзину?”. Show recovery only when supported. Permanent deletion explicitly states irreversibility and exact scope. A red button is reserved for the destructive confirmation, not routine overflow triggers.

## Dates, quantities and truncation

Format dates with the active locale and local timezone; use unambiguous absolute detail when a relative date could mislead. Creation date is not a deadline. Source timestamp is not task creation date. Counts use proper Russian pluralization.

Test long Cyrillic titles, duplicate project names, quotes, multiline text and paths. Truncate only secondary list context, with a way to read the full value. Never truncate the concrete question, error recovery or destructive consequence. Text layout must expand at 200% zoom and with user spacing overrides.
