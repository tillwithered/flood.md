# Defensive security boundary audit — 0.2.0

Дата: 20 сентября 2026 г.  Область: local storage, MCP, project connectors, attachments, export/import и процессы локальных agent providers.

## Итог

Открытых P0/P1 findings в проверенной области нет. Значимые границы enforced в общем domain/runtime слое, а не только описаны в UI. Контент задач, Telegram, GitHub и файлов остаётся недоверенными данными и не расширяет разрешения.

## Findings и remediation

| Severity | Finding | Evidence | Remediation / state |
| --- | --- | --- | --- |
| P0 | Результат agent run мог тихо записать предложенную память проекта. | `finish_work_result` раньше переносил `WorkResult.memory` в active memory. | Устранено: результат хранит только proposal; канонические memory/rule/skill меняются отдельным review/apply с base version и provenance run receipt. |
| P0 | Локальный provider мог наследовать лишние environment secrets и переживать cancel/exit. | Процессы запускались через обычное inherited environment без общего process registry. | Устранено: canonical workspace validation, `env_clear` + минимальный allowlist, bounded stdout/stderr, tracked process tree и termination при cancel, остановке automation и выходе приложения. |
| P1 | GitHub recursive tree мог вернуть слишком большой ответ. | Provider-side `truncated` не ограничивал локальный размер после фильтрации. | Устранено: максимум 5000 tree entries; файл отклоняется по объявленному и фактическому размеру свыше 1 МБ; search и issue/PR context также ограничены. |
| P1 | Connector failures смешивали stale auth, permission, rate limit и scope. | Provider errors сводились к общей строке. | Устранено: нормализованы `AuthExpired`, `PermissionDenied`, `RateLimited`, `OutOfScope`, `InvalidRequest`; binding и request bounds проверяются до чтения. |
| P1 | Перенос проекта мог захватить runtime/credentials или перезаписать существующие ID. | Ранее не было переносимого проверяемого формата. | Устранено: archive allowlist, manifest + SHA-256, zip-slip/symlink/size/file-count guards, offline verification и conflict-without-write. Credentials, sessions, queues, caches и integration secrets исключены. |
| P1 | Диагностический экспорт мог раскрыть workspace content или локальный путь. | Полезной безопасной проекции не существовало. | Устранено: sanitized report содержит состояния, counts и correlation IDs; data root заменён fingerprint, тексты, output, credentials и paths исключены. |
| P2 | Run/task lifecycle допускал неявное завершение задачи при acceptance. | `accept_agent_run` связывал два разных решения. | Устранено: legal run state machine; accept result и complete task — отдельные явные действия; restart переводит невосстановимый running в interrupted. |

## Подтверждённые границы

- Storage: atomic writes, optimistic versions, recovery journal, fault-injection/restart coverage; export/import не пишет внутрь data root и не следует путям из архива наружу.
- MCP: Project Work Context receipt, обязательное дочитывание усечённых rules, preview/apply token, exact payload and expected-version checks, idempotent request IDs. Destructive mode выключен по умолчанию.
- Agent runtime: immutable receipt создаётся до execution; включает context digest/manifest, versions, allowed actions, provider capabilities, working directory, sandbox и permissions без полного prompt/transcript.
- Connectors: project binding и Agent access ограничивают source scope. Telegram local acknowledgement не вызывает TDLib read receipt. GitHub объявляет только read capabilities.
- Attachments: изображения и файлы имеют явные лимиты; локальные пути и provider credentials не возвращаются агенту.
- Automation: выключена по умолчанию, требует consent, ограничивает batch/retry/context/token budget и немедленно прекращает новые вызовы после stop.

## Остаточный риск и RC guidance

Flood запускает пользовательские локальные CLI внутри разрешённого workspace; это process isolation, а не полноценная OS VM sandbox. Перед RC чистая Windows-установка должна подтвердить kill-tree, denied out-of-scope path, empty/minimal child environment, offline recovery и отсутствие секретов в sanitized export. Любое будущее connector write действие обязано пройти тот же mutation preview/approval contract и отдельный security review.
