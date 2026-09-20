# AGENTS.md

## Goal

Work efficiently in this repository.

Prefer implementation over prolonged exploration.
Read the minimum code necessary to make a correct change.
Do not spend time investigating unrelated architecture.

## Repository

Flood is a desktop application built with:

- Svelte 5 + TypeScript + Vite
- Tauri 2
- Rust workspace

Frontend:
- `src/`

Rust:
- `crates/`
- `src-tauri/`

Project-owned agent context:
- `.flood/`

## Large files

These files are unusually large:

- `src/App.svelte`
- `src/styles.css`
- `src/i18n.ts`

Do NOT read these files in full unless absolutely necessary.

When working with a large file:

1. Locate the relevant symbol, text, selector, component, or handler first.
2. Use targeted search such as `rg -n`.
3. Read only the relevant surrounding range.
4. Make the targeted edit.
5. Do not repeatedly re-read unchanged regions.

Prefer:

```bash
rg -n "symbol|text|selector" src/App.svelte
```

over dumping the entire file.

## Execution style

For clear implementation requests:

1. Find the relevant implementation.
2. Read enough surrounding code to understand it.
3. Make the change.
4. Validate the affected area.
5. Report the result.

Do not produce a long implementation plan unless the user explicitly asks for one.

Do not repeatedly alternate between:
- inspecting
- explaining
- inspecting again
- planning again

Once sufficient context is available, implement.

Prefer one coherent implementation pass over many tiny exploratory passes.

## Scope

Stay within the requested scope.

Do not:
- refactor unrelated code;
- redesign unrelated architecture;
- rename unrelated symbols;
- clean up unrelated files;
- investigate unrelated failures.

If an unrelated issue is discovered, mention it briefly at the end instead of fixing it automatically.

## Frontend work

For frontend-only tasks, focus on:

- `src/`
- relevant Tauri bindings only when required

Do not inspect Rust internals unless the frontend task depends on them.

Prefer extracting reusable Svelte components instead of making
`src/App.svelte` larger.

New substantial UI/features should normally live outside `App.svelte`.

Avoid adding more large global CSS blocks to `src/styles.css` when styles can
reasonably live with the relevant component or feature.

## Rust work

The Rust workspace contains multiple crates.

For changes isolated to one crate:

```bash
cargo check -p <crate>
```

Prefer crate-specific checks and tests over checking the entire workspace.

Do not run broad workspace builds after every small edit.

Use a full workspace check only when:
- the change affects shared APIs;
- multiple crates changed;
- release-level validation is requested;
- targeted validation is insufficient.

## Validation

Use the narrowest useful validation first.

Frontend:

```bash
npm run check
```

When appropriate:

```bash
npm run build
```

Rust:

```bash
cargo check -p <affected-crate>
```

Run targeted tests when available.

Do not repeatedly run the same expensive check after every small edit.
Finish the coherent change first, then validate it.

Do not run Tauri production builds merely to verify ordinary frontend changes.

## Search

Prefer targeted repository search:

```bash
rg -n "pattern" path/
rg -l "pattern" path/
```

Search likely directories first.

Do not recursively inspect the entire repository when the task clearly belongs
to one feature or subsystem.

## Git

Assume the working tree may contain user changes.

Before modifying files, inspect relevant existing changes when necessary.

Never discard user changes.

Do not use destructive commands such as:

```bash
git reset --hard
git checkout -- .
git clean -fd
```

unless the user explicitly requests them.

Use targeted diffs:

```bash
git diff -- <file>
git diff -- <path>
```

Do not repeatedly dump the entire repository diff.

Do not create commits or branches unless explicitly requested.

## Dependencies

Do not add or upgrade dependencies unless necessary for the requested task.

Prefer existing project capabilities over introducing another package.

If a new production dependency is genuinely necessary, explain why before
adding it.

## `.flood` project context

`.flood/` contains project-owned rules, skills, and agent context.

Use relevant `.flood` material when the task requires product, UI, design,
interaction, or project-specific guidance.

Do not load every `.flood` document for every coding task.

Read only the rules or skills relevant to the current task.

## Communication

Keep progress commentary concise.

Do not narrate routine repository exploration.

Surface only:
- important discoveries;
- blockers;
- meaningful architectural decisions;
- validation failures.

At completion, summarize:
- what changed;
- which files changed;
- what validation was run;
- any unresolved issue.

## Priority

Correctness matters, but avoid unnecessary analysis.

Default behavior:

**search narrowly → read narrowly → implement → validate narrowly**
