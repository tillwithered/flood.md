import {forwardRef, useState} from "react";
import {
  CopyableValue, DescriptionList, Field, Section, Select, Stack, Text,
  type ConnectionDetailsProps,
} from "./index.js";

export const ConnectionDetailsPanel = /* @__PURE__ */ forwardRef<HTMLElement, ConnectionDetailsProps>(
  function ConnectionDetailsPanel({profiles, value, defaultValue, onValueChange, labels, ...props}, ref) {
    const [localValue, setLocalValue] = useState(defaultValue);
    const selectedId = value ?? localValue;
    const selected = selectedId === undefined
      ? profiles.find(profile => !("unavailableReason" in profile)) ?? profiles[0]
      : profiles.find(profile => profile.id === selectedId);
    if (value === undefined && localValue === undefined && selected) setLocalValue(selected.id);
    const canCopy = selected && !("unavailableReason" in selected);
    const showSelector = profiles.length > 1 || !!profiles.length && !selected;
    const methodLabel = labels?.method ?? "Connection method";
    const connectionLabel = labels?.connection ?? "Connection string";
    const methodHint = selected
      ? "unavailableReason" in selected ? selected.unavailableReason : selected.description
      : labels?.selectionUnavailable ?? "The selected method is unavailable. Choose another connection method.";

    return <Section {...props} ref={ref}>
      {profiles.length ? <Stack gap="4">
        {showSelector
          ? <Field label={methodLabel} hint={methodHint}>
              {control => <Select {...control} controlSize="sm" value={selected?.id ?? ""} onChange={event => {
                const next = event.currentTarget.value;
                if (value === undefined) setLocalValue(next);
                onValueChange?.(next);
              }}>
                {!selected && <option value="" disabled>{labels?.choose ?? "Choose a connection method"}</option>}
                {profiles.map(profile => <option key={profile.id} value={profile.id}>{profile.label}</option>)}
              </Select>}
            </Field>
          : methodHint && <Text as="p" size="compact" tone="subtle">{methodHint}</Text>}
        {canCopy && <DescriptionList layout="stacked" items={[{
          id:"connection", term:connectionLabel,
          description:<CopyableValue key={selected.id} appearance="code" dir="ltr"
            value={selected.connection} copyLabel={labels?.copy ?? "Copy connection string"}
            copiedLabel={labels?.copied} errorLabel={labels?.copyError}/>,
        }]}/>}
        {canCopy && selected.parameters?.length ? <DescriptionList layout="grid" items={selected.parameters.map(parameter=>({
          id:parameter.id, term:parameter.label,
          description:<Text size="compact"><bdi>{parameter.value}</bdi></Text>,
        }))}/> : null}
      </Stack> : <Text as="p" tone="subtle" size="compact">{labels?.empty ?? "No connection methods available."}</Text>}
    </Section>;
  },
);
