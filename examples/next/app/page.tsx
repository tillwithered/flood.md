import { Button } from "@flood-md/react";
import { ProfileForm } from "./profile-form";

// Server component imports Flood's client boundary without moving the whole page client-side.
export default function Page() {
  return (
    <main style={{ maxWidth: 480, margin: "48px auto", padding: 24 }}>
      <h1>Flood + Next.js</h1>
      <Button variant="outline">Server-rendered button</Button>
      <ProfileForm />
    </main>
  );
}
