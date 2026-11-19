import { Fragment, forwardRef, useState } from "react";
import { Button, Table, Text, type CodeDiffLine, type CodeDiffProps } from "./index.js";
import { SourceLine } from "./source-line.js";

type Side = "before" | "after";
interface DiffBlock {
  context: boolean;
  lines: CodeDiffLine[];
}

function groupLines(lines: readonly CodeDiffLine[]) {
  const blocks: DiffBlock[] = [];
  for (const line of lines) {
    const context = line.kind === "context";
    const previous = blocks.at(-1);
    if (previous?.context === context) previous.lines.push(line);
    else blocks.push({ context, lines: [line] });
  }
  return blocks;
}

export const SourceCodeDiff = /* @__PURE__ */ forwardRef<HTMLTableElement, CodeDiffProps>(function SourceCodeDiff({
  label, hunks, layout = "unified", contextLines = 3, wrap = false, labels, renderLineAction, density = "compact",
  hideCaption = true, className, ...props
}, ref) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const names = {
    before: labels?.before ?? "Before",
    after: labels?.after ?? "After",
    code: labels?.code ?? "Code",
    added: labels?.added ?? "Added line",
    removed: labels?.removed ?? "Removed line",
    context: labels?.context ?? "Unchanged line",
    empty: labels?.empty ?? "No lines to review.",
    expand: labels?.expand ?? ((count: number) => `Show ${count} unchanged ${count === 1 ? "line" : "lines"}`),
    collapse: labels?.collapse ?? ((count: number) => `Hide ${count} unchanged ${count === 1 ? "line" : "lines"}`),
  };
  if (![label, names.before, names.after, names.code, names.added, names.removed, names.context, names.empty].every(name => name.trim()))
    throw new Error("Flood CodeDiff requires readable labels");
  if (!Number.isSafeInteger(contextLines) || contextLines < 0)
    throw new RangeError("Flood CodeDiff contextLines must be a nonnegative safe integer");
  if (new Set(hunks.map(hunk => hunk.id)).size !== hunks.length || hunks.some(hunk =>
    !hunk.id.trim() || new Set(hunk.lines.map(line => line.id)).size !== hunk.lines.length || hunk.lines.some(line =>
      !line.id.trim() ||
      /[\r\n]/.test(line.text) ||
      (line.kind !== "added" && (!Number.isSafeInteger(line.oldLine) || line.oldLine < 1)) ||
      (line.kind !== "removed" && (!Number.isSafeInteger(line.newLine) || line.newLine < 1)))))
    throw new Error("Flood CodeDiff requires unique hunk and line IDs, one source line per entry and positive line numbers");

  const unified = layout === "unified";
  const cellCount = unified ? 3 : 4;
  const hasLines = hunks.some(hunk => hunk.lines.length);

  function toggle(id: string) {
    setExpanded(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function renderNumbers(line?: CodeDiffLine, side?: Side) {
    const number = side === "before" ? line?.oldLine : line?.newLine;
    return <td className="flood-code-diff__number" data-side={side} data-diff-kind={line?.kind}>
      {number}
    </td>;
  }

  function renderSource(line?: CodeDiffLine, side?: Side) {
    if (!line) return <td className="flood-code-diff__content" data-gap />;
    const mark = line.kind === "added" ? "+" : line.kind === "removed" ? "−" : " ";
    const action = side ? renderLineAction?.(line, side) : null;
    return <td className="flood-code-diff__content" data-diff-kind={line.kind}>
      <SourceLine text={line.text} label={names[line.kind]} marker={mark} action={action} wrap={wrap} />
    </td>;
  }

  function renderSingle(line: CodeDiffLine) {
    return unified ? <tr key={line.id}>
      {renderNumbers(line, "before")}
      {renderNumbers(line, "after")}
      {renderSource(line, line.kind === "removed" ? "before" : "after")}
    </tr> : renderSplit(line, line);
  }

  function renderSplit(before?: CodeDiffLine, after?: CodeDiffLine) {
    return <tr key={JSON.stringify([before?.id, after?.id])}>
      {renderNumbers(before, "before")}
      {renderSource(before, "before")}
      {renderNumbers(after, "after")}
      {renderSource(after, "after")}
    </tr>;
  }

  function renderBlock(hunkId: string, block: DiffBlock) {
    const firstId = block.lines[0].id;
    const id = JSON.stringify([hunkId, firstId]);
    const hiddenCount = block.lines.length - contextLines * 2;
    if (block.context && hiddenCount > 0) {
      const open = expanded.has(id);
      const action = (open ? names.collapse : names.expand)(hiddenCount);
      if (!action.trim()) throw new Error("Flood CodeDiff context toggles require accessible names");
      const tail = block.lines.length - contextLines;
      return <Fragment key={firstId}>
        {block.lines.slice(0, contextLines).map(renderSingle)}
        <tr className="flood-code-diff__context">
          <td colSpan={cellCount}><Button size="sm" variant="ghost" aria-expanded={open} onClick={() => toggle(id)}>{action}</Button></td>
        </tr>
        {open && block.lines.slice(contextLines, tail).map(renderSingle)}
        {block.lines.slice(tail).map(renderSingle)}
      </Fragment>;
    }
    if (unified || block.context) return <Fragment key={firstId}>{block.lines.map(renderSingle)}</Fragment>;
    const before = block.lines.filter(line => line.kind === "removed");
    const after = block.lines.filter(line => line.kind === "added");
    return <Fragment key={firstId}>
      {Array.from({ length: Math.max(before.length, after.length) }, (_, index) => renderSplit(before[index], after[index]))}
    </Fragment>;
  }

  return <Table {...props} ref={ref} caption={label} hideCaption={hideCaption} density={density} cellVerticalAlign="top"
    className={["flood-code-diff", className].filter(Boolean).join(" ")} data-layout={layout} data-wrap={wrap || undefined}>
    {unified ? <colgroup>
      <col className="flood-code-diff__gutter" /><col className="flood-code-diff__gutter" /><col />
    </colgroup> : <>
      <colgroup><col className="flood-code-diff__gutter" /><col /></colgroup>
      <colgroup><col className="flood-code-diff__gutter" /><col /></colgroup>
    </>}
    <thead><tr>
      <th scope={unified ? "col" : "colgroup"} colSpan={unified ? undefined : 2}>{names.before}</th>
      <th scope={unified ? "col" : "colgroup"} colSpan={unified ? undefined : 2}>{names.after}</th>
      {unified && <th scope="col">{names.code}</th>}
    </tr></thead>
    {hasLines ? hunks.filter(hunk => hunk.lines.length).map(hunk => <tbody key={hunk.id}>
      {hunk.label && <tr className="flood-code-diff__hunk">
        <th scope="rowgroup" colSpan={cellCount}><Text size="helper" tone="subtle">{hunk.label}</Text></th>
      </tr>}
      {groupLines(hunk.lines).map(block => renderBlock(hunk.id, block))}
    </tbody>) : <tbody><tr><td colSpan={cellCount}><Text size="compact" tone="subtle">{names.empty}</Text></td></tr></tbody>}
  </Table>;
});
