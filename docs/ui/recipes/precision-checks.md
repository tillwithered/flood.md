# Precision lab 0.4 — проверки и ограничения

[Открыть образец](precision.html) · [контракт](../precision.md) · 2026-09-19.

Состав: precision.html + precision.css + precision.js. Открывать вместе, например локальным static server. Разговорное HTML-превью содержит те же CSS/JS встроенными. Новых runtime dependencies и сетевых запросов нет. Golos Text используется только при наличии в системе; иначе системный fallback. Файлы шрифтов не включены. Образец не импортируется приложением.

## Выполнено при подготовке образца 0.4

- `node --check docs/ui/recipes/precision.js` — синтаксис корректен.
- `node docs/ui/recipes/check-precision.mjs` — 45 opaque-пар на тему, **90 проверок** пройдены; нейтральные light roles, принятый canvas #fafafa, уникальные ID и связи панелей проверены.
- `node docs/ui/recipes/check-polish.mjs` — **92 проверки** принятой clean-light базы пройдены отдельно.
- `python docs/ui/recipes/check-precision.py --output <каталог>` — Chromium/Playwright: 4 раздела × 4 ширины (1180/780/390/320 CSS px) × 2 темы = **32 представления**, без горизонтального overflow страницы; 10 групп поведенческих проверок.
- Проверены одинаковые тексты A/B, сохранность всех полей 18 задач при density/noise переключении, multiselect при фильтрации/no-results, возврат focus при сбросе, синхронные input/filter в сравнении controls, validation focus, размеры pending button, отдельные отзывы/JSON export, tabs через ArrowRight/End, forced-colors/reduced-motion rendering. JavaScript page errors не зарегистрированы.
- Визуально просмотрены типографика и controls в light 1180, list в dark 1180 и states в light 390; screenshots остальных вариантов создаёт runner.

Browser runner требует отдельно доступных Python Playwright и Chromium; они не добавлены в dependencies приложения. FLOOD_CHROMIUM_PATH задаёт путь к браузеру; иначе используется chromium из PATH или установленный Playwright browser. В этой среде file navigation заблокирована политикой, поэтому runner использует page.set_content с теми же файлами inline, а не выдаёт это за проверенный запуск file://.

## Не заявляется

Не проверены actual Tauri, WebKit/WebView2, screen reader, native 200% zoom, OS scaling/физический дисплей, все комбинации UI states, реальные источники/permissions и production build Flood. 90 opaque-пар не сертифицируют alpha/анимации/все системные appearances. Шесть образцов состояний — статичная схема, не тест шести одновременно сфокусированных элементов. Реальный focus проверен отдельно.

Кнопка Save показывает явно обозначенную локальную симуляцию ожидания 700 ms; не переносить эту задержку в продукт. Create/filter в сравнении controls не создают реальные задачи; полноценные поиск и фильтрация находятся во вкладке списков. Отзывы живут в памяти страницы и теряются после перезагрузки; экспорт JSON локален и не отправляет решения в GitHub.

## Статус после просмотра

2026-09-19 владелец явно одобрил T-01/L-01/C-01/S-01 и попросил main; см. [реестр решений](../decisions.md). Статус направления теперь approved, а не candidate. Одобрение не отменяет перечисленных ограничений проверки и не означает внедрение в runtime.

Фиксация одобрения меняет только Markdown: HTML/CSS/JS образца, исполняемые tokens, зависимости, backend и .flood не изменены. Приведённые выше результаты относятся к подготовке образца в commit `e7fe5d745fd039f52223eff3ccdd9517da0c27b3`; при этой документационной фиксации browser/build tests повторно не запускались. Исходные подписи предложений и локальная форма отзывов сохранены в превью; текущий статус определяется decisions.md.
