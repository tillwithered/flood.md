# Иконография и icon-only действия — 0.6.5

[Индекс](README.md) · [desktop lab](recipes/iconography.html) · [проверки](recipes/iconography-checks.md) · 2026-09-19.

**Статус слоя: approved в показанном объёме.** После просмотра0.6.5 владелец ответил «отлично! Идем далее». Heroicons mapping, icon-only36/16 и tooltip contract приняты как DS-направление; это не production migration, не проверка всех24px masters и не Tauri/SR acceptance.

## 1. Одна family, но не любой смысл обязан стать пиктограммой

Heroicons Solid остаётся выбранной icon family. Рабочий default — `optimized/20/solid`, pinned commit `616b7a4dbbf3d011760af8066262cd5c6b3868f3`, `currentColor`, без stroke. Production `@lucide/svelte` пока не удаляем: миграция идёт по поверхностям после карты смыслов и runtime проверки.

Исключения — часть системы:
- Agent/Bot → Flood blob/agent identity.
- Bold/H1/Underline → типографические `B`, `H1`, подчёркнутая `U`.
- Radio dot / checkbox mixed / circle / square → геометрические state marks.
- Provider identity → настоящий логотип provider.
- Sidebar collapse/expand → отдельный точный affordance, если Heroicons не даёт нужной семантики.

Не смешивать Solid/Outline как rest/selected. Выбранность задаётся состоянием control, а не сменой family.

## 2. Размеры

| Роль | Glyph | Target / slot |
| --- | ---: | ---: |
| Action / toolbar | 16 px | 36×36, R10 |
| Иконка рядом с label | 16 px | slot16, gap8 |
| Object / section identity | 20 px | slot24–28 |
| Rare supporting mark | 24 px | slot32+ |
| Coarse pointer | glyph тот же | target ≥44 |

20px master допустимо рендерить в 16px control после оптической проверки. 24px role требует подходящего Heroicons master. Не вводить 14/18/22 только ради локальной подгонки. Оптический Y-offset по умолчанию 0; документированный ±1px допустим только после проверки с настоящим Golos/Tauri.

## 3. Карта реальных смыслов Flood

Карта построена по текущим imports `src/App.svelte`.

| Текущий смысл | Heroicons / язык |
| --- | --- |
| Search | `magnifying-glass` |
| Attachment | `paper-clip` |
| Pin | `bookmark` |
| Refresh | `arrow-path` |
| Settings | `cog-6-tooth` |
| More | `ellipsis-horizontal` |
| Delete | `trash` |
| Close | `x-mark` |
| Create | `plus` |
| Link | `link` |
| External | `arrow-top-right-on-square` |
| Download | `arrow-down-tray` |
| Edit | `pencil-square` |
| Info | `information-circle` |
| Send | `paper-airplane` |
| Trust | `shield-check` |
| Project | `folder` / `folder-open` |
| New project | `folder-plus` |
| Document | `document-text` |
| Storage | `circle-stack` |
| Tasks | `clipboard-document-check` / `queue-list` by context |
| Logout | `arrow-right-start-on-rectangle` |
| Expand | `arrows-pointing-out` |
| Messages | `chat-bubble-left-ellipsis` |
| Integrations | `puzzle-piece` only as category |
| Calendar | `calendar-days` |
| Language | `language` |

`Check`/success, agent-ready and result-applied are not synonyms. До миграции каждого mapping проверять контекст. Не мигрировать поверхность наполовину, если оставшиеся смыслы требуют случайных Lucide glyphs.

## 4. Icon-only button

Default: **36×36, R10, glyph16**. Rest transparent, no border/shadow. Hover — neutral surface; pressed — более определённый neutral tone; `aria-pressed=true` — устойчивый selected fill. Focus — двухслойный neutral focus 0.6.3.

Никакого inset-bottom, bevel или capsule вокруг группы. Между соседними actions gap4; между смысловыми группами gap8–12 без обязательного divider.

Каждая icon-only button имеет accessible name. Tooltip его не заменяет. Если причина недоступности важна, она существует как accessible description/локальный текст. `aria-disabled=true` допустим, когда action нужно оставить в Tab ради объяснения; handler блокирует mutation.

Trash в обычном toolbar/menu остаётся neutral. Pink-red Danger появляется при реальном destructive confirmation/error, а не заранее.

## 5. Tooltip

Tooltip — короткая визуальная подпись:
- 12/16, max-width260;
- padding6×8, R8;
- gap6;
- без arrow и decorative shadow;
- light: inverse dark surface; dark: inverse light surface;
- pointer delay450ms, keyboard focus120ms;
- Escape скрывает tooltip, но не control;
- blur/pointerleave скрывают;
- viewport clamp8, top default, flip bottom when needed;
- no pointer events, no buttons/links/forms.

Tooltip не хранит обязательную ошибку или единственное объяснение disabled state.

## 6. Не переиспользовать иконки ради количества

Не добавлять glyph каждому helper, setting row или metadata. Status Warning/Danger/Success может иметь icon только как дополнительный сигнал рядом с текстом. Privacy/time/repository не получают icon автоматически.

## 7. Исследование

Heroicons source — pinned upstream SVG/MIT, не дизайн-система Tailwind. Исторические SHA: [icon-sources](recipes/icon-sources.md).

Mobbin просмотрен 2026-09-19; capture dates неизвестны, поэтому refs provisional: [Linear header/actions](https://mobbin.com/screens/6aa79cb3-14f2-4234-94ca-a4cafe032d69), [Linear project surface](https://mobbin.com/screens/344cad59-d4a8-421a-9c2f-14b3c977e82d), [Linear settings/tool surface](https://mobbin.com/screens/abf277ec-d00a-4504-8cfa-54930315f0ab). Используем только локальность действий и компактность; не копируем palette, sizes или предполагаемую icon family. Screenshot не доказывает tooltip timing/keyboard behavior.

## После утверждения

Icon map, 36/16 icon-button, selected state и tooltip timing/surface сохраняются как approved contract0.6.5. Runtime icon wrapper и surface-by-surface migration plan остаются отдельной implementation-задачей. Следующий DS layer — [feedback primitives0.6.6](feedback.md), всё ещё до workspace-компаундов.
