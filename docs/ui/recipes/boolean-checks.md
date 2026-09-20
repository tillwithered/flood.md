# Boolean lab 0.6.4 — проверки

[Контракт](../boolean-controls.md) · [открыть](boolean-controls.html) · 2026-09-19 · candidate.

HTML/CSS/JS нового lab используют **неизменённый** primitives-refined.css0.6.3, blob `470cd3a90ca82b74063b53c2185b60325273253e`. Автономное разговорное HTML встраивает эти же bytes и MIT notice. Новых packages приложения, шрифтов и сетевых вызовов нет.

## Выполнено

`node --check boolean-controls.js` и `FLOOD_EVIDENCE=<каталог> python check-boolean.py`.

**133 assertions:** из них24 desktop layout cases (4 раздела ×960/1180/1440 ×light/dark) и54 проверки явных непрозрачных цветовых пар. Количество assertions не равно количеству критериев доступности. 62 статичных образца — 24checkbox/16radio/22switch — проверены по количеству, они не являются62 живыми интеракциями.

Проверены mixed→all→none/Space, scoped master без disabled child, label activation, group validation и восстановление; radio без default/ошибка/стрелки/disabled/Tab/commit; switch on/off/pending/failure/retry captured intent/unknown/readback без второй записи, блокирование повторов, стабильная подпись, отсутствие focus theft на скрытой вкладке.

Измерены checkbox18/R5/gap10/first-line offset1, track36×20/thumb16/inset2 в обоих положениях; длинная подпись не растягивает mark. Проверены двухслойный focus на mark без дубля input и rest без shadow, отсутствие select/number/resize grip, настоящие fill paths, локальные отзывы/JSON.

Forced-colors отрендерен, проверен отдельный outline; reduced motion снимает анимацию thumb. Абсолютное2× увеличение вычисленных font-size/line-height проверено на geometry/dark/960 без page overflow — это не native zoom. Отдельная Chromium coarse/touch эмуляция проверила label target≥44 и tap. JS errors/внешние запросы основной страницы:0.

Визуально просмотрены checkbox light, switch dark и radio/geometry desktop screenshots. Runner не скрывает scrollbars headless-флагом. При доработке исправлена потеря фокуса на исчезающей retry-кнопке; повторные проверки пройдены.

## Ограничения

Только Chromium, загрузка тех же файлов через page.set_content. Playwright/Chromium должны быть отдельно установлены; FLOOD_CHROMIUM_PATH либо PATH. Не заявлены Tauri, Safari/WebKit/WebView2, screen reader, native200% zoom, физический дисплей/DPI, все семантические/цветовые/alpha/animation combinations и реальные API.

Значения 0.6.3 focus сохранены, не утверждены заново за владельца. Тесты проверяют relevant opaque tokens; полный WCAG/AAA-аудит не выполнен. Статичные состояния не получают Tab/checkbox roles. Disabled+focus не моделируется как обычный native disabled state. Не проверены все возможные ошибки reconciliation. Приложение, .flood и permissions не изменены.
