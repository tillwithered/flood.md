# Primitive lab 0.6 — проверка

[Превью](primitives.html) · [контракты](../primitive-controls.md). Статус новых вариантов — candidate, 2026-09-19.

Состав: primitives.html/css/js + primitive-icons.js; палитра из неизменённого precision.css. Портативный HTML содержит те же CSS/JS inline и полные MIT notices. Ни шрифтовых файлов, CDN, пакетов приложения, внешних запросов, ни реальных mutations. Golos Text только если установлен; иначе system fallback.

## Выполнено

`node --check primitives.js`, `node --check primitive-icons.js` — корректный синтаксис.

`python check-primitives.py --output <каталог>` — **50 групп проверок**, включая **32 представления** (4 раздела × 4 ширины 1180/780/414/320 × 2 темы) без page overflow и **46 вычисленных непрозрачных цветовых пар**. Runner использует Python Playwright/Chromium и `page.set_content`, не file:// navigation. Это отдельно доступный тестовый инструмент, не зависимость package.json.

Проверены: оригинальные fill SVG без stroke; размеры 16/20/24; выбор семейства в control sample; checkbox mixed/all/none/Space; focus на видимом mark; radio arrows/single selection; pending/success/failure switch; validation checkbox/select; readonly focus; textarea newline; pending button без скачка размеров и повторного submit; реальные insets/radii; возврат focus при clear; независимые отзывы и JSON; keyboard tabs; native fallback forced colors; reduced motion. Отдельная Chromium touch/coarse эмуляция проверила target минимум 44 и tap у checkbox/switch.

Для panel измерены все четыре inset при B4/B6/B10. Для menu/field измерены top/right inset и radius children. Восстановленные оригинальные SVG-обёртки дали точное совпадение всех 12 upstream blob SHA из icon-sources.md; экспортируются исходные paths, без перерисовки.

2× увеличение вычисленных font-size/line-height прошло без горизонтального page overflow для choice/fields/geometry на 414 px в обеих темах. Это не browser-native 200% zoom. Визуально просмотрены icon/choice/geometry light wide и choice dark narrow. Остальные снимки создаёт runner. JavaScript page errors и внешние network requests в основной тестовой странице отсутствовали.

## Ограничения

Не проверены реальное Tauri, iOS Safari, WebKit/WebView2, screen reader, OS scaling/физические дисплеи, native 200% zoom, все combinations состояний и native select popup styling. Отдельная touch-эмуляция Chromium не является тестом iPhone. Цветовые проверки не покрывают все composited alpha, transitions и native controls.

Heroicons в этом sample — 20px solid, при 16/24 масштабируется; не выдавать за отдельные optical masters. Domain icon catalogue представлен шестью смыслами, не всей картой приложения. Radio invalid-group и все disabled-on/focus сочетания требуют дополнительной визуальной приёмки. Статичная сетка checkbox-state скрыта от accessibility tree и не имитирует несколько реальных focus одновременно.

Таймеры 600 ms относятся только к локальным симуляциям; в production их не переносить. Некоторые кнопки показаны как образцы визуального веса, а не реальные команды. Отзывы локальны до экспорта. Ни main, ни прохождение тестов не означают одобрения этих новых кандидатов или внедрения ДС в приложение.
