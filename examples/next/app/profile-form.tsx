"use client";
import { useState } from "react";
import { Button, Checkbox, Field, Input } from "@flood-md/react";
export function ProfileForm() {
  const [saved, setSaved] = useState(false);
  return (
    <form
      style={{ display: "grid", gap: 16, marginTop: 32 }}
      onSubmit={(event) => {
        event.preventDefault();
        setSaved(true);
      }}
    >
      <Field label="Your name" hint="Used in this example only">
        {(props) => (
          <Input {...props} name="name" required autoComplete="name" />
        )}
      </Field>
      <Checkbox label="Send product updates" name="updates" />
      <Button type="submit">Save profile</Button>
      <p role="status">{saved ? "Profile saved in this demo." : ""}</p>
    </form>
  );
}
