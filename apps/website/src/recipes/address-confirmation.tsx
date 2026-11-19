"use client";

import { useRef, useState } from "react";
import {
  Alert, Autocomplete, Button, ChangeList, Dialog, Field, FormActions,
  Grid, Input, Stack, StatusIndicator,
  type ChangeListItem,
} from "@flood-md/react";

export interface PostalAddress {
  street: string;
  city: string;
  postalCode: string;
}

interface AddressConfirmationProps {
  results: {
    query: string;
    state: "ready" | "loading" | "error";
    suggestions: readonly { id: string; address: PostalAddress }[];
  };
  onSearch: (street: string) => void;
  onRetrySearch?: () => void;
  /** Returns an alternative only when the difference needs a decision. */
  findAlternative: (draft: PostalAddress) => Promise<PostalAddress | undefined>;
  onSave: (confirmedAddress: PostalAddress) => Promise<void>;
}

const fields = [
  ["street", "Street address", "address-line1"],
  ["city", "City", "address-level2"],
  ["postalCode", "Postal code", "postal-code"],
] as const;

export function AddressConfirmation({ results, onSearch, onRetrySearch, findAlternative, onSave }: AddressConfirmationProps) {
  const opener = useRef<HTMLButtonElement>(null);
  const edit = useRef<HTMLButtonElement>(null);
  const working = useRef(false);
  const [draft, setDraft] = useState<PostalAddress>({ street: "", city: "", postalCode: "" });
  const [review, setReview] = useState<{ entered: PostalAddress; alternative: PostalAddress }>();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function change(key: keyof PostalAddress, value: string) {
    setDraft(previous => ({ ...previous, [key]: value }));
    setSaved(false);
  }

  async function apply(address: PostalAddress, check: boolean) {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setError("");
    try {
      const alternative = check ? await findAlternative(address) : undefined;
      if (alternative && fields.some(([key]) => address[key] !== alternative[key])) {
        setReview({ entered: address, alternative });
      } else {
        await onSave(address);
        setDraft(address);
        setReview(undefined);
        setSaved(true);
      }
    } catch {
      setError(check ? "Could not check or save this address. Try again." : "Could not save this address. Try again.");
    } finally {
      setBusy(false);
      working.current = false;
    }
  }

  const changes: ChangeListItem[] = review ? fields.flatMap(([key, label]) =>
    review.entered[key] === review.alternative[key] ? [] :
      [{ id: key, label, before: review.entered[key], after: review.alternative[key] }]) : [];
  const errorNotice = error && <Alert tone="error" announcement="polite">{error}</Alert>;

  return <Stack gap="4">
    <form onSubmit={event => {
      event.preventDefault();
      void apply(draft, true);
    }}>
      <Stack gap="4">
        <Field label="Street address" required>
          {field => <Autocomplete {...field} autoComplete="section-shipping shipping address-line1" value={draft.street}
            filtering="manual" optionsQuery={results.query} loadState={results.state} onRetry={onRetrySearch}
            options={results.suggestions.map(({ id, address }) => ({ value: id, label: address.street, description: `${address.city} ${address.postalCode}` }))}
            readOnly={busy || Boolean(review)} onValueChange={street => {
              change("street", street);
              onSearch(street);
            }} onOptionSelect={option => {
              const result = results.suggestions.find(item => item.id === option.value);
              if (result) { setDraft(result.address); setSaved(false); }
            }} />}
        </Field>
        <Grid maxColumns={2} minItemWidth="11rem" gap="4">
          {fields.slice(1).map(([key, label, purpose]) => <Field key={key} label={label} required>
            {field => <Input {...field} autoComplete={`section-shipping shipping ${purpose}`} value={draft[key]}
              readOnly={busy || Boolean(review)} onChange={event => change(key, event.currentTarget.value)} />}
          </Field>)}
        </Grid>
        {!review && errorNotice}
        <FormActions primary={<Button ref={opener} type="submit" loading={busy ? "retain-focus" : false}>Save address</Button>}
          status={saved && <StatusIndicator announce tone="success" label="Address saved" />} />
      </Stack>
    </form>
    <Dialog title="Confirm delivery address" open={Boolean(review)} trigger={() => null}
      closeOnOutsideClick={false} initialFocusRef={edit} getFallbackFocus={() => opener.current}
      onOpenChange={open => { if (!open && !working.current) { setError(""); setReview(undefined); } }}>
      {review && <Stack gap="4">
        <ChangeList items={changes} valueLayout="stacked" labels={{ before: "Entered", after: "Suggested" }} />
        {errorNotice}
        <Grid maxColumns={2} minItemWidth="10rem" gap="2">
          <Button variant="subtle" disabled={busy} onClick={() => void apply(review.entered, false)}>Keep entered address</Button>
          <Button loading={busy ? "retain-focus" : false} onClick={() => void apply(review.alternative, false)}>Use suggested address</Button>
        </Grid>
        <Button ref={edit} variant="ghost" size="sm" disabled={busy} style={{ alignSelf: "start" }}
          onClick={() => { setError(""); setReview(undefined); }}>Edit address</Button>
      </Stack>}
    </Dialog>
  </Stack>;
}
