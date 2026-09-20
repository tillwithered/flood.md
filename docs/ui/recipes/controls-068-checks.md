# Controls 0.6.8 — checks

Локальный Chromium review:
- 24 desktop layout cases: 4 tabs × 960/1180/1440 × light/dark, no horizontal overflow.
- Clear возвращает input focus.
- Custom +/− изменяет numeric value; invalid 200 не исправляется молча.
- Numeric input не использует type=number/system steppers.
- Pending primary сохраняет width/height.
- Late response сообщает captured value, если draft уже изменён.
- No JavaScript page errors in tested flows.

Непроверено: Tauri/WebView2/WebKit, real autofill manager, screen reader, native200% zoom, locale-specific numeric IME, password manager overlays.
