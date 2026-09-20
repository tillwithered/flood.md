---
name: flood-ui-implementation
description: "Implement or fix Flood Svelte 5 and Tauri frontend screens and components after the interaction direction is defined. Use for UI code, forms, dialogs, repository picker, themes, accessibility, and focused component extraction; not backend-only tasks."
---

# Flood UI implementation

Прочитай `AGENTS.md`, применимый `src/AGENTS.md` и [UI index](../../../docs/ui/README.md). Затем только recipe/contract текущего сценария. Если surface ещё не определена, сначала `flood-ui-design`.

1. Найди relevant symbols через targeted search. Не читай App.svelte/styles.css/i18n.ts целиком по умолчанию; проверь actual callers и cascade, прежде чем объявлять дефект.
2. Реализуй минимальную целостную границу. [Migration](../../../docs/ui/frontend-audit.md) описывает первый pilot; это предложение, не уже существующие файлы.
3. Переиспользуй existing tokens, i18n, logos, command/error contracts. Не добавляй React/Tailwind/runtime UI dependency. Не выдумывай pagination, permissions или idempotency API.
4. Сохрани state ownership, drafts, selection, event cleanup. Прочитай нужные пункты [interaction](../../../docs/ui/interaction.md); modal обязан иметь реальное focus/inert поведение, не только ARIA.
5. Проверь applicable states и один завершённый flow. Targeted check после coherent change; не запускай Rust workspace для чистого frontend.
6. Пройди [acceptance](../../../docs/ui/acceptance.md). Отчитай фактически выполненные команды, visual environment и not-run проверки. Browser preview не заменяет Tauri acceptance.

Никакой массовой декомпозиции/редизайна без отдельного scope. Не выдавай чтение исходника за runtime тест и не меняй live `.flood` snapshot напрямую.
