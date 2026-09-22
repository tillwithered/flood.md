# Information architecture and ownership

Use when changing a screen, navigation transition, source scope or editing location. Complete current Project Work Context and read docs/design/principles.md, then use docs/design/skills/flood-screen-design/SKILL.md for composition.

1. Name the object and user action before selecting a container. Assign its owner: application, project, task, agent run, source or transient state.
2. Application settings own installation, appearance, storage and global provider accounts. Projects own task indices, context documents/rules/skills, compact memory, selected source scope and automation policy. Tasks own description, urgency, open/completed state, captured source and related runs/results. Drafts, selection, validation and queues are temporary state, not another source of truth.
3. Give each editable object one canonical home and editor. Other surfaces provide a useful summary/link without duplicating persistence. A global connected account does not grant access to every project source.
4. Use the selected Quiet Workbench: sidebar projects, one working task list, separate task/context pages, and one primary action. No duplicate task tree or permanent detail/chat column. Use the default/on-demand/omitted decisions in the progressive-disclosure matrix.
5. Documents, rules and skills are distinct project artifacts sharing an index and artifact modal. Type changes meaning, not the navigation architecture. Memory contains compact current facts, not transcripts/progress logs; history explains changes without becoming the data source.
6. Define entry, return and focus before styling. Preserve useful list position and drafts. Stable IDs keep links valid across renaming; a long route must not rely on remembered hidden state.

Deliver the owner, canonical surface, entry/return route and any removed duplication. Check that a first-time user can identify the current object, its next action and where it can be changed. Do not add entities, mandatory fields, permissions or workflow states merely to support the composition.
