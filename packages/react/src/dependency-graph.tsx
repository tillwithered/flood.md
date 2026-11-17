import { forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  Button, DataList, DataListItem, Grid, Link, ScrollArea, Stack, StatusIndicator, Surface, Text, VisuallyHidden,
  type DependencyGraphNode, type DependencyGraphProps,
} from "./index.js";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

interface GraphConnection { from: string; to: string; }
interface DependencyModel {
  nodesById: Map<string, DependencyGraphNode>;
  columns: DependencyGraphNode[][];
  connections: GraphConnection[];
}

function dependencyModel(nodes: readonly DependencyGraphNode[]): DependencyModel {
  const nodesById = new Map(nodes.map(node => [node.id, node]));
  if (nodesById.size !== nodes.length || nodes.some(node => !node.id.trim() || !node.label.trim()))
    throw new Error("Flood DependencyGraph requires uniquely named nodes");

  const rank = new Map(nodes.map(node => [node.id, 0]));
  const remaining = new Map<string, number>();
  const targets = new Map(nodes.map(node => [node.id, [] as string[]]));
  const connections: GraphConnection[] = [];
  for (const node of nodes) {
    const parents = node.dependsOn ?? [];
    if (new Set(parents).size !== parents.length || parents.some(id => !nodesById.has(id) || id === node.id))
      throw new Error("Flood DependencyGraph requires known, unique dependency IDs");
    remaining.set(node.id, parents.length);
    for (const from of parents) {
      targets.get(from)!.push(node.id);
      connections.push({ from, to: node.id });
    }
  }

  const ready = nodes.filter(node => remaining.get(node.id) === 0).map(node => node.id);
  for (let index = 0; index < ready.length; index++) {
    const id = ready[index];
    for (const child of targets.get(id)!) {
      rank.set(child, Math.max(rank.get(child)!, rank.get(id)! + 1));
      const waiting = remaining.get(child)! - 1;
      remaining.set(child, waiting);
      if (!waiting) ready.push(child);
    }
  }
  if (ready.length !== nodes.length) throw new Error("Flood DependencyGraph requires acyclic dependencies");

  const columns: DependencyGraphNode[][] = [];
  for (const node of nodes) (columns[rank.get(node.id)!] ??= []).push(node);
  return { nodesById, columns, connections };
}

interface ConnectionShape extends GraphConnection { path: string; }
interface GraphGeometry {
  model: DependencyModel;
  width: number;
  height: number;
  connections: ConnectionShape[];
}

function measureConnections(canvas: HTMLElement, nodeElements: Map<string, HTMLLIElement>, model: DependencyModel): GraphGeometry {
  const bounds = canvas.getBoundingClientRect();
  const rtl = canvas.ownerDocument.defaultView?.getComputedStyle(canvas).direction === "rtl";
  const locations = new Map(Array.from(nodeElements, ([id, element]) => [id, element.getBoundingClientRect()]));
  const coordinate = (value: number) => Math.round(value * 100) / 100;
  const connections = model.connections.flatMap(({ from, to }) => {
    const origin = locations.get(from), target = locations.get(to);
    if (!origin || !target) return [];
    const startX = coordinate((rtl ? origin.left : origin.right) - bounds.left);
    const endX = coordinate((rtl ? target.right : target.left) - bounds.left);
    const startY = coordinate(origin.top + origin.height / 2 - bounds.top);
    const endY = coordinate(target.top + target.height / 2 - bounds.top);
    const centerX = coordinate((startX + endX) / 2);
    return [{ from, to, path: `M ${startX} ${startY} C ${centerX} ${startY}, ${centerX} ${endY}, ${endX} ${endY}` }];
  });
  return { model, width: coordinate(bounds.width), height: coordinate(bounds.height), connections };
}

export const WorkflowDependencies = /* @__PURE__ */ forwardRef<HTMLDivElement, DependencyGraphProps>(function WorkflowDependencies({
  label, nodes, presentation = "graph", activeId, onNodeActivate, maxViewportHeight, emptyLabel = "No dependencies to show.",
  formatDependencies = dependencies => `Depends on ${dependencies.join(", ")}`, className, ...props
}, forwardedRef) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const nodeElements = useRef(new Map<string, HTMLLIElement>());
  const focusedNode = useRef<string | undefined>(undefined);
  const [geometry, setGeometry] = useState<GraphGeometry>();
  const id = useId();
  const model = useMemo(() => dependencyModel(nodes), [nodes]);
  useImperativeHandle(forwardedRef, () => root.current!, []);

  if (!label.trim() || !emptyLabel.trim()) throw new Error("Flood DependencyGraph requires readable labels");

  useBrowserLayoutEffect(() => {
    const graph = canvas.current;
    const view = graph?.ownerDocument.defaultView;
    if (presentation !== "graph" || !graph || !view) return;
    let frame = 0;
    const measure = () => {
      const next = measureConnections(graph, nodeElements.current, model);
      setGeometry(previous => previous?.model === model && previous.width === next.width && previous.height === next.height &&
        previous.connections.length === next.connections.length && previous.connections.every((edge, index) => edge.path === next.connections[index].path)
        ? previous : next);
    };
    const schedule = () => {
      if (frame) view.cancelAnimationFrame(frame);
      frame = view.requestAnimationFrame(measure);
    };
    const resize = view.ResizeObserver && new view.ResizeObserver(schedule);
    resize?.observe(graph);
    for (const node of nodeElements.current.values()) resize?.observe(node);
    const direction = new view.MutationObserver(schedule);
    for (let ancestor: HTMLElement | null = graph; ancestor; ancestor = ancestor.parentElement)
      direction.observe(ancestor, { attributes: true, attributeFilter: ["dir"] });
    measure();
    return () => { resize?.disconnect(); direction.disconnect(); if (frame) view.cancelAnimationFrame(frame); };
  }, [model, presentation, props.dir]);

  useBrowserLayoutEffect(() => {
    const node = root.current;
    const active = node?.ownerDocument.activeElement;
    if (!node || !focusedNode.current || (active !== node.ownerDocument.body && !node.contains(active ?? null))) return;
    nodeElements.current.get(focusedNode.current)?.querySelector<HTMLElement>("[data-node-action]")?.focus();
  }, [presentation]);

  function rememberNode(nodeId: string, element: HTMLLIElement | null) {
    if (element) nodeElements.current.set(nodeId, element);
    else nodeElements.current.delete(nodeId);
  }

  function renderNode(node: DependencyGraphNode, rowId: string) {
    const parentLabels = (node.dependsOn ?? []).map(id => model.nodesById.get(id)!.label);
    const dependencies = parentLabels.length ? formatDependencies(parentLabels) : undefined;
    const descriptionId = dependencies ? `${id}-node-${rowId}-dependencies` : undefined;
    if (parentLabels.length && !dependencies?.trim()) throw new Error("Flood DependencyGraph requires names for the displayed dependencies");
    const active = node.id === activeId;
    const title = node.href
      ? <Link href={node.href} aria-current={active || undefined} aria-describedby={descriptionId} data-node-action>{node.label}</Link>
      : onNodeActivate
        ? <Button size="sm" variant="ghost" aria-current={active || undefined} aria-describedby={descriptionId} data-node-action
            className="flood-dependency-graph__action" onClick={() => onNodeActivate(node.id)}>{node.label}</Button>
        : <Text size="label">{node.label}</Text>;
    const status = node.status && <StatusIndicator label={node.status.label} tone={node.status.tone} size="sm" />;
    const attach = (element: HTMLLIElement | null) => rememberNode(node.id, element);

    if (presentation === "list") return <DataListItem key={node.id} ref={attach} data-node-id={node.id} layout="content"
      title={title} metadata={status}
      details={(node.description || dependencies) && <Stack gap="1">
        {node.description && <Text size="helper" tone="subtle">{node.description}</Text>}
        {dependencies && <Text size="helper" tone="subtle" id={descriptionId}>{dependencies}</Text>}
      </Stack>}
      className="flood-dependency-graph__record" data-active={active || undefined} />;
    return <li key={node.id} ref={attach} data-node-id={node.id} className="flood-dependency-graph__record" data-active={active || undefined}>
      <Surface padding="3" className="flood-dependency-graph__node">
        <Stack gap="1">
          {title}
          {node.description && <Text size="helper" tone="subtle">{node.description}</Text>}
          {status}
          {dependencies && <VisuallyHidden id={descriptionId}>{dependencies}</VisuallyHidden>}
        </Stack>
      </Surface>
    </li>;
  }

  const renderedGeometry = geometry?.model === model && geometry.width > 0 && geometry.height > 0 ? geometry : undefined;
  const content = !nodes.length ? <Text as="p" tone="subtle" size="compact">{emptyLabel}</Text>
    : presentation === "list" ? <DataList aria-label={label} density="compact" dividers={false}>
      {model.columns.flatMap((column, depth) => column.map((node, index) => renderNode(node, `${depth}-${index}`)))}
    </DataList>
    : <ScrollArea aria-label={label} orientation={maxViewportHeight === undefined ? "horizontal" : "both"}
      style={maxViewportHeight === undefined ? undefined : { maxBlockSize: maxViewportHeight }}>
      <div ref={canvas} className="flood-dependency-graph__canvas">
        {renderedGeometry && <svg className="flood-dependency-graph__connections" aria-hidden="true"
          viewBox={`0 0 ${renderedGeometry.width} ${renderedGeometry.height}`} preserveAspectRatio="none" focusable="false">
          {renderedGeometry.connections.map(({ from, to, path }) => <path key={JSON.stringify([from, to])} d={path}
            data-from={from} data-to={to} data-active={(from === activeId || to === activeId) || undefined} />)}
        </svg>}
        <Grid gap="8" className="flood-dependency-graph__columns" style={{ "--flood-dependency-columns": model.columns.length } as CSSProperties}>
          {model.columns.map((column, depth) => <DataList key={depth} density="compact" dividers={false} className="flood-dependency-graph__column">
            {column.map((node, index) => renderNode(node, `${depth}-${index}`))}
          </DataList>)}
        </Grid>
      </div>
    </ScrollArea>;

  return <div {...props} ref={root} className={["flood-dependency-graph", className].filter(Boolean).join(" ")} data-presentation={presentation}
    onFocus={event => {
      props.onFocus?.(event);
      focusedNode.current = event.target.closest<HTMLElement>("[data-node-id]")?.dataset.nodeId;
    }}
    onBlur={event => {
      props.onBlur?.(event);
      if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) focusedNode.current = undefined;
    }}>
    {content}
  </div>;
});
