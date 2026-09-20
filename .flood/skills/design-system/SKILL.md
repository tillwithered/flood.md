# Дизайн-система flood.md

Используй этот skill, когда задача меняет визуальное направление, tokens, общие component contracts, motion-язык или применение flood-материалов. Для реализации уже определённой поверхности используй skill «Реализация UI flood.md».

## Цель

Сделать flood.md узнаваемым human–agent workspace. Формула: **тихая точность + живой материал**. Рабочая среда спокойна и точна; характер создают блобсы, типографика, ритм и честная обратная связь, а не декоративный chrome.

## Обязательный контекст

1. Прочитай AGENTS.md, Design.md и Stack.md.
2. Прочитай project documents «Визуальные foundations flood.md» и «Арт-дирекшн flood.md: Soft Utility», а также rules «Visual foundations v1» и «Soft Utility quality bar v1».
3. Изучи src/styles.css, manifest flood-material, общие Svelte-компоненты и затронутые поверхности в Tauri.
4. Внешние дизайн-системы используй только как research. Не копируй идентичность, tokens, framework или готовые компоненты.

## Порядок работы

1. **Inventory:** зафиксируй существующие tokens, assets, повторяющиеся patterns и очевидные расхождения без преждевременного restyle.
2. **Direction:** сформулируй проблему пользователя и проверь её против визуальной формулы.
3. **Foundations:** определи semantic typography, contrast, spacing, color, shape, elevation, icons, brand и motion. Не начинай экранный аудит до этой базы.
4. **Audit:** измерь foundation debt, contract debt, composition debt, state debt и brand debt относительно принятой базы.
5. **Contracts:** исправь общий contract, если проблема повторяется, вместо серии локальных патчей.
6. **Anchors:** проверь существенное направление на обзоре проекта, редакторе задачи и контексте проекта.
7. **Migration:** переноси подтверждённую систему небольшими группами экранов.
8. **Canon:** обновляй Design.md только после проверки в настоящем Tauri-окне и пользовательского подтверждения.

## Четыре слоя

- Foundations: характер, semantic type/color/spacing, форма, elevation, iconography и motion.
- Contracts: анатомия и состояния controls, navigation, rows, editor, feedback и transient layers.
- Recipes: shell, project overview, task editor, project knowledge, settings и integrations.
- Verification: реальные темы, размеры окна, длинные данные, empty/loading/error/conflict и клавиатура.

## Непереговорные принципы

- Используй семантические роли из foundations; не добавляй случайные px, hex, radius или shadow.
- Иерархия строится композицией, типографикой, контрастом и пространством раньше карточек и декора.
- Блобсы — фирменный материал, не обои: максимум один крупный brand-момент на view.
- Обычный контейнер не сочетает одновременно заметные border, shadow и tinted fill.
- Squircles — для значимых поверхностей; pills только там, где форма объясняет функцию.
- Motion короткий и функциональный; loading сохраняет геометрию; reduced motion всегда поддержан.
- Не добавляй второй источник tokens или runtime component dependency.
- Не делай один патч «редизайн всего» и не меняй доменную модель ради визуальной задачи.

## Результат

Опиши выбранные semantic roles, измеримые проблемы, системное изменение, anchor surfaces, проверенные состояния и оставшиеся ограничения. Отделяй исследовательское решение от доказанного канона.

## Монохромный control contract

При работе с color tokens и компонентными контрактами держи весь рабочий chrome монохромным. Не предлагай цветной primary accent для кнопок, tabs, inputs, switches или connector actions. Selected/hover/focus выражай нейтральными surface, ink и border. Цвет проектируй только для status/urgency, destructive confirmation, flood identity и живых операций. Scrollbar входит в foundations: neutral thumb, transparent track, no native arrows, stable gutter, обе темы.

## Проектирование status surfaces

Мягкий semantic tint допустим для цельной status-card. Не вкладывай в неё вторую контрастную card и тёмный count: дочерние строки наследуют material, а hierarchy строится divider, spacing, glyph и transparent tone shift. Вне status surfaces controls остаются монохромными.

## Large clickable row recipe

Когда вся строка открывает artifact/detail/disclosure, проектируй её как самостоятельный rounded-control: radius 8–10, neutral surface, internal padding 8–12 и gap 8–12 между соседями. Hover/active меняют semantic tone той же поверхности. Не предлагай table dividers или квадратный hover для такого действия.

## Spacing and tabs recipe

Проектируй space по ownership: 4–8 control, 12–16 construct, 24 cluster, 32 section, 48 region. Для compound components сначала назови уровни вложения, затем назначь убывающие внутренние gaps; не масштабируй один base spacing на всё. Для horizontal navigation используй settings-style open bar с border-block и rounded surface только у active tab.

## Геометрия вложенных углов

При создании compound surface сначала задай внешний radius `A` и измерь inset `B` между видимыми контурами. Внутреннему элементу назначь `C = max(0, A − B)`. Храни связь в semantic tokens: например, `--panel-radius: 16px`, `--panel-inset: 6px`, `--panel-inner-radius: calc(var(--panel-radius) - var(--panel-inset))`. Не исправляй оптическую ошибку случайным увеличением внутреннего radius; сначала проверь реальный контур, border и padding.