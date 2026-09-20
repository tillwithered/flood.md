# Desktop lab 0.6.3 — проверка исправлений

[Контракт](../primitives-refinement.md) · [открыть](primitives-refined.html) · 2026-09-19.

Три файла HTML/CSS/JS; автономное превью содержит те же bytes inline, включая Heroicons MIT notice. Нет CDN, шрифтовых файлов, сетевых вызовов или настоящих операций GitHub. Это не runtime-компоненты приложения.

## Выполнено

- `node --check primitives-refined.js` — синтаксис.
- `python check-refined.py` — **93 assertions**, включая **18 layout cases**: fields/selects/details × 960/1180/1440 × light/dark. Не путать количество assertions с количеством отдельных accessibility criteria.
- Степперы отсутствуют; numeric value не меняется от wheel; integer error не исправляет введённое молча. Нет native select ни в одном разделе. Resize:none у обоих textarea, автогроу/сжатие и внутренняя прокрутка после240px; native Enter и копирование readonly сохранены.
- Фокус: два zero-offset слоя, без двойного input outline и изменения rect; core контрастирует с тремя подложками и их alpha-halo в обеих темах. Это измеренные пары focus, не аудит всей палитры.
- Option без border/outline/shadow; committed ARIA selection отличается от keyboard-active. Измерены gap6, viewport inset7 по четырём сторонам, radius7 и зарезервированный scrollbar10px. Проверено настоящее перетаскивание thumb, которое прокручивает список и не закрывает его.
- Required/duplicate validation, сохранение draft при ошибке и retry, double-submit guard, pending button bounds, custom select/scenario keyboard, disabled option, stable-ID choice, no-results/error, поздние ответы, IME, checkbox mixed/Space, radio arrows, B-геометрия и локальный JSON отзыв.
- Короткое окно960×540: popup внутри viewport и active option видима после keyboard scroll. Forced-colors rendering и отдельный focus fallback. JS errors и network requests:0.

Runner намеренно отключает headless-флаг `--hide-scrollbars`: полосы не прячутся ради красивых скриншотов. Визуально просмотрены fields в обеих темах, select dark и прокрученный popup light/dark. Браузер — Chromium; HTML/CSS/JS загружаются через page.set_content. Playwright/Chromium — отдельные инструменты проверки, не новые dependencies приложения.

## Не проверено

Tauri, Safari/WebKit/WebView2, физические дисплеи/OS scaling, screen reader, native200% zoom, все комбинированные states, backend/pagination/offline. CSS scrollbar fallback других браузеров требует отдельной приёмки. 1px core не заявлен как AAA Focus Appearance; слабые rest edges не объявлены универсально доступными. Полные boolean state sheets ещё впереди.

По запросу владельца отдельных мобильных экспортов нет. Это не отменяет будущие reflow/zoom тесты. Сохранённые исторические lab checks описывают свои версии, не новый код. Текущий executable runner заменён вместе с изменившимися selectors/семантикой.
