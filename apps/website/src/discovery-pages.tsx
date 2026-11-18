import { useState, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Box, ChartNoAxesCombined, Compass, Layers3, LayoutGrid, ListChecks, PanelsTopLeft, ShoppingBag, SlidersHorizontal, Terminal, TextCursor, Wallet, Workflow } from "lucide-react";
import { Breadcrumb, CopyButton, Grid, Heading, IconSlot, Inline, Link, SearchInput, Stack, Surface, Text } from "@flood-md/react";
import { directoryGroups, directoryComponents, matchesComponent, type ComponentSummary } from "./component-directory-data";
import { recipeCategories, recipeGroups, recipes, recipePrompt, type Recipe } from "./recipe-directory";
import { agentScenarios } from "./agent-scenarios";
import { TableBulkActions } from "./recipes/table-bulk-actions";

const categoryIcons = {
  setup: Box, layout: LayoutGrid, typography: TextCursor, actions: Workflow, forms: SlidersHorizontal,
  navigation: Compass, content: Layers3, charts: ChartNoAxesCombined, overlays: PanelsTopLeft, feedback: ListChecks,
  tables: ListChecks, workspace: PanelsTopLeft, "e-commerce": ShoppingBag, fintech: Wallet, hosting: Terminal,
  saas: PanelsTopLeft, operations: Workflow,
} as const;
const commonComponents = ["button", "data-table", "input", "select", "dialog", "app-shell"]
  .flatMap(slug => directoryComponents.filter(component => component.slug === slug));

function CategoryIcon({ name }: { name: string }) {
  const Icon = categoryIcons[name as keyof typeof categoryIcons] ?? Box;
  return <IconSlot size="lg" className="discovery-glyph"><Icon /></IconSlot>;
}

function DirectoryHeading({ title, description, parent }: {
  title: string;
  description: string;
  parent?: { label: string; href: string };
}) {
  return <Stack gap="3" className="discovery-heading">
    {parent && <Breadcrumb label="Page breadcrumb" items={[parent, { label: title }]} />}
    <Heading level={1} size="large" className="discovery-title">{title}</Heading>
    <Text as="p" size="lead" tone="subtle">{description}</Text>
  </Stack>;
}

function DirectoryCard({ href, title, description, icon, meta, id }: {
  href: string; title: string; description: string; icon: string; meta?: ReactNode; id?: string;
}) {
  return <Link href={href} id={id} className="discovery-card">
    <Surface padding="4" className="discovery-card-surface"
      style={{ background: "var(--discovery-card-background, var(--flood-sys-color-surface-default))" }}>
      <Stack gap="3">
        <Inline gap="2" align="center" className="discovery-card-top">
          <CategoryIcon name={icon} />
          <IconSlot size="sm" className="discovery-arrow"><ArrowUpRight /></IconSlot>
        </Inline>
        <Stack gap="1">
          <Heading level={3} size="group">{title}</Heading>
          <Text size="compact" tone="subtle">{description}</Text>
        </Stack>
        {meta && <Text size="helper" tone="subtle">{meta}</Text>}
      </Stack>
    </Surface>
  </Link>;
}

function ComponentLinks({ pages }: { pages: readonly ComponentSummary[] }) {
  return <Grid gap="2" minItemWidth="15rem" className="component-directory-links">
    {pages.map(page => <Link key={page.slug} href={`/components/${page.slug}`} className="discovery-result">
      <Stack gap="1">
        <Text size="compact" className="discovery-result-name">{page.name}</Text>
        <Text size="helper" tone="subtle">{page.description}</Text>
      </Stack>
      <IconSlot size="sm"><ArrowUpRight /></IconSlot>
    </Link>)}
  </Grid>;
}

export function ComponentDirectory({ family }: { family?: string }) {
  const [query, setQuery] = useState("");
  const group = directoryGroups.find(entry => entry.id === family);
  const pages = group?.components ?? directoryComponents;
  const searching = Boolean(query.trim());
  const matches = searching ? pages.filter(page => matchesComponent(page, query)) : pages;
  return <main id="main-content" tabIndex={-1} className="discovery-page">
    <DirectoryHeading title={group?.label ?? "Components"}
      description={group?.description ?? "Explore the React components behind Flood interfaces."}
      parent={group ? { label: "Components", href: "/components" } : undefined} />
    <Stack gap="6">
      <Inline gap="3" align="center" className="discovery-filter">
        <SearchInput className="catalog-search" aria-label="Search components" placeholder={group ? `Search ${group.label.toLowerCase()}…` : "Find a component…"}
          value={query} onChange={event => setQuery(event.currentTarget.value)}
          onKeyDown={event => { if (event.key === "Escape") setQuery(""); }} />
        <Text role="status" size="compact" tone="subtle">
          {searching && !matches.length ? "No components found." : `${matches.length} ${matches.length === 1 ? "component" : "components"}`}
        </Text>
      </Inline>
      {group || searching ? <ComponentLinks pages={matches} /> : <>
      <section aria-labelledby="families-heading">
        <Stack gap="4">
          <Heading level={2} size="section" id="families-heading">Browse families</Heading>
          <Grid gap="3" minItemWidth="15rem" className="discovery-family-grid" role="navigation" aria-label="Component categories">
            {directoryGroups.map(item => <DirectoryCard id={item.id} key={item.id} href={`/components/category/${item.id}`}
              title={item.label} description={item.description} icon={item.id}
              meta={`${item.components.length} ${item.components.length === 1 ? "component" : "components"}`} />)}
          </Grid>
        </Stack>
      </section>
      <section aria-labelledby="common-components"><Stack gap="4">
        <Heading level={2} size="section" id="common-components">Start with the essentials</Heading>
        <ComponentLinks pages={commonComponents} />
      </Stack></section>
      </>}
      <Inline gap="4">
        <Link href="/recipes">See components in recipes <IconSlot size="sm"><ArrowRight /></IconSlot></Link>
        {(!group || group.id === "charts") && <Link href="/docs/charts">Chart guide</Link>}
        <Link href="/components.md">Page Markdown</Link>
      </Inline>
    </Stack>
  </main>;
}

export function RecipeCards({ items }: { items: readonly Recipe[] }) {
  return <Grid gap="3" minItemWidth="16rem" className="discovery-recipe-grid">
    {items.map(recipe => <DirectoryCard key={recipe.slug} href={recipe.path} title={recipe.label}
      description={recipe.description} icon={recipe.groups?.[0] ?? "workspace"}
      meta={recipe.preview ? "Live example and code" : "Guide and code"} />)}
  </Grid>;
}

function RecipeCollectionCards({ items }: { items: typeof recipeGroups }) {
  return <Grid gap="3" minItemWidth="19rem" className="recipe-collection-grid">
    {items.map(item => <DirectoryCard key={item.id} href={`/recipes/${item.id}`} title={item.label}
      description={item.description} icon={item.id} meta={`${item.recipes.length} recipes`} />)}
  </Grid>;
}

export function CategoriesDirectory() {
  return <main id="main-content" tabIndex={-1} className="discovery-page">
    <DirectoryHeading title="Categories" description="Browse Flood recipes by industry and product type." />
    <RecipeCollectionCards items={recipeCategories} />
  </main>;
}

export function RecipesDirectory({ collection }: { collection?: string }) {
  const group = recipeGroups.find(entry => entry.id === collection);
  const taskGroups = recipeGroups.filter(entry => !entry.category);
  return <main id="main-content" tabIndex={-1} className="discovery-page">
    <DirectoryHeading title={group?.label ?? "Recipes"}
      description={group?.description ?? "Working patterns for tables, forms and product workspaces."}
      parent={group?.category ? { label: "Categories", href: "/categories" }
        : group ? { label: "Recipes", href: "/recipes" } : undefined} />
    <Stack gap="12">
      {group ? <section aria-labelledby="collection-heading"><Stack gap="4">
        <Heading id="collection-heading" level={2} size="section">Recipes in this collection</Heading>
        <RecipeCards items={group.recipes} />
      </Stack></section> : <>
        <section aria-labelledby="tasks-heading"><Stack gap="4">
          <Heading id="tasks-heading" level={2} size="section">Browse by task</Heading>
          <RecipeCollectionCards items={taskGroups} />
        </Stack></section>
        <section aria-labelledby="industries-heading"><Stack gap="4">
          <Heading id="industries-heading" level={2} size="section">Browse by category</Heading>
          <RecipeCollectionCards items={recipeCategories} />
        </Stack></section>
        <section aria-labelledby="all-recipes-heading"><Stack gap="4">
          <Heading id="all-recipes-heading" level={2} size="section">All recipes</Heading>
          <RecipeCards items={recipes} />
        </Stack></section>
      </>}
    </Stack>
  </main>;
}

export function RecipeIntroduction({ recipe }: { recipe: Recipe }) {
  return <Stack gap="4" className="recipe-introduction">
    <Inline gap="2" align="center">
      <CopyButton variant="subtle" size="sm" value={recipePrompt(recipe)} copyLabel="Copy for agent" />
      {recipe.preview && <Link href={recipe.preview} variant="outline" size="sm">Open playground <IconSlot size="sm"><ArrowUpRight /></IconSlot></Link>}
      <Link href={recipe.path + ".md"} size="sm">Read Markdown</Link>
    </Inline>
    {recipe.uses?.length ? <section aria-label="Components in this recipe">
      <Stack gap="2">
        <Text size="label" className="discovery-result-name">Components used</Text>
        <Inline gap="2">
          {recipe.uses.map(slug => {
            const component = directoryComponents.find(page => page.slug === slug);
            return component && <Link key={slug} href={`/components/${slug}`} variant="ghost" size="sm">{component.name}</Link>;
          })}
        </Inline>
      </Stack>
    </section> : null}
    {recipe.slug === "table-bulk-actions" && <section id="live-example" aria-labelledby="live-example-heading">
      <Stack gap="3">
        <Heading id="live-example-heading" level={2} size="section">Live example</Heading>
        <TableBulkActions />
      </Stack>
    </section>}
  </Stack>;
}

export function AgentsDirectory() {
  return <main id="main-content" tabIndex={-1} className="discovery-page">
    <DirectoryHeading title="Flood for coding agents" description="Give your agent the recipes and APIs that match your project." />
    <Stack gap="12">
      <section aria-labelledby="agent-setup-heading"><Stack gap="4">
        <Heading id="agent-setup-heading" level={2} size="section">Setup and guidance</Heading>
        <Grid minItemWidth="16rem">
          <DirectoryCard href="/docs/mcp" title="Connect Flood MCP" description="Search the public catalog from Codex, Cursor, Claude Code and other clients." icon="hosting" />
          <DirectoryCard href="/docs/skills" title="Explore skills" description="Read the guidance for component selection, layout and interface review." icon="workspace" />
          <DirectoryCard href="/docs/agent-knowledge" title="Read the installed catalog" description="Find the matching component contract and project guidance by version." icon="content" />
        </Grid>
      </Stack></section>
      <section aria-labelledby="try-agent-heading"><Stack gap="4">
        <Heading id="try-agent-heading" level={2} size="section">Try a task</Heading>
        <Grid minItemWidth="16rem">
          {agentScenarios.map(item => <Surface key={item.href} padding="4" className="agent-prompt-card">
            <Stack gap="3">
              <Heading level={3} size="group">{item.title}</Heading>
              <Text as="p" size="compact" tone="subtle">{item.prompt}</Text>
              <Inline gap="2">
                <CopyButton variant="subtle" size="sm" value={item.prompt} copyLabel="Copy prompt" aria-label={`Copy prompt for ${item.title}`} />
                <Link href={item.href} size="sm">View example <IconSlot size="sm"><ArrowRight /></IconSlot></Link>
              </Inline>
            </Stack>
          </Surface>)}
        </Grid>
      </Stack></section>
    </Stack>
  </main>;
}
