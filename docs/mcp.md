# Connect your agent

Connect an agent to Flood’s public component APIs, recipes, tokens and design
skills. The server uses the same versioned catalog as this website.

## Set up your client

### Codex

```sh
codex mcp add flood --url https://flood.md/mcp
```

Run `codex mcp list` to check the connection.

### Cursor

To add the server manually, put this in your project's `.cursor/mcp.json`.

```json
{
  "mcpServers": {
    "flood": { "url": "https://flood.md/mcp" }
  }
}
```

### VS Code

To add the server manually, run **MCP: Add Server**, choose **HTTP**, enter
`https://flood.md/mcp`, and use `flood` as the server ID.

### Claude Code

```sh
claude mcp add --transport http flood https://flood.md/mcp
```

Run `claude mcp list` to check the connection for the current project.

### ChatGPT

In a workspace that allows custom plugins, choose **Add custom MCP server**,
enter `https://flood.md/mcp`, and select **No authentication**.

[Download the Flood plugin ZIP](https://flood.md/flood-plugin.zip) for OpenAI's
plugin upload.

### Other clients

Use `https://flood.md/mcp` with Streamable HTTP. The public catalog requires no
Flood account or API key.

## Try Flood

Open a new chat and ask your agent to find the recipe for a table with filters
and bulk actions. It should link to the [table bulk actions recipe](https://flood.md/docs/recipes/table-bulk-actions).

## Tools

| Tool | Use |
| --- | --- |
| `flood_info` | See the published catalog version and available groups. |
| `search_flood` | Discover matching components, recipes, guides, skills and tokens. |
| `read_flood` | Read the source material for one result. |

For existing projects, use the installed package and CLI to check available
APIs and read project-owned guidance. The MCP serves public website materials.

## Install the catalog skill

Install the public catalog skill with the Skills CLI to give your coding agent
instructions for finding Flood components, reading their contracts, and checking
them against the installed version.

```sh
npx skills add tillwithered/flood.md --skill flood-catalog
```

Connect Flood MCP in your client to use hosted search. For an existing Flood
project, start with the versioned guidance installed by the Flood CLI.

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
