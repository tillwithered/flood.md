# Banner actions и raster brand — 0.6.7

[Индекс](README.md) · [desktop lab](recipes/brand-notices.html) · 2026-09-19.

## 1. Contextual action внутри semantic banner

Розово-красный Danger-material сохраняется. Отдельная белая/угольная secondary-кнопка внутри него отвергнута: она выглядит как чужая вложенная поверхность и создаёт лишний контраст.

Recovery-action принадлежит banner surface:
- прозрачный rest;
- цвет текста = текущий semantic foreground;
- без border/shadow/подошвы;
- underline 1px с offset3;
- hover/pressed = локальное смешение currentColor примерно 3%/5%;
- двухслойный neutral focus остаётся отдельным accessibility-layer;
- на узкой ширине действие переносится под copy, не сжимая title/helper.

Не превращать это в универсальную text-button для всего приложения. Это contextual action внутри semantic notice.

## 2. Raster blobs: три роли

**Accent.** Один крупный brand-material рядом с важным содержимым. Не фон каждой card/row и не повторяющийся divider.

**Empty state.** Небольшая illustration перед появлением содержимого. После создания/загрузки object она уступает место рабочей поверхности и не остаётся декоративным watermark.

**Stable identity.** Blob может представлять Flood/agent identity. Смена run-state не меняет asset: status показывают text + Heroicons/state primitives. Красный/зелёный raster не являются Danger/Success автоматически.

Blobs не заменяют Heroicons, provider logos, progress/spinner, warning/danger icon или checkbox/radio marks.

## 3. Raster rules

Источник — существующие PNG masters в `src/assets/flood-material/masters/`. В docs specimen используем их как есть: без crop, hue-shift, CSS-filter и перерисовки. `object-fit:contain`, transparent background, `pointer-events:none`, `user-select:none`.

Размеры — по роли, а не по имени файла:
- identity: 24–40px;
- empty state: примерно 72–120px;
- accent: 120–240px в desktop composition;
- background/watermark не default.

При runtime-внедрении derivatives выбираются по реальному DPR/весу bundle. Не плодить отдельные raster variants до измерения.

## 4. Существующий FloodGlyph

Текущий `FloodGlyph` связывает raster names с `normal/important/urgent/completed/connected/info`. Для новой DS это смешивает identity и semantic state. Не удалять компонент вслепую, но при runtime migration разделить:
- `BrandMaterial` / `AgentIdentity` — стабильный raster asset;
- semantic state — Heroicons + text/tone primitives.

## 5. Feedback relation

Persistent permission/access problem остаётся banner/notice. Краткий подтверждённый итог может быть toast. Blob не появляется внутри error banner как ещё один статусный символ.

Feedback0.6.6 остаётся отдельным слоем; 0.6.7 уточняет только action и brand-role.

## 6. References

Mobbin просмотрен 2026-09-19. Linear empty-state refs: https://mobbin.com/screens/5273571d-4f58-410a-97a0-f6018dc8b80f и https://mobbin.com/screens/5cc1bd35-b393-4c63-9b86-280b982247e0 — provisional, capture date неизвестна. Используем идею одного спокойного visual anchor, не их illustration style.

Banner refs returned by Mobbin for this search were Deel/Chatbase rather than Linear; identity mismatch noted, поэтому не используем их как Linear evidence.

## После review

Нужно утвердить NOTICE-ACTION-067 и brand roles, затем выполнить atomic audit P-04 / feedback / runtime component split. Workspace остаётся deferred.
