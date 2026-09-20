# Реестр решений UI

[Индекс](README.md) · обновлено 2026-09-19.

approved — одобрено показанное решение; approved direction — задано направление, детали проверяются; candidate — нужен просмотр; rejected — не default; deferred — отложено. Это не сертификат доступности или production readiness.

| ID | Статус | Решение / границы |
| --- | --- | --- |
| BASE-MONO | approved | Монохромные light/dark controls; цвет у blobs и реальных Warning/Danger/Success. Без синего action accent. |
| BASE-DANGER | approved | Розово-красное семейство; text/mark/solid разделяются по контрасту. |
| LIGHT-03 | rejected | Большая тёплая подложка #e9e9e6; не возвращать ради искусственного surface threshold. |
| LIGHT-CLEAN | approved | #fafafa, белые поверхности, локальный edge и нейтральные controls. |
| T-01 | approved | Иерархия контекст/title/body/metadata; не большие title у каждой task row. |
| L-01 | approved | Коллекции без лишних рамок/badges; две плотности, без автоматической preference или единого default. |
| C-01 | approved | Геометрия согласованного ряда 36/R10/glyph16; не массовая замена всех размеров. |
| S-01 | approved | Hover, selection и focus раздельны; не обязательная боковая полоса. |
| M-01 | approved | Локальное command menu, anchor/keyboard, отдельное destructive confirmation. |
| V-01 | approved | Select для значения, combobox для поиска; не закрывает все WebView. |
| D-01 | approved | Repository modal с query/filters/draft/commit, identity и focus. |
| F-01 | approved | Load/write/revoked/unknown различаются; reconciliation до retry; close view не отмена операции. |
| D-01-META | approved direction | Признаки у названия, до описания при переносе; privacy/linked/archive/access независимы. |
| I-01 | approved direction | Heroicons Solid; Phosphor — историческое сравнение. Полный icon map впереди. |
| G-02 | approved | B-вариант r=max(0,R−B) у параллельных контуров; border входит в B. |
| E-FLAT | approved direction | Нет нижней подошвы, bevel, inset underline у primitive controls. Focus не декоративная тень. |
| B-SOFT | approved direction | Спокойные декоративные края без затемнения canvas; required boundary/check/dot/focus не исчезают. |
| P-01 | approved | 0.6.4: checkbox18/R5/check12, 24 сочетания; scope master, group validation и label target. |
| P-02 | approved | 0.6.4: radio18/dot8, 16 сочетаний; no default, group error, native arrows и explicit demo commit. |
| P-03 | approved | 0.6.4: switch36×20/thumb16/inset2, 22 сочетания; confirmed/requested/operation, retry/reconcile. |
| G-BOOLEAN | approved | Первая строка label, gap10, target36/44 и измерение switch insets; не новая глобальная шкала. |
| P-04 | approved | 0.6.8 закрывает button/input edge cases в показанном объёме; platform acceptance отдельно. |
| E-01 | candidate | Прочие эффекты и полная совместимость состояний. |
| INPUT-062 | approved direction | Общее направление полей принято с конкретными исправлениями 0.6.3; не все states. |
| SELECT-062 | approved direction | Сохранён custom select с gap6/B7; рамка option отменена, scroll viewport уточнён в 0.6.3. |
| ASYNC-062 | candidate | Локальные async/IME/stale simulations проверены кодом, но не заявлен отдельный review каждого исхода владельцем. |
| CHROME-063 | approved direction | Никаких случайных системных степперов, resize-corner и select popup в обычной теме. Настоящая семантика и high-contrast сохраняются. |
| FOCUS-063 | approved direction | Два нейтральных концентрических слоя, без смещения и дубля input/frame. Точные core1/halo4 и цвета — текущий пилот. |
| SCROLL-063 | approved direction | Scrollbar внутри inset viewport, наружный rounded shell отдельно; место полосы не отнимается у текста незаметно. |
| OPTION-063 | approved direction | Выбранная/активная option без border/outline; check+fill, focus на combobox. |
| ICON-MAP-065 | approved | Heroicons Solid mapping для текущих смыслов Flood + явные exceptions для agent/provider/formatting/state marks. |
| ICON-BUTTON-065 | approved | Icon-only 36×36/R10/glyph16, transparent rest, neutral hover/pressed/selected, existing double focus. |
| TOOLTIP-065 | approved | Tooltip12/16, R8, gap6, no arrow/shadow, hover450ms/focus120ms, Escape/viewport clamp. |
| LOAD-066 | approved | First-load skeleton повторяет итоговую геометрию; refresh сохраняет существующий content и показывает локальный busy state. |
| PROGRESS-066 | approved | Progress bar только при честном denominator; неизвестная длительность = spinner/status без fake percent. |
| NOTICE-066 | approved | Inline feedback для локального действия; banner/notice для устойчивого состояния области и recovery. |
| TOAST-066 | approved | Floating краткий итог, max3, без focus theft; passive5s, Undo8s, pause hover/focus. |
| NOTICE-MATERIAL-067 | approved direction | Розово-красный material persistent Danger-banner сохранён; это не approval всех feedback primitives. |
| NOTICE-ACTION-067 | approved | Contextual text-action на semantic surface; без белой/угольной inset-кнопки, без border/shadow. |
| BRAND-ROLE-067 | approved | Raster blob = accent / empty-state illustration / stable identity; не decoration каждой строки и не статус. |
| BRAND-STATE-067 | approved | Asset identity не меняется от run state; Heroicons+text сообщают status/outcome. |
| BRAND-RASTER-067 | approved direction | Используются существующие raster masters без перекраски/обрезки; derivatives позже по runtime необходимости. |
| BUTTON-068 | approved | Primary/secondary/ghost/danger/contextual roles, stable pending bounds, readable disabled reason. |
| FIELD-068 | approved | Prefix/suffix, custom numeric stepping, copy/readonly, long textarea, validation and late-response capture. |
| AUTOFILL-068 | approved direction | Neutral autofill/selection/caret contract; actual Tauri/WebView acceptance remains separate. |
| ATOMIC-AUDIT-069 | approved | Новых generic primitive-family не найдено; atomic design gate закрыт после review feedback0.6.6. |
| W-01 | rejected | 0.7.0 greenfield shell rejected: generic SaaS structure, too much chrome, moves too far from current Flood. Preserve current shell as baseline. |
| W-02 | rejected | 0.7.0 list/detail rejected as default direction. Future compound work must refine current project/task flow before inventing new overview IA. |
| W-BASELINE-071 | candidate | Preserve current production geometry: 52px window bar, sidebar304/58, project tree/nested tasks and central task editor. No new overview/tabs/split-view. |
| W-POLISH-071 | candidate | Apply approved atomic DS in place: clean-light, quieter lines, double focus, approved controls/icons and sparse raster identity. |
| W-03 | deferred | Agent-result review remains deferred until current Flood task flow is refined; do not build on rejected0.7.0 shell. |

## История

**0.4:** владелец одобрил T/L/C/S после просмотра `e7fe5d745fd039f52223eff3ccdd9517da0c27b3`. Приняты чистые варианты, не намеренно шумные A-версии. Плотности допустимы по сценарию, не одобрена новая preference автоматически.

**0.5/0.5.1:** одобрены M/V/D/F; privacy/linked вынесены к имени. Подключение не скрывает приватность, отсутствие доступа не меняет публичность. Это не доказательство просмотра каждой симуляции. См. [metadata](repository-metadata.md).

**Смена очереди:** владелец остановил переход к компаундам ради отдельной проработки checkbox/radio/select/icons/effects. Общие approvals не закрывают атомарные state sheets.

**0.6.1 → 0.6.2:** выбраны Heroicons Solid «для начала», B-геометрия, удаление нижнего выступа и спокойные края. Затем разрешены запись в main и desktop-review без мобильных экспортов. I-01/G-02/E-FLAT/B-SOFT зафиксированы, новые поля/поведение изначально оставлены на review.

**0.6.3:** после desktop screenshots владелец отметил «В целом норм» и запросил исправить системные элементы, двойной focus, вылезший scrollbar и рамку option, затем записать в main. Приняты общее направление и перечисленные требования. Новый вид кольца и все boolean states не объявлены автоматически утверждёнными. Скриншот синего кольца — пример двухслойности, не разрешение ввести синий UI accent.

**0.6.4:** после просмотра владелец ответил «отлично! Идем далее». P-01/P-02/P-03/G-BOOLEAN одобрены в показанном объёме. Это не Tauri/SR/runtime acceptance. Палитра/исходники0.6.3 не изменены.

**0.6.5:** после просмотра владелец ответил «отлично! Идем далее». ICON-MAP-065 / ICON-BUTTON-065 / TOOLTIP-065 одобрены в показанном объёме. Это не runtime migration и не Tauri/SR acceptance.

**0.6.6:** подготовлены feedback primitives: skeleton/refresh, determinate vs indeterminate progress, inline/banner и toast. LOAD/PROGRESS/NOTICE/TOAST-066 остаются candidate до просмотра. После них — повторный аудит base gate, не автоматический переход к workspace.

Текущий feedback: [lab0.6.6](recipes/feedback.html), [контракт](feedback.md), [проверки](recipes/feedback-checks.md). Iconography: [lab0.6.5](recipes/iconography.html), [контракт](iconography.md), [проверки](recipes/iconography-checks.md). Boolean: [lab0.6.4](recipes/boolean-controls.html), [контракт](boolean-controls.md), [проверки](recipes/boolean-checks.md). Поля/выбор0.6.3: [lab](recipes/primitives-refined.html), [контракт](primitives-refinement.md), [проверки](recipes/primitives-refined-checks.md). Исторические labels и native fallback-примеры не переопределяют текущие решения. Runtime CSS, `.flood` snapshot и permissions не менялись.


**0.6.7:** владелец одобрил красный banner material, отверг нейтральные inset-плашки действий и запросил брендовые raster accents. Новый [контракт](brand-and-notices.md) и [lab](recipes/brand-notices.html) добавлены на review. Остальные LOAD/PROGRESS/NOTICE/TOAST-066 не повышены до approved автоматически.


**0.6.7 approval:** пользователь попросил «пуш в мейн и далее идем» после просмотра banner/blob preview. NOTICE-ACTION-067, BRAND-ROLE-067 и BRAND-STATE-067 считаются одобренными в показанном объёме; это не runtime migration.

**0.6.8:** подготовлен P-04 candidate. Публикация lab в main не означает автоматическое одобрение новых button/field/autofill решений.


**0.6.8 approval:** после просмотра controls lab владелец ответил «давай» на предложение перейти к полному atomic audit. BUTTON-068 / FIELD-068 и P-04 считаются одобренными в показанном объёме; AUTOFILL-068 остаётся approved direction из-за platform-specific behavior.

**0.6.9 audit:** отдельная проверка покрытия не выявила новой generic primitive-family, которую нужно спроектировать до compounds. Нерешённый owner-review — feedback0.6.6. Platform acceptance и domain-specific calendar/editor/attachments не смешиваются с design-gate.


**feedback0.6.6 approval:** после финального preview владелец ответил «да, нормально. идем далее». LOAD/PROGRESS/NOTICE/TOAST-066 считаются approved в показанном объёме. Это не screen-reader/Tauri runtime acceptance.

**0.7.0:** atomic gate закрыт и активирован первый compound-slice: W-01 AppShell + W-02 project overview/list-detail. W-03 остаётся отдельным следующим review.


**0.7.0 rejection:** после просмотра владелец отметил, что specimen выглядит явно хуже текущего Flood. Причины: greenfield SaaS shell, избыточный project header/tabs, generic split-view и декоративно приклеенные blobs. 0.7.0 сохраняется только как historical experiment; не использовать как implementation baseline.


**0.7.1:** новый specimen построен от фактического `src/styles.css` и текущего task flow. Review сравнивает current structure и DS refined без изменения IA. Baseline sizes/sidebar/editor sequence считаются constraints, а не новыми design decisions.
