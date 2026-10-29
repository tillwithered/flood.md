"use client";
import {useState} from 'react';
import {AlertDialog, Button, DataTable, Inline, Section, Stack, StatusIndicator, Surface, Text, Toolbar} from '@flood-md/react';

const initialProjects = [
  {id:'system',name:'Design system'}, {id:'website',name:'Website'},
  {id:'docs',name:'Documentation'}, {id:'research',name:'Research'},
  {id:'preview',name:'Component preview'}, {id:'locked',name:'Protected project'},
];

/** Local host composition; no backend operation or new BulkActions export. */
export function TableBulkActions() {
  const [projects,setProjects] = useState(initialProjects);
  const [selected,setSelected] = useState<string[]>([]);
  const [pending,setPending] = useState<string[] | null>(null);
  const [message,setMessage] = useState('');
  const [page,setPage] = useState(1);
  const eligible = new Set(projects.filter(project=>project.id!=='locked').map(project=>project.id));
  const selection = selected.filter(id=>eligible.has(id));
  function archive() {
    const ids = new Set(pending ?? []);
    const count = projects.filter(project=>ids.has(project.id)&&eligible.has(project.id)).length;
    setProjects(projects.filter(project=>!ids.has(project.id)||!eligible.has(project.id)));
    setSelected([]);setPending(null);setPage(1);
    setMessage(`${count} ${count===1?'project archived':'projects archived'} in this local example.`);
  }
  return <Surface padding="4">
    <Section title="Project bulk actions" description="Selection can span this local collection's pages. Nothing is sent or persisted.">
      <Stack gap="4">
        <Inline gap="3">
          <Text size="compact">{selection.length} selected</Text>
          <Toolbar label="Bulk project actions">
            <Inline gap="2">
              <AlertDialog open={pending!==null} onOpenChange={open=>setPending(open?[...selection]:null)}
                trigger={props=><Button {...props} size="sm" variant="subtle" disabled={!selection.length}>Archive locally</Button>}
                title="Archive selected projects?" description={`Archive ${pending?.length??0} selected projects in memory only. Restore example brings them back.`}
                confirmLabel="Archive selected" cancelLabel="Keep projects" confirmDisabled={!pending?.length} onConfirm={archive} />
              <Button size="sm" variant="ghost" disabled={!selection.length} onClick={()=>setSelected([])}>Clear selection</Button>
            </Inline>
          </Toolbar>
        </Inline>
        <DataTable caption="Local projects" selectable pageSize={3} page={page} onPageChange={setPage} minWidth="28rem"
          columns={[{id:'name',label:'Project',sortable:true},{id:'scope',label:'Scope'}]}
          rows={projects.map(project=>({id:project.id,label:project.name,selectionDisabled:project.id==='locked',cells:{name:project.name,scope:project.id==='locked'?'Protected':'Local example'}}))}
          selectedIds={selection} onSelectionChange={setSelected} />
        <Inline gap="3">
          <Button size="sm" variant="subtle" onClick={()=>{setProjects(initialProjects);setSelected([]);setPending(null);setPage(1);setMessage('Example restored.');}}>Restore example</Button>
          <StatusIndicator size="sm" label={message || 'Local example'} tone={message?'success':'neutral'} announce={Boolean(message)} />
        </Inline>
      </Stack>
    </Section>
  </Surface>;
}
