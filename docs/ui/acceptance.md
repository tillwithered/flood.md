# Acceptance и доказательства

[Индекс](README.md). Проверять затронутый сценарий, а не ритуально весь продукт после каждой правки.

## До реализации

Названы объект, действие, surface и ближайшая отвергнутая альтернатива. Известны states, owner state, backend capabilities и границы прав. Размеры взяты из existing tokens или явно предложенной роли. Референсы не названы свежее подтверждённых дат.

## Матрица сценария

- Light/dark; normal/narrow; 200% text zoom; длинный RU/EN; 0/1/много объектов; одинаковые names, отсутствие optional данных.
- Rest/hover/focus/pressed/selected/disabled; first loading/refresh; empty/no results; error/offline/reconnect; conflict/unsaved; pending/success — применимые состояния.
- Keyboard от входа до результата; Escape закрывает один слой; focus возвращается; фон modal недоступен; sticky элементы не перекрывают focus.
- Query/selection/draft сохраняются при предусмотренных переходах и ошибках; stale response не отменяет новое действие; двойной submit не создаёт дубль.
- Состояние не определяется только цветом; контраст текста/controls измерен; нет текста меньше 12 px; hit targets достаточны; reduced motion/forced colors работоспособны.
- Нет лишнего page horizontal scroll, card nesting, idle motion, скачка геометрии или скрытых обязательных действий. Локальный scroll широкой таблицы может быть корректным.

## Material gate 0.2

1. У каждой линии указана роль: divider / surface edge / required boundary / state-focus. Наличие DOM wrapper не является обоснованием рамки.
2. Нет дублированных стыков header/body/sidebar, случайных 2 px от border+shadow и отдельной рамки вокруг каждой строки списка.
3. Декоративный контраст подчинён тексту; required cues и focus не ослаблены вместе с ним. Для alpha измерена итоговая композиция, а не исходный hex.
4. Контролы монохромны во всех states; native checkbox/radio, text selection и visited link не привносят случайный blue. Forced-color system palette — явное исключение.
5. Розово-красный Danger сохраняется; text/icon/solid различаются по роли. Пара #d92f55/#fff0f3 не объявляется соответствующей 4.5:1 для body text.
6. Material один и цельный. Верхний свет optional, не двигает layout, не перехватывает pointer, исчезает в forced colors и не является focus.
7. Вложенный radius рассчитан по реальному visible inset. Shape, padding и border width стабильны между states.
8. Полный экран просмотрен при 100%, а edges — дополнительно на целевых DPR/масштабах. Не принять красивый увеличенный crop вместо нормального рабочего экрана.
9. Подсчитанные пары не заменяют проверку реальных компонентов. Не заявлять весь продукт доступным по результату specimen script.

## Проверки кода

Frontend: `npm run check`; `npm run build` для bundling/релевантной итоговой проверки. `npm run check` уже запускает font-size-floor script — не дублировать его ритуально. Rust — targeted crate checks/tests; docs-only изменение не требует production Tauri build.

Для material specimen: `node docs/ui/recipes/check-materials.mjs`. Проверяет 74 перечисленные непрозрачные пары; не вычисляет все alpha/gradients или production cascade. Для изменений CSS/HTML specimen повторить его visual/state проверки; [инструкции и ограничения](recipes/README.md).

Тесты чистой логики фильтрации/selection и сценарные тесты нужны при соответствующем implementation change и доступном harness. Browser preview — iteration; UI-ready требует actual Tauri flow. Не выдавать ручную симуляцию за выполненный автоматический тест.

## Карточка результата

```text
Scenario / source baseline:
Changed paths / contract:
Implemented behavior vs proposed values:
Edge/material roles and spacing ownership:
Contrast pairs (including compositing) / themes / focus:
Checks executed, command and outcome:
Visual evidence, environment and viewport:
Error recovery / keyboard / not run:
Known limitations / backend prerequisites:
```

Скриншот доказывает один state, не permissions, keyboard или recovery. Before/after используют одинаковые данные и размер окна, без секретов. Нет actual Tauri check — не писать «UI готов»; документационный пакет при этом может быть завершён.
