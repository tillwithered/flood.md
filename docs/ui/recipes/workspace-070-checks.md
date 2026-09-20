# Workspace0.7.0 — checks

Desktop specimen review scope:
- wide shell: sidebar + list + detail, no page horizontal overflow;
- collapsed sidebar changes width, not typography;
- search/filter preserve selected detail;
- hidden selected task is reported, not silently cleared;
- Back on narrow returns list without clearing query/filter;
- list scrollTop survives detail open/back;
- task selection uses neutral fill; keyboard focus remains independent;
- project header keeps one raster accent and repo metadata separate from description;
- no new blue controls, card-per-row borders or KPI dashboard;
- stable agent raster identity does not change with task state;
- theme switch preserves current task/filter.

Not production acceptance: Tauri/WebView/SR/native zoom/backend and actual routing are not tested by this lab.
