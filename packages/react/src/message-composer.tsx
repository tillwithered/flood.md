import { forwardRef, useRef, type KeyboardEvent, type ReactNode } from "react";
import { Button, FileTrigger, IconButton, Inline, SuggestionTextarea, Surface, TagGroup, Textarea, type MessageComposerProps } from "./index.js";

export const ComposerForm = /* @__PURE__ */ forwardRef<HTMLFormElement, MessageComposerProps & {header?: ReactNode; editorDescriptionId?: string}>(function ComposerForm({
  label, layout = "stacked", sendPresentation = "icon", header, editorDescriptionId, value, onValueChange, onSend, placeholder, disabled = false, streaming = false, onStop,
  attachments = [], attachmentsLabel = "Attachments", maxVisibleAttachments, moreAttachmentsLabel, fewerAttachmentsLabel,
  onRemoveAttachment, onFilesSelect, accept, leadingActions,
  suggestions, onSuggestionSelect,
  sendLabel = "Send message", stopLabel = "Stop response", attachLabel = "Attach files", className, ...props
}, ref) {
  const editor = useRef<HTMLTextAreaElement>(null);
  const canSend = !disabled && !streaming && (value.trim().length > 0 || attachments.length > 0);
  const canStop = !disabled && streaming && Boolean(onStop);
  const focusDraft = () => editor.current?.focus({ preventScroll: true });
  const editorProps = {
    ref:editor, className:"flood-message-composer__editor", rows:1,
    "aria-label":label, "aria-describedby":editorDescriptionId, placeholder, value, disabled,
    onKeyDown:(event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey ||
          event.nativeEvent.isComposing || event.keyCode === 229 || event.defaultPrevented ||
          event.currentTarget.hasAttribute("aria-activedescendant")) return;
      event.preventDefault();
      if (!event.repeat && canSend) event.currentTarget.form?.requestSubmit();
    },
  };

  return (
    <form {...props} ref={ref} className={["flood-message-composer", className].filter(Boolean).join(" ")} data-layout={layout} onSubmit={event => {
      event.preventDefault();
      event.stopPropagation();
      if (canSend) {
        focusDraft();
        onSend();
      }
    }}>
      {header}
      <Surface padding="2" elevation="raised" className="flood-message-composer__surface">
        {attachments.length > 0 && <TagGroup className="flood-message-composer__attachments"
          label={attachmentsLabel} items={attachments} size="sm" disabled={disabled}
          maxVisibleTags={maxVisibleAttachments} moreTagsLabel={moreAttachmentsLabel} fewerTagsLabel={fewerAttachmentsLabel}
          onRemove={onRemoveAttachment && (id => {
            focusDraft();
            onRemoveAttachment(id);
          })} />}
        {suggestions?.length
          ? <SuggestionTextarea {...editorProps} suggestions={suggestions} onValueChange={onValueChange} onSuggestionSelect={onSuggestionSelect} />
          : <Textarea {...editorProps} onChange={event => onValueChange(event.currentTarget.value)} />}
        <Inline className="flood-message-composer__actions">
          {onFilesSelect && <FileTrigger accept={accept} multiple disabled={disabled} label={attachLabel} onFilesSelect={onFilesSelect}
            trigger={trigger => <IconButton {...trigger} size="sm" variant="ghost" label={attachLabel} title={attachLabel}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="m21 11-9 9a5 5 0 0 1-7-7l9-9a3.25 3.25 0 0 1 4.6 4.6l-9 9a1.5 1.5 0 0 1-2.1-2.1l8-8" />
              </svg>
            </IconButton>} />}
          {leadingActions}
          {sendPresentation === "label" && !streaming
            ? <Button className="flood-message-composer__primary" type="submit" size="sm" disabled={!canSend}>{sendLabel}</Button>
            : <IconButton className="flood-message-composer__primary" type={streaming ? "button" : "submit"} size="sm"
            variant={canSend || canStop ? "solid" : "ghost"} label={streaming ? stopLabel : sendLabel} title={streaming ? stopLabel : sendLabel}
            disabled={streaming ? !canStop : !canSend} onClick={streaming ? () => {
              if (!canStop) return;
              focusDraft();
              onStop?.();
            } : undefined}>
            {streaming ? <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 19V5m-6 6 6-6 6 6" />
            </svg>}
          </IconButton>}
        </Inline>
      </Surface>
    </form>
  );
});
