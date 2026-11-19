import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Breadcrumb, Grid, Heading, HighlightText, IconSlot, Inline, Link, SearchInput, Stack, Text } from "@flood-md/react";
import { directoryGroups, directoryComponents, searchDirectoryComponents, type ComponentSummary } from "./component-directory-data";
import { recipes, type Recipe } from "./recipe-directory";

const catalogGroups = [
  ...directoryGroups.filter(group => group.id === "actions" || group.id === "forms"),
  ...directoryGroups.filter(group => group.id !== "actions" && group.id !== "forms"),
];

function DirectoryHeading({ title, description, parent }: {
  title: string;
  description?: string;
  parent?: { label: string; href: string };
}) {
  return <Stack gap="3" className="discovery-heading">
    {parent && <Breadcrumb label="Page breadcrumb" items={[parent, { label: title }]} />}
    <Heading level={1} size="large" className="discovery-title">{title}</Heading>
    {description && <Text as="p" size="lead" tone="subtle">{description}</Text>}
  </Stack>;
}

function ComponentLinks({ pages, compact = false, query = "" }: {
  pages: readonly ComponentSummary[];
  compact?: boolean;
  query?: string;
}) {
  return <Grid gap={compact ? "1" : "2"} minItemWidth={compact ? "10rem" : "15rem"}>
    {pages.map(page => <Link key={page.slug} href={`/components/${page.slug}`} className="discovery-result"
      data-compact={compact || undefined}>
      {compact ? <Text size="compact">{page.name}</Text> : <>
        <Stack gap="1">
          <Text size="compact" className="discovery-result-name"><HighlightText query={query}>{page.name}</HighlightText></Text>
          <Text size="helper" tone="subtle"><HighlightText query={query}>{page.description}</HighlightText></Text>
        </Stack>
        <IconSlot size="sm"><ArrowUpRight /></IconSlot>
      </>}
    </Link>)}
  </Grid>;
}

export function ComponentDirectory({ family }: { family?: string }) {
  const [query, setQuery] = useState("");
  const [activeFamily, setActiveFamily] = useState<string | undefined>(catalogGroups[0]?.id);
  const results = useRef<HTMLDivElement>(null);
  const group = directoryGroups.find(entry => entry.id === family);
  const pages = group?.components ?? directoryComponents;
  const searching = Boolean(query.trim());
  const matches = searching ? searchDirectoryComponents(pages, query) : pages;
  useEffect(() => {
    const list = results.current;
    if (query && list && list.getBoundingClientRect().top < 0) list.scrollIntoView({ block: "start" });
  }, [query]);

  useEffect(() => {
    const list = results.current;
    const viewport = list?.closest(".site-page-scroll");
    if (!list || !viewport || searching) return;
    const headings = Array.from(list.querySelectorAll("h2[id]")).reverse();
    let frame = 0;
    const update = () => {
      const bounds = viewport.getBoundingClientRect();
      const atEnd = viewport.scrollTop > 0 && viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= 1;
      const target = atEnd ? headings.find(heading => {
        const top = heading.getBoundingClientRect().top;
        return location.hash === `#${heading.id}` && top >= bounds.top && top < bounds.bottom;
      }) : undefined;
      const current = atEnd ? target ?? headings[0] :
        headings.find(heading => heading.getBoundingClientRect().top <= bounds.top + 64) ?? headings.at(-1);
      setActiveFamily(current?.id);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    schedule();
    viewport.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
    };
  }, [searching]);

  const filter = <Inline gap="3" align="center" className="discovery-filter">
    <SearchInput className="catalog-search" aria-label="Search components" placeholder={group ? `Search ${group.label.toLowerCase()}…` : "Find a component…"}
      value={query} onChange={event => setQuery(event.currentTarget.value)}
      onKeyDown={event => { if (event.key === "Escape") setQuery(""); }} />
    <Text role="status" size="compact" tone="subtle">
      {searching && !matches.length ? "No components found." : `${matches.length} ${matches.length === 1 ? "component" : "components"}`}
    </Text>
  </Inline>;
  return <main id="main-content" tabIndex={-1} className="discovery-page library-directory">
    <DirectoryHeading title={group?.label ?? "Components"}
      description={group?.description}
      parent={group ? { label: "Components", href: "/components" } : undefined} />
    <Stack gap="6">
      {group ? <>{filter}<ComponentLinks pages={matches} query={query.trim()} /></> : <div className="component-directory-layout">
        <div className="component-directory-controls">
          {filter}
          {!searching && <nav className="component-directory-families" aria-label="Component categories">
            {catalogGroups.map(item => <Link key={item.id} href={`#${item.id}`} variant="ghost" size="sm"
              aria-current={activeFamily === item.id ? "location" : undefined}>{item.label}</Link>)}
          </nav>}
        </div>
        <div ref={results} className="component-directory-sections">
          {searching ? <ComponentLinks pages={matches} query={query.trim()} /> : catalogGroups.map(item => <section key={item.id} aria-labelledby={item.id}>
            <Heading level={2} id={item.id} size="section" tabIndex={-1}>{item.label}</Heading>
            <ComponentLinks pages={item.components} compact />
          </section>)}
        </div>
      </div>}
      <Inline gap="4">
        <Link href="/recipes">See components in recipes <IconSlot size="sm"><ArrowRight /></IconSlot></Link>
        {(!group || group.id === "charts") && <Link href="/docs/charts">Chart guide</Link>}
        <Link href="/components.md">Page Markdown</Link>
      </Inline>
    </Stack>
  </main>;
}

function RecipeCards({ items }: { items: readonly Recipe[] }) {
  return <Grid gap="6" minItemWidth="25rem">
    {items.map(recipe => <Link key={recipe.slug} href={recipe.path} className="recipe-result">
      <Stack gap="1">
        <Heading level={2} size="group">{recipe.label}</Heading>
        <Text size="compact" tone="subtle">{recipe.description}</Text>
      </Stack>
      <IconSlot size="sm"><ArrowUpRight /></IconSlot>
    </Link>)}
  </Grid>;
}

export function RecipesDirectory() {
  const [query, setQuery] = useState("");
  const text = query.trim().toLowerCase();
  const matchingRecipes = recipes.filter(recipe =>
    !text || [recipe.label, recipe.description, ...(recipe.keywords ?? [])].some(value => value.toLowerCase().includes(text)));
  return <main id="main-content" tabIndex={-1} className="discovery-page library-directory">
    <DirectoryHeading title="Recipes" />
    <Stack gap="6">
      <SearchInput className="catalog-search" aria-label="Filter recipes" placeholder="Find a recipe…"
        value={query} onChange={event => setQuery(event.currentTarget.value)} />
      {matchingRecipes.length ? <RecipeCards items={matchingRecipes} /> :
        <Text role="status" tone="subtle" size="compact">No matching recipes.</Text>}
    </Stack>
  </main>;
}
