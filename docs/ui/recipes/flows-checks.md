# Interaction lab 0.5 — проверка

[Превью](flows.html) · [контракт](../interaction-components.md) · статус **candidate**, 2026-09-19.

Открывать `flows.html` рядом с `precision.css`, `flows.css` и `flows.js` через local static server. Разговорный HTML включает те же файлы inline и работает без сервера. Нет сети, CDN, шрифтовых файлов, реальных source bindings или dependencies приложения. Golos Text — только если установлен, иначе system fallback.

## Выполнено

`node --check flows.js` — синтаксис. `python check-flows.py --output <каталог>` — отдельно доступные Python Playwright/Chromium; это не новая зависимость Flood. Runner использует `page.set_content` с теми же CSS/JS, не утверждает проверку navigation file://.

24 состояния viewport: menu/combobox/dialog × 1180/780/390/320 × light/dark. Открытые popups остаются во viewport, horizontal page overflow отсутствует. Визуально просмотрены wide light menu/dialog и narrow dark dialog.

34 группы проверок в отчёте runner (одна из групп объединяет 24 viewport states): keyboard menu/confirm/return focus; selection и Escape у combobox; no-results; installation/repo identity; скрытый фильтром выбор; reset focus; Enter в search не commit; Tab containment; backdrop; double submit; success; catalog retry; write error; reconciliation без второй mutation; revoked source; closing pending без потери результата/focus theft; отзывы/JSON; tabs; reduced motion. JS page errors и внешние requests не зарегистрированы. Forced-colors отрендерен; полная его визуальная/assistive проверка не заявляется.

При ранней проверке узкого окна auto-scroll закрывал только что открытый combobox. Исправлено: popup пересчитывает положение при scroll/resize, закрывается лишь при уходе anchor за viewport. Повторный runner прошёл.

## Границы

Не проверены реальное Tauri-окно, WebKit/WebView2, OS scaling, native 200% zoom, screen reader, все комбинации error recovery, async search/pagination, реальная отмена сетевого запроса и production build. Синтетические repository IDs/описания не являются данными GitHub. Unknown outcome охватывает одну симуляцию успешной записи с потерянным ответом.

Новых foreground/background palette roles нет: используются approved tokens `precision.css`; scrim/shadow декоративные. Проверка взаимодействий не заменяет полный contrast audit native select popup, alpha/transitions или реального экрана. Selection и ошибки всё равно требуют проверки в production.

Отзывы живут в памяти страницы, экспорт JSON локален. Ни отзыв, ни попадание файлов в main не утверждает кандидаты автоматически. Сама DS 0.4 и clean-light остаются принятыми; следующий слой ещё проходит review.
