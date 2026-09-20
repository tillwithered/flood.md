# Repository metadata 0.5.1 — проверка исправления

[Контракт](../repository-metadata.md) · [превью](flows.html) · 2026-09-19.

Исправление применяется к двум файлам существующего образца: `flows.css`, `flows.js`. `flows.html` и `precision.css` сохранены без изменений; в разговорном HTML те же CSS/JS встроены. Ни сеть, ни шрифты, ни зависимости приложения не добавлены.

## Выполнено в этой итерации

- `node --check flows.js` — синтаксис корректен.
- `python check-repository-metadata.py --output <каталог>` — Python Playwright/Chromium: **78 проверок**, включая 10 базовых представлений (две темы × 1180/780/414/390/320 CSS px).
- Заголовок с метками перед описанием, без overflow строки/страницы; linked+private, archived+public, revoked+private; длинное имя; увеличение текста вдвое абсолютными размерами; отсутствие ложного linked при unknown outcome.
- Сохранение выбора при фильтрации/no-results, Enter в search без записи, блокирование double-submit, reconciliation без повторной mutation. Метки не создают дополнительных controls/Tab stops.
- Проверены четыре opaque-пары metadata text/background: rest и selected в обеих темах. Это не сертификация всех соседств, gradients, alpha или промежуточных кадров.
- Forced-colors выбранной строки, отсутствие внешних requests и ошибок JavaScript. Отрендерены широкие и узкие screenshots; визуально просмотрены light/dark 414 px.

Runner читает реальные файлы образца и использует `page.set_content`, а не `file://` navigation. Требует отдельно установленных Python Playwright и Chromium (`FLOOD_CHROMIUM_PATH` либо PATH). Не добавлен в package.json приложения.

## Ограничения

Это focused regression test, не повтор всех 34 групп исторического `check-flows.py`. Не проверены реальный Tauri, iOS Safari/WebKit, WebView2, screen reader, OS scaling и нативный 200% zoom. Текстовый стресс-тест не равен browser zoom. Скриншоты мобильной ширины — Chromium-рендер, не запись с телефона.

Не выполнены production build и реальные GitHub operations. Существующие десять записей каталога синтетические; сохранение privacy при connected не доказывает изменение реальных прав. Утверждение владельцем касается дизайна и запрошенного размещения метаданных, не production readiness.
