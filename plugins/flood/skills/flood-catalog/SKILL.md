---
name: flood-catalog
description: Find and read Flood design-system components, recipes, tokens and agent workflows. Use when the user asks about Flood or is working in a Flood project.
---

Use the Flood MCP server for public documentation. Call `flood_info` if the
version is relevant. Search by component name, UI role or workflow with
`search_flood`, then use `read_flood` for the selected material IDs. Follow
`nextOffset` until the chosen material is complete and read any required
prerequisites. Link to the returned public URL when one is available.

For an existing project, check its host instructions, installed Flood version,
declarations and local design guide first. Use the matching installed catalog
when it is available. For a new project, use the public catalog to find the
smallest existing components that meet the task and apply the relevant
composition and review guidance. Send only public Flood search terms and IDs.
