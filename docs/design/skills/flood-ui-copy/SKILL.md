---
name: flood-ui-copy
description: Write and edit Russian interface copy for flood.md, including task actions, empty states, errors, permissions and agent results. Use when labels or explanations change; this skill does not redesign unrelated screens.
---

# Flood UI copy

Complete [the bootstrap](../../agent-contract.md#bootstrap). Read [the content contract](../../content.md), the owning [flow](../../flows.md) and its actual backend consequence.

1. Identify what the surrounding page/section already tells the user. Remove repeated object types, introductory prose and technical implementation details that do not help a decision. Keep necessary scope, consequences and recovery.
2. Use the established Russian vocabulary: project, task, normal/important/urgent, open/completed. Use sentence case and concrete action verbs. Do not introduce “workspace,” “channel” or another workflow state as a synonym for a project/task.
3. Label the operation the system really performs. For the existing compound `accept_agent_run` operation, use `Принять и завершить`; readiness for review alone does not mean completion. Save/apply/publish/grant access are distinct actions.
4. Distinguish no data, no matches, loading, offline/unavailable and failed read. Do not invite the user to recreate an object merely because it could not be loaded.
5. For errors state what failed, whether the input was preserved, and one safe next action. Put raw technical details behind an optional diagnostic view. For permissions name the source, scope and read/write consequence at the decision point.
6. Review labels in context, including long Cyrillic names, plurals/counts, missing names, accessible names for icon-only controls and narrow/200% layouts. A tooltip must not be the only place essential meaning exists.

Deliver the affected strings with location and reason when useful. Keep the surrounding instruction/specification English. Preserve all explicit user decisions and implementation scope; copy work does not authorize new features.
