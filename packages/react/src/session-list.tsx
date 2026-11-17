import { forwardRef } from "react";
import { Badge, DataList, DataListItem, IconSlot, Inline, Stack, Text, Timestamp, type SessionListProps } from "./index.js";

export const AccountSessionList = /* @__PURE__ */ forwardRef<HTMLDivElement, SessionListProps>(function AccountSessionList(
  { label, sessions, currentId, renderEndAction, labels, className, ...props }, ref,
) {
  const ids = new Set(sessions.map(session => session.id));
  if (!label.trim() || ids.size !== sessions.length ||
      sessions.some(session => !session.id.trim() || !session.label.trim())) {
    throw new Error("Flood SessionList requires a name and uniquely identified sessions");
  }

  return <Stack {...props} ref={ref} className={["flood-session-list", className].filter(Boolean).join(" ")}>
    {sessions.length ? <DataList aria-label={label} density="compact" dividers={false}>
      {sessions.map(session => {
        const current = session.id === currentId;
        const unavailable = session.status === "unavailable";
        return <DataListItem key={session.id} layout="content" className="flood-session-list__row"
          media={session.icon != null ? <IconSlot size="sm">{session.icon}</IconSlot> : undefined}
          title={<Inline gap="2" align="center">
            <Text size="label">{session.label}</Text>
            {current && <Badge size="sm">{labels?.current ?? "Current session"}</Badge>}
          </Inline>}
          description={session.location || session.lastActive || unavailable ? <Inline gap="2" align="baseline">
            {session.location && <Text size="helper" tone="subtle">{session.location}</Text>}
            {session.lastActive && <Timestamp dateTime={session.lastActive.dateTime} size="helper">{session.lastActive.label}</Timestamp>}
            {unavailable && <Text size="helper" tone="subtle">{labels?.unavailable ?? "Session status unavailable"}</Text>}
          </Inline> : undefined}
          actions={currentId === undefined || current || unavailable ? undefined : renderEndAction?.(session)} />;
      })}
    </DataList> : <Text size="compact" tone="subtle">{labels?.empty ?? "No active sessions."}</Text>}
  </Stack>;
});
