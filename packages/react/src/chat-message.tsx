import { forwardRef, useId, type HTMLAttributes, type ReactNode } from "react";
import { Inline, Stack, Text } from "./index.js";
import { hasFieldContent } from "./field-state.js";

export interface ChatMessageProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  author: string;
  direction?: "incoming" | "outgoing";
  avatar?: ReactNode;
  timestamp?: ReactNode;
  children: ReactNode;
  reply?: ReactNode;
  attachments?: ReactNode;
  receipt?: ReactNode;
  actions?: ReactNode;
}

/** One attributed turn in a conversation, with the host's content and actions. */
export const ChatMessage = /* @__PURE__ */ forwardRef<HTMLElement, ChatMessageProps>(function ChatMessage(
  { author, direction = "incoming", avatar, timestamp, children, reply, attachments, receipt, actions, className, ...props }, ref,
) {
  const authorId = useId();
  return <article aria-labelledby={authorId} {...props} ref={ref} data-direction={direction}
    className={["flood-chat-message", className].filter(Boolean).join(" ")}>
    {hasFieldContent(avatar) && <div className="flood-chat-message__avatar" aria-hidden="true">{avatar}</div>}
    <Stack gap="1" className="flood-chat-message__content">
      <Inline gap="2" align="baseline" className="flood-chat-message__meta">
        <Text id={authorId} size="label" dir="auto" className="flood-chat-message__author">{author}</Text>
        {timestamp}
        {receipt}
      </Inline>
      <Stack gap="2" className="flood-chat-message__body">
        {reply}
        <Text as="div" dir="auto" className="flood-chat-message__text">{children}</Text>
        {attachments}
      </Stack>
      {hasFieldContent(actions) && <Inline gap="1" className="flood-chat-message__actions">{actions}</Inline>}
    </Stack>
  </article>;
});
