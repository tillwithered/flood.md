# Feedback primitives — 0.6.6

**Уточнение0.6.7:** Danger-banner material сохраняется, но нейтральная белая/угольная кнопка внутри отвергнута. Для recovery используем [contextual banner action](brand-and-notices.md): действие визуально принадлежит semantic surface, не выглядит вторым вложенным control. Остальная семантика feedback0.6.6 и её candidate-status не меняются.

[Индекс](README.md) · [desktop lab](recipes/feedback.html) · [проверки](recipes/feedback-checks.md) · 2026-09-19.

**Approved in shown scope: FEEDBACK-066.** После одобрения iconography 0.6.5 переходим к обратной связи, не к рабочим экранам. Палитра, Heroicons Solid, focus, flat controls и boolean 0.6.4 не меняются. Это отдельный browser specimen, не production migration.

## 1. Сначала определить тип неопределённости

Нельзя использовать один spinner для любого ожидания.

| Ситуация | Примитив | Не делать |
| --- | --- | --- |
| Первый load новой структуры | Skeleton итоговой геометрии | Пустой экран + большой spinner |
| Refresh уже видимых данных | Локальный spinner/status | Заменять данные skeleton или блокировать всё окно |
| Известно N из M | Determinate progress | Выдумывать процент без знаменателя |
| Активная операция без знаменателя | Spinner + текст этапа | Fake progress 73% |
| Локальный результат действия | Inline feedback | Toast + banner + badge одновременно |
| Длительное состояние области | Banner/notice | Исчезающий toast как единственное объяснение |
| Краткий подтверждённый итог | Toast | Хранить критическую ошибку до auto-dismiss |

Loading primitive не должен заставлять человека заново находить контекст после завершения. Existing content сохраняет layout и scroll там, где это безопасно.

## 2. Skeleton

Skeleton используется главным образом при **первом** появлении структуры или значимой смене формы данных. Блоки повторяют реальную row geometry: одинаковая высота, оси и количество крупных зон. Не рисовать декоративные аватары/плашки, которых не будет в результате.

Пилот: row min-height58, title block12, metadata10. Нейтральные блоки без borders/cards внутри каждой строки. Допустим тихий opacity breathe 1500ms; `prefers-reduced-motion` делает skeleton статичным. Агрессивный shimmer через весь экран не default Flood.

Skeleton не маскирует permission error, no-results или пустой проект. Эти состояния имеют своё сообщение и действие.

## 3. Spinner и refresh

Spinner 14px/2px используется рядом с **текстом операции**, а не как самостоятельное объяснение. Для refresh существующего списка данные остаются видимыми и не меняют opacity всей области. `aria-busy` относится к обновляемому региону; кнопка повторного refresh блокируется только на время текущего запроса.

Если операция блокирует только одну кнопку — pending живёт в кнопке/рядом с ней. Не создавать modal overlay ради локального сохранения. Если человеку безопасно продолжать читать/навигацию, spinner не должен блокировать это.

Reduced motion убирает вращение, но текст «Обновляем…» остаётся. Статичный индикатор без текста не является достаточным состоянием.

## 4. Determinate progress

Progress bar показывается только при честном denominator: bytes, files, completed/total и т.п. Пилот: height6, monochrome ink fill, neutral track, явный текст `N из M` и процент. `role=progressbar` получает min/max/now.

Процент не является status color. Success появляется после подтверждённого завершения. Не анимировать progress к произвольной цели для ощущения скорости. Не откатывать визуально назад без объяснения, если denominator пересчитан.

Agent run, reasoning, network handshake и «проверяем доступ» обычно не имеют честного процента. Для них показывать этап/последнюю активность/известный факт, а не progress bar.

## 5. Inline feedback

Inline feedback относится к ближайшему действию или полю. Pending нейтрален. Success может использовать existing Success text; error — Danger. Сообщение не меняет ширину control и не исчезает раньше, чем человек успел понять результат.

Успех простого сохранения может быть кратким и затем вернуться к нейтральному состоянию; он не обязан становиться отдельной зелёной card. Ошибка сохраняет draft и остаётся до следующего meaningful retry/редактирования. Важная ошибка имеет recovery рядом.

## 6. Banner / notice

Banner означает длительное состояние **области**, например expired GitHub session, revoked access, offline source. Он живёт внутри затронутой surface, не обязательно в самом верху всего приложения.

Пилот: R12, 12×14 padding, semantic surface, icon16, title + helper + одно основное recovery action. Без тяжёлой рамки и без shadow. Warning/Danger/Success используют уже принятые semantic families. Не создавать banner для каждого успешного сохранения.

После устранения причины persistent warning может смениться кратким success notice или исчезнуть. Не держать вечный success banner, если он больше не несёт полезного состояния.

## 7. Toast

Toast — floating краткий итог завершившейся операции. Он **не крадёт focus**. `aria-live=polite` сообщает пассивный результат; критические решения не полагаются только на live region.

Пилот: width до340, R12, edge1, panel background, локальная floating shadow — разрешённая depth роль, не тень control. Stack максимум3. Icon16 использует semantic color, текст остаётся основным.

Timing candidate: passive success/info 5s; Undo 8s. Hover/focus приостанавливает таймер. Escape закрывает только toast, в котором находится focus. Close button имеет accessible name. Toast с Undo содержит одно короткое действие; длинный workflow открывается в устойчивой surface.

Error, которая требует исправления, permission change или повторной операции, **не auto-dismiss toast**. Использовать inline/banner. Не дублировать одно событие toast + banner + permanent badge.

## 8. Motion и неизвестный итог

Motion сообщает изменение состояния, но не создаёт фиктивный progress. Spinner rotation и skeleton breathe отключаются при reduced motion; progress обновляется без smoothing-анимации. Toast не прыгает и не сдвигает рабочий content.

Unknown outcome — не success и не failure. Как в уже принятом F-01, UI предлагает reconciliation/проверку состояния перед повторной mutation. Feedback primitives должны уметь показать «Проверяем итог…» без зелёной галочки заранее.

## 9. Источники

Mobbin просмотрен 2026-09-19; точные capture dates MCP не сообщает, поэтому refs provisional: [Linear loading/progress](https://mobbin.com/screens/07969196-1fee-46e0-85b4-39972001d7fc), [Linear toast/confirmation](https://mobbin.com/screens/7833c5d5-299e-415f-adf4-7f53e586e11a), [Linear integration notice](https://mobbin.com/screens/b9c7d3d2-6f32-4553-9c85-0ef3a80af52a). Используем только локальность и относительный визуальный вес feedback; не переносим чужую палитру, timing или layout. Screenshot не доказывает keyboard/live-region behavior.

ARIA/WAI semantics: status/live region, `aria-busy` и `progressbar` описывают состояние, но не задают визуальный стиль Flood. Chromium lab не заменяет screen reader/Tauri/WebView проверку.

## После просмотра

0.6.6 approved после ответа владельца «да, нормально. идем далее». Atomic audit0.6.9 закрывает generic primitive gate; текущая design-работа переходит в [workspace0.7.0](workspace-070.md). Browser/Tauri/SR acceptance остаётся отдельным runtime track.
