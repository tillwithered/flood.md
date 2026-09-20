---
name: flood-ui-design
description: "Design or restructure Flood desktop screens, visual foundations, component contracts, screen composition, spacing, typography, surfaces, navigation, and integration selection flows. Use for Flood UI design decisions, not backend-only work."
---

# Flood UI design

1. Прочитай `AGENTS.md` и [UI index](../../../docs/ui/README.md). Уточни статус решения: существующая база или proposed extension.
2. Назови объект, действие, результат и ограничения. Для screen work прочитай [composition](../../../docs/ui/composition.md), для styling — [foundations](../../../docs/ui/foundations.md). Не загружай весь каталог.
3. Выбери [component contract](../../../docs/ui/components.md) и кратко объясни ближайшую отвергнутую альтернативу. GitHub repository binding использует [свой рецепт](../../../docs/ui/github-repository-picker.md).
4. Для agent result/permissions прочитай [human–agent](../../../docs/ui/human-agent.md). Safety rules и live MCP permissions не переопределяются этим skill.
5. Определи states и narrow behavior до polish. Сохрани Golos Text, neutral controls, прямой shell и отдельные identity/status. Не копируй OA Design, Material, Fluent или Carbon.
6. Для внешнего research используй `flood-ui-references`; launch date не доказывает актуальность screenshot.
7. Отдай небольшой проверяемый сценарий, не массовый restyle. Укажи tokens/roles, state matrix, [acceptance](../../../docs/ui/acceptance.md), допущения и необходимость пользовательской проверки направления.

`.flood/` — snapshot. Не переписывай manifest/version hashes и не утверждай, что живой workspace синхронизирован. Нерелевантные skills и документы не читай.
