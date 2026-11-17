"use client";

import { Button, DataList, DataListItem, Stack, StatusIndicator, Text, Toggle } from "@flood-md/react";

export interface Checkpoint {
  id: string;
  label: string;
  answered: boolean;
  flagged: boolean;
}

export function CheckpointNavigator({ checkpoints, currentId, onOpen, onFlagChange }: {
  checkpoints: readonly Checkpoint[];
  currentId: string;
  onOpen: (id: string) => void;
  onFlagChange: (id: string, flagged: boolean) => void;
}) {
  const answered = checkpoints.filter(checkpoint => checkpoint.answered).length;

  return <Stack gap="2">
    <Text as="p" size="helper" tone="subtle">{answered} of {checkpoints.length} answered</Text>
    <DataList aria-label="Review checkpoints" density="compact" dividers={false}>
      {checkpoints.map(checkpoint => {
        const current = checkpoint.id === currentId;
        return <DataListItem key={checkpoint.id}
          title={<Button size="sm" variant={current ? "subtle" : "ghost"}
            aria-current={current ? "step" : undefined} onClick={() => onOpen(checkpoint.id)}>
            {checkpoint.label}
          </Button>}
          metadata={<StatusIndicator size="sm" tone={checkpoint.answered ? "success" : "neutral"}
            label={checkpoint.answered ? "Answered" : "Unanswered"}/>}
          actions={<Toggle size="sm" variant="ghost" pressed={checkpoint.flagged} aria-label={`Flag ${checkpoint.label}`}
            onPressedChange={flagged => onFlagChange(checkpoint.id, flagged)}>
            {checkpoint.flagged ? "Flagged" : "Flag"}
          </Toggle>}/>;
      })}
    </DataList>
  </Stack>;
}
