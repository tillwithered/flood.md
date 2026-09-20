# Workspace refine0.7.1 — checks

Standalone lab tested in Chromium:
- 12 layout cases: 1024/1280/1440 × light/dark × current/refined;
- no page horizontal overflow;
- sidebar remains304px in expanded state in both modes;
- task title remains28px in both modes;
- Current/Refined toggle changes polish without changing DOM/IA;
- theme toggle and sidebar collapse work;
- no JavaScript page errors.

Visual review at1440×900 confirms editor-first layout and sparse raster identity.

Not tested: actual Tauri, production routing, live data, SR/native zoom. Specimen recreates production structure from current CSS; it is not a pixel-perfect screenshot of running app.
