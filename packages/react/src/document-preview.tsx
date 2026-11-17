import {forwardRef, useId, useLayoutEffect, useRef, useState} from "react";
import {Button, Dialog, EmptyState, ErrorState, Inline, Input, LoadingState, Pagination, ScrollArea, Text, VisuallyHidden, type DocumentPreviewProps} from "./index.js";

type PreviewBodyProps = Pick<DocumentPreviewProps, "pageCount" | "renderPage" | "action" | "labels"> & {
  page: number;
  onPageChange: (page: number) => void;
};

function DocumentPreviewBody({page, pageCount, renderPage, action, labels, onPageChange}: PreviewBodyProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const pageInput = useRef<HTMLInputElement>(null);
  const pendingArrow = useRef<HTMLButtonElement | null>(null);
  const errorId = useId();
  const [draft, setDraft] = useState<{page: number; value: string; invalid?: boolean}>();
  const value = draft?.page === page ? draft.value : "";
  const invalid = draft?.page === page && draft.invalid;
  const result = pageCount > 0 ? renderPage(page) : null;
  const position = labels?.position ?? ((current: number, total: number) => `Page ${current} of ${total}`);

  useLayoutEffect(() => {
    if (viewport.current) {
      viewport.current.scrollTop = 0;
      viewport.current.scrollLeft = 0;
    }
  }, [page]);

  useLayoutEffect(() => {
    const arrow = pendingArrow.current;
    pendingArrow.current = null;
    if (arrow?.disabled) {
      const document = arrow.ownerDocument;
      if (document.activeElement === arrow || document.activeElement === document.body) {
        viewport.current?.focus({preventScroll: true});
      }
    }
  }, [page, pageCount]);

  const jump = () => {
    const next = Number(value);
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(next) || next < 1 || next > pageCount) {
      setDraft({page, value, invalid: true});
      pageInput.current?.focus({preventScroll: true});
      return;
    }
    setDraft(undefined);
    pendingArrow.current = null;
    if (next !== page) onPageChange(next);
  };

  return <>
    <ScrollArea ref={viewport} orientation="both" contentInset="none" role="region"
      aria-label={labels?.viewport ?? "Document page"} tabIndex={0} className="flood-document-preview__viewport">
      <div className="flood-document-preview__page" data-state={result?.state ?? "empty"}>
        {result?.state === "ready" ? <div key={page} className="flood-document-preview__content">{result.content}</div>
          : result?.state === "loading" ? <LoadingState label={labels?.loading ?? "Loading page…"} announce />
          : result?.state === "error" ? <ErrorState title={labels?.error ?? "Could not load this page"} headingLevel={3}
            onRetry={result.onRetry ? () => {
              viewport.current?.focus({preventScroll: true});
              result.onRetry?.();
            } : undefined} retryLabel={labels?.retry} />
          : <EmptyState title={labels?.empty ?? "This document has no pages"} headingLevel={3} />}
      </div>
    </ScrollArea>
    {(pageCount > 1 || action != null) && <Inline gap="3" align="center" className="flood-document-preview__controls">
      {pageCount > 1 && <Inline gap="3" align="center" className="flood-document-preview__navigation">
        <Pagination label={labels?.navigation ?? "Document pages"} presentation="compact" page={page} pageCount={pageCount}
          previousLabel={labels?.previousPage} nextLabel={labels?.nextPage} positionLabel={position}
          onPageChange={next => {
            const active = viewport.current?.ownerDocument.activeElement;
            pendingArrow.current = active?.tagName === "BUTTON" ? active as HTMLButtonElement : null;
            onPageChange(next);
          }} />
        <Inline gap="2" align="center" className="flood-document-preview__jump">
          <Input ref={pageInput} inputMode="numeric" type="text" controlSize="sm" aria-label={labels?.pageNumber ?? "Page number"}
            placeholder={labels?.pageNumber ?? "Page"}
            value={value} aria-invalid={invalid || undefined} aria-describedby={invalid ? errorId : undefined}
            onChange={event => setDraft({page, value: event.currentTarget.value})}
            onKeyDown={event => {
              if (event.key !== "Enter" || event.nativeEvent.isComposing || event.defaultPrevented) return;
              event.preventDefault();
              jump();
            }} />
          <Button size="sm" variant="subtle" onClick={jump}>{labels?.goToPage ?? "Go"}</Button>
        </Inline>
      </Inline>}
      {action != null && <div className="flood-document-preview__action">{action}</div>}
      {invalid && <Text as="p" id={errorId} role="status" size="helper" tone="error" className="flood-document-preview__error">
        {labels?.invalidPage?.(pageCount) ?? `Enter a page from 1 to ${pageCount}.`}
      </Text>}
    </Inline>}
    <VisuallyHidden role="status" aria-atomic="true">{pageCount > 0 && position(page, pageCount)}</VisuallyHidden>
  </>;
}

export const ModalDocumentPreview = /* @__PURE__ */ forwardRef<HTMLDialogElement, DocumentPreviewProps>(function ModalDocumentPreview(
  {pageCount, renderPage, page, defaultPage = 1, onPageChange, action, labels, className, ...props}, ref,
) {
  const [localPage, setLocalPage] = useState(defaultPage);
  if (!Number.isSafeInteger(pageCount) || pageCount < 0 ||
      [page, defaultPage].some(value => value !== undefined && (!Number.isSafeInteger(value) || value < 1))) {
    throw new RangeError("Flood DocumentPreview requires a nonnegative page count and positive whole page numbers");
  }
  const currentPage = Math.min(page ?? localPage, Math.max(pageCount, 1));
  useLayoutEffect(() => {
    if (page === undefined && localPage !== currentPage) setLocalPage(currentPage);
  }, [currentPage, localPage, page]);
  return <Dialog {...props} ref={ref} className={["flood-document-preview", className].filter(Boolean).join(" ")}>
    <DocumentPreviewBody page={currentPage} pageCount={pageCount} renderPage={renderPage} action={action} labels={labels}
      onPageChange={next => {
        if (page === undefined) setLocalPage(next);
        onPageChange?.(next);
      }} />
  </Dialog>;
});
