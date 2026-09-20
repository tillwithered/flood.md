# Buttons и field edge cases — 0.6.8

[Индекс](README.md) · [desktop lab](recipes/controls-068.html) · [checks](recipes/controls-068-checks.md) · 2026-09-19.

**Approved in shown scope: BUTTON-068 / FIELD-068; AUTOFILL-068 — approved direction.** После просмотра владелец перешёл к atomic audit0.6.9.

## Button roles
- Primary: одно главное commit-действие на локальной surface; ink fill, R10, min36.
- Secondary: neutral surface без явной border/shadow в rest.
- Ghost: transparent low-emphasis action.
- Danger solid: только после понятного destructive intent/confirmation; toolbar trash остаётся neutral.
- Contextual notice action — отдельный approved0.6.7 recipe, не общий secondary.
- Icon-only — approved0.6.5.

Pending сохраняет bounds, резервирует label/indicator slot и блокирует duplicate submit. Disabled сохраняет читаемый label; причина существует рядом/через description, а не только в tooltip/opacity.

## Fields
Default min36/R10. Border1+padding2=B3; nested action30/R7. Prefix/suffix не входят в editable value. Clear/copy/step actions фокусируются отдельно и не заставляют frame рисовать второй focus.

### Numeric
Системных steppers нет. Если stepping нужен, используем собственные −/+ nested actions. Input остаётся text-like с inputmode=numeric; wheel не мутирует значение. Ошибка не округляет/исправляет число молча.

### Readonly / copy
Readonly можно фокусировать и выделять. Copy-action вложенный. Disabled не подменяется readonly.

### Long content
Однострочный input сохраняет одну строку/горизонтальный caret. Textarea растёт до max и затем внутренне scroll. Long paste не меняет control radius и не выталкивает trailing action.

## Autofill / selection / caret
Не принимаем browser yellow/blue autofill как часть Flood theme. WebKit autofill получает neutral surface/text/caret override, но actual Tauri acceptance отдельно.
Selection = neutral ink alpha; caret = ink. Не blue brand accent.

## Late response
Mutation captures отправленное значение. Если draft изменён во время ожидания, поздний success относится только к captured value и не объявляет новый draft сохранённым.

## References
Mobbin 2026-09-19, capture dates unknown/provisional: Linear settings forms https://mobbin.com/screens/d4e47b31-9152-40c7-a400-c6725e8de647 and https://mobbin.com/screens/abf277ec-d00a-4504-8cfa-54930315f0ab; button/modal https://mobbin.com/screens/792749f2-7ecc-445e-a2d0-4e9e9c36a0c9. Validation search returned non-Linear results and is not used as Linear evidence.

## После review
0.6.8 принят. См. [atomic audit0.6.9](atomic-audit-069.md). Новых generic primitives без конкретного пробела не добавляем; остаются feedback0.6.6 review, runtime wrappers и representative Tauri/WebView/SR acceptance.
