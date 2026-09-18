# Desktop ↔ MCP mutation parity — 0.2.0

Проверка для issue #119: desktop-команды Tauri и MCP-инструменты не должны содержать собственные расходящиеся правила изменения проектов, задач и project-owned Markdown.

## Итог

Канонический mutation/validation/version path находится в `flood-core::Store`. Tauri-команды вызывают `Store` напрямую. MCP добавляет только transport/policy-обвязку: Project Work Context, destructive gate, `request_id`, preview token, activity/receipt и преобразование строковых аргументов в domain-типы.

Коды ошибок `StoreError` также принадлежат core через `StoreError::code()`. Desktop и MCP больше не держат отдельные таблицы соответствия.

## Parity table

| Сущность / операция | Desktop | MCP | Общий domain path | Adapter-only отличие | Version / validation semantics |
| --- | --- | --- | --- | --- | --- |
| Project: create | `create_project` | `create_project` | `Store::create_project` / `Store::create_project_idempotent` → `create_project_locked` | MCP: `request_id`, activity | title validation в core; версии нет до создания |
| Project: rename | `update_project` | `update_project` | `Store::update_project` | MCP: Project Work Context, activity, receipt | один `expected_version`; stale → `StoreError::Conflict` |
| Project: context | `update_project_context` | `update_project_context` | `Store::update_project_context` | MCP: Project Work Context, activity, receipt | одинаковые core validation/version checks |
| Project: resources | `set_project_resources` | `set_project_resources` | `Store::set_project_resources` | MCP не может сам выдать access новому/перенаправленному source | итоговый payload валидируется и version-check выполняется в core |
| Project: details composite | `update_project_details` | — | `Store::update_project_details` | Desktop-only composite command; MCP использует отдельные context/resources mutations | атомарная desktop mutation защищена `expected_version` в core |
| Project: delete | `delete_project` | `delete_project` | `Store::delete_project` | MCP: destructive gate + Project Work Context + activity | один `expected_version`; stale → conflict |
| Document / Rule / Skill: create | `create_project_workspace_item` | `create_project_workspace_item` | `Store::create_project_workspace_item_idempotent` | MCP запрещает сразу выдавать новый Rule/Skill агенту; `request_id`, receipt | content/title/kind validation в core |
| Document / Rule / Skill: update | `update_project_workspace_item` | `preview_project_workspace_item_update` → `apply_project_workspace_item_update` | `Store::update_project_workspace_item` | MCP: access check + preview token + Project Work Context + receipt | Store повторно проверяет тот же `expected_version` под write lock; stale → conflict |
| Document / Rule / Skill: delete | `delete_project_workspace_item` | — | `Store::delete_project_workspace_item` | MCP delete не экспонирован | desktop version semantics задаёт core |
| Project memory: add | `add_project_memory` | `add_project_memory` | `Store::add_project_memory_idempotent` | MCP: Project Work Context, receipt | общий `expected_version` + `request_id` semantics |
| Project memory: edit | `update_project_memory` | `update_project_memory` | `Store::update_project_memory` | MCP: Project Work Context, receipt | один `expected_version`; validation в core |
| Project memory: supersede | `supersede_project_memory` | `supersede_project_memory` | `Store::supersede_project_memory_idempotent` | MCP: Project Work Context, receipt | общий `expected_version` + `request_id` semantics |
| Project memory: delete | `delete_project_memory` | `delete_project_memory` | `Store::delete_project_memory` | MCP: destructive gate + Project Work Context + receipt | один `expected_version`; stale → conflict |
| Task: create | `create_task` | `create_task` | `Store::create_task` / `Store::create_task_idempotent` → `create_task_locked` | MCP: Project Work Context, `request_id`, optional agent run, activity | description/source/project validation в core |
| Task: update | `update_task` | `update_task` | `Store::update_task` | MCP: Project Work Context, parse string enums, activity | один `expected_version`; stale → conflict |
| Task: complete | `complete_task` | `complete_task` | `Store::complete_task` | MCP: Project Work Context, activity | один `expected_version` |
| Task: move | `move_task` | `move_task` | `Store::move_task` | MCP проверяет context исходного и целевого проектов + activity | один `expected_version`; project existence/domain checks в core |
| Task: trash / restore | `trash_task` / `restore_task` | `trash_task` / `restore_task` | `Store::trash_task` / `Store::restore_task` | MCP: Project Work Context, activity | один `expected_version` |
| Task: permanent delete | `delete_trashed_task` | `delete_trashed_task` | `Store::delete_trashed_task` | MCP: destructive gate + Project Work Context | один `expected_version` |
| Task: clear source | `clear_task_source` | `update_task(clear_source=true)` | desktop: `Store::clear_task_source`; MCP: `Store::update_task` с `source=Some(None)` | форма API различается | обе операции используют core version check; MCP не содержит отдельной domain-validation |

## Проверяемые инварианты

1. Desktop и MCP не реализуют собственные проверки stale-version вместо `Store`; MCP preview может отсеять заведомо stale данные раньше, но `Store` повторяет проверку под блокировкой записи.
2. `create_project` и `create_task` отличаются только генерацией стабильного id для MCP retry: обычный и idempotent варианты сходятся в одном `*_locked` path после одинаковой core-валидации.
3. Документы, правила и skills — один domain type (`ProjectWorkspaceItemKind`) и один CRUD path в `Store`; MCP preview/access rules остаются transport/policy-слоем.
4. Память проекта изменяется только через `Store`; MCP receipt/destructive gate не меняют domain semantics.
5. Канонический machine-readable error code задаёт `StoreError::code()`. Tauri `AppCommandError` и MCP `McpToolError` используют его напрямую.

## Verification

- `flood-core`: unit/integration tests для Store validation, idempotent create и stale-version конфликтов.
- `flood-mcp`: stdio smoke проверяет tool negotiation и structured responses.
- `stdio_compact_context_reads_preserve_the_mutation_gate`: внешнее изменение через `Store` делает MCP mutation stale; workspace update и task update возвращают `code = "conflict"`, после свежей версии mutation проходит.
- Tauri adapter test `store_conflict_has_stable_tauri_error_code`: desktop получает тот же канонический `conflict` code.
