# Исследование материалов — дополнение 0.2

[Индекс](README.md) · проверено 2026-09-19 · [общий метод](references.md). Внешние продукты — свидетельства отдельных решений, не готовая тема Flood.

## 1. Linear: релевантная датированная работа с границами

Публичный запуск — [2020-06-30](https://linear.app/changelog/2020-06-30). Релевантный refresh — **2026-03-12**, [A calmer interface for a product in motion](https://linear.app/now/behind-the-latest-design-refresh). Это dated-primary, а не попытка назвать шестилетний продукт новым.

В разделе Structure should be felt not seen авторы описывают сокращение лишних separators и смягчение контраста. Просмотрено опубликованное сравнение тёмных поверхностей: слева меньше доминирующих разделителей, иерархия держится также тоном и группировкой. Статья отдельно объясняет уход от холодной голубоватой основы к менее насыщенному нейтральному оттенку.

Переносим принцип подчинённого chrome и устранение дублирующих линий. **Не переносим** их числовые цвета, pills, размеры или вывод, что в их коде использован именно наш top-light recipe. Изображение не позволяет доказать конкретный CSS. Наши alpha и shadows — самостоятельные кандидаты для Flood.

## 2. Что реально вернул Mobbin

Все изображения ниже просмотрены. MCP не дал capture date; дата внутри task не датирует screenshot. Статус всех подходящих примеров — provisional, а не «проверенный UI сентября 2026».

| Точный экран | Наблюдение | Решение для Flood |
| --- | --- | --- |
| [Linear preferences](https://mobbin.com/screens/aa0b9e71-c5a0-4245-b30a-ee5059de6235) | Светлый экран, крупные интервалы между группами настроек, тихие контуры групп, компактные controls справа | Переносим оси и различие внутреннего/внешнего spacing; не переносим точные оттенки/плотность |
| [Linear create issue](https://mobbin.com/screens/65487ca3-9cf4-4287-b0cc-2c3e8c6f7f35) | Светлый dialog над затемнённым backdrop, краткая форма и нижняя action zone | Свидетельство распределения chrome; сине-фиолетовую кнопку не заимствуем. Это НЕ dark theme, несмотря на запрос поиска |
| [Linear filled issue dialog](https://mobbin.com/screens/6bd32918-97a5-45ec-bd95-efe367207a22) | Тот же светлый dialog с заполненными title/description | Проверка композиции на данных, не отдельный новый material |
| [Superlist light settings](https://mobbin.com/screens/99f1615e-cc2b-43cc-b2f1-b2a274545e0f) | Группы выделяются спокойной заливкой и интервалом; отдельная крупная декоративная колонка | Берём идею группировки без сильных рамок; НЕ lavender chrome, green toggle и отдельную декоративную колонку |
| [Superlist dark settings](https://mobbin.com/screens/58c47fda-1732-481b-8824-87c8eca617de) | Settings на чёрном фоне, более светлые группы, нейтральный select и зелёный toggle | Полезно сравнение материальной иерархии тем; не копируем blackout palette, цвет toggle или wallpaper |

Superlist 1.0 — [2024-02-13](https://www.superlist.com/updates/say-hello-to-superlist-1-0); в [официальном архиве](https://www.superlist.com/updates) просмотрено обновление **2026-08-14, 1.57.0** с Activity Log и multiselect. Это подтверждает развитие продукта, но **не доказывает свежесть указанных settings captures**.

[Heidi](https://mobbin.com/screens/91ba6abd-5968-4854-9ae3-9347ff1369ab) пришёл на запрос Linear. Изображение показывает другое приложение, включая голубое selected navigation. Rejected: identity mismatch; launch/current UI отдельно не исследованы, в shortlist не включается.

Вывод: Mobbin дал полезные сравнительные поверхности, но не подтвердил дату captures или конкретную реализацию compound borders. Подтверждённый датированный источник для направления — статья Linear; механизм top highlight — наш проверяемый CSS-пилот.

## 3. Инженерные источники

- [Geist Materials](https://vercel.com/geist/materials), checked 2026-09-19, дата публикации неизвестна: material объединяет radius/fill/stroke/shadow в роль поверхности. Method-only: не устанавливаем Geist, не переносим размеры/акцент/типографику. Для Flood важна идея цельного material, а не комбинация произвольных effects.
- [MDN box-shadow](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/box-shadow): multiple shadows и inset — механика CSS. Сам по себе inset не является градиентом вдоль верхней кромки.
- [MDN forced-colors](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/forced-colors): shadow/background effects нельзя считать единственным способом показать control/focus в системном контрастном режиме.
- [W3C non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html): важные cues и декоративные границы требуют разного обращения.
- [W3C text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): проверка текстовых пар; источник метода расчёта находки Danger.
- [W3C Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html): критерий AAA, не повод объявлять любой тонкий outline достаточным.

Стандарты объясняют поведение и доступность; они не служат доказательством модного визуального стиля. Дата проверки живой страницы не подменяет дату публикации.

## 4. Применение и повторная проверка

Принимать только конкретное переносимое решение: «группа отделена поверхностью» вместо «скопировать современность Superlist». Чужие screenshots/код не экспортированы в repository. Сохранены постоянные Mobbin URLs, не истекающие image_url.

Перепроверять источник при изменении соответствующего паттерна, перед новым визуальным пилотом или когда стала известна capture date. Не назначать expiration самому полезному правилу только из-за возраста референса.
