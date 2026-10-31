import {readFile} from 'node:fs/promises';
import {readAgentWorkflows, workflowMarkdown} from './agent-workflows.mjs';

/** Resolve source-backed guide inclusions without requiring generated checkout files.
 * Browser shards receive the tested website artifact, not the build job's source cache.
 */
export async function readWebsiteDocument(file, {workflows} = {}) {
  let content = await readFile(`docs/${file}`, 'utf8');
  if (content.includes('<!-- flood:workflows -->')) {
    content = content.replace('<!-- flood:workflows -->', workflowMarkdown(workflows ?? await readAgentWorkflows()));
  }
  if (content.includes('<!-- flood:workspace-review -->')) {
    const source = await readFile('apps/website/src/recipes/workspace-review.tsx', 'utf8');
    content = content.replace('<!-- flood:workspace-review -->', '```tsx\n' + source.trimEnd() + '\n```');
  }
  if (content.includes('<!-- flood:table-bulk-actions -->')) {
    const source = await readFile('apps/website/src/recipes/table-bulk-actions.tsx', 'utf8');
    content = content.replace('<!-- flood:table-bulk-actions -->', '```tsx\n' + source.trimEnd() + '\n```');
  }
  if (content.includes('<!-- flood:grouped-form -->')) {
    const source = await readFile('apps/website/src/recipes/grouped-form.tsx', 'utf8');
    content = content.replace('<!-- flood:grouped-form -->', '```tsx\n' + source.trimEnd() + '\n```');
  }
  return content;
}
