"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  Alert, Button, CharacterAvatar, ChatMessage, Container, CopyButton, EmptyState,
  Inline, MessageComposer, MessageReceipt, MessageScroller, PageHeader, Select,
  Stack, Text, TypingIndicator, VisuallyHidden,
} from "@flood-md/react";

export interface StarterMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}
interface Thread {
  id: string;
  messages: StarterMessage[];
}
export type StarterResponder = (messages: readonly StarterMessage[], signal: AbortSignal) => AsyncIterable<string>;
interface ActiveRun {
  threadId: string;
  controller: AbortController;
}

const storageKey = "flood-chat-starter-v1";
const prompts = ["Draft a launch update", "Plan a weekly review", "Improve an empty state"];
const draftId = "";
const transcriptStyle: CSSProperties = { blockSize: "clamp(16rem, 48dvh, 35rem)" };
const previewReplies = [
  "Flood's latest release is ready for early adopters.\n\nThe update brings a more focused component library, complete examples, and a faster path from documentation to UI.\n\nTry it in one workflow this week and share where the examples fall short.",
  "Start by deciding what changed since last week.\n\nSpend five minutes on outcomes, ten on unresolved work, and five on decisions that need an owner.\n\nEnd with three actions and write down who owns each one.",
  "Name the missing content and offer one immediate action.\n\nFor example: “No saved views” with a “Save current view” button.\n\nKeep filters visible if they caused the empty state, so the user can clear them without leaving the page.",
];

async function* exampleResponse(messages: readonly StarterMessage[], signal: AbortSignal) {
  const lastUserMessage = [...messages].reverse().find(message => message.role === "user");
  const response = previewReplies[prompts.indexOf(lastUserMessage?.text ?? "")] ??
    "This local example shows how a Flood conversation updates as text arrives. Try one of the opening prompts to see a sample response.";
  const chunks = response.match(/[\s\S]{1,12}/gu) ?? [response];
  for (const [index, chunk] of chunks.entries()) {
    await new Promise<void>(resolve => setTimeout(resolve, index === 0 ? 300 : 75));
    if (signal.aborted) return;
    yield chunk;
  }
}

function readThreads(): Thread[] {
  try {
    const data: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
    if (!Array.isArray(data)) return [];
    return data.filter((thread): thread is Thread =>
      typeof thread?.id === "string" && Array.isArray(thread.messages) && thread.messages.length > 0 &&
      thread.messages.every((message: StarterMessage) => typeof message?.id === "string" &&
        typeof message.text === "string" && (message.role === "user" || message.role === "assistant")));
  } catch { return []; }
}

function threadLabel(thread: Thread) {
  const text = thread.messages[0]?.text.replace(/\s+/g, " ").trim() ?? "";
  return text.length > 44 ? `${text.slice(0, 41)}…` : text || "New conversation";
}

export function ChatStarter({ respond = exampleResponse }: { respond?: StarterResponder } = {}) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selected, setSelected] = useState(draftId);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const [activeThread, setActiveThread] = useState<string>();
  const [runError, setRunError] = useState<string>();
  const [announcement, setAnnouncement] = useState("");
  const run = useRef<ActiveRun | null>(null);
  const composer = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const saved = readThreads();
    setThreads(saved);
    setSelected(saved[0]?.id ?? draftId);
    setReady(true);
    return () => { run.current?.controller.abort(); run.current = null; };
  }, []);

  useEffect(() => {
    if (!ready || activeThread) return;
    try { window.localStorage.setItem(storageKey, JSON.stringify(threads)); }
    catch { /* Chat remains usable if storage is blocked or full. */ }
  }, [activeThread, ready, threads]);

  const thread = threads.find(item => item.id === selected);
  const messages = thread?.messages ?? [];
  const isRunning = activeThread === selected;
  const waitingForFirstChunk = isRunning && messages.at(-1)?.role !== "assistant";

  function focusDraft() {
    composer.current?.querySelector("textarea")?.focus({ preventScroll: true });
  }

  function selectThread(id: string) {
    setSelected(id);
    setAnnouncement("");
  }

  async function respondTo(threadId: string, history: StarterMessage[]) {
    const request: ActiveRun = { threadId, controller: new AbortController() };
    const answerId = window.crypto.randomUUID();
    run.current = request;
    setActiveThread(threadId);
    setRunError(undefined);
    setAnnouncement("Preparing a response");
    let answer = "";
    try {
      for await (const chunk of respond(history, request.controller.signal)) {
        if (run.current !== request || request.controller.signal.aborted) return;
        if (!chunk) continue;
        answer += chunk;
        const currentAnswer = answer;
        setThreads(current => current.map(item => item.id === threadId ? {
          ...item, messages: [...history, { id: answerId, role: "assistant", text: currentAnswer }],
        } : item));
      }
      if (run.current !== request) return;
      if (!answer.trim()) throw new Error("Empty response");
      setAnnouncement("Response available");
    } catch {
      if (run.current !== request) return;
      setRunError(threadId);
      setAnnouncement("Response failed");
    } finally {
      if (run.current === request) {
        run.current = null;
        setActiveThread(undefined);
      }
    }
  }

  function send(text: string) {
    const value = text.trim();
    if (!ready || !value || run.current) return;
    const threadId = thread?.id ?? window.crypto.randomUUID();
    const history: StarterMessage[] = [...messages, { id: window.crypto.randomUUID(), role: "user", text: value }];
    setDrafts(current => ({ ...current, [selected]: "" }));
    setThreads(current => thread
      ? current.map(item => item.id === threadId ? { ...item, messages: history } : item)
      : [{ id: threadId, messages: history }, ...current]);
    setSelected(threadId);
    void respondTo(threadId, history);
  }

  function stop() {
    run.current?.controller.abort();
    run.current = null;
    setActiveThread(undefined);
    setAnnouncement("Response stopped");
  }

  function retry() {
    if (!thread || run.current) return;
    const promptIndex = messages.map(message => message.role).lastIndexOf("user");
    if (promptIndex < 0) return;
    focusDraft();
    const history = messages.slice(0, promptIndex + 1);
    setThreads(current => current.map(item => item.id === thread.id ? { ...item, messages: history } : item));
    void respondTo(thread.id, history);
  }

  return <Container size="md" gutter="4">
    <Stack gap="4">
      <PageHeader title="Chat" metadata={respond === exampleResponse ? <Text size="helper" tone="subtle">Local demo</Text> : undefined}
        actions={<Button type="button" size="sm" variant="outline" onClick={() => { selectThread(draftId); focusDraft(); }}>New chat</Button>} />
      {threads.length > 0 && <Select aria-label="Conversations" value={selected}
        onChange={event => selectThread(event.currentTarget.value)}>
        <option value={draftId}>New conversation</option>
        {threads.map(item => <option key={item.id} value={item.id}>{threadLabel(item)}</option>)}
      </Select>}
      <MessageScroller key={selected} label="Messages" style={transcriptStyle}>
        {messages.length === 0
          ? <EmptyState title="Start a conversation"
              icon={<CharacterAvatar seed="flood-starter" name="Flood" size="lg" decorative />}
              actions={<Inline gap="2" style={{ flexWrap: "wrap", justifyContent: "center" }}>
                {prompts.map(prompt => <Button key={prompt} type="button" size="sm" variant="outline"
                  disabled={!ready || Boolean(activeThread)} onClick={() => { focusDraft(); send(prompt); }}>{prompt}</Button>)}
              </Inline>} />
          : <Stack gap="4" style={{ paddingBlock: "var(--flood-sys-space-2)" }}>
              {messages.map((message, index) => {
                const own = message.role === "user";
                const partial = isRunning && index === messages.length - 1;
                return <ChatMessage key={message.id} author={own ? "You" : "Flood"} direction={own ? "outgoing" : "incoming"}
                  avatar={<CharacterAvatar seed={own ? "flood-visitor" : "flood-starter"} name={own ? "You" : "Flood"} size="sm" decorative />}
                  receipt={own ? <MessageReceipt state="sent" /> : undefined}
                  actions={!own && !partial ? <CopyButton iconOnly size="xs" variant="ghost" value={message.text} copyLabel="Copy response" /> : undefined}>
                  {message.text}
                </ChatMessage>;
              })}
            </Stack>}
      </MessageScroller>
      {runError === selected && <Inline gap="2">
        <Alert tone="error">Could not load the response.</Alert>
        <Button size="sm" variant="outline" onClick={retry}>Retry</Button>
      </Inline>}
      <TypingIndicator label={waitingForFirstChunk ? "Flood is typing" : undefined} reserveSpace={false} />
      <VisuallyHidden role="status">{announcement}</VisuallyHidden>
      <MessageComposer ref={composer} label="Message" placeholder="Write a message…" value={drafts[selected] ?? ""}
        onValueChange={value => setDrafts(current => ({ ...current, [selected]: value }))}
        disabled={!ready || Boolean(activeThread && !isRunning)} streaming={isRunning}
        onSend={() => send(drafts[selected] ?? "")} onStop={stop} />
    </Stack>
  </Container>;
}
