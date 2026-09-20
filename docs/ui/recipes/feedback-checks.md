# Feedback lab 0.6.6 — проверки

[Контракт](../feedback.md) · [открыть](feedback.html) · 2026-09-19 · candidate.

## Выполнено

`python check-feedback.py` — **52 assertions**, включая **24 desktop layout cases**: 4 раздела × 960/1180/1440 × light/dark, без горизонтального page overflow. Chromium/Playwright — отдельный инструмент проверки, не dependency приложения.

Проверены:
- skeleton и loaded rows имеют одинаковую высоту; first-load region получает `aria-busy` и возвращается к содержимому;
- refresh сохраняет существующий список, использует локальный `aria-busy` и текстовую активность;
- determinate progress имеет min/max/now, синхронные `N из M`/процент и success только после 8/8;
- indeterminate operation не получает fake progressbar;
- inline error сохраняет введённое значение; success/error остаются рядом с действием;
- persistent warning разрешается явной операцией, success notice не становится вечным;
- toast не крадёт focus, stack ограничен тремя, hover приостанавливает timeout, Escape закрывает focused toast;
- reduced motion отключает skeleton/spinner animation, сохраняя текст состояния;
- forced-colors сохраняет persistent notice; JS errors и external requests: 0.

Визуально просмотрены Loading light, Progress dark, Inline/banner light и Toast dark. Скриншоты runner сохраняет в `FLOOD_EVIDENCE` или `/tmp/flood-feedback-evidence`.

## Ограничения

Не проверены Tauri/WebView2/WebKit/Safari, screen reader, native 200% zoom, background app state, реальные API и долгие операции. Timing toast 5s/8s и skeleton breathe1500ms — кандидаты для review, не универсальные константы продукта. Forced-colors screenshot не равен полному high-contrast audit. Semantic colors наследуют уже принятую палитру, но все composited alpha/adjacency combinations здесь не сертифицируются.
