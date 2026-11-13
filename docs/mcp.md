# Flood MCP

Connect an agent to Flood’s public component APIs, recipes, tokens and design
skills. The server uses the same versioned catalog as this website.

## Connect in Codex

```sh
codex mcp add flood --url https://flood.md/mcp
```

Open a new chat and ask, “Use Flood to find the right components for a table
with filters and bulk actions. Link the relevant docs.”

## Connect in ChatGPT

In a workspace that allows custom plugins, create one using
`https://flood.md/mcp` as the server URL and select **No authentication**.
The server uses Streamable HTTP.

[Download the Flood plugin ZIP](/flood-plugin.zip) for OpenAI's plugin upload
flow. It includes the connection settings and a skill that teaches the agent
when to search, what to read and how to handle installed versions.

## Tools

| Tool | Use |
| --- | --- |
| `flood_info` | See the published catalog version and available groups. |
| `search_flood` | Discover matching components, recipes, guides, skills and tokens. |
| `read_flood` | Read the source material for one result. |

For existing projects, use the installed package and CLI to check available
APIs and read project-owned guidance. The MCP serves public website materials.

## Privacy

The MCP endpoint processes public catalog queries and material IDs. Flood
does not store MCP request bodies or count them as website visits. Requests
do not require a Flood account. The hosting provider can maintain operational
request logs. Send public search terms and IDs only.
