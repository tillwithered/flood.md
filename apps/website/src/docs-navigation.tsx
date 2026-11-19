import { useEffect, useRef, useState, type RefObject } from "react";
import { Button, Collapsible, IconSlot, Link, NavigationList, ScrollArea, Sheet, Stack, TableOfContents, Text, type TableOfContentsItem } from "@flood-md/react";
import { List } from "lucide-react";
import { docPages } from "../site-guides.mjs";
import { compactNavigation, useStudioMedia } from "./studio-media";
import "./docs-navigation.css";

const guideGroups = [
  { label: "Getting started", includes: (page: GuidePage) => ["README.md", "installation.md", "project-ui.md"].includes(page.file) },
  { label: "Design system", includes: (page: GuidePage) => ["foundations.md", "motion.md", "layout.md", "charts.md", "theming.md"].includes(page.file) },
  { label: "Agent reference", includes: (page: GuidePage) => ["agents.md", "mcp.md", "skills.md", "interface-content.md", "agent-knowledge.md"].includes(page.file) },
] as const;

type GuidePage = (typeof docPages)[number];


const guideLinks = [
  ...guideGroups.flatMap(({ label, includes }) => docPages.filter(includes).map(page => ({ page, group: label }))),
  ...docPages.filter(page => page.group !== "recipes" && !guideGroups.some(({ includes }) => includes(page))).map(page => ({ page, group: "More" })),
].map(({ page, group }) => ({ label: page.label, href: page.path, value: page.path, group }));
const recipeLinks = docPages.filter(page => page.group === "recipes").map(page => ({
  label: page.label, href: page.path, value: page.path,
}));

export function DocsNavigation({ path, visible = true }: { path: string; visible?: boolean }) {
  const nav = useRef<HTMLElement>(null);
  const recipe = path.startsWith("/docs/recipes/");
  useEffect(() => {
    const viewport = nav.current?.closest<HTMLElement>(".flood-scroll-area__viewport, .flood-overlay-body");
    const current = nav.current?.querySelector('[aria-current="page"]');
    if (!visible || !viewport || !current) return;

    const align = () => {
      if (!viewport.clientHeight) return;
      const item = current.getBoundingClientRect();
      const frame = viewport.getBoundingClientRect();
      if (item.bottom > frame.bottom) viewport.scrollTop += item.bottom - frame.bottom;
      else if (item.top < frame.top) viewport.scrollTop -= frame.top - item.top;
    };
    const frame = requestAnimationFrame(align);
    const observer = new ResizeObserver(align);
    observer.observe(viewport);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [path, visible]);

  return <Stack gap="4" className="guide-navigation">
    {recipe && <Link href="/recipes" variant="ghost" size="sm" className="guide-components-link">All recipes</Link>}
    <NavigationList ref={nav} label={recipe ? "Recipe navigation" : "Documentation sections"} size="sm"
      items={recipe ? recipeLinks : guideLinks} currentValue={path} />
  </Stack>;
}

export function MobileDocsNavigation({ path }: { path: string }) {
  const [open, setOpen] = useState(false);
  const compact = useStudioMedia(compactNavigation);
  const recipe = path.startsWith("/docs/recipes/");
  useEffect(() => { if (!compact) setOpen(false); }, [compact]);
  return <div className="guide-mobile-navigation">
    <Sheet title={recipe ? "Recipes" : "Documentation"} size="lg" open={compact && open} onOpenChange={setOpen}
      trigger={props => <Button {...props} variant="ghost" size="sm"><IconSlot size="sm"><List /></IconSlot>{recipe ? "Browse recipes" : "Browse documentation"}</Button>}>
      <DocsNavigation path={path} visible={open} />
    </Sheet>
  </div>;
}

export function GuideOutline({ items, mobile = false, scrollRootRef }: {
  items: readonly TableOfContentsItem[];
  mobile?: boolean;
  scrollRootRef?: RefObject<HTMLDivElement | null>;
}) {
  if (!items.length) return null;

  const links = <TableOfContents items={items} scrollRootRef={scrollRootRef} />;

  if (mobile) return <Collapsible className="guide-outline-mobile" title="On this page" variant="flush" controlSize="sm">{links}</Collapsible>;

  return <aside className="doc-toc guide-outline" aria-label="Page outline">
    <Text size="helper" tone="subtle">On this page</Text>
    <ScrollArea contentInset="scrollbar" className="guide-outline-scroll" tabIndex={-1}>{links}</ScrollArea>
  </aside>;
}
