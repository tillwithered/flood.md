import { useId, useState, type FormEvent } from "react";
import { ArrowRight, Copy, Plus } from "lucide-react";
import {
  Button, Checkbox, CodeSnippet, Divider, Field, FloodRoot, Heading,
  IconButton, IconSlot, Inline, Input, Link, Radio, Stack, Surface,
  Switch, Text, Textarea,
} from "@flood-md/react";

export interface ComponentPage {
  slug: string;
  name: string;
  group: string;
  description: string;
  code: string;
  notes: string[];
  api: Array<[string, string, string]>;
}

export const componentPages: ComponentPage[] = [
  {
    slug: "flood-root", name: "FloodRoot", group: "Setup",
    description: "An explicit scope for the neutral dark foundations profile.",
    code: '<FloodRoot>\n  <Text>Your workspace starts here.</Text>\n</FloodRoot>',
    notes: ["Import @flood-md/react/styles.css once at the application entry.", "This root selects neutral/dark locally. Legacy controls outside it keep their earlier theme behavior."],
    api: [["children", "ReactNode", "—"], ["HTML div props / ref", "HTMLDivElement", "Forwarded"]],
  },
  {
    slug: "text", name: "Text", group: "Typography",
    description: "Role-based interface text, from introductory copy to small supporting details.",
    code: '<Stack gap="3">\n  <Text as="p" size="lead">A calm foundation for your next idea.</Text>\n  <Text as="p" size="compact">Use the space to make it yours.</Text>\n</Stack>',
    notes: ["Use as=\"p\" for paragraphs. The label size does not create a form association.", "Subtle is a supplementary tone; evaluate small required instructions against the actual background and font size."],
    api: [["as", "span | p | div", "span"], ["size", "lead | body | compact | label | helper", "body"], ["tone", "default | subtle | error | success | warning | info", "default"], ["HTML props / ref", "HTMLElement", "Forwarded"]],
  },
  {
    slug: "heading", name: "Heading", group: "Typography",
    description: "Semantic heading levels with an independent visual scale.",
    code: '<Stack gap="4">\n  <Heading level={2} size="page">Workspace settings</Heading>\n  <Heading level={3} size="section">Notifications</Heading>\n</Stack>',
    notes: ["Choose level for document structure and size for appearance.", "Display is a large marketing role. Keep page and section sizes for ordinary product interfaces."],
    api: [["level", "1 | 2 | 3 | 4 | 5 | 6", "2"], ["size", "display | large | page | section", "page"], ["HTML heading props / ref", "HTMLHeadingElement", "Forwarded"]],
  },
  {
    slug: "stack", name: "Stack", group: "Layout",
    description: "Vertical composition with spacing from the shared token scale.",
    code: '<Stack gap="4">\n  <Heading size="section">Project</Heading>\n  <Text as="p">One place for your work.</Text>\n</Stack>',
    notes: ["The parent owns the gap between its children.", "Spacing keys are strings and use rem. Flood does not reset the host root font size."],
    api: [["gap", '"0" | "1" | "2" | "3" | "4" | "6" | "8" | "12"', '"4"'], ["HTML div props / ref", "HTMLDivElement", "Forwarded"]],
  },
  {
    slug: "inline", name: "Inline", group: "Layout",
    description: "A wrapping horizontal group for related content and actions.",
    code: '<Inline gap="2" align="center">\n  <Button>Save changes</Button>\n  <Button variant="subtle">Cancel</Button>\n</Inline>',
    notes: ["Inline wraps when its children need more space.", "Use the same control size for neighboring actions of the same level."],
    api: [["gap", '"0" | "1" | "2" | "3" | "4" | "6" | "8" | "12"', '"2"'], ["align", "start | center | end | baseline", "center"], ["HTML div props / ref", "HTMLDivElement", "Forwarded"]],
  },
  {
    slug: "surface", name: "Surface", group: "Layout",
    description: "A quiet container with semantic elevation and token-based padding.",
    code: '<Surface elevation="raised" padding="6">\n  <Text>Everything in its place.</Text>\n</Surface>',
    notes: ["Elevation describes appearance. Overlay does not create a dialog, portal or focus trap.", "Prefer grouping and spacing before adding more nested containers."],
    api: [["elevation", "default | raised | overlay", "default"], ["padding", '"0" | "1" | "2" | "3" | "4" | "6" | "8" | "12"', '"6"'], ["HTML div props / ref", "HTMLDivElement", "Forwarded"]],
  },
  {
    slug: "divider", name: "Divider", group: "Layout",
    description: "A semantic separator with a low-emphasis visual line.",
    code: '<Stack gap="4">\n  <Text>Workspace</Text>\n  <Divider />\n  <Text>Account</Text>\n</Stack>',
    notes: ["The line is decorative in contrast terms: content grouping must remain understandable without seeing it.", "Divider renders a native hr; it has no orientation prop."],
    api: [["HTML hr props / ref", "HTMLHRElement", "Forwarded"]],
  },
  {
    slug: "button", name: "Button", group: "Actions",
    description: "Native actions with a clear prominence, size and interaction state.",
    code: '<Inline gap="2">\n  <Button>Save changes</Button>\n  <Button variant="subtle">Cancel</Button>\n  <Button loading>Saving</Button>\n</Inline>',
    notes: ["Button defaults to type=\"button\". Set submit or reset deliberately inside forms.", "Loading disables activation and sets aria-busy. The host owns completion announcements.", "Prefer subtle for standalone secondary actions; ghost belongs in a clear parent context."],
    api: [["variant", "solid | subtle | outline | ghost", "solid"], ["size", "2xs | xs | sm | md | lg | xl | 2xl", "md"], ["loading", "boolean", "false"], ["type", "button | submit | reset", "button"], ["HTML button props / ref", "HTMLButtonElement", "Forwarded"]],
  },
  {
    slug: "icon-button", name: "IconButton", group: "Actions",
    description: "An icon-only action with a required accessible name.",
    code: '<IconButton label="Add idea">\n  <Plus />\n</IconButton>',
    notes: ["Provide a meaningful action label, rather than the name of the glyph.", "Supply a licensed SVG. IconButton wraps it in a decorative IconSlot sized to the control.", "Connect onClick to your host action. The interactive preview adds a local count; the basic usage snippet only shows composition."],
    api: [["label", "string", "Required"], ["variant", "solid | subtle | outline | ghost", "subtle"], ["size", "2xs | xs | sm | md | lg | xl | 2xl", "md"], ["Other Button props / ref", "ButtonProps / HTMLButtonElement", "Forwarded"]],
  },
  {
    slug: "link", name: "Link", group: "Actions",
    description: "A native anchor for navigation.",
    code: '<Link href="/docs/installation">Install Flood</Link>',
    notes: ["Use a button for state-changing actions and a link for navigation.", "Link forwards anchor attributes. It does not provide Button variants or an asChild API."],
    api: [["HTML anchor props / ref", "HTMLAnchorElement", "Forwarded"]],
  },
  {
    slug: "field", name: "Field", group: "Forms",
    description: "The association between a visible label, its input and supporting messages.",
    code: '<Field label="Project name" required hint="Visible to your team.">\n  {(control) => <Input {...control} name="project" />}\n</Field>',
    notes: ["Spread the supplied control props onto one Input or Textarea.", "Field merges describedBy with hint/error IDs and forwards native required through its function child.", "The host owns validation rules. Compose Field in a client component in Next.js.", "Field is not a generic native div wrapper and does not forward a ref."],
    api: [["label", "ReactNode", "Required"], ["children", "(controlProps) => ReactNode", "Required"], ["id", "string", "Generated"], ["hint / error", "ReactNode", "—"], ["required", "boolean", "—"], ["describedBy", "string", "—"]],
  },
  {
    slug: "input", name: "Input", group: "Forms",
    description: "A native input with semantic styling and independent visual sizing.",
    code: '<Field label="Workspace name">\n  {(control) => <Input {...control} defaultValue="My project" />}\n</Field>',
    notes: ["Use Field or a native associated label; placeholder text is not a label.", "controlSize changes appearance. The native numeric size attribute keeps its HTML meaning.", "Preserve the stronger necessary boundary and focus indicator when customizing colors."],
    api: [["controlSize", "sm | md | lg | xl", "md"], ["invalid", "boolean", "—"], ["HTML input props / ref", "HTMLInputElement", "Forwarded"]],
  },
  {
    slug: "textarea", name: "Textarea", group: "Forms",
    description: "Native multiline input for notes and longer text.",
    code: '<Field label="Project note" hint="Keep it short and useful.">\n  {(control) => <Textarea {...control} rows={3} maxLength={500} />}\n</Field>',
    notes: ["Rows, maxLength, value/defaultValue and form props remain native.", "Vertical resizing is supported. The host owns validation and character-count messages."],
    api: [["controlSize", "sm | md | lg | xl", "md"], ["invalid", "boolean", "—"], ["HTML textarea props / ref", "HTMLTextAreaElement", "Forwarded"]],
  },
  {
    slug: "checkbox", name: "Checkbox", group: "Forms",
    description: "A labeled native checkbox for independent choices.",
    code: '<Checkbox label="Send project updates" name="updates" defaultChecked />',
    notes: ["Use checked/onChange for controlled state or defaultChecked for native state.", "Labels stay visible. Disabled does not mean read-only; explain unavailable choices outside the disabled control when needed."],
    api: [["label", "ReactNode", "Required"], ["Native input props / ref", "Input props except type and size / HTMLInputElement", "Forwarded"]],
  },
  {
    slug: "radio", name: "Radio", group: "Forms",
    description: "A labeled native radio for one choice within a group.",
    code: '<fieldset>\n  <legend>Visibility</legend>\n  <Radio label="Private" name="visibility" value="private" defaultChecked />\n  <Radio label="Public" name="visibility" value="public" />\n</fieldset>',
    notes: ["Radios in one group share a name. The host supplies fieldset and legend.", "Native browser keyboard and form behavior remain available."],
    api: [["label", "ReactNode", "Required"], ["Native input props / ref", "Input props except type and size / HTMLInputElement", "Forwarded"]],
  },
  {
    slug: "switch", name: "Switch", group: "Forms",
    description: "A labeled on/off setting with native checkbox form behavior.",
    code: '<Switch label="Email notifications" name="notifications" defaultChecked />',
    notes: ["Switch uses a native checkbox with role=\"switch\".", "checked/defaultChecked, name/value, reset and disabled remain native. The component does not persist settings."],
    api: [["label", "ReactNode", "Required"], ["Native input props / ref", "Input props except type and size / HTMLInputElement", "Forwarded"]],
  },
  {
    slug: "code-snippet", name: "CodeSnippet", group: "Content",
    description: "Selectable, wrapping code with an optional host-owned action.",
    code: '<CodeSnippet code="npx @flood-md/cli@0.2.2 init" />',
    notes: ["CodeSnippet escapes code content and uses the semantic system monospace font stack.", "The host implements copy behavior, failure handling and feedback. No clipboard or network API runs inside the component."],
    api: [["code", "string", "Required"], ["action", "ReactNode", "—"], ["HTML div props / ref", "HTMLDivElement (except children)", "Forwarded"]],
  },
  {
    slug: "icon-slot", name: "IconSlot", group: "Content",
    description: "Consistent geometry for a host-supplied SVG icon.",
    code: '<IconSlot size="md"><ArrowRight /></IconSlot>',
    notes: ["No glyph pack ships in the React package. Keep the license of the host's icon artwork.", "Without label the slot is decorative. With label it exposes role=\"img\" and an accessible name.", "Use an SVG rather than a text character. Avoid inline SVG sizing styles that override the slot."],
    api: [["size", "2xs | xs | sm | md | lg | xl | 2xl", "md"], ["label", "string", "—"], ["HTML span props / ref", "HTMLSpanElement", "Forwarded"]],
  },
];

export function ComponentPreview({ slug }: { slug: string }) {
  const id = useId();
  const [ideas, setIdeas] = useState(0);
  const [name, setName] = useState("");
  const [error, setError] = useState("Enter a project name.");
  const [status, setStatus] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const command = "npx @flood-md/cli@0.2.2 init";

  function validate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(name.trim() ? "" : "Enter a project name.");
    setStatus(name.trim() ? `Ready: ${name.trim()}. Nothing was sent.` : "");
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopyStatus("Copied command.");
    } catch {
      setCopyStatus("Select the command and copy it manually.");
    }
  }

  switch (slug) {
    case "flood-root": return <FloodRoot><Surface padding="6"><Text>Your workspace starts here.</Text></Surface></FloodRoot>;
    case "text": return <Stack gap="3"><Text as="p" size="lead">A calm foundation for your next idea.</Text><Text as="p">Body text for everyday reading.</Text><Text as="p" size="compact">Compact text for a working interface.</Text><Text as="p" size="helper">Supporting detail with a clear purpose.</Text></Stack>;
    case "heading": return <Stack gap="4"><Heading level={2} size="large">Workspace</Heading><Heading level={3} size="page">Project settings</Heading><Heading level={4} size="section">Notifications</Heading></Stack>;
    case "stack": return <Stack gap="4"><Heading size="section">Project</Heading><Text as="p">One place for your work.</Text><Button variant="subtle">Open project</Button></Stack>;
    case "inline": return <Inline gap="2"><Button>Save changes</Button><Button variant="subtle">Cancel</Button></Inline>;
    case "surface": return <Stack gap="3"><Surface><Text>Default surface</Text></Surface><Surface elevation="raised"><Text>Raised surface</Text></Surface><Surface elevation="overlay"><Text>Overlay appearance</Text></Surface></Stack>;
    case "divider": return <Stack gap="4"><Text>Workspace</Text><Divider /><Text>Account</Text></Stack>;
    case "button": return <Stack gap="4"><Inline><Button>Save changes</Button><Button variant="subtle">Cancel</Button><Button variant="outline">Details</Button></Inline><Surface padding="3"><Button variant="ghost">Contextual action</Button></Surface><Inline><Button disabled>Unavailable</Button><Button loading>Saving</Button></Inline></Stack>;
    case "icon-button": return <Inline gap="4"><IconButton label="Add idea" onClick={() => setIdeas((count) => count + 1)}><Plus /></IconButton><Text as="p" size="compact" role="status">{ideas === 0 ? "Add your first idea." : `${ideas} ${ideas === 1 ? "idea" : "ideas"} added locally.`}</Text></Inline>;
    case "link": return <Link href="/docs/installation">Install Flood</Link>;
    case "field": return <form onSubmit={validate} noValidate><Stack gap="3"><Field label="Project name" required hint="Visible to your team." error={error}>{(control) => <Input {...control} name="project" value={name} onChange={(event) => { setName(event.target.value); setError(""); setStatus(""); }} />}</Field><Inline><Button type="submit">Check name</Button></Inline><Text as="p" size="compact" role="status">{status}</Text></Stack></form>;
    case "input": return <Stack gap="4"><Field label="Workspace name">{(control) => <Input {...control} defaultValue="My project" />}</Field><Field label="Read-only identifier">{(control) => <Input {...control} value="workspace-01" readOnly />}</Field></Stack>;
    case "textarea": return <Field label="Project note" hint="Keep it short and useful.">{(control) => <Textarea {...control} rows={3} maxLength={500} defaultValue="A place for our next idea." />}</Field>;
    case "checkbox": return <Stack gap="2"><Checkbox label="Send project updates" name={`${id}-updates`} defaultChecked /><Checkbox label="Managed by your organization" disabled /></Stack>;
    case "radio": return <fieldset style={{ margin: 0, padding: 0, border: 0 }}><legend>Visibility</legend><Inline><Radio label="Private" name={`${id}-visibility`} value="private" defaultChecked /><Radio label="Public" name={`${id}-visibility`} value="public" /></Inline></fieldset>;
    case "switch": return <Stack gap="2"><Switch label="Email notifications" name={`${id}-notifications`} defaultChecked /><Switch label="Managed setting" disabled /></Stack>;
    case "code-snippet": return <Stack gap="3"><CodeSnippet code={command} aria-describedby={`${id}-copy-status`} action={<Button variant="subtle" size="sm" onClick={copy}>Copy<IconSlot size="sm"><Copy /></IconSlot></Button>} /><Text as="p" size="compact" role="status" id={`${id}-copy-status`}>{copyStatus || "Copy the command or select its text."}</Text></Stack>;
    case "icon-slot": return <Inline gap="4"><IconSlot size="sm" label="Small arrow"><ArrowRight /></IconSlot><IconSlot label="Medium arrow"><ArrowRight /></IconSlot><IconSlot size="xl" label="Large arrow"><ArrowRight /></IconSlot><Text size="compact">16, 20 and 24px at the reference root.</Text></Inline>;
    default: return null;
  }
}
