#!/usr/bin/env node
import { run } from "../lib/index.mjs";
try {
  await run(process.argv.slice(2));
} catch (error) {
  if (['info','catalog','read'].includes(process.argv[2])) console.error(JSON.stringify({ok:false,error:{code:error.code ?? 'KNOWLEDGE_ERROR',message:error.message}}));
  else console.error(`Flood: ${error.message}`);
  process.exitCode = 1;
}
