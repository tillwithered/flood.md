# Flood MCP

Connect an agent to Flood’s public component APIs, recipes, tokens and design
skills. The server uses the same versioned catalog as this website.

## Connect in Codex

```sh
codex mcp add flood --url https://flood.md/mcp
```

Run `codex mcp list` to confirm that `flood` is configured.

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

The endpoint uses public search terms, filters and material IDs to return
Flood documentation. It requires no account and keeps no record of request
bodies or MCP visits. Railway processes requests as the hosting provider and
may retain operational metadata under its own policies. Disconnect Flood in
your agent client to stop sending requests. Send public search terms and IDs only.

## Terms

The Flood plugin and its source are available under the [MIT license](https://github.com/tillwithered/flood.md/blob/main/LICENSE).
The hosted endpoint provides public documentation as available. Use it for
catalog access and respect the request limits.
