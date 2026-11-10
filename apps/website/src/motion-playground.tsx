"use client";

import { useState } from "react";
import {
  Button, Checkbox, Collapsible, Container, Dialog, Drawer, FloodRoot, Grid,
  Heading, Inline, Link, Menu, Progress, SegmentedControl, Skeleton, Stack,
  Surface, Switch, Text, ToastRegion, type ToastItem,
} from "@flood-md/react";

export default function MotionPlayground() {
  const [motion, setMotion] = useState("system");
  const [progress, setProgress] = useState(25);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<ToastItem[]>([]);

  return <FloodRoot data-flood-motion={motion === "reduce" ? "reduce" : undefined}>
    <Container role="main" size="lg" gutter="6" style={{paddingBlock:"var(--flood-sys-space-8)"}}>
      <Stack gap="8">
        <Stack gap="3">
          <Link href="/docs/motion">Motion guide</Link>
          <Heading level={1} size="page">Motion</Heading>
          <SegmentedControl label="Motion preference" hideLabel name="motion-preference" value={motion}
            onValueChange={setMotion} options={[{value:"system",label:"System preference"},{value:"reduce",label:"Reduced motion"}]} />
        </Stack>
        <Grid minItemWidth="18rem" gap="4">
          <Surface padding="6"><Stack gap="4">
            <Heading level={2} size="section">Controls</Heading>
            <Inline gap="4"><Button variant="subtle">Hover or press</Button><Switch label="Notifications" /></Inline>
            <Checkbox label="Remember this choice" />
            <Collapsible title="Show details"><Text as="p">Content appears in place.</Text></Collapsible>
          </Stack></Surface>
          <Surface padding="6"><Stack gap="4">
            <Heading level={2} size="section">Layers</Heading>
            <Inline gap="2">
              <Menu label="Project actions" trigger={props=><Button {...props} variant="subtle">Menu</Button>}
                items={[{id:"archive",label:"Archive project"},{id:"duplicate",label:"Duplicate project"}]}
                onAction={()=>setNotification([{id:"action",title:"Action complete",status:"success"}])} />
              <Dialog title="Project settings" trigger={props=><Button {...props} variant="subtle">Dialog</Button>}>
                <Checkbox label="Allow notifications" />
              </Dialog>
              <Drawer title="Project details" trigger={props=><Button {...props} variant="subtle">Drawer</Button>}>
                <Text as="p">Project details open from the edge of the workspace.</Text>
              </Drawer>
            </Inline>
          </Stack></Surface>
          <Surface padding="6"><Stack gap="4">
            <Heading level={2} size="section">Feedback</Heading>
            <Progress label="Upload" value={loading ? undefined : progress} />
            <Inline gap="2">
              <Button variant="subtle" onClick={()=>setProgress(value=>value===100?25:value+25)}>Update progress</Button>
              <Button variant="subtle" aria-pressed={loading} onClick={()=>setLoading(value=>!value)}>Loading</Button>
            </Inline>
            {loading&&<Skeleton width="75%" />}
          </Stack></Surface>
        </Grid>
      </Stack>
      <ToastRegion items={notification} onDismiss={()=>setNotification([])} />
    </Container>
  </FloodRoot>;
}
