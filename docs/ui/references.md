# Исследование и реестр референсов

[Индекс](README.md) · проверено 2026-09-19. Реестр не является галереей «самых современных продуктов».

## Метод отбора

Разделять четыре даты: **публичный запуск продукта**, **изменение нужной поверхности**, **дата screenshot/capture**, **наша проверка**. Год запуска не датирует UI; дата внутри задачи на screenshot тоже не датирует съёмку. Старый продукт может иметь новый интерфейс, новый продукт — неподходящий паттерн.

Сначала проверить название, назначение, платформу и реальные launch/update источники. Затем искать конкретную поверхность в Mobbin и смотреть изображение, а не доверять app_name/query match. Записать, что именно переносимо в Flood и что отвергнуто.

Рабочий фильтр исследования: для текущего визуального направления предпочитать подтверждённые изменения последних 12 месяцев; более ранние примеры оставлять как явно датированные паттерны, не как «UI 2026». Этот интервал — правило исследования Flood, не срок годности хорошего дизайна.

Статусы: `dated-primary` — датированный материал владельца продукта; `provisional` — полезный screenshot с неподтверждённой актуальностью; `rejected` — не соответствует сценарию; `method-only` — источник процесса/инженерных правил, не визуальный эталон. Ни один из статусов не заменяет тестирование Flood.

## Linear

- Публичный запуск: **2020-06-30**, [официальный changelog](https://linear.app/changelog/2020-06-30).
- Релевантный visual refresh: **2026-03-12**, [A calmer interface for a product in motion](https://linear.app/now/behind-the-latest-design-refresh), `dated-primary`.
- В публикации просмотрено сравнение sidebar before/after: более спокойные inactive элементы и перераспределение визуального веса. Это датированный иллюстративный материал автора; точная дата создания изображения отдельно не указана.
- В Flood применима идея предсказуемых зон actions и подчинённой навигации. Не переносим их точные размеры, palette, icon-only tabs или оттенок text без собственного contrast test.

[Mobbin: inbox и выбранная задача](https://mobbin.com/screens/beb9d6b3-ec34-46d7-9332-320fcb32a338) — просмотрены sidebar, index, detail и properties. **Capture date не предоставлена MCP; статус provisional.** Подходит для обсуждения master/detail, не доказывает соответствие мартовскому refresh.

[Mobbin: project update в inbox](https://mobbin.com/screens/8337813e-f0dd-4415-8a29-87c114b0442b) — тот же provisional: полезна связь выбранной строки и рабочей области; не пример result review агента.

## Superlist

- Версия 1.0 публично выпущена **2024-02-13**, [официальное объявление](https://www.superlist.com/updates/say-hello-to-superlist-1-0). Не путать с более ранними анонсами компании/разработки.
- В [официальном updates archive](https://www.superlist.com/updates) проверена запись **2026-06-27, 1.56.0** о multiselect. Это подтверждение развития сценария, не утверждение о последней доступной версии и не дата Mobbin capture.
- [Mobbin: task list с detail pane](https://mobbin.com/screens/06b73426-c2d1-4d45-a3e4-7a797cacf91d) — просмотрены выбранная задача, subtasks и detail. `provisional`, capture date неизвестна. Берём компактность task/notes сценария; не копируем washed-purple panels и красное оформление selection.
- [Mobbin: список с крупной декоративной областью](https://mobbin.com/screens/678bdc90-0afd-4812-9be5-30d804b23d7f) — `rejected` как направление для заполненного Flood workspace: декорация забирает самостоятельную колонку, а задача требует места для работы. Это оценка применимости, не оценка продукта целиком.

## Granola

- Публичный запуск: **2024-05-22**, [Introducing Granola](https://www.granola.ai/blog/announcement).
- В [официальном updates archive](https://www.granola.ai/updates) проверено обновление визуальной идентичности **2026-02-02** и ссылка на [A new look for Granola](https://www.granola.ai/blog/a-new-look-for-granola). Обновление бренда не считается доказательством обновления всех рабочих экранов.
- Релевантность: совместная работа человека и AI с заметками; не task management и не разрешение на применение изменений.
- Совпадающего Granola screenshot в использованной Mobbin выдаче не найдено. **Не включён как подтверждённый визуальный референс.** Официальные материалы оставлены только как контекст продукта.

## Отбракованная выдача Mobbin

По запросу Granola пришли [Evernote](https://mobbin.com/screens/d9b96113-1f32-486d-9235-23ed5551de6b) и [Obvious](https://mobbin.com/screens/bc69ec4e-5c67-455d-9d29-d62b5d38c34a): изображения просмотрены, identity mismatch, `rejected`. Не выдавать чужой экран за запрошенный продукт.

По запросу подключения GitHub в Linear пришёл [Creating a Slack channel](https://mobbin.com/flows/55b881e4-a91f-43e0-bda7-38f62326bdb2): просмотренные шаги действительно относятся к Slack. `rejected` для GitHub picker. Его нельзя использовать как доказательство нужного connection flow.

Вывод исследования: текущая выдача MCP недостаточна для объявления подборки свежих визуальных эталонов. Для пилота использовать собственный Flood contract и датированный primary материал Linear; provisional screens — только для обсуждения структуры. Перед утверждением pixel-level направления нужен проверенный текущий экран/flow, а не ещё десять случайных карточек из выдачи.

## Organisation

[OpenLabs-so/oa-design](https://github.com/OpenLabs-so/oa-design), [README](https://github.com/OpenLabs-so/oa-design/blob/main/README.md), [skill entry](https://github.com/OpenLabs-so/oa-design/blob/main/skills/oa-design/SKILL.md) — `method-only`, просмотрены 2026-09-19. Предоставленный адрес с завершающим дефисом возвращал 404; рабочий repository — без дефиса.

Полезно устройство: короткая точка входа, отдельные contracts/recipes, связь рецептов с проверяемым source. Не копируем их двухслойные cards, pill actions, Inter Tight, blue primary, семь springs, React/Tailwind/motion stack. Наш пакет написан для Flood, без импорта кода OA Design.

## Инженерные источники, не стилевые эталоны

- [Vercel Web Interface Guidelines](https://vercel.com/design/guidelines): живой checklist, дата публикации не указана; проверено 2026-09-19. Использован как метод проверки focus, layout и inputs, а не набор обязательных визуальных решений.
- [WAI-ARIA Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) и [Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/): различение поведения и семантики, не современность оформления.
- [WCAG contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), [target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): проверяемый минимум доступности.
- [Codex skills](https://developers.openai.com/codex/skills/): формат SKILL.md с name/description и расположение `.agents/skills/`; automatic matching зависит от запроса и клиента, не гарантируется одним наличием Markdown.

## Карточка следующего кандидата

Заполнять: product; platform; launch date + primary URL; relevant update date + URL; exact screen/flow URL; capture date или unknown; observed elements; transferable principle; rejected elements; Flood scenario; status; checked date; recheck trigger.

Не сохранять private screens третьих лиц в публичный repository. При разрешённом экспорте Mobbin использовать оригинальный image_url и сохранить файл, а ссылкой-источником оставить mobbin_url: временная ссылка изображения не подходит для постоянной документации. Этот пакет не распространяет копии чужих screenshots.
