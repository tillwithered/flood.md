import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const designRoot = path.join(root, "docs/design");
const sourcePath = path.join(root, "src/design/tokens.json");
const runtimeCssPath = path.join(root, "src/design/tokens.css");
const generatedRoot = path.join(designRoot, "generated");
const mode = process.argv[2] ?? "--check";
const errors = [];
const tokenName = /^--[a-z][a-z0-9-]*$/;
const hexColor = /^#[\da-f]{6}$/i;
const directAlias = /^var\(\s*(--[a-z][a-z0-9-]*)\s*\)$/;
const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const relative = (file) => path.relative(root, file).replaceAll("\\", "/");
const escapeCell = (value) => String(value).replaceAll("|", "\\|").replaceAll("\n", " ");

function isRgbColor(value) {
  const number = "(\\d+(?:\\.\\d+)?%?)";
  const alpha = "((?:\\d*\\.)?\\d+%?)";
  const modern = new RegExp(`^rgba?\\(\\s*${number}\\s+${number}\\s+${number}(?:\\s*/\\s*${alpha})?\\s*\\)$`);
  const legacy = new RegExp(`^rgba?\\(\\s*${number}\\s*,\\s*${number}\\s*,\\s*${number}(?:\\s*,\\s*${alpha})?\\s*\\)$`);
  const match = value.match(modern) ?? value.match(legacy);
  if (!match) return false;
  return match.slice(1, 4).every((part) => parseFloat(part) <= (part.endsWith("%") ? 100 : 255)) &&
    (!match[4] || parseFloat(match[4]) <= (match[4].endsWith("%") ? 100 : 1));
}

function fail(message) {
  errors.push(message);
}

function references(value) {
  return [...value.matchAll(/var\(\s*(--[a-z][a-z0-9-]*)/g)].map((match) => match[1]);
}

function validateMap(value, label, colorsOnly = false) {
  if (!isRecord(value) || !Object.keys(value).length) {
    fail(`${label} must be a nonempty token object.`);
    return {};
  }
  const valid = {};
  for (const [name, css] of Object.entries(value)) {
    if (!tokenName.test(name)) {
      fail(`${label}: invalid token name ${name}.`);
      continue;
    }
    if (typeof css !== "string" || !css.trim() || /[;{}\r\n]/.test(css)) {
      fail(`${label}.${name} must be a nonempty CSS value without declaration delimiters.`);
      continue;
    }
    if (colorsOnly && !hexColor.test(css) && !directAlias.test(css) && !isRgbColor(css)) {
      fail(`${label}.${name} must be a six-digit hex color, rgb() color or direct var(--token) alias.`);
      continue;
    }
    valid[name] = css;
  }
  return valid;
}

function validateAliases(tokens, label) {
  const visiting = new Set();
  const visited = new Set();
  function visit(name, trail = []) {
    if (visiting.has(name)) {
      fail(`${label}: cyclic token alias ${[...trail, name].join(" → ")}.`);
      return;
    }
    if (visited.has(name)) return;
    visiting.add(name);
    for (const target of references(tokens[name])) {
      if (!(target in tokens)) fail(`${label}.${name}: unresolved alias ${target}.`);
      else visit(target, [...trail, name]);
    }
    visiting.delete(name);
    visited.add(name);
  }
  for (const name of Object.keys(tokens)) visit(name);
}

function resolveColor(name, tokens, trail = new Set()) {
  if (trail.has(name) || !(name in tokens)) return null;
  const value = tokens[name];
  if (hexColor.test(value)) return value;
  const alias = value.match(directAlias);
  if (!alias) return null;
  return resolveColor(alias[1], tokens, new Set([...trail, name]));
}

function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map((part) => parseInt(part, 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function validateContract(contract) {
  if (!isRecord(contract)) throw new Error("Token source must contain a JSON object.");
  if (!(typeof contract.version === "string" && contract.version.trim()) &&
      !(typeof contract.version === "number" && Number.isFinite(contract.version) && contract.version > 0)) {
    fail("version must be a nonempty string or positive number.");
  }
  if (typeof contract.status !== "string" || !contract.status.trim()) fail("status must be a nonempty string.");
  const themes = {};
  if (!isRecord(contract.themes)) fail("themes must contain light and dark token objects.");
  for (const theme of ["light", "dark"]) themes[theme] = validateMap(contract.themes?.[theme], `themes.${theme}`, true);
  if (isRecord(contract.themes) && Object.keys(contract.themes).some((theme) => !(theme in themes))) {
    fail("Only light and dark themes are currently supported.");
  }
  const scales = validateMap(contract.scales, "scales");
  const brand = contract.brand === undefined ? {} : validateMap(contract.brand, "brand");
  const lightKeys = Object.keys(themes.light).sort();
  const darkKeys = Object.keys(themes.dark).sort();
  if (JSON.stringify(lightKeys) !== JSON.stringify(darkKeys)) fail("Light and dark themes must define identical token names.");
  for (const name of Object.keys(scales)) {
    if (name in themes.light || name in themes.dark || name in brand) fail(`${name} appears in multiple token groups.`);
  }
  for (const name of Object.keys(brand)) {
    if (name in themes.light || name in themes.dark) fail(`${name} appears in both themes and brand exceptions.`);
  }
  for (const [theme, tokens] of Object.entries(themes)) validateAliases({ ...scales, ...brand, ...tokens }, theme);
  const notes = contract.notes ?? {};
  if (!isRecord(notes)) fail("notes must be an object keyed by token names.");
  else for (const [name, description] of Object.entries(notes)) {
    if (!(name in themes.light) && !(name in themes.dark) && !(name in scales) && !(name in brand)) fail(`notes references unknown token ${name}.`);
    if (typeof description !== "string" || !description.trim()) fail(`notes.${name} must be nonempty text.`);
  }
  for (const name of Object.keys(brand)) {
    if (!isRecord(notes) || typeof notes[name] !== "string" || !notes[name].trim()) {
      fail(`Brand exception ${name} requires a provenance and usage note.`);
    }
  }

  const measurements = [];
  if (!Array.isArray(contract.contrast) || !contract.contrast.length) fail("contrast must declare at least one required pair.");
  else for (const [index, pair] of contract.contrast.entries()) {
    if (!isRecord(pair) || !tokenName.test(pair.foreground ?? "") || !tokenName.test(pair.background ?? "") ||
        typeof pair.minimum !== "number" || !Number.isFinite(pair.minimum) || pair.minimum < 1 || pair.minimum > 21) {
      fail(`contrast[${index}] requires foreground/background token names and a minimum from 1 to 21.`);
      continue;
    }
    const pairThemes = pair.themes ?? (pair.theme ? [pair.theme] : Object.keys(themes));
    if (!Array.isArray(pairThemes) || !pairThemes.length || pairThemes.some((theme) => !(theme in themes))) {
      fail(`contrast[${index}] contains an unsupported theme.`);
      continue;
    }
    for (const theme of pairThemes) {
      const tokens = { ...scales, ...brand, ...themes[theme] };
      const foreground = resolveColor(pair.foreground, tokens);
      const background = resolveColor(pair.background, tokens);
      if (!foreground || !background) {
        fail(`contrast[${index}] (${theme}): both references must resolve to six-digit hex colors.`);
        continue;
      }
      const ratio = contrastRatio(foreground, background);
      measurements.push({ ...pair, theme, ratio });
      if (ratio < pair.minimum) fail(`${theme}: ${pair.foreground} / ${pair.background} is ${ratio.toFixed(2)}:1; requires ${pair.minimum}:1.`);
    }
  }
  return { ...contract, themes, scales, brand, notes, measurements };
}

function generate(contract) {
  const declarations = (tokens) => Object.entries(tokens).map(([name, value]) => `  ${name}: ${value};`).join("\n");
  const css = `/* Generated from src/design/tokens.json by scripts/design-contract.mjs.
 * Shared runtime foundations and documentation specimen tokens.
 * Static checks do not establish native visual or interaction acceptance.
 * Do not edit this file. Run node scripts/design-contract.mjs --write.
 */
:root {
${declarations(contract.scales)}
${declarations(contract.brand)}
${declarations(contract.themes.light)}
}

:root[data-theme="dark"] {
${declarations(contract.themes.dark)}
}
`;
  const rows = (tokens, themed) => Object.entries(tokens).map(([name, value]) => {
    const values = themed ? `${escapeCell(value)}\` | \`${escapeCell(contract.themes.dark[name])}` : escapeCell(value);
    return `| \`${name}\` | \`${values}\` | ${escapeCell(contract.notes[name] ?? "—")} |`;
  }).join("\n");
  const markdown = `# Generated runtime token reference

Version: **${escapeCell(contract.version)}**. Status: **${escapeCell(contract.status)}**.

Generated from [the single authored token source](../../../src/design/tokens.json); edit that source and run \`node scripts/design-contract.mjs --write\`.
The application imports [generated runtime CSS](../../../src/design/tokens.css) through \`src/styles.css\`. The documentation specimen receives the same generated values. The former candidate path is a [compatibility pointer](../tokens.target.json), not a second token source.
This initial foundation migration preserves current page gutters, content widths and desktop sidebar geometry. Native visual and interaction acceptance is separate from token validation.

## Semantic colors

| Token | Light | Dark | Purpose |
| --- | --- | --- | --- |
${rows(contract.themes.light, true)}

## Common scales

| Token | Value | Purpose |
| --- | --- | --- |
${rows(contract.scales, false)}

## Registered legacy brand exceptions

These existing gradient values are retained for compatibility. They are not ordinary interface color roles and must not replace supplied raster blobs. New consumers require a brand-contract decision.

| Token | Value | Purpose |
| --- | --- | --- |
${rows(contract.brand, false)}

## Declared contrast pairs

Ratios use opaque sRGB colors. Alpha compositing, rendered states, images, overlays and focus geometry require separate UI verification.

| Theme | Foreground | Background | Measured | Minimum |
| --- | --- | --- | --- | --- |
${contract.measurements.map((pair) => `| ${pair.theme} | \`${pair.foreground}\` | \`${pair.background}\` | ${pair.ratio.toFixed(2)}:1 | ${pair.minimum}:1 |`).join("\n")}
`;
  const compatibility = {
    version: contract.version,
    status: "generated-compatibility-pointer",
    source: "../../src/design/tokens.json",
    generatedBy: "scripts/design-contract.mjs",
    migration: "The former candidate token source was adopted into the initial runtime UI-kit slice. Values are authored only in src/design/tokens.json; this file intentionally contains no token values.",
    outputs: ["../../src/design/tokens.css", "generated/tokens.css", "generated/token-reference.md"]
  };
  return new Map([
    [runtimeCssPath, css],
    [path.join(generatedRoot, "tokens.css"), css],
    [path.join(generatedRoot, "token-reference.md"), markdown],
    [path.join(designRoot, "tokens.target.json"), JSON.stringify(compatibility, null, 2) + "\n"]
  ]);
}

async function markdownFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await markdownFiles(file));
    else if (entry.isFile() && entry.name.endsWith(".md")) files.push(file);
  }
  return files;
}

async function checkLocalLinks() {
  let count = 0;
  for (const file of await markdownFiles(designRoot)) {
    const markdown = (await readFile(file, "utf8"))
      .replace(/^\s*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\s*\1\s*$/gm, "")
      .replace(/`[^`\n]*`/g, "");
    const destinations = [
      ...markdown.matchAll(/!?\[[^\]\n]*\]\(\s*(?:<([^>\n]+)>|([^\s)]+))(?:\s+["'][^\n]*?["'])?\s*\)/g),
      ...markdown.matchAll(/^\s{0,3}\[[^\]\n]+\]:\s*(?:<([^>\n]+)>|(\S+))/gm)
    ];
    for (const match of destinations) {
      const destination = match[1] ?? match[2];
      const windowsPath = /^[a-z]:[\\/]/i.test(destination);
      if (!windowsPath && (/^[a-z][a-z\d+.-]*:/i.test(destination) || destination.startsWith("//"))) continue;
      const withoutFragment = destination.split(/[?#]/, 1)[0];
      if (!withoutFragment) continue;
      let decoded;
      try { decoded = decodeURIComponent(withoutFragment); }
      catch { fail(`${relative(file)}: malformed local link ${destination}.`); continue; }
      const target = windowsPath ? path.resolve(decoded) : decoded.startsWith("/")
        ? path.resolve(root, decoded.slice(1)) : path.resolve(path.dirname(file), decoded);
      count++;
      try { await stat(target); }
      catch { fail(`${relative(file)}: local link does not exist: ${destination}.`); }
    }
  }
  return count;
}

async function checkRuntimeOwnership(contract) {
  const sharedTokens = new Set([
    ...Object.keys(contract.themes.light), ...Object.keys(contract.scales), ...Object.keys(contract.brand)
  ]);
  async function inspect(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) { await inspect(file); continue; }
      if (!entry.isFile() || file === runtimeCssPath || !/\.(css|svelte)$/.test(file)) continue;
      const source = (await readFile(file, "utf8")).replace(/\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/g, "");
      for (const match of source.matchAll(/(--[a-z][a-z0-9-]*)\s*:/g)) {
        if (sharedTokens.has(match[1])) fail(`${relative(file)} redeclares foundation token ${match[1]}; edit src/design/tokens.json instead.`);
      }
    }
  }
  await inspect(path.join(root, "src"));
  const styles = await readFile(path.join(root, "src/styles.css"), "utf8");
  const imports = [...styles.matchAll(/@import\s+["']\.\/design\/tokens\.css["']\s*;/g)];
  if (imports.length !== 1) fail("src/styles.css must import ./design/tokens.css exactly once.");
}

async function reportCurrentCssDebt() {
  try {
    const css = await readFile(path.join(root, "src/styles.css"), "utf8");
    const light = css.match(/:root\s*\{([\s\S]*?)\}/)?.[1] ?? "";
    const ink = light.match(/--danger-ink:\s*(#[\da-f]{6})\b/i)?.[1];
    const surface = light.match(/--danger-surface:\s*(#[\da-f]{6})\b/i)?.[1];
    if (ink && surface) {
      const ratio = contrastRatio(ink, surface);
      console.log(`Current CSS static ${ratio < 4.5 ? "debt" : "sample"} (nonfailing): danger ink/surface ${ratio.toFixed(2)}:1; small-text target 4.5:1. This is not desktop UI verification.`);
    }
  } catch (error) {
    if (error.code !== "ENOENT") console.warn(`Could not inspect current CSS: ${error.message}`);
  }
}

try {
  if (!["--write", "--check"].includes(mode) || process.argv.length > 3) throw new Error("Usage: node scripts/design-contract.mjs [--write|--check]");
  const contract = validateContract(JSON.parse(await readFile(sourcePath, "utf8")));
  if (!errors.length) {
    const outputs = generate(contract);
    if (mode === "--write") {
      await mkdir(generatedRoot, { recursive: true });
      await mkdir(path.dirname(runtimeCssPath), { recursive: true });
    }
    for (const [file, expected] of outputs) {
      if (mode === "--write") await writeFile(file, expected, "utf8");
      else {
        let actual = "";
        try { actual = await readFile(file, "utf8"); } catch (error) { if (error.code !== "ENOENT") throw error; }
        if (actual.replaceAll("\r\n", "\n") !== expected) fail(`${relative(file)} is missing or stale. Run node scripts/design-contract.mjs --write.`);
      }
    }
    await checkRuntimeOwnership(contract);
    const linkCount = await checkLocalLinks();
    if (!errors.length) {
      console.log(`Runtime token contract ${mode === "--write" ? "generated" : "checked"}: ${contract.measurements.length} declared contrast pairs pass; generated runtime and specimen files share one authored source.`);
      console.log(`${linkCount} local Markdown link paths checked (fragments and external URLs excluded). Native appearance and interaction still require Tauri verification.`);
    }
  }
  await reportCurrentCssDebt();
  if (errors.length) throw new Error(errors.map((message) => `- ${message}`).join("\n"));
} catch (error) {
  console.error(`Design contract check failed:\n${error.message}`);
  process.exitCode = 1;
}
