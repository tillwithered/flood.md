// Build-time compiler for Flood's deliberately limited DTCG token profile.
// No CSS expressions or external references are executed from source data.
const segment = /^(?:(?:[a-z]|[1-9][0-9]*[a-z])[a-z0-9]*(?:-[a-z0-9]+)*|0|[1-9][0-9]*)$/;
const reference = /^\{((?:ref|sys|comp|exp)\.[a-z0-9.-]+)\}$/;
const types = new Set([
  "color",
  "dimension",
  "number",
  "duration",
  "fontFamily",
  "fontWeight",
  "cubicBezier",
]);
const layers = new Set(["ref", "sys", "comp", "exp"]);
const sorted = (items) =>
  [...items].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
const object = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const finite = (value) => typeof value === "number" && Number.isFinite(value);
const fail = (message) => {
  throw new Error(`Tokens: ${message}`);
};
const keys = (value, allowed, label) => {
  if (!object(value)) fail(`${label}: expected an object`);
  for (const key of Object.keys(value))
    if (!allowed.includes(key)) fail(`${label}: unknown key ${key}`);
};
const cssName = (id) => `--flood-${id.replaceAll(".", "-")}`;

function metadata(token, id) {
  keys(
    token,
    ["$type", "$value", "$description", "$extensions", "$deprecated"],
    id,
  );
  if (!types.has(token.$type)) fail(`${id}: unsupported type ${token.$type}`);
  if (typeof token.$description !== "string" || !token.$description.trim())
    fail(`${id}: description required`);
  const meta = token.$extensions?.["md.flood"];
  if (!object(meta)) fail(`${id}: md.flood metadata required`);
  keys(
    meta,
    ["status", "visibility", "owner", "since", "usage"],
    `${id} metadata`,
  );
  if (!["experimental", "stable", "deprecated"].includes(meta.status))
    fail(`${id}: invalid status`);
  if (!["internal", "public"].includes(meta.visibility))
    fail(`${id}: invalid visibility`);
  if (
    typeof meta.owner !== "string" ||
    !meta.owner.trim() ||
    typeof meta.since !== "string" ||
    !meta.since.trim()
  )
    fail(`${id}: owner and since required`);
  keys(meta.usage, ["allowed", "avoid"], `${id} usage`);
  for (const name of ["allowed", "avoid"]) {
    if (
      !Array.isArray(meta.usage[name]) ||
      meta.usage[name].some((x) => typeof x !== "string" || !x.trim())
    )
      fail(`${id}: usage.${name} must contain strings`);
  }
  if (meta.usage.allowed.length === 0) fail(`${id}: allowed usage required`);
  if (
    meta.status === "deprecated" &&
    (typeof token.$deprecated !== "string" || !token.$deprecated.trim())
  )
    fail(`${id}: deprecation explanation required`);
  if (token.$deprecated !== undefined && meta.status !== "deprecated")
    fail(`${id}: deprecation status mismatch`);
  return meta;
}

function valueCSS(type, value, id) {
  switch (type) {
    case "color": {
      keys(value, ["colorSpace", "components", "alpha"], id);
      if (
        value.colorSpace !== "srgb" ||
        !Array.isArray(value.components) ||
        value.components.length !== 3 ||
        value.components.some((x) => !finite(x) || x < 0 || x > 1)
      )
        fail(`${id}: expected an sRGB color in range 0..1`);
      const alpha = value.alpha ?? 1;
      if (!finite(alpha) || alpha < 0 || alpha > 1)
        fail(`${id}: alpha outside 0..1`);
      return `rgb(${value.components.map((x) => Number((x * 255).toFixed(6))).join(" ")}${alpha === 1 ? "" : ` / ${alpha}`})`;
    }
    case "dimension":
    case "duration": {
      keys(value, ["value", "unit"], id);
      const units = type === "dimension" ? ["px", "rem", "em"] : ["ms", "s"];
      if (
        !finite(value.value) ||
        (value.value < 0 && !(type === "dimension" && value.unit === "em")) ||
        !units.includes(value.unit)
      )
        fail(`${id}: invalid ${type}`);
      return `${value.value}${value.unit}`;
    }
    case "number":
      if (!finite(value)) fail(`${id}: expected a finite number`);
      return String(value);
    case "fontWeight":
      if (!finite(value) || value < 1 || value > 1000)
        fail(`${id}: font weight outside 1..1000`);
      return String(value);
    case "fontFamily": {
      const families = typeof value === "string" ? [value] : value;
      if (
        !Array.isArray(families) ||
        !families.length ||
        families.some(
          (x) =>
            typeof x !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9 -]*$/.test(x),
        )
      )
        fail(`${id}: invalid font family`);
      const generic = new Set([
        "serif",
        "sans-serif",
        "monospace",
        "cursive",
        "fantasy",
        "system-ui",
      ]);
      return families
        .map((x) => (generic.has(x) ? x : JSON.stringify(x)))
        .join(", ");
    }
    case "cubicBezier":
      if (
        !Array.isArray(value) ||
        value.length !== 4 ||
        value.some((x) => !finite(x)) ||
        value[0] < 0 ||
        value[0] > 1 ||
        value[2] < 0 ||
        value[2] > 1
      )
        fail(`${id}: invalid cubic bezier`);
      return `cubic-bezier(${value.join(", ")})`;
    default:
      fail(`${id}: unsupported type ${type}`);
  }
}

function flatten(tree, path = [], result = new Map()) {
  if (!object(tree) || path.length > 16)
    fail(`${path.join(".")}: invalid group`);
  if (Object.hasOwn(tree, "$value")) {
    const id = path.join(".");
    if (path.length < 3 || !layers.has(path[0]))
      fail(`${id}: invalid token path`);
    const meta = metadata(tree, id);
    if (typeof tree.$value === "string" && tree.$value.startsWith("{")) {
      if (!reference.test(tree.$value)) fail(`${id}: malformed alias`);
    } else {
      if (["sys", "comp"].includes(path[0]))
        fail(`${id}: semantic/component tokens require aliases`);
      valueCSS(tree.$type, tree.$value, id);
    }
    result.set(id, { ...tree, meta });
    return result;
  }
  if (!Object.keys(tree).length) fail(`${path.join(".")}: empty group`);
  for (const [key, child] of Object.entries(tree)) {
    if (!segment.test(key)) fail(`${path.join(".")}: invalid name ${key}`);
    flatten(child, [...path, key], result);
  }
  return result;
}

function graph(sets, context) {
  const entries = new Map();
  const names = new Map();
  for (const set of sets)
    for (const [id, token] of flatten(set)) {
      if (entries.has(id))
        fail(`${context}: overlapping set ownership for ${id}`);
      const name = cssName(id);
      if (names.has(name))
        fail(`${context}: CSS name collision ${id} / ${names.get(name)}`);
      names.set(name, id);
      entries.set(id, token);
    }
  const resolved = new Map();
  const visiting = new Set();
  function resolve(id) {
    if (resolved.has(id)) return resolved.get(id);
    if (visiting.has(id)) fail(`${context}: alias cycle at ${id}`);
    const token = entries.get(id);
    if (!token) fail(`${context}: missing reference ${id}`);
    visiting.add(id);
    const target =
      typeof token.$value === "string"
        ? reference.exec(token.$value)?.[1]
        : undefined;
    let value = token.$value,
      dependencies = [];
    if (target) {
      const next = entries.get(target);
      if (!next) fail(`${id}: missing reference ${target}`);
      if (next.$type !== token.$type)
        fail(`${id}: type mismatch with ${target}`);
      const [fromLayer, component] = id.split(".");
      const [toLayer, targetComponent] = target.split(".");
      const allowed = {
        ref: ["ref"],
        sys: ["ref", "sys"],
        comp: ["sys", "comp"],
        exp: ["ref", "sys", "exp"],
      };
      if (!allowed[fromLayer].includes(toLayer))
        fail(`${id}: forbidden layer dependency ${target}`);
      if (
        fromLayer === "comp" &&
        toLayer === "comp" &&
        component !== targetComponent
      )
        fail(`${id}: cross-component alias ${target}`);
      if (token.meta.status === "stable" && next.meta.status === "experimental")
        fail(`${id}: stable token depends on experimental ${target}`);
      const result = resolve(target);
      value = result.value;
      dependencies = [target, ...result.dependencies];
      if (
        token.meta.status === "stable" &&
        dependencies.some(
          (dependency) =>
            entries.get(dependency).meta.status === "experimental",
        )
      )
        fail(`${id}: stable token transitively depends on experimental`);
    }
    const result = {
      value,
      css: target
        ? `var(${cssName(target)})`
        : valueCSS(token.$type, value, id),
      target,
      dependencies,
    };
    visiting.delete(id);
    resolved.set(id, result);
    return result;
  }
  for (const id of entries.keys()) resolve(id);
  return { entries: new Map(sorted(entries)), resolved };
}

function legacyOutput(legacy) {
  keys(legacy, ["shared", "light", "dark"], "legacy");
  for (const mode of ["shared", "light", "dark"]) {
    if (!object(legacy[mode]) || !Object.keys(legacy[mode]).length)
      fail(`legacy.${mode}: nonempty map required`);
    for (const [name, value] of Object.entries(legacy[mode])) {
      if (
        !segment.test(name) ||
        typeof value !== "string" ||
        !value.trim() ||
        /[{};\n\r]|\/\*/.test(value)
      )
        fail(`legacy.${mode}.${name}: unsafe declaration`);
    }
  }
  if (
    Object.keys(legacy.light).sort().join() !==
    Object.keys(legacy.dark).sort().join()
  )
    fail("legacy: light/dark roles differ");
  if (
    Object.keys(legacy.shared).some((key) => Object.hasOwn(legacy.light, key))
  )
    fail("legacy: shared/theme overlap");
  const rules = (values) =>
    Object.entries(values)
      .map(([key, value]) => `  --flood-${key}: ${value};`)
      .join("\n");
  const css = `/* Generated from packages/tokens/src/tokens.json. */\n:root {\n${rules({ ...legacy.shared, ...legacy.light })}\n  color-scheme: light;\n}\n@media (prefers-color-scheme: dark) { :root:not([data-flood-theme="light"]) {\n${rules(legacy.dark)}\n  color-scheme: dark;\n} }\n[data-flood-theme="light"] {\n${rules(legacy.light)}\n  color-scheme: light;\n}\n[data-flood-theme="dark"] {\n${rules(legacy.dark)}\n  color-scheme: dark;\n}\n`;
  return { json: legacy, css };
}

export function compileTokens(source, version) {
  if (typeof version !== "string" || !version.trim())
    fail("build version required");
  keys(source, ["formatVersion", "legacy", "sets", "presets"], "source");
  if (source.formatVersion !== 1) fail("unsupported source formatVersion");
  const legacy = legacyOutput(source.legacy);
  keys(source.sets, ["shared", "palette", "theme"], "sets");
  if (
    !object(source.sets.palette) ||
    !object(source.sets.theme) ||
    !object(source.presets) ||
    !Object.keys(source.presets).length
  )
    fail("palettes, themes and presets required");
  if (source.sets.shared !== undefined) flatten(source.sets.shared);
  for (const [name, set] of Object.entries(source.sets.palette)) {
    if (!segment.test(name)) fail(`invalid palette ${name}`);
    for (const id of flatten(set).keys())
      if (!id.startsWith("ref.color."))
        fail(`palette ${name}: only ref.color allowed`);
  }
  for (const [name, set] of Object.entries(source.sets.theme)) {
    if (!["light", "dark"].includes(name)) fail(`unsupported theme ${name}`);
    for (const id of flatten(set).keys())
      if (id.startsWith("ref."))
        fail(`theme ${name}: reference values must be fixed`);
  }
  const contexts = [];
  const allPublic = new Map();
  const identities = new Map();
  const usedPalettes = new Set();
  const usedThemes = new Set();
  let publicSignature;
  for (const [preset, config] of sorted(Object.entries(source.presets))) {
    if (!segment.test(preset)) fail(`invalid preset ${preset}`);
    keys(config, ["palette", "themes"], `preset ${preset}`);
    if (
      !Object.hasOwn(source.sets.palette, config.palette) ||
      !Array.isArray(config.themes) ||
      !config.themes.length ||
      new Set(config.themes).size !== config.themes.length
    )
      fail(`invalid preset ${preset}`);
    usedPalettes.add(config.palette);
    for (const theme of config.themes) {
      if (
        !["light", "dark"].includes(theme) ||
        !Object.hasOwn(source.sets.theme, theme)
      )
        fail(`${preset}: missing theme ${theme}`);
      usedThemes.add(theme);
      const { entries, resolved } = graph(
        [
          ...(source.sets.shared ? [source.sets.shared] : []),
          source.sets.palette[config.palette],
          source.sets.theme[theme],
        ],
        `${preset}/${theme}`,
      );
      const exported = [...entries].filter(
        ([, token]) => token.meta.visibility === "public",
      );
      const signature = exported
        .map(([id, token]) => `${id}:${token.$type}`)
        .join("|");
      if (publicSignature !== undefined && publicSignature !== signature)
        fail(`${preset}/${theme}: public roles/types differ across contexts`);
      publicSignature = signature;
      for (const [id] of exported) allPublic.set(id, cssName(id));
      const definitions = {};
      const catalog = [];
      for (const [id, token] of entries) {
        const identity = JSON.stringify([
          token.$type,
          token.meta.status,
          token.meta.visibility,
          token.meta.owner,
          token.meta.since,
        ]);
        if (identities.has(id) && identities.get(id) !== identity)
          fail(`${id}: identity differs across contexts`);
        identities.set(id, identity);
        const item = resolved.get(id);
        let group = definitions;
        const parts = id.split(".");
        for (const part of parts.slice(0, -1)) {
          // Legal token names can match inherited Object properties. Never follow
          // prototypes while constructing the resolved diagnostic document.
          if (!Object.hasOwn(group, part)) group[part] = {};
          group = group[part];
        }
        group[parts.at(-1)] = {
          $type: token.$type,
          $value: item.value,
          $description: token.$description,
          $extensions: token.$extensions,
          ...(token.$deprecated ? { $deprecated: token.$deprecated } : {}),
        };
        catalog.push({
          id,
          type: token.$type,
          cssName: cssName(id),
          description: token.$description,
          ...token.meta,
          value: item.value,
          alias: item.target ?? null,
          dependencies: item.dependencies,
          dependents: [...entries.keys()].filter((other) =>
            resolved.get(other).dependencies.includes(id),
          ),
        });
      }
      const selector = `:where([data-flood-foundations="${preset}"][data-flood-theme="${theme}"])`;
      const css = `${selector} {\n${[...entries].map(([id]) => `  ${cssName(id)}: ${resolved.get(id).css};`).join("\n")}\n  color-scheme: ${theme};\n}\n`;
      contexts.push({ preset, theme, css, definitions, catalog });
    }
  }
  if (
    Object.keys(source.sets.palette).some((name) => !usedPalettes.has(name)) ||
    Object.keys(source.sets.theme).some((name) => !usedThemes.has(name))
  )
    fail("unused palette or theme set");
  const tokenNames = Object.fromEntries(sorted(allPublic));
  const js = `// Generated. Flood token API; role stability is recorded in the manifest.\nexport const tokenNames = Object.freeze(${JSON.stringify(tokenNames, null, 2)});\n`;
  const dts = `/** Experimental token IDs and CSS variable names. */\nexport declare const tokenNames: Readonly<{\n${Object.entries(
    tokenNames,
  )
    .map(
      ([id, name]) =>
        `  readonly ${JSON.stringify(id)}: ${JSON.stringify(name)};`,
    )
    .join("\n")}\n}>;\nexport type TokenName = keyof typeof tokenNames;\n`;
  const manifest = {
    schemaVersion: 1,
    version,
    status: "experimental",
    contexts: contexts.map(({ preset, theme, catalog }) => ({
      preset,
      theme,
      tokens: catalog.filter((token) => token.visibility === "public"),
    })),
  };
  return {
    legacy,
    contexts,
    tokenNames,
    js,
    dts,
    manifest,
    css: `/* Generated experimental foundations; explicit scope required. */\n${contexts.map((context) => context.css).join("\n")}`,
  };
}
