"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  Alert, Button, DataTable, Field, Heading, Inline, PageHeader, ResizablePanels, SegmentedControl,
  Stack, Surface, Text, Textarea, type DataTableColumn, type DataTableRow,
} from "@flood-md/react";

type Layout = "vertical" | "horizontal";
type EditorBinding = { value: string; onValueChange: (value: string) => void; run: () => void };
type QueryOutput = { columns: readonly DataTableColumn[]; rows: readonly DataTableRow[] };
type QueryExecutor = (query: string, signal: AbortSignal) => Promise<QueryOutput>;
type QueryState = { output?: QueryOutput; pending?: boolean; error?: string };

export function CodeEditorWorkspace({
  initialQuery, renderEditor, execute,
}: {
  initialQuery: string;
  renderEditor: (binding: EditorBinding) => ReactNode;
  execute: QueryExecutor;
}) {
  const layoutId = useId();
  const active = useRef<AbortController | null>(null);
  const [value, setValue] = useState(initialQuery);
  const [layout, setLayout] = useState<Layout>("vertical");
  const [ratio, setRatio] = useState<Record<Layout, number>>({vertical:43,horizontal:49});
  const [state, setState] = useState<QueryState>({});
  useEffect(() => () => active.current?.abort(), []);

  async function run() {
    const draft = value.trim();
    if (!draft || active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setState(previous => ({output:previous.output,pending:true}));
    try {
      const output = await execute(draft,controller.signal);
      if (!controller.signal.aborted && active.current === controller) setState({output});
    } catch (error) {
      if (!controller.signal.aborted && active.current === controller) setState(previous=>({
        output:previous.output,error:error instanceof Error ? error.message : "Try running the query again.",
      }));
    } finally {
      if (active.current === controller) active.current = null;
    }
  }

  function cancel() {
    active.current?.abort();
    active.current = null;
    setState(previous=>({output:previous.output}));
  }

  return <Stack gap="4">
    <PageHeader title="Query workspace" />
    <Inline gap="2" align="center" style={{justifyContent:"space-between"}}>
      <SegmentedControl label="Panel layout" hideLabel name={layoutId} controlSize="sm" value={layout}
        options={[{value:"vertical",label:"Stacked"},{value:"horizontal",label:"Side by side"}]}
        onValueChange={next=>{if (next==="vertical" || next==="horizontal") setLayout(next);}} />
      <Inline gap="2" align="center">
        {state.pending && <Button size="sm" variant="ghost" onClick={cancel}>Cancel query</Button>}
        <Button size="sm" loading={state.pending ? "retain-focus" : false} disabled={!value.trim()} onClick={run}>Run query</Button>
      </Inline>
    </Inline>
    <ResizablePanels label="Resize editor and results" orientation={layout} min={30} max={70} value={ratio[layout]}
      onValueChange={percent=>setRatio(previous=>({...previous,[layout]:percent}))}
      style={layout==="vertical" ? {minBlockSize:"30rem"} : undefined}
      main={<Surface padding="4" style={{height:"100%"}}>
        {renderEditor({value,onValueChange:setValue,run})}
      </Surface>}
      secondary={<Surface padding="4" style={{height:"100%"}}>
        <Stack gap="3" aria-busy={state.pending || undefined}>
          <Heading level={2} size="group">Results</Heading>
          {state.error && <Alert appearance="inline" tone="error" announcement="assertive" title="Query failed">{state.error}</Alert>}
          {state.output ? <DataTable caption="Query results" hideCaption columns={state.output.columns} rows={state.output.rows}
            refreshing={state.pending} density="compact" minWidth="22rem" showResults={false}
            emptyContent={<Text tone="subtle">No matching rows.</Text>} /> : !state.error &&
            <Text size="helper" tone="subtle" role="status">{state.pending ? "Running query…" : "Run a query to see its results."}</Text>}
        </Stack>
      </Surface>}
    />
  </Stack>;
}

const initialQuery = "SELECT ticket, owner, count\nFROM review_queue\nLIMIT 3;";
const columns: readonly DataTableColumn[] = [
  {id:"ticket",label:"Ticket"},{id:"owner",label:"Owner"},{id:"count",label:"Open items",align:"end"},
];
const rows: readonly DataTableRow[] = [
  {id:"REQ-1042",cells:{ticket:"REQ-1042",owner:"Maya Chen",count:12}},
  {id:"REQ-1043",cells:{ticket:"REQ-1043",owner:"Sam Rivera",count:7}},
  {id:"REQ-1044",cells:{ticket:"REQ-1044",owner:"Alex Morgan",count:4}},
];

async function executeExample(query: string, signal: AbortSignal): Promise<QueryOutput> {
  await new Promise<void>((resolve,reject)=>{
    const onAbort = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(()=>{signal.removeEventListener("abort",onAbort); resolve();},250);
    signal.addEventListener("abort",onAbort,{once:true});
  });
  signal.throwIfAborted();
  const match = /^SELECT\s+ticket\s*,\s*owner\s*,\s*count\s+FROM\s+review_queue(?:\s+LIMIT\s+(\d+))?\s*;?$/iu.exec(query);
  if (!match) throw new Error("Query the review_queue table with ticket, owner and count.");
  return {columns,rows:match[1] === undefined ? rows : rows.slice(0,Number(match[1]))};
}

export function CodeEditorExample() {
  return <CodeEditorWorkspace initialQuery={initialQuery} execute={executeExample} renderEditor={editor=>
    <Field label="SQL query">{field=><Textarea {...field} rows={5} value={editor.value} spellCheck={false}
      style={{fontFamily:"var(--flood-sys-font-mono)"}} onChange={event=>editor.onValueChange(event.currentTarget.value)}
      onKeyDown={event=>{
        if (event.defaultPrevented || event.nativeEvent.isComposing || event.keyCode===229 || event.repeat || event.key!=="Enter" ||
          !(event.metaKey || event.ctrlKey) || event.shiftKey || event.altKey) return;
        event.preventDefault();
        editor.run();
      }} />}</Field>} />;
}
