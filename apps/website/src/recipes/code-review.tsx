"use client";

import { useId, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import {
  CodeDiff, CommentComposer, CommentThread, DiffStat, Heading, IconButton, Inline, PageHeader, ResizablePanels,
  ReviewRevision, ScrollArea, SegmentedControl, Stack, Surface, Text, Tree, type CodeDiffHunk, type CodeDiffLine,
  type CommentThreadItem, type TreeItem,
} from "@flood-md/react";

type DiffSide = "before" | "after";
type LineAnchor = { id: string; number: number; side: DiffSide };

const files: readonly TreeItem[] = [{
  value:"source", label:"src", selectable:false, children:[
    {value:"projects",label:"projects.ts"},{value:"projects-test",label:"projects.test.ts"},
  ],
}];
const unchanged = [
  "import { get } from './http';",
  "",
  "type Project = {",
  "  id: string;",
  "  name: string;",
  "};",
  "",
  "export async function listProjects() {",
];
const patches: Record<string,{ path: string; hunks: readonly CodeDiffHunk[] }> = {
  projects:{path:"src/projects.ts",hunks:[{id:"api",lines:[
    ...unchanged.map((text,index)=>({id:`context-${index}`,kind:"context" as const,text,oldLine:index+1,newLine:index+1})),
    {id:"old-route",kind:"removed",oldLine:9,text:"  return get<Project[]>('/projects');"},
    {id:"new-route",kind:"added",newLine:9,text:"  return get<Project[]>('/api/v2/projects');"},
    {id:"end",kind:"context",oldLine:10,newLine:10,text:"}"},
  ]}]},
  "projects-test":{path:"src/projects.test.ts",hunks:[{id:"test",lines:[
    {id:"test-start",kind:"context",oldLine:14,newLine:14,text:"it('requests projects', async () => {"},
    {id:"old-test",kind:"removed",oldLine:15,text:"  expect(get).toHaveBeenCalledWith('/projects');"},
    {id:"new-test",kind:"added",newLine:15,text:"  expect(get).toHaveBeenCalledWith('/api/v2/projects');"},
    {id:"request-count",kind:"added",newLine:16,text:"  expect(get).toHaveBeenCalledTimes(1);"},
    {id:"test-end",kind:"context",oldLine:16,newLine:17,text:"});"},
  ]}]},
};

const anchorKey = (file: string, anchor: LineAnchor) => JSON.stringify([file,anchor.id,anchor.side]);
const seed = anchorKey("projects",{id:"new-route",number:9,side:"after"});
const initialThreads: Record<string,readonly CommentThreadItem[]> = {
  [seed]:[{id:"review-comment",author:{name:"Maya Chen"},body:"Can we keep the previous endpoint available during the rollout?"}],
};

export function CodeReview() {
  const controlId = useId();
  const nextComment = useRef(0);
  const [file,setFile] = useState("projects");
  const [layout,setLayout] = useState<"unified" | "split">("unified");
  const [anchors,setAnchors] = useState<Record<string,LineAnchor>>({});
  const [threads,setThreads] = useState(initialThreads);
  const [drafts,setDrafts] = useState<Record<string,string>>({});
  const patch = patches[file], current = anchors[file];
  const currentKey = current && anchorKey(file,current);
  const patchLines = patch.hunks.flatMap(hunk => hunk.lines);
  const additions = patchLines.filter(line => line.kind === "added").length;
  const deletions = patchLines.filter(line => line.kind === "removed").length;

  function lineAction(line: CodeDiffLine, side: DiffSide) {
    if (line.kind === "context") return null;
    const number = side === "before" ? line.oldLine : line.newLine;
    if (number === undefined) return null;
    const anchor = {id:line.id,side,number}, key = anchorKey(file,anchor);
    const label = `Discuss ${side} line ${number}`;
    return <IconButton size="xs" variant={currentKey === key ? "subtle" : "ghost"} label={label} title={label}
      aria-pressed={currentKey === key} onClick={()=>setAnchors(previous=>({...previous,[file]:anchor}))}><MessageSquare /></IconButton>;
  }

  function addComment() {
    if (!currentKey) return;
    const body = drafts[currentKey]?.trim();
    if (!body) return;
    const id = `line-comment-${++nextComment.current}`;
    setThreads(previous=>({...previous,[currentKey]:[...(previous[currentKey] ?? []),{id,author:{name:"Alex Morgan"},body}]}));
    setDrafts(previous=>({...previous,[currentKey]:""}));
  }

  return <Stack gap="4">
    <PageHeader title="Review project API changes" />
    <ResizablePanels label="Resize changed files and diff" defaultValue={23} min={16} max={42}
      main={<Surface padding="3" style={{minBlockSize:"100%"}}>
        <Tree label="Changed files" controlSize="sm" items={files} defaultExpandedValues={["source"]} value={file}
          onValueChange={next=>{if (typeof next==="string" && Object.hasOwn(patches,next)) setFile(next);}} />
      </Surface>}
      secondary={<Stack gap="3">
        <Surface padding="4"><Stack gap="4">
          <ReviewRevision state="stale" reviewedRevision="7c00a18" revision="e709326" compareHref="#review-current-diff"
            labels={{compare:"View current diff"}} />
          <Stack id="review-current-diff" tabIndex={-1} gap="3">
            <Inline gap="2" align="center" style={{justifyContent:"space-between"}}>
              <Inline gap="3">
                <Heading level={2} size="group">{patch.path}</Heading>
                <DiffStat additions={additions} deletions={deletions} />
              </Inline>
              <SegmentedControl label="Diff layout" hideLabel name={controlId} controlSize="sm" value={layout}
                options={[{value:"unified",label:"Unified"},{value:"split",label:"Split"}]}
                onValueChange={next=>{if(next==="unified" || next==="split") setLayout(next);}} />
            </Inline>
            <ScrollArea orientation="horizontal" aria-label="Code changes">
              <CodeDiff key={file} label={patch.path} hunks={patch.hunks} layout={layout} contextLines={2}
                renderLineAction={lineAction} wrap />
            </ScrollArea>
          </Stack>
        </Stack></Surface>
        {current && currentKey && <Surface padding="4"><Stack gap="3">
          <Inline gap="2" align="baseline">
            <Heading level={2} size="group">Line discussion</Heading>
            <Text size="helper" tone="subtle">{current.side === "before" ? "Before" : "After"} · line {current.number}</Text>
          </Inline>
          {!!threads[currentKey]?.length && <CommentThread aria-label={`Comments on ${current.side} line ${current.number}`} items={threads[currentKey]} />}
          <CommentComposer label={`Comment on ${current.side} line ${current.number}`} value={drafts[currentKey] ?? ""}
            onValueChange={draft=>setDrafts(previous=>({...previous,[currentKey]:draft}))} onSend={addComment}
            sendPresentation="label" sendLabel="Comment" placeholder="Write a comment…" />
        </Stack></Surface>}
      </Stack>}
    />
  </Stack>;
}
