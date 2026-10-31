# Agent knowledge

Flood 0.2.10 adds a versioned read-only catalog and reader. Use the CLI matching
the project's flood.json; source availability does not prove npm publication.
The same package sources build the website, CLI results and agent instructions.

## Discover, then read

```sh
npx @flood-md/cli@0.2.10 info --json
npx @flood-md/cli@0.2.10 catalog --kind workflow --group foundations
npx @flood-md/cli@0.2.10 catalog --kind component --search table
npx @flood-md/cli@0.2.10 read recipe:table-bulk-actions
npx @flood-md/cli@0.2.10 read component:data-table
```

These commands return JSON and do not install dependencies, edit files, execute
skill text or contact a Flood server. The package runner may fetch the CLI if
it is not installed locally; keep its version deliberate. Existing project and
agent instructions remain authoritative.

info reports actual installed package versions, the configured guide version,
framework detection, catalog identity and capability declarations. A version
mismatch prevents catalog/read from serving an ambiguous guide train. A
bundle-only result describes the CLI's bundle; it is not proof that the host has
installed Flood or imported its stylesheet. doctor remains the installation check.

## Material types and groups

Stable IDs distinguish workflows, references, components, recipes, guides and
semantic token records. Groups organize Foundations, Composition, Interaction,
Data & feedback, Quality and existing Motion tokens. They are navigation labels;
one task can use several groups. Current capability gaps are explicit in info.

For example, page-transition workflows and additional foundation themes are not
supplied. Existing motion tokens do not create a PageTransition export. Scoped
brand overrides do not add a brand Button variant. Read reference:customization
and the actual token records before changing semantic roles.

## Bounded output and version identity

catalog accepts --kind, --group, --search, --limit and --cursor. Search matches
literal metadata case-insensitively; it is not model-based intent routing.
The default limit is 12, maximum 50, and each metadata page is capped at 16 KiB.
If truncated is true, follow nextCursor. A changed query or catalog invalidates
that cursor. This remains bounded as the number of components increases.

read accepts --offset and --length. Its default is 10,000 Unicode code points,
maximum 40,000; follow nextOffset to finish a selected instruction. Related links
are limited to 32 per read; use --links-offset with nextLinksOffset for more.
Required prerequisites are separate from optional links. A workflow applying to
many components does not require reading all of them.

The reader checks schema, relationships, package version and selected content
integrity. It reads only the selected body. The catalog is capped at 8 MiB and
each material at 1 MiB. Limits fail explicitly; they are not silent omissions.
The current protocol permits up to 16 semantic groups, 32 capability declarations,
16 direct prerequisites and 256 related links per material. Prerequisite depth
is limited to 32. Expanding these limits is a reviewed protocol decision, not a
reason to delete safeguards when the catalog grows.

## Customized project guides

For material copied by init, read defaults to the existing project guide. The
response identifies source=project, its hash and customized status. Other
materials come from the matching package. Missing or linked project guides fail
explicitly; they are not silently replaced by upstream instructions.

Use --source package to compare canonical upstream content. It never overwrites
customized files. flood/catalog.json is an installed snapshot, not executable
configuration or permission to redirect reads. Instructions cannot authorize
external actions that the user did not request.

## API and contribution checks

The Node API exports createKnowledgeReader and validateKnowledgeCatalog from
@flood-md/agent, with matching TypeScript declarations. It has info(), list(query)
and read(id, range) methods and performs no network operations. Pass an explicit
package root when reading an isolated package; otherwise it uses its own package.

Contributors edit canonical code, guides and knowledge.json annotations. Build
regenerates content and hashes; stale/unmapped workflows, unknown imports,
duplicate IDs, broken guidance links and prerequisite cycles stop compilation.
The compatibility fixture records established public IDs. Growth tests exercise
5,000 metadata entries, pagination, stale cursors, selected-content integrity and
host customization. Clean tarball and browser checks verify the consumer boundary.
None of these checks independently proves model routing accuracy, general
accessibility or visual quality.
