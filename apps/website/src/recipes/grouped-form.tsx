"use client";
import type {FormEvent} from 'react';
import {Button,Field,Fieldset,Grid,Input,Select,Stack,Surface} from '@flood-md/react';

/** Shared outer tracks; groups retain their own reading order and field ownership. */
export function GroupedForm({showBillingEmail=true,onApply}:{showBillingEmail?:boolean;onApply?:(values:FormData)=>void}) {
  function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();onApply?.(new FormData(event.currentTarget));}
  return <form aria-label="Workspace settings" onSubmit={submit}>
    <Stack gap="6">
      <Grid columns={2} gap="6">
        <Surface padding="6"><Fieldset legend="Identity"><Stack gap="4">
          <Field label="Workspace name" required>{props=><Input {...props} name="workspace" required />}</Field>
          <Field label="Reference">{props=><Input {...props} name="reference" />}</Field>
        </Stack></Fieldset></Surface>
        <Surface padding="6"><Fieldset legend="Locale"><Stack gap="4">
          <Field label="Language">{props=><Select {...props} name="language" defaultValue="en"><option value="en">English</option><option value="ru">Русский</option></Select>}</Field>
          <Field label="Time zone">{props=><Select {...props} name="timezone" defaultValue="UTC"><option value="UTC">UTC</option><option value="Asia/Almaty">Almaty</option></Select>}</Field>
        </Stack></Fieldset></Surface>
        <Surface padding="6"><Fieldset legend="Primary contact"><Stack gap="4">
          <Field label="Contact name">{props=><Input {...props} name="contact" />}</Field>
          <Field label="Contact email">{props=><Input {...props} name="contactEmail" type="email" />}</Field>
        </Stack></Fieldset></Surface>
        <Surface padding="6"><Fieldset legend="Billing contact"><Stack gap="4">
          <Field label="Billing name">{props=><Input {...props} name="billing" />}</Field>
          {showBillingEmail&&<Field label="Billing email">{props=><Input {...props} name="billingEmail" type="email" />}</Field>}
        </Stack></Fieldset></Surface>
      </Grid>
      <Button type="submit">Apply settings</Button>
    </Stack>
  </form>;
}
