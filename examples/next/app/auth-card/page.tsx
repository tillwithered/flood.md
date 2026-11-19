import { Center, FloodRoot } from "@flood-md/react";
import { AuthCardExample } from "../../../../apps/website/src/recipes/auth-card";

export const metadata = { title: "Auth card · Flood" };

export default function AuthCardPage() {
  return <FloodRoot>
    <Center style={{ minBlockSize: "100dvh", justifyItems: "stretch", padding: "var(--flood-sys-space-4)" }}>
      <AuthCardExample />
    </Center>
  </FloodRoot>;
}
