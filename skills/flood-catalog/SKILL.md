---
name: flood-catalog
description: Build and review Flood design-system interfaces using version-matched components, recipes, tokens, and skills. Use when the user asks about Flood or wants an agent to build a screen with Flood.
---

1. In an existing project, read its host instructions, package manifest,
   installed Flood declarations, and Flood design guide. Use the matching
   installed catalog when available. The installed version determines which
   APIs the project can use.
2. Search for a recipe that matches the task, then read its required materials
   before composing the smallest set of existing Flood components. With Flood
   MCP, use `search_flood` to find materials and `read_flood` to open their IDs.
   Pass `nextOffset` as `offset` and `nextLinksOffset` as `linksOffset`
   when the corresponding result is paginated. For a
   new project or a version check, `flood_info` reports the public catalog
   version. Send only public search terms and material IDs.
3. If MCP is unavailable, use the installed CLI's `catalog` and `read`
   commands or the public [Flood docs](https://flood.md/docs),
   [MCP connection guide](https://flood.md/docs/mcp), and
   [documentation index](https://flood.md/llms.txt).
4. When implementing a screen, verify its normal interaction, relevant errors,
   and layout in a browser. Read the installed visual review and verification
   workflows before reporting results.

Start with the [table bulk actions](https://flood.md/docs/recipes/table-bulk-actions)
or [navigation workspace](https://flood.md/docs/recipes/navigation-workspace)
recipe when the task matches. Link to the source page when citing a public
component, recipe, or workflow.
