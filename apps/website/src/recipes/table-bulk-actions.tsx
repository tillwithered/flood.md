"use client";
import {useRef, useState} from 'react';
import {AlertDialog, AppShell, BulkActionBar, Button, CollectionToolbar, Container, DataTable, Field, FloodRoot, Heading, Section, Select, Stack, Surface, ToastRegion, type ToastItem} from '@flood-md/react';

const initialProjects = [
  {id:'system',name:'Design system'}, {id:'website',name:'Website'},
  {id:'docs',name:'Documentation'}, {id:'research',name:'Research'},
  {id:'preview',name:'Component preview'}, {id:'locked',name:'Protected project'},
];

export function TableBulkActionsScreen() {
  return <FloodRoot>
    <AppShell id="project-review" scroll="content" scrollOrientation="vertical"
      scrollContentInset="none" scrollLabel="Workspace content">
      <Container size="lg" gutter="4">
        <Stack gap="4" style={{paddingBlockStart:'var(--flood-sys-space-4)',paddingBlockEnd:'var(--flood-sys-space-12)'}}>
          <Heading level={1} size="page">Project review</Heading>
          <TableBulkActions />
        </Stack>
      </Container>
    </AppShell>
  </FloodRoot>;
}

export function TableBulkActions({ compact = false }: { compact?: boolean }) {
  const [projects,setProjects] = useState(initialProjects);
  const [search,setSearch] = useState('');
  const [scope,setScope] = useState('all');
  const [selected,setSelected] = useState<string[]>([]);
  const [proposal,setProposal] = useState<string[] | null>(null);
  const [feedback,setFeedback] = useState<ToastItem[]>([]);
  const [page,setPage] = useState(1);
  const toolbar = useRef<HTMLFieldSetElement>(null);
  const eligible = new Set(projects.filter(project=>project.id!=='locked').map(project=>project.id));
  const selection = selected.filter(id=>eligible.has(id));
  const visible = projects.filter(project =>
    project.name.toLowerCase().includes(search.trim().toLowerCase()) &&
    (scope === 'all' || scope === (project.id === 'locked' ? 'protected' : 'standard'))
  );

  function changeQuery(nextSearch: string, nextScope: string) {
    setSearch(nextSearch);
    setScope(nextScope);
    setSelected([]);
    setPage(1);
  }

  function getSearchInput() {
    return toolbar.current?.querySelector<HTMLInputElement>('input[type="search"]') ?? null;
  }

  function archive() {
    const ids = new Set((proposal ?? []).filter(id=>eligible.has(id)));
    setProjects(projects.filter(project=>!ids.has(project.id)));
    setSelected([]);
    setPage(1);
    setFeedback([{id:'archive',title:`${ids.size} ${ids.size===1?'project archived':'projects archived'}.`,status:'success'}]);
  }

  return <Surface padding={compact ? "3" : "4"}>
    <Section title="Projects">
      <Stack gap="4">
        <DataTable caption="Project list" hideCaption selectable pageSize={3} page={page} onPageChange={setPage} minWidth={compact ? "18rem" : "28rem"}
          toolbar={<CollectionToolbar ref={toolbar} label="Project filters" searchLabel="Search projects" searchValue={search} controlSize="sm" align="split"
            onSearchValueChange={value=>changeQuery(value,scope)}
            quickFilters={<Field label="Scope" hideLabel>{field=><Select {...field} controlSize="sm" value={scope}
              onChange={event=>changeQuery(search,event.target.value)}>
              <option value="all">All scopes</option>
              <option value="standard">Standard</option>
              <option value="protected">Protected</option>
            </Select>}</Field>}
            canClear={Boolean(search || scope!=='all')} onClear={()=>changeQuery('','all')}
            actions={<Button size="sm" variant="subtle" onClick={()=>{
              setProjects(initialProjects);
              changeQuery('','all');
              setFeedback([]);
            }}>Reset collection</Button>} />}
          columns={[{id:'name',label:'Project',sortable:true},{id:'scope',label:'Scope'}]}
          rows={visible.map(project=>({id:project.id,label:project.name,selectionDisabled:project.id==='locked',cells:{name:project.name,scope:project.id==='locked'?'Protected':'Standard'}}))}
          selectedIds={selection} onSelectionChange={setSelected} showSelection={false} />
        {selection.length>0 && <div style={{
          position:'fixed', insetInline:0, insetBlockEnd:'var(--flood-sys-space-4)', marginInline:'auto',
          inlineSize:'max-content', maxInlineSize:'calc(100% - 2 * var(--flood-sys-space-4))',
          zIndex:'var(--flood-sys-layer-sticky)',
        }}>
          <BulkActionBar label="Bulk project actions" selectionCount={selection.length}
            items={[{id:'archive',label:'Archive projects'}]} onAction={()=>setProposal([...selection])}
            onClear={()=>{getSearchInput()?.focus({preventScroll:true});setSelected([]);}} />
        </div>}
        <AlertDialog open={proposal!==null} onOpenChange={open=>{if(!open)setProposal(null);}}
          trigger={()=>null} title="Archive selected projects?"
          description={`${proposal?.length??0} selected projects will leave this list.`}
          confirmLabel="Archive selected" cancelLabel="Keep projects"
          getFallbackFocus={getSearchInput} confirmDisabled={!proposal?.length} onConfirm={archive} />
        <ToastRegion label="Project updates" items={feedback} onDismiss={()=>setFeedback([])} />
      </Stack>
    </Section>
  </Surface>;
}
