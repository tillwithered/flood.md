import { useState } from "react";
import { Alert, Avatar, Badge, Button, FloodRoot, Heading, Inline, Link, Meter, Progress, Skeleton, Spinner, Stack, Surface, Text } from "@flood-md/react";
import { SiteHeader } from "./site-header";
import release from "./release.json";
import "./content-board.css";

export default function ContentBoard() {
  const [image, setImage] = useState(true);
  const [animate, setAnimate] = useState(true);
  const [progress, setProgress] = useState(60);
  const [unknown, setUnknown] = useState(false);
  const [storage, setStorage] = useState(75);
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
      <Link href="/components">Browse all components</Link>
    </main>
  </div></FloodRoot>;
}
