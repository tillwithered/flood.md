# Skills

Flood's agent package includes a lightweight `flood-ui` entry that routes work to
specialized skills. Start with the [agent guide](agents.md), the host instructions
and matching installed declarations. Load the skills relevant to the current task,
not the entire library of instructions.

[Interface content](interface-content.md) covers labels, wording and information
hierarchy. Its workflow removes unnecessary narration while keeping meaningful
constraints, consequences, recovery and accessible names.

Use [Agent knowledge](agent-knowledge.md) to discover these workflows by semantic
group and read the installed version. The catalog separates prerequisites from
optional related components; grouping is not a request to load every skill.

<!-- flood:workflows -->

See [Workspace review](/docs/recipes/workspace-review) for a runnable form and file
drawer assembled with these workflows. Its source, ownership choices and host
checks are documented together.

[Table bulk actions](/docs/recipes/table-bulk-actions) demonstrates controlled
cross-page selection, protected rows and an explicit confirmation using existing
Flood primitives. Its operation changes only the local in-memory example.

These skills use the existing dark base. They help apply and verify component
contracts; they do not imply new themes, animations, unavailable APIs or automatic
agent compliance. The component-family index describes applicability, not a test
report or an accessibility certification.

## Use a skill

The matching CLI installs the full sources beneath
`.agents/skills/flood-ui/references/`. The root `flood-ui` router links the relevant
workflow. Independent automatic discovery of nested skill directories is not
assumed; an agent can also read the selected installed `SKILL.md` explicitly.

The same versioned sources are served under `/agent/`. Raw skill links above are
readable Markdown and can be saved directly. Existing projects should compare
and merge newer guidance rather than overwrite customized instruction files.

For example, a settings form needs composition and forms, with spacing when
geometry is being tuned. A drawer with a selection popup additionally needs the
overlay workflow. Before handing off, use verification and report actual checks,
failures and any behavior that remains unverified.

The shared [rules index](/agent/rules.json) provides stable rule IDs and observable
checks; the [workflow index](/agent/workflows.json) describes routing. Neither is
an executable policy engine or authority to change external systems.
