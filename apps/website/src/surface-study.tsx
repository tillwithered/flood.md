import { Alert, Badge, Button, Calendar, Checkbox, CopyButton, Dialog, Field, FloodRoot, Grid, Heading, Inline, InlineCode, Input, Kbd, Menu, Popover, Progress, Select, Skeleton, Stack, Surface, Switch, Table, Tag, Text, Textarea, Toggle } from '@flood-md/react';
import { SiteHeader } from './site-header';
import './surface-study.css';

/** Shared verification scene: identical controls, real material owners. */
export function SurfaceControls({ name }: { name: string }) {
  return <Stack gap="4" data-study-controls={name}>
    <Inline gap="2">
      <Button size="sm">Save</Button><Button size="sm" variant="subtle">Secondary</Button>
      <Button size="sm" variant="outline">Outline</Button><Button size="sm" variant="ghost">Ghost</Button>
      <Button size="sm" variant="subtle" disabled>Disabled</Button>
      <Button size="sm" variant="subtle" tone="danger">Delete</Button>
    </Inline>
    <Field label="Project">{props => <Input {...props} defaultValue="Design system" />}</Field>
    <Field label="Visibility">{props => <Select {...props} defaultValue="private"><option value="private">Private</option><option value="team">Team</option></Select>}</Field>
    <Grid minItemWidth="10rem" gap="3">
      <Field label="Read only">{props => <Input {...props} value="Workspace" readOnly />}</Field>
      <Field label="Unavailable">{props => <Input {...props} value="Workspace" disabled />}</Field>
    </Grid>
    <Field label="Notes">{props => <Textarea {...props} defaultValue="Review the next release." rows={2} />}</Field>
    <Inline gap="4"><Checkbox label="Updates" defaultChecked /><Checkbox label="News" /><Switch label="Available" defaultChecked /></Inline>
    <Inline gap="2"><Toggle size="sm" defaultPressed>Selected</Toggle><Toggle size="sm">Unselected</Toggle><Badge>Draft</Badge><Tag>Design</Tag><Kbd>⌘ K</Kbd><InlineCode>project.id</InlineCode></Inline>
    <Progress label="Storage" value={45} size="sm" />
    <Skeleton style={{ width: '60%', height: '1rem' }} />
    <Alert tone="info">A new version is available.</Alert>
    <Table caption={`${name} records`} hideCaption><thead><tr><th>Project</th><th>Status</th></tr></thead><tbody><tr><td>Design system</td><td>Active</td></tr></tbody><tfoot><tr><td>1 project</td><td /></tr></tfoot></Table>
    <Inline gap="2">
      <Menu label={`${name} commands`} trigger={props => <Button {...props} size="sm" variant="subtle">Actions</Button>}
        items={[{ id: 'rename', label: 'Rename' }, { id: 'archive', label: 'Archive' }]} onAction={() => {}} />
      <CopyButton value="Design system" size="sm" />
    </Inline>
  </Stack>;
}

export default function SurfaceStudy() {
  return <FloodRoot className="site-root"><div className="site-shell"><SiteHeader path="/playground/surfaces" />
    <main id="main-content" className="surface-study"><Stack gap="6">
      <Heading level={1} size="page">Surface study</Heading>
      <Grid minItemWidth="18rem" gap="6">
        <Stack gap="4" data-study="base"><Heading size="section" level={2}>Canvas</Heading><SurfaceControls name="base" /></Stack>
        <Surface elevation="default" padding="4" data-study="default"><Stack gap="4"><Heading size="section" level={2}>Surface</Heading><SurfaceControls name="default" /></Stack></Surface>
        <Surface elevation="overlay" padding="4" data-study="overlay"><Stack gap="4"><Heading size="section" level={2}>Overlay</Heading><SurfaceControls name="overlay" /></Stack></Surface>
      </Grid>
      <Inline gap="3">
        <Dialog title="Project settings" trigger={props => <Button {...props} variant="subtle">Open dialog</Button>}>
          <Stack gap="6"><SurfaceControls name="dialog" /><Surface elevation="default" padding="4" data-study="nested"><SurfaceControls name="nested" /></Surface></Stack>
        </Dialog>
        <Popover title="Project filters" trigger={props => <Button {...props} variant="subtle">Open popover</Button>}>
          <SurfaceControls name="popover" />
        </Popover>
      </Inline>
      <Surface elevation="raised" padding="4" data-study="raised"><Stack gap="4"><Heading size="section" level={2}>Raised</Heading><SurfaceControls name="raised" /><Calendar label="Schedule" defaultValue="2026-11-07" /></Stack></Surface>
    </Stack></main>
  </div></FloodRoot>;
}
