#!/usr/bin/env node
import { run } from "../lib/index.mjs";
try {
  await run(process.argv.slice(2));
} catch (error) {
  console.error(`Flood: ${error.message}`);
  process.exitCode = 1;
}
