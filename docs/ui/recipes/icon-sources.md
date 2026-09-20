# Fill-иконки: источники и границы сравнения

[Примитивы](../primitive-controls.md) · [превью](primitives.html) · проверено 2026-09-19.

Это испытание двух наборов, не выбранная библиотека Flood. В `primitive-icons.js` сохранены исходные paths и viewBox. SVG-обёртки собираются локально с `currentColor`, `aria-hidden` и `focusable=false`; для Heroicons сохранён evenodd у соответствующих paths. Шрифтовых файлов, CDN, runtime-пакетов и ручной перерисовки нет. Все 12 восстановленных оригинальных SVG совпали по Git blob SHA с прочитанными upstream-файлами.

## Phosphor Fill

Источник: [phosphor-icons/core](https://github.com/phosphor-icons/core), фиксированный commit `2b75f3ad12b420c9504ef05df8d2564a28f8500e`, каталог [assets/fill](https://github.com/phosphor-icons/core/tree/2b75f3ad12b420c9504ef05df8d2564a28f8500e/assets/fill). ViewBox 256×256.

| Смысл в сравнении | Исходный файл | Git blob SHA |
| --- | --- | --- |
| Проекты | folder-fill.svg | 01819f5c01bfe47ca3af73c57bf22972cc3fea48 |
| Документ | file-text-fill.svg | 4a1e96104afce674295b2c83cef046249d78599b |
| Настройки | gear-six-fill.svg | 0eeb3ff2a78c6f7e26480fd059f909f153c66f1a |
| Поиск | magnifying-glass-fill.svg | 842d975ece19f1a970fd6dcc296e82aec522621a |
| Удаление | trash-fill.svg | 37381ce411f1253227b9f6d82fe2a99862d1fe6f |
| Готово | check-circle-fill.svg | ee1317cf4370e59a8a7d58ba305e709b74b3b625 |

[Лицензия](https://github.com/phosphor-icons/core/blob/2b75f3ad12b420c9504ef05df8d2564a28f8500e/LICENSE): MIT, Copyright (c) 2023 Phosphor Icons. В fill-лупе действительно больше залитой площади, чем в другом кандидате: не править её path, чтобы искусственно уравнять сравнение.

## Heroicons Solid 20

Источник: [tailwindlabs/heroicons](https://github.com/tailwindlabs/heroicons), фиксированный commit `616b7a4dbbf3d011760af8066262cd5c6b3868f3`, каталог [optimized/20/solid](https://github.com/tailwindlabs/heroicons/tree/616b7a4dbbf3d011760af8066262cd5c6b3868f3/optimized/20/solid). ViewBox 20×20.

| Смысл в сравнении | Исходный файл | Git blob SHA |
| --- | --- | --- |
| Проекты | folder.svg | a0fd97ba869e8afef7833e290bc2622de286a31a |
| Документ | document-text.svg | 11c383c511b49f306048d7276a6b08c8a7dac3f5 |
| Настройки | cog-6-tooth.svg | 8eae3366bf29871a0e9050042b6242846bbb0a04 |
| Поиск | magnifying-glass.svg | 8fede6f841a753b455b7fb38f8c831cef8eba455 |
| Удаление | trash.svg | 529224d3280b94bc5f2e90076e715faac033ec24 |
| Готово | check-circle.svg | 763716ead0cf5bcba879c1f6d72a779125ff41b1 |

[Лицензия](https://github.com/tailwindlabs/heroicons/blob/616b7a4dbbf3d011760af8066262cd5c6b3868f3/LICENSE): MIT, Copyright (c) Tailwind Labs, Inc. В этом sample используется **только 20px master**. Переключатель 16/24 масштабирует его и не подменяет отдельным micro/24 набором. Нельзя по этому sample объявлять проверенной всю size family Heroicons.

Полные notices обоих наборов: [primitive-icon-licenses.txt](primitive-icon-licenses.txt). Сохранять вместе с исходниками и внутри портативного HTML. MIT-разрешение на использование иконок не является требованием добавить React, Tailwind или библиотеку компонентов в Svelte-приложение.

## Mobbin: наблюдение controls, не определение иконок

Перед поиском проверены [публичный запуск Linear 2020-06-30](https://linear.app/changelog/2020-06-30) и [датированный visual refresh 2026-03-12](https://linear.app/now/behind-the-latest-design-refresh). Дата запуска продукта и дата обновления интерфейса не датируют отдельный screenshot. Для Flood применим вопрос о весе controls и локальных разделителях; чужие значения, палитру и код не переносим.

Просмотрены:

- [Linear Preferences, light](https://mobbin.com/screens/d4e47b31-9152-40c7-a400-c6725e8de647): групповые headings, labels и controls на согласованных осях. Capture date неизвестна, статус provisional.
- [Linear appearance, dark](https://mobbin.com/screens/c968b3b2-82a5-4044-8e4a-0bec5683dec5): те же отношения, тёмные controls, активные синие switches. Capture date неизвестна, provisional; синий в Flood не переносим.

Картинки не доказывают использование Phosphor/Heroicons, состояние mixed, keyboard behavior или точные радиусы. Для иконок источником являются сами upstream SVG, для поведения — собственные тесты. Изображения Mobbin не копируются в repository и не выдаются за проверенные свежие экраны.

## Первичные источники поведения

[WAI checkbox](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/), [radio group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/), [switch](https://www.w3.org/WAI/ARIA/apg/patterns/switch/) — семантика и клавиатурные ожидания. [WCAG non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) — значимые control/state boundaries, не требование усилить каждый декоративный edge. Это инженерные основания, не визуальные системы Microsoft/Material/Carbon.

Следующий шаг после выбора семейства: карта всех реально используемых смыслов Flood, проверка внутренних просветов на 16/20, baseline и hit area в настоящем Golos/Tauri, затем узкая миграция. Пока ни один кандидат не назначен единственным стандартом.
