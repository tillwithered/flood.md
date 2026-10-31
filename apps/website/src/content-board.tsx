import { useState } from "react";
import { Container, Grid, AspectRatio, Image, List, EmptyState, Card, Switch, Alert, Avatar, Badge, Button, DescriptionList, FloodRoot, Heading, IconButton, Inline, Link, Menu, Meter, Progress, Skeleton, Spinner, Stack, Surface, Table, Text, Toolbar, Kbd, Toggle, Divider, type MenuItem } from "@flood-md/react";
import { Archive, Copy, Ellipsis, Pencil, Trash2, Bold, Italic, Undo2 } from "lucide-react";
import { SiteHeader } from "./site-header";
import release from "./release.json";
import "./content-board.css";
import { WorkspaceReview } from "./recipes/workspace-review";
import { TableBulkActions } from './recipes/table-bulk-actions';
import { RecordWorkspace } from './recipes/record-workspace';

const projectActions: readonly MenuItem[] = [{id:"rename",label:"Rename…",icon:<Pencil />},{id:"duplicate",label:"Duplicate",icon:<Copy />},{id:"archive",label:"Archive",icon:<Archive />,disabled:true},{id:"divider",type:"separator"},{id:"delete",label:"Delete project",icon:<Trash2 />,tone:"danger"}];

export default function ContentBoard() {
  const [cardStatus, setCardStatus] = useState("");
  const [image, setImage] = useState(true);
  const [animate, setAnimate] = useState(true);
  const [progress, setProgress] = useState(60);
  const [unknown, setUnknown] = useState(false);
  const [storage, setStorage] = useState(75);
  const [menuStatus, setMenuStatus] = useState("");
  return <FloodRoot className="site-root"><div className="site-shell">
    <SiteHeader path="/playground/content" />
    <main id="main-content" className="content-board">
      <Stack gap="2"><Text size="helper" tone="subtle">Component preview · {release.version}</Text>
        <Heading level={1} size="page">Small pieces, more possibilities.</Heading>
        <Text as="p" size="compact" tone="subtle">Original components for status, loading, identity and feedback.</Text>
      </Stack>
      <div className="content-board-grid">
        <Surface padding="6"><Stack gap="6">
          <Inline align="center" gap="4"><Heading level={2} size="section">Badge</Heading><Link href="/components/badge">Explore</Link></Inline>
          <Stack gap="3"><Inline gap="2"><Badge>Draft</Badge><Badge tone="accent">Beta</Badge><Badge tone="success">Active</Badge><Badge tone="warning">Pending</Badge><Badge tone="error">Failed</Badge><Badge tone="info">Updated</Badge></Inline>
            <Inline gap="2"><Badge variant="outline">Draft</Badge><Badge tone="accent" variant="outline">Beta</Badge><Badge tone="success" variant="outline">Active</Badge><Badge tone="warning" variant="outline">Pending</Badge><Badge tone="error" variant="outline">Failed</Badge></Inline>
            <Inline gap="3"><Badge size="sm">Small</Badge><Badge size="md">Medium</Badge><Badge size="lg">Large</Badge></Inline></Stack>
          <Text as="p" size="helper" tone="subtle">Quiet labels. Color supports the words.</Text>
        </Stack></Surface>
        <Surface padding="6"><Stack gap="6">
          <Inline gap="4"><Heading level={2} size="section">Spinner</Heading><Link href="/components/spinner">Explore</Link></Inline>
          <Inline gap="6"><Spinner size="sm" label="Loading small preview" /><Spinner label="Loading medium preview" /><Spinner size="lg" label="Loading large preview" /></Inline>
          <Inline gap="3"><Button loading>Saving</Button><Button variant="subtle" loading>Syncing</Button></Inline>
          <Text as="p" size="helper" tone="subtle">The same indicator inside and outside buttons.</Text>
        </Stack></Surface>
        <Surface padding="6"><Stack gap="6">
          <Inline gap="4"><Heading level={2} size="section">Skeleton</Heading><Link href="/components/skeleton">Explore</Link></Inline>
          <div className="content-board-skeleton"><Skeleton shape="circle" animate={animate} />
            <Stack gap="2"><Skeleton width="65%" animate={animate} /><Skeleton animate={animate} /><Skeleton width="80%" animate={animate} /></Stack>
          </div>
          <Skeleton shape="rounded" height="5rem" animate={animate} />
          <Button variant="subtle" size="sm" aria-pressed={animate} onClick={() => setAnimate(value => !value)}>Animation {animate ? "on" : "off"}</Button>
        </Stack></Surface>
        <Surface padding="6"><Stack gap="6">
          <Inline gap="4"><Heading level={2} size="section">Avatar</Heading><Link href="/components/avatar">Explore</Link></Inline>
          <Inline gap="3"><Avatar name="Alex Morgan" src={image ? "/avatar-demo.svg" : undefined} size="sm" /><Avatar name="Alex Morgan" src={image ? "/avatar-demo.svg" : undefined} /><Avatar name="Alex Morgan" src={image ? "/avatar-demo.svg" : undefined} size="lg" /><Avatar name="Sam Lee" /><Avatar name="Flood" shape="rounded" fallback="F" /></Inline>
          <Inline gap="3"><Avatar name="Alex Morgan" src={image ? "/avatar-demo.svg" : undefined} decorative /><Stack gap="1"><Text size="compact">Alex Morgan</Text><Text size="helper" tone="subtle">Design engineer</Text></Stack><Badge tone="success" size="sm">Online</Badge></Inline>
          <Button variant="subtle" size="sm" onClick={() => setImage(value => !value)}>{image ? "Show initials" : "Show image"}</Button>
        </Stack></Surface>
      </div>
      <section id="foundations" className="content-board-feedback" aria-labelledby="foundation-pieces-title">
        <Stack gap="2"><Heading id="foundation-pieces-title" level={2} size="page">A foundation to build on.</Heading><Text as="p" size="compact" tone="subtle">Layout, media, content and an empty beginning, composed from the same pieces.</Text></Stack>
        <Container size="lg" gutter="0"><Grid minItemWidth="20rem" gap="4">
          <Card title="Media and content" headingLevel={3} description="Geometry stays in place while content loads.">
            <Stack gap="4"><AspectRatio ratio={2}><Image src="/flood-mark.png" alt="Flood logo" fit="contain" width={1280} height={1280} /></AspectRatio>
              <List><li>Container and Grid handle layout.</li><li>AspectRatio reserves media space.</li><li>Image and List keep native semantics.</li></List></Stack>
          </Card>
          <Card><EmptyState title="No projects yet" headingLevel={3} description="A clear next step, without extra noise." icon={<Pencil />} actions={<Button size="sm" onClick={()=>setCardStatus("Creation requested locally.")}>Create project</Button>} /></Card>
        </Grid></Container>
      </section>
      <section id="cards" className="content-board-feedback" aria-labelledby="cards-title">
        <Stack gap="2"><Heading id="cards-title" level={2} size="page">A place for the whole picture.</Heading><Text as="p" size="compact" tone="subtle">Structured content, quiet surfaces, independent actions.</Text><Link href="/components/card">Explore Card</Link></Stack>
        <div className="content-board-grid">
          <Card title="Flood workspace" headingLevel={3} description="Everything your team is building." actions={<Badge tone="success">Active</Badge>}
            footer={<Inline gap="3"><Button variant="subtle" size="sm" onClick={()=>setCardStatus("Workspace opened locally.")}>Open workspace</Button><Button variant="ghost" size="sm" onClick={()=>setCardStatus("Invitation requested locally.")}>Invite people</Button></Inline>}>
            <DescriptionList items={[{id:"members",term:"Members",description:"12 people"},{id:"projects",term:"Projects",description:"3 active"},{id:"updated",term:"Updated",description:"Just now"}]} />
          </Card>
          <Card title="Notifications" headingLevel={3} description="Choose what reaches you." actions={<Menu label="Notification options" trigger={props=><IconButton {...props} label="Notification options" size="sm"><Ellipsis /></IconButton>} items={[{id:"reset",label:"Reset preferences"}]} onAction={()=>setCardStatus("Reset requested locally.")} />}
            footer={<Inline gap="3"><Button variant="subtle" size="sm" onClick={()=>setCardStatus("Preferences saved locally.")}>Save preferences</Button><Text size="helper" tone="subtle">Only affects this preview</Text></Inline>}>
            <Stack gap="2"><Switch label="Product updates" defaultChecked /><Switch label="Weekly summary" defaultChecked /><Switch label="Community news" /></Stack>
          </Card>
        </div>
        <Text role="status" size="helper" tone="subtle" style={{minHeight:"1.25rem"}}>{cardStatus}</Text>
      </section>
      <section id="toolbar" className="content-board-feedback" aria-labelledby="toolbar-title">
        <Stack gap="2"><Heading id="toolbar-title" level={2} size="page">Actions, together.</Heading><Text as="p" size="compact" tone="subtle">One panel. One Tab entry. Arrow keys move between actions.</Text></Stack>
        <Surface padding="6"><Stack gap="6">
          <Inline gap="4"><Link href="/components/toolbar">Toolbar</Link><Link href="/components/kbd">Kbd</Link></Inline>
          <Toolbar label="Document actions">
            <IconButton label="Undo" variant="ghost" size="sm" onClick={() => setMenuStatus("Last edit undone locally.")}><Undo2 /></IconButton>
            <Divider aria-orientation="vertical" />
            <Toggle aria-label="Bold" iconOnly variant="ghost" size="sm"><Bold /></Toggle>
            <Toggle aria-label="Italic" iconOnly variant="ghost" size="sm"><Italic /></Toggle>
            <Divider aria-orientation="vertical" />
            <Menu label="Document options" trigger={props => <IconButton {...props} label="Document options" variant="ghost" size="sm"><Ellipsis /></IconButton>} items={[{id:"duplicate",label:"Duplicate"},{id:"export",label:"Export…"}]} onAction={id => setMenuStatus(`${id} requested locally.`)} />
            <Button variant="subtle" size="sm" onClick={() => setMenuStatus("Share requested locally.")}>Share</Button>
          </Toolbar>
          <Inline gap="2"><Text size="helper" tone="subtle">Keyboard hint</Text><Kbd>Ctrl</Kbd><Text size="helper" tone="subtle">+</Text><Kbd>K</Kbd><Text size="helper" tone="subtle">Display only in this demo</Text></Inline>
        </Stack></Surface>
      </section>
      <section id="feedback" className="content-board-feedback" aria-labelledby="feedback-title">
        <Stack gap="2"><Heading id="feedback-title" level={2} size="page">Feedback, at the right volume.</Heading>
          <Text as="p" size="compact" tone="subtle">Progress, bounded values and messages with a clear purpose.</Text></Stack>
        <div className="content-board-grid">
          <Surface padding="6"><Stack gap="6">
            <Inline gap="4"><Heading level={3} size="section">Progress</Heading><Link href="/components/progress">Explore</Link></Inline>
            <Progress label="Uploading files" value={unknown ? undefined : progress} valueText={unknown ? "Estimating…" : `${progress}%`} />
            <Progress label="Preparing workspace" value={35} tone="neutral" size="sm" />
            <Inline gap="2"><Button variant="subtle" size="sm" onClick={() => setProgress(value => value >= 100 ? 0 : Math.min(100, value + 20))}>Advance</Button><Button variant="subtle" size="sm" aria-pressed={unknown} onClick={() => setUnknown(value => !value)}>Indeterminate</Button></Inline>
          </Stack></Surface>
          <Surface padding="6"><Stack gap="6">
            <Inline gap="4"><Heading level={3} size="section">Meter</Heading><Link href="/components/meter">Explore</Link></Inline>
            <Meter label="Storage used" value={storage} valueText={`${storage} of 100 GB`} tone={storage >= 90 ? "warning" : "neutral"} />
            <Meter label="Battery" value={82} valueText="82% remaining" tone="success" size="sm" />
            <Button variant="subtle" size="sm" onClick={() => setStorage(value => value >= 100 ? 25 : Math.min(100, value + 25))}>Use more storage</Button>
          </Stack></Surface>
        </div>
        <Surface padding="6"><Stack gap="4">
          <Inline gap="4"><Heading level={3} size="section">Alert</Heading><Link href="/components/alert">Explore</Link></Inline>
          <div className="content-board-grid">
            <Alert title="A new version is available">Review the changes when you are ready.</Alert>
            <Alert tone="success" title="Changes saved">Your workspace is up to date.</Alert>
            <Alert tone="warning" title="Storage is almost full">Free some space before your next upload.</Alert>
            <Alert tone="error" title="Changes could not be saved">Check your connection and try again.</Alert>
            <Alert tone="neutral" icon={null}>A quiet note without a heading or icon.</Alert>
          </div>
        </Stack></Surface>
      </section>
      <section id="data" className="content-board-feedback" aria-labelledby="data-title">
        <Stack gap="2"><Heading id="data-title" level={2} size="page">Details, in their place.</Heading><Text as="p" size="compact" tone="subtle">Related properties and native tables, with room for real content.</Text></Stack>
        <div className="content-board-grid">
          <Surface padding="6"><Stack gap="6">
            <Inline gap="4"><Heading level={3} size="section">DescriptionList</Heading><Link href="/components/description-list">Explore</Link></Inline>
            <DescriptionList aria-label="Project details" dividers items={[
              {id:"project",term:"Project",description:"Flood design system"},
              {id:"status",term:"Status",description:<Badge tone="success" size="sm">Active</Badge>},
              {id:"version",term:"Version",description:release.version},
              {id:"owner",term:"Owner",description:<Link href="https://github.com/tillwithered/flood.md">Design team</Link>},
              {id:"description",term:"Description",description:"An independent foundation for thoughtful interfaces."},
            ]} />
          </Stack></Surface>
          <Surface padding="6"><Stack gap="4">
            <Inline gap="4"><Heading level={3} size="section">Table</Heading><Link href="/components/table">Explore</Link></Inline>
            <Table caption="Workspace projects" style={{minWidth:"32rem"}}>
              <thead><tr><th scope="col">Project</th><th scope="col">Status</th><th scope="col" data-numeric>Members</th><th scope="col" data-numeric>Storage</th><th scope="col"><span className="flood-visually-hidden">Actions</span></th></tr></thead>
              <tbody>{[{name:"Flood",status:"Active",members:12,storage:"24 GB"},{name:"Portal",status:"Draft",members:8,storage:"16 GB"},{name:"Studio",status:"Active",members:20,storage:"10 GB"}].map(project=><tr key={project.name}><th scope="row">{project.name}</th><td><Badge tone={project.status==="Active"?"success":"neutral"} size="sm">{project.status}</Badge></td><td data-numeric>{project.members}</td><td data-numeric>{project.storage}</td><td><Menu label={`${project.name} actions`} align="end" items={projectActions} onAction={id=>setMenuStatus(`${project.name}: ${id} selected.`)} trigger={props=><IconButton {...props} size="sm" label={`Actions for ${project.name}`}><Ellipsis /></IconButton>} /></td></tr>)}</tbody>
              <tfoot><tr><th scope="row" colSpan={2}>Total</th><td data-numeric>40</td><td data-numeric>50 GB</td><td /></tr></tfoot>
            </Table>
          </Stack></Surface>
        </div>
      </section>
      <section id="menu" className="content-board-feedback" aria-labelledby="menu-title">
        <Stack gap="2"><Heading id="menu-title" level={2} size="page">Actions, within reach.</Heading><Text as="p" size="compact" tone="subtle">A compact action menu with keyboard navigation and clear priorities.</Text></Stack>
        <Surface padding="6"><Stack gap="4">
          <Inline gap="4"><Heading level={3} size="section">Menu</Heading><Link href="/components/menu">Explore</Link></Inline>
          <div className="content-board-menu-stage"><Menu label="Project actions" items={projectActions} onAction={id=>setMenuStatus(`${id} selected.`)} trigger={props=><Button {...props} variant="subtle">Project actions</Button>} /></div>
          <Text role="status" size="helper" tone="subtle" className="content-board-menu-status">{menuStatus}</Text>
        </Stack></Surface>
      </section>
      <section id="workspace-review" className="content-board-feedback"><WorkspaceReview /></section>
      <section id="table-bulk-actions" className="content-board-feedback"><TableBulkActions /></section>
      <section id="record-workspace" className="content-board-feedback"><RecordWorkspace /></section>
      <Link href="/components">Browse all components</Link>
    </main>
  </div></FloodRoot>;
}
