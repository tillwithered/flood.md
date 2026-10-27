# Form submission

Keep validation, pending state and recovery explicit. Native validity runs
before submit. Application or server errors belong to the form and its fields.

```tsx
"use client";
import {useRef, useState} from "react";
import {Alert, Button, Field, Input, Stack} from "@flood-md/react";

export function ProjectForm({save}: {save: (data: FormData) => Promise<void>}) {
  const locked = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  return <form onSubmit={async event => {
    event.preventDefault();
    if (locked.current) return;
    const data = new FormData(event.currentTarget);
    locked.current = true;
    setPending(true); setError(""); setSaved(false);
    try { await save(data); setSaved(true); }
    catch { setError("Could not save. Your changes are still here. Try again."); }
    finally { locked.current = false; setPending(false); }
  }} aria-busy={pending}>
    <Stack gap="4">
      <Field label="Project name">{props => <Input {...props} name="name" required readOnly={pending} />}</Field>
      {error && <Alert tone="error" announcement="assertive">{error}</Alert>}
      {saved && <Alert tone="success" announcement="polite">Project saved.</Alert>}
      <Button type="submit" loading={pending}>Save project</Button>
    </Stack>
  </form>;
}
```

Capture FormData before disabling any native fields. This example preserves user
input after failure. Map returned field errors to Field and optionally ErrorSummary;
never pretend the request succeeded. The host supplies persistence, cancellation,
authentication and navigation. Place inside FloodRoot and import its CSS once.
