import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { chromium, firefox, webkit } from '@playwright/test';
const plan = JSON.parse(await readFile('.artifacts/ci-plan.json','utf8'));
if(typeof plan.full !== 'boolean' || !Array.isArray(plan.components) || !Array.isArray(plan.testFiles))throw Error('Missing browser coverage plan');
const engine=process.argv[2];
if(!['chromium','firefox','webkit'].includes(engine))throw Error('Unknown browser engine');
const gateOnly=process.env.FLOOD_PUBLICATION_ONLY === 'true';
const config=gateOnly?'playwright.site.config.ts':engine==='chromium'?'playwright.config.ts':'playwright.engines.config.ts';
const args=['node_modules/@playwright/test/cli.js','test','--config='+config];
if(engine !== 'chromium')args.push('--project='+engine);
if(process.argv[3]) {
  if(!/^[1-4]\/4$/.test(process.argv[3]))throw Error('Invalid shard');
  args.push('--shard='+process.argv[3]);
}
if(!gateOnly && !plan.full) {
  if(!plan.components.length || !plan.testFiles.length || plan.testFiles.some(p=>!/^tests\/browser\/[a-z0-9-]+\.spec\.ts$/.test(p)))throw Error('Invalid affected coverage plan');
  args.push(...plan.testFiles);
  // A small affected cohort may have no tests in the engine-specific subset.
  // Full candidates never permit an empty suite.
  if(engine !== 'chromium') args.push('--pass-with-no-tests');
  process.env.FLOOD_AFFECTED_COMPONENTS=plan.components.join(',');
}
console.log(`${engine}: ${gateOnly?'publication-only website':plan.full?'full candidate':plan.components.join(', ')}`);
// Detect a broken browser installation/container once, before per-test retries.
const browser = await ({chromium,firefox,webkit})[engine].launch();
await browser.close();
const result=spawnSync(process.execPath,args,{stdio:'inherit',env:process.env});
process.exit(result.status ?? 1);
