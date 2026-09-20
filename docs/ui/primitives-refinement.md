# Примитивы 0.6.3 — фокус, собственные контролы, прокрутка

[Индекс](README.md) · [desktop lab](recipes/primitives-refined.html) · [проверки](recipes/primitives-refined-checks.md) · 2026-09-19.

Владелец принял общее направление 0.6.2 и запросил пять исправлений: убрать системные степперы и resize-corner, сделать двухслойный концентрический focus, удержать scrollbar внутри popup и убрать рамку выбранной option. Ни запись в main, ни smoke tests не означают проверку каждой комбинации владельцем. Числа нового focus-пилота требуют просмотра; направление задано явно.

Сохраняем Heroicons Solid, clean-light #fafafa, тёмную базу, розово-красный Danger и B-формулу. Компаунды/workspace отложены. Это правила и отдельная лаборатория, не миграция приложения.

## 1. Свой вид, настоящая семантика

Не оставлять OS/browser chrome в обычном интерфейсе: native select popup, number steppers, textarea resize grip, дублирующую кнопку очистки и системную кнопку раскрытия password. `appearance:none` не заменяет целевую проверку конкретного control.

Настоящие input/textarea, checked/indeterminate, disabled/readonly, клавиатура, IME и прокрутка сохраняются. Checkbox/radio в текущем lab имеют native input с собственным видимым mark; это не div-имитация. Галочка — Heroicons Solid, radio-dot и mixed-line — геометрические state marks. Полные P-01/P-02/P-03 state sheets этим не утверждены.

Исключение: пользовательский forced-colors/high-contrast использует Canvas, CanvasText, Highlight и системную палитру. Не выключать доступность ради абсолютного визуального совпадения. Семантика и ОС-механизм ввода не запрещены; запрещён случайный системный внешний вид.

**Число минут:** text input + inputmode=numeric, без степперов и изменения значения колёсиком. В демо допустимо целое 0–120; пустое/ошибочное значение можно редактировать. Blur объясняет ошибку, не округляет и не исправляет число молча. Это ограничение демо, не универсальное правило всех числовых полей.

**Textarea:** resize:none. Высота растёт по содержимому до 240 px в пилоте; дальше прокручивается внутренний текст. Длинное содержимое не теряется. У поля отзывов тот же принцип, без системного уголка. Нативные Enter/caret/selection сохранены.

## 2. Два слоя фокуса, один владелец

Оба кольца рисуются от одного border-box, с нулевыми X/Y/blur:

- core: spread 1 px, #737373 light / #a0a09a dark;
- halo: общий spread 4 px; ink 12% light / light-ink 13% dark;
- halo остаётся внешним мягким слоем, core — различимым индикатором. Прозрачный halo не заменяет core.

В CSS это две нулевые по смещению spread-shadow. Это **индикатор focus**, а не декоративная тень снизу: у покоящихся controls box-shadow:none. Нет inset-bottom, bevel, отдельного верхнего блика или анимации нижней полосы.

Input/textarea передают focus своему `.frame`; внутренний input одновременно не рисует вторую рамку. Кнопка очистки при фокусе отмечается по собственному R7, не подсвечивает всё поле как редактируемое. Родитель поля не обрезает внешний halo. При invalid розовая граница и сообщение сохраняются, neutral focus остаётся независимым.

Пилот проверяет контраст core относительно panel/surface/canvas и halo после композиции alpha. Это не полный WCAG-аудит: тонкая 1px линия не заявляется выполнением AAA Focus Appearance. `prefers-contrast:more` усиливает core до 2px; forced-colors заменяет shadow на явный системный outline. [W3C: non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

Слабый rest edge #dddddd light / #4a4a46 dark не является универсальной доступной границей. Когда контур необходим для распознавания поля, его контраст проверяется отдельно; focus не исправляет отсутствие различимости до входа. Не затемнять всю страницу ради одной рамки.

## 3. Popup: рамка и прокрутка — разные элементы

**Outer shell:** radius14, border1, padding6, overflow:hidden. **Inner viewport:** overflow:auto, min-height:0, radius7. Фактический inset по всем сторонам равен 1+6=7. Внутри viewport зарезервирован scrollbar-gutter. Полоса прокрутки не рисуется на наружной скруглённой рамке.

В Chromium/WebKit стилях track прозрачный, полоса10px, thumb с прозрачными полями3px и округлением, без системных стрелок. Для браузеров со стандартными scrollbar properties используется отдельный fallback; его вид проверяется в целевом WebView. Scroll engine остаётся браузерным: wheel, trackpad, keyboard и drag thumb не переписываются.

Scrollbar уменьшает доступную ширину строки. Не резервировать под него место поверх текста или check. Правый inset option до shell при видимом gutter больше левого; не выдавать его за 7px. B-формула применяется к параллельным shell/viewport-контурам, а не ко всем потомкам автоматически.

Позиционирование измеряет полную высоту содержимого внутреннего scroller + padding/border shell, а не только уже обрезанный outer rect. Gap до trigger — ровно6px из одной переменной. Высота ограничивается viewport, popup переворачивается вверх при необходимости. Прокрутка самого списка не отрывает popup от trigger. Перемещение anchor и короткое окно проверяются отдельно. [MDN: scrollbar-gutter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scrollbar-gutter).

## 4. Выбранный пункт не обводим

У option нет border, outline, box-shadow — ни у выбранной, ни у активной клавиатурой. Сохранённое значение: галочка Heroicons + нейтральная поверхность. `aria-selected` описывает сохранённое значение, `aria-activedescendant` — активную suggestion; они не подменяют друг друга. Keyboard active получает тон поверхности без рамки. DOM focus остаётся на combobox/его поле, где и находится двухслойный индикатор.

Enter подтверждает активную option, Escape отменяет незавершённое перемещение, Tab закрывает без произвольного commit. Disabled option не выбирается. Native select удалён также из панели выбора симуляции: один проверяемый select-only controller используется для обоих мест. [WAI combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

## 5. Остальные контракты сохраняются

Поле: minimum36, R10, border1+padding2=B3. Clear action30/R7; текст без leading icon начинается в12px от контура. Glyph16 + gap8. Высота — минимум, не ограничение длинного текста. Helper относится к полю, readonly можно копировать, disabled не участвует в Tab. Password-демо не хранит настоящие токены. Validation не уничтожает draft; pending не двигает кнопку и не допускает повторной отправки.

Поиск: query, active option и committed ID раздельны. Loading/no results/error различимы; поздний ответ не заменяет свежий и не открывает закрытый popup. Во время IME composition поиск не запускается. Таймеры/семь проектов — синтетические fixtures. Не переносить их в production; реальную сеть, pagination/offline и permissions этот lab не реализует.

Heroicons paths сохранены из `optimized/20/solid`, commit `616b7a4dbbf3d011760af8066262cd5c6b3868f3`, с MIT notice в JS и автономном HTML. SVG currentColor, без stroke. Логотипы/blobs не заменяются пиктограммами. Полная карта смыслов пока не готова; production Lucide не заменён.

## Далее до компаундов

Следующий пакет — полные boolean state sheets: checkbox off/on/mixed, radio group error, switch off/on/pending/error/disabled. Геометрия, visible mark и подпись проверяются отдельно от области нажатия. Затем icon-only/tooltip и feedback primitives. Не считать несколько custom marks в этом lab завершением P-01/P-02/P-03.

## Источники и границы

Mobbin проверен 2026-09-19: [Linear preferences](https://mobbin.com/screens/abf277ec-d00a-4504-8cfa-54930315f0ab) и [email intake setup](https://mobbin.com/screens/42ddfbd0-83e1-4ce3-9171-cea951719f33). На изображениях закрытые controls, а не запрошенный открытый select/focus. Не использованы как доказательство формы кольца или scrollbar. Capture date unknown; не выдавать их за подтверждённые свежие пиксели. Датированный [refresh Linear 2026-03-12](https://linear.app/now/behind-the-latest-design-refresh) — контекст снижения шума, не источник наших значений. Чужие screenshots не копируются.

[Проверки](recipes/primitives-refined-checks.md) относятся к Chromium и данной лаборатории. Новые правила не меняют `.flood` snapshot/manifest, permissions или source-of-truth production tokens. Старые labs остаются историей, не разрешением вернуть native chrome/нижний выступ.
