import { useEffect, useRef, useState } from "react";
import { Button, Collapsible, Link, NavigationList, ScrollArea, Sheet, Stack, Text } from "@flood-md/react";
import { docPages } from "../routes.mjs";
import { compactNavigation, useStudioMedia } from "./studio-media";
import "./docs-navigation.css";

const guideGroups = [
  { label: "Getting started", includes: (page: GuidePage) => ["README.md", "installation.md", "project-ui.md"].includes(page.file) },
  { label: "Design system", includes: (page: GuidePage) => ["foundations.md", "motion.md", "layout.md", "theming.md"].includes(page.file) },
  { label: "For agents", includes: (page: GuidePage) => ["agents.md", "skills.md", "interface-content.md", "agent-knowledge.md"].includes(page.file) },
] as const;

type GuidePage = (typeof docPages)[number];
type OutlineItem = { id: string; label: string };

const guideLinks = [
  ...guideGroups.flatMap(({ label, includes }) => docPages.filter(includes).map(page => ({ page, group: label }))),
  ...docPages.filter(page => page.group !== "recipes" && !guideGroups.some(({ includes }) => includes(page))).map(page => ({ page, group: "More" })),
  ...docPages.filter(page => page.group === "recipes").map(page => ({ page, group: "Recipes" })),
].map(({ page, group }) => ({ label: page.label, href: page.path, value: page.path, group }));

export function DocsNavigation({ path, visible = true }: { path: string; visible?: boolean }) {
  const nav = useRef<HTMLElement>(null);
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
    <NavigationList ref={nav} label="Documentation sections" size="sm" items={guideLinks} currentValue={path} />
    <Link href="/components" variant="ghost" size="sm" className="guide-components-link">All components</Link>
  </Stack>;
}

export function MobileDocsNavigation({ path }: { path: string }) {
  const [open, setOpen] = useState(false);
  const compact = useStudioMedia(compactNavigation);
  useEffect(() => { if (!compact) setOpen(false); }, [compact]);
  return <div className="guide-mobile-navigation">
    <Sheet title="Documentation" size="lg" open={compact && open} onOpenChange={setOpen}
      trigger={props => <Button {...props} variant="subtle" size="sm">Browse documentation</Button>}>
      <DocsNavigation path={path} visible={open} />
    </Sheet>
  </div>;
}

export function GuideOutline({ items, mobile = false }: { items: readonly OutlineItem[]; mobile?: boolean }) {
  if (!items.length) return null;

  const links = <nav aria-label="On this page" className="guide-outline-links">
    <Stack gap="2">{items.map(item => <Link key={item.id} href={`#${item.id}`}>{item.label}</Link>)}</Stack>
  </nav>;

  if (mobile) return <Collapsible className="guide-outline-mobile" title="On this page" controlSize="sm">{links}</Collapsible>;

  return <aside className="doc-toc guide-outline" aria-label="Page outline">
    <Text size="helper" tone="subtle">On this page</Text>
    <ScrollArea contentInset="scrollbar" className="guide-outline-scroll" tabIndex={-1}>{links}</ScrollArea>
  </aside>;
}
