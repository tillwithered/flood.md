---
name: flood-ui-review
description: "Review a Flood UI implementation or design diff for composition, component contracts, neutral visual language, accessibility, states, copy, agent trust, and regression risk. Use for UI audits and acceptance reviews; do not automatically rewrite the frontend."
---

# Flood UI review

Прочитай [UI index](../../../docs/ui/README.md), соответствующий recipe и [acceptance](../../../docs/ui/acceptance.md). Не проверяй все нерелевантные экраны.

Для каждого finding укажи: path/строка или наблюдаемый state → правило → влияние на пользователя → минимальное исправление → проверка. Отделяй подтверждённый дефект от hypothesis и эстетического предложения. Читай callers и computed behavior, прежде чем объявлять отсутствие focus handling в wrapper runtime bug.

Приоритеты:
- Блокирует: потеря данных, неверный scope/identity, ложный success, небезопасное подтверждение, keyboard trap.
- Мешает сценарию: неверная surface, отсутствие error recovery, нечитаемая иерархия/narrow layout.
- Polish: точность spacing/radius, optical alignment, лишняя рамка или иконка.

Проверь state, light/dark, narrow, long RU, keyboard, draft/selection, source provenance. Contrast оценивать по реальной паре цветов. Не ранжировать дефекты только по screenshot и не считать неизвестный capture date современным эталоном.

Результат: короткий список конкретных findings; что проверено; что не проверено; готовность именно затронутого flow. Для docs-only review проверять пути, непротиворечивость и статусы решений, не заявлять UI-ready.
