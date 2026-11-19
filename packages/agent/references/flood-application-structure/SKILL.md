---
name: flood-application-structure
description: Plan a multi-route Flood application and keep page, dialog, drawer and sheet patterns recognizable. Use when building a whole workspace, adding a section to one, or moving a task between surfaces.
---

# Carry one product structure through every surface

Before writing JSX, identify the main objects, the destinations people return
to, and one task that crosses those destinations. For each step, identify the
current object, the next action, and the state that needs to survive return.
Use that outline in development notes and keep the interface focused on work.
Reuse the host's existing shell, conventions and components where available.

## Start a full-window workspace

Use AppShell for persistent navigation and a bounded working area. AppTopBar
holds application context and global actions. PageHeader holds the current
destination and its actions. For a document that scrolls as a whole, use
`scroll="page"`.

```tsx
"use client";
import type { ReactNode } from "react";
import { AppShell, AppTopBar, FloodRoot, PageHeader, Sidebar, Text } from "@flood-md/react";
import "@flood-md/react/styles.css";

export function ProjectsWorkspace({ children }: { children: ReactNode }) {
  return (
    <FloodRoot>
      <AppShell
        scroll="content"
        scrollOrientation="vertical"
        navigation={<Sidebar
          label="Workspace navigation"
          groups={[{
            id: "workspace", label: "Workspace", hideLabel: true, items: [
              { value: "overview", label: "Overview", href: "/overview" },
              { value: "projects", label: "Projects", href: "/projects" },
            ],
          }]}
          currentValue="projects"
        />}
        topBar={<AppTopBar start={<Text>Workspace</Text>} />}
      >
        <PageHeader title="Projects" />
        {children}
      </AppShell>
    </FloodRoot>
  );
}
```

Reuse the application's root and stylesheet import if they already exist. The
host supplies real routes and derives `currentValue` from the accepted route.
For navigation that must collapse into a drawer on a narrow host, read the
installed `recipe:navigation-workspace`. Check that overflow scrolls inside the
working area and that the skip link reaches it.

## Choose what the user can recognize everywhere

| Region | Keep stable across equivalent destinations | Adapt to the task |
| --- | --- | --- |
| Application shell | Real global destinations, current location, shared utility positions and the work area's entry edge. | The shell can collapse navigation or reveal it on request when space runs out. |
| Page header | One clear title role, common start edge and level of prominence for an equivalent action. Choose one PageHeader recipe for peer pages. | Use an action only when there is work to start there. Give editor, reading and settings bodies their own useful measures. |
| Task body | Shared type roles and a visible rhythm from field to group to task boundary. Match label and control edges inside comparable groups. | Use the width and density the task needs. Let a document or editor breathe and keep ordinary settings easy to scan. |
| Actions and feedback | Same verb for the same outcome. Keep equivalent actions in familiar places with stable emphasis and order. | A blocking confirmation puts the consequence close to the commit action. A persistent editor can keep tools alongside the content. |

Reuse AppShell, AppTopBar, PageHeader, Section and Flood layout primitives where
their installed contracts fit. Put the page title and first body region on a
common content edge. Place related actions within their region. A narrow settings
body can sit under the same page frame as a wide library without stretching its
fields to the library's width. For finite grouping and spacing decisions, use
[layout composition](../flood-layout-composition/SKILL.md) and
[hierarchy](../flood-hierarchy/SKILL.md).

## Choose a surface from the task

Use a page for work that needs a stable address, sustained editing or its own
navigation. Use a Drawer for adjacent details or a bounded task whose parent
context should stay recognizable. Use Dialog or AlertDialog for a focused
interruption or commitment. Use Sheet when a short contextual task needs a
touch-friendly presentation at narrow widths. Read
[overlays](../flood-overlays/SKILL.md) for the actual anatomy and focus contract.

Keep an equivalent title, labels, actions and meaning when a task changes
presentation. For example, an article's Comments may live in a Drawer beside
the editor and in a Sheet at narrow widths. Maintain the selected article and a
single host-owned comment draft across the change. If a full editor needs a
single-column route, keep the same draft and give Back a predictable destination.
Allow component-owned insets and header sizes to differ by surface. Match visual
roles and relationships instead of forcing a page-sized title into a compact
panel.

## Decide what survives a transition

- Put shareable routes and object identity in the host router. Give transient
  choosers and confirmations local open state. Reopening a deep link should
  restore the intended object without assuming a previous opener.
- Keep per-view query, selection and scroll where returning to the task needs
  them. Scope them to the relevant destination or workspace. Restore a sensible
  focus target when the previous one is gone.
- Keep editable drafts in the host across any presentation change that should
  preserve them. For route exits decide whether the app keeps the draft,
  explicitly asks to discard, or saves it. Distinguish local draft, accepted
  save and publication. Preserve edits after failed saves. Flush or reject late
  responses according to their draft identity. Use
  [forms](../flood-forms/SKILL.md) and [feedback](../flood-feedback/SKILL.md)
  for the submission and message owners.

## Review a whole route through the app

Compare two real peer pages and the secondary surface they can open. Check the
shell stays recognizable, page titles and content share their intended axes,
and the smaller surface keeps the task's hierarchy without crowding its actions.
Walk from one destination to another mid-task, then return and confirm the
selected object and draft. Exercise the corresponding narrow state and one
consequential action or relevant failure. Inspect the actual screens and
interactions using [visual review](../flood-visual-review/SKILL.md).
