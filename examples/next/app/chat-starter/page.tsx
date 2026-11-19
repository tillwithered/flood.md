import { FloodRoot } from "@flood-md/react";
import { ChatStarter } from "../../../../apps/website/src/recipes/chat-starter";

export const metadata = { title: "Chat starter · Flood" };

export default function ChatStarterPage() {
  return <FloodRoot style={{ minBlockSize: "100dvh", boxSizing: "border-box", paddingBlock: "var(--flood-sys-space-6)" }}>
    <ChatStarter />
  </FloodRoot>;
}
