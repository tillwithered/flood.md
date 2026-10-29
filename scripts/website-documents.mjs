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
  return content;
}
