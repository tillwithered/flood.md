# UI acceptance gate v1

UI-изменение не считается готовым, пока не проверено в затронутом объёме:

- light и dark theme;
- normal и narrow desktop window;
- populated, empty, loading, recoverable error, conflict и disabled states, если применимы;
- длинный русский текст, дубли имён, отсутствующие необязательные данные;
- keyboard order, focus-visible, Enter/Space и Escape;
- reduced motion и 200% text zoom;
- отсутствие текста меньше 12 px, color-only states, layout shift и необъяснимого horizontal scroll;
- сохранение введённых данных при ошибке;
- before/after на реалистичном наполнении;
- запуск и визуальная проверка в реальном Tauri-окне. Browser preview годится только для итерации.

Новый общий паттерн сначала доказывается на одном полном сценарии. Переносить его на остальные экраны можно только после прохождения gate и пользовательского подтверждения направления.

## Проверка крупных row-controls

Для каждого full-row action проверить resting, hover, focus, active и expanded: radius не исчезает, hit area совпадает с видимой формой, между соседями есть gap, постоянных dividers нет, а expanded content остаётся внутри того же rounded container.

## Проверка пространства и tabs

Проверить четыре масштаба: детали control, construct, section и page region. Вложенные уровни не должны иметь одинаковый gap, а child не создаёт внешний margin вместо parent. Horizontal tabs проверяются в wide/narrow: active tab округлена, вся полоса не превращена в capsule, border-block стабильны, scrollbar скрыт и страница не получает horizontal scroll.

## Проверка вложенных радиусов

Для каждой вложенной rounded surface измерить внешний radius `A`, расстояние между видимыми контурами `B` и подтвердить внутренний radius `C = max(0, A − B)`. Проверить resting, hover, focus и expanded: inset и видимый контур не должны меняться так, чтобы ломать геометрию углов. Независимые magic-number radii считаются дефектом foundations.