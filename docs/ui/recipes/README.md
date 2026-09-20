# Material specimen

[Индекс](../README.md) · [контракт](../materials-and-borders.md).

`materials.html` + `materials.css` — собственный изолированный образец Flood: Quiet, Outlined, Floating с затухающим верхним светом, антипаттерн лишних рамок, neutral controls, semantic status и связанный nested radius. Это НЕ полноценный экран и НЕ production component library.

Открыть `docs/ui/recipes/materials.html` в браузере или через локальный static server. Никаких аккаунтов, сети, packages или CDN не требуется. Шрифт использует Golos Text при доступности, иначе system fallback; font files в specimen не включены. Переключение тем и demo-buttons локальные; GitHub/search/save/delete не подключены.

## Единственный источник recipe

Числовые candidate values живут в CSS, не во вручную скопированном code block Markdown. Весь CSS scoped под `.flood-materials`; документация объясняет выбор и ограничения. Не импортировать этот файл в App.svelte/main.ts: сначала согласованно перенести нужные роли в один production token source, затем реализовать соответствующий компонент.

Существующие runtime baseline colors сохранены для сравнения. Новые edge/boundary/focus/danger-text roles — предложения для пилота. Это не доказательство синхронизации с будущими изменениями `src/styles.css`.

## Проверка

```sh
node docs/ui/recipes/check-materials.mjs
```

Dependency-free скрипт читает opaque hex tokens из CSS и проверяет 37 пар на тему: обычный текст, labels кнопок, status, required boundaries и focus. На 0.2 проходят **74 пары**. Отдельно подтверждается исходная находка: #d92f55 на #fff0f3 = примерно 4.236:1, ниже 4.5. Парсер ограничен простыми hex в двух token blocks; новые форматы цвета требуют явного обновления checker, не молчаливого пропуска.

В этой сессии образец отрендерен через `page.set_content` со встроенным тем же CSS в Chromium: light/dark, ширина 1180 и 390 CSS px, отсутствие horizontal overflow; проверены focus outline/стабильность размеров, demo click, reduced-motion и forced-colors fallback. Код страницы не выдал JavaScript errors. Это smoke-проверка образца, не полный accessibility audit.

Не проверены: actual Tauri, WebKit/WebView2, реальные формы приложения, все keyboard paths, DPI 125/150%, DPR 2, 200% text zoom и пользовательские данные. Голос/shape в реальном продукте потребуют проверки с Golos Text и настоящими assets. Цветовые тесты не покрывают все composited alpha, gradients, hover transitions или любую возможную подложку.

## Границы использования

- `--edge-divider` и `--edge-surface` декоративные; для обязательной границы поля используется отдельный `--boundary-control`.
- Top light — pseudo-element, не inset focus ring. Его выключение не меняет понятность.
- Пример nested radius считает border 1 + padding 5 = inset 6; 16 − 6 = 10.
- Темы используют один contract. Forced colors сохраняет пользовательские system colors.
- Demo без brand blobs намеренно изолирует материалы. Не переносить отсутствие assets в правило, запрещающее фирменные blobs в продукте.
