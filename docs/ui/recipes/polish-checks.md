# Clean-light 0.3.1 — проверка образца

[Правила](../light-theme-and-polish.md) · [образец](polish.html) · 2026-09-19.

Владелец одобрил исправленную светлую палитру. Файл polish.html перенесён из проверенного разговорного preview без изменения его поведения: SHA blob 5345d8661e3a1a9a5943685351a15bd906bdca6f. В repository базовый CSS подключён по относительному пути; в разговорной версии тот же CSS встроен. materials.css не менялся.

Повторно выполнено: `node docs/ui/recipes/check-polish.mjs` — 46 opaque-пар на тему, 92 проверки пройдены; нейтральные light roles и схема общих данных пройдены. Удалён отвергнутый card/canvas >=1.20 guard; проверки текста, полей, focus и статусов не ослаблены.

Исторические проверки 0.3 (Chromium, ширины 1180/780/390/320, selection/filter/focus, reduced-motion и forced-colors) не являются новой проверкой каждой платформы после изменения. Новый результат нужно записывать вместе с окружением и конкретным сценарием.

Не заявляется: production build Flood, actual Tauri, WebView2/WebKit, screen reader, физический дисплей, OS scaling, нативный zoom, реальный GitHub/permissions flow. Проверки opaque tokens не покрывают автоматически alpha, gradients и промежуточные кадры. Следующий перенос в приложение требует приёмки настоящего сценария.
