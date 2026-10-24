import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { compileTokens } from "../scripts/token-compiler.mjs";

const source = JSON.parse(
  await readFile("packages/tokens/src/tokens.json", "utf8"),
);
const compile = (value) => compileTokens(value, "test-build");
const clone = () => structuredClone(source);
const dark = (value) => value.sets.theme.dark.sys.color;
const meta = (token) => token.$extensions["md.flood"];

test("dark foundations publish coherent role metrics and accessible boundary colors", () => {
  const result = compile(source);
  const values = new Map(result.contexts[0].catalog.map((x) => [x.id, x.value]));
  const metric = (id) => values.get(`sys.${id}`);
  for (const [role, size, line, weight, tracking] of [
    ["large", 32, 40, 500, -.02], ["page", 24, 32, 500, -.02],
    ["section", 20, 28, 500, -.015], ["body", 16, 24, 400, -.01],
    ["compact", 14, 20, 400, -.01], ["label", 13, 18, 400, -.01],
    ["helper", 12, 18, 400, -.01], ["control", 14, 20, 500, -.005],
  ]) {
    assert.deepEqual(metric(`type.${role}.size`), { value: size / 16, unit: "rem" });
    assert.equal(metric(`type.${role}.line-height`), line / size);
    assert.equal(metric(`type.${role}.weight`), weight);
    assert.deepEqual(metric(`type.${role}.tracking`), { value: tracking, unit: "em" });
  }
  const sizes = ["2xs", "xs", "sm", "md", "lg", "xl", "2xl"];
  assert.deepEqual(sizes.map((size) => metric(`control.${size}.height`).value * 16), [24,28,32,40,44,48,56]);
  assert.deepEqual(sizes.map((size) => metric(`control.${size}.icon-size`).value * 16), [14,16,16,20,20,24,24]);
  const luminance = (color) => color.components.map((v) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126,.7152,.0722][i], 0);
  const ratio = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
  for (const surface of ["canvas", "default", "raised", "overlay"]) {
    assert.ok(ratio(metric("color.field.boundary"), metric(`color.surface.${surface}`)) >= 3);
    assert.ok(ratio(metric("color.focus.ring"), metric(`color.surface.${surface}`)) >= 3);
  }
  assert.ok(ratio(metric("color.field.border"), metric("color.field.background")) < 3, "quiet outline is not misrepresented as a required boundary");
  assert.equal(metric("motion.duration-reduced").value, 0);
  assert.equal(metric("color.action.ghost.rest").alpha, 0);
  for (const [state, byte] of Object.entries({ rest: 48, hover: 56, pressed: 74, content: 255, disabled: 48, "disabled-content": 122 })) {
    assert.deepEqual(metric(`color.action.on-surface.${state}`).components, [byte / 255, byte / 255, byte / 255]);
  }
});

test("foundation output is deterministic and preserves the legacy JSON contract", async () => {
  const a = compile(source),
    b = compile(source);
  assert.deepEqual(a, b);
  assert.deepEqual(
    JSON.parse(await readFile("packages/tokens/dist/tokens.json", "utf8")),
    source.legacy,
  );
  assert.deepEqual(Object.keys(a.legacy.json), ["shared", "light", "dark"]);
  assert.equal(a.contexts.length, 1);
  assert.deepEqual(
    a.contexts.map((x) => [x.preset, x.theme]),
    [["neutral", "dark"]],
  );
});

test("semantic values resolve while CSS retains editable aliases", () => {
  const result = compile(source);
  const token = result.contexts[0].catalog.find(
    (x) => x.id === "sys.color.content.default",
  );
  assert.deepEqual(token.value.components, [1, 1, 1]);
  assert.deepEqual(token.dependencies, ["ref.color.neutral.0"]);
  assert.match(
    result.css,
    /--flood-sys-color-content-default: var\(--flood-ref-color-neutral-0\)/,
  );
  assert.equal(
    result.tokenNames["sys.color.content.default"],
    "--flood-sys-color-content-default",
  );
  assert.equal(result.tokenNames["ref.color.neutral.0"], undefined);
  assert.ok(
    result.manifest.contexts[0].tokens.every((x) => x.visibility === "public"),
  );
  assert.deepEqual(
    result.contexts[0].definitions.sys.color.content.default.$value,
    token.value,
  );
  assert.ok(
    result.contexts[0].catalog
      .find((x) => x.id === "ref.color.neutral.0")
      .dependents.includes("sys.color.content.default"),
  );
});

test("missing references and cycles fail with token-specific errors", () => {
  let value = clone();
  dark(value).surface.canvas.$value = "{ref.color.neutral.999}";
  assert.throws(
    () => compile(value),
    /missing reference ref.color.neutral.999/,
  );
  value = clone();
  dark(value).surface.canvas.$value = "{sys.color.surface.default}";
  dark(value).surface.default.$value = "{sys.color.surface.canvas}";
  assert.throws(() => compile(value), /alias cycle/);
});

test("alias types and layer boundaries are enforced", () => {
  let value = clone();
  dark(value).surface.canvas.$value = "{ref.stroke.width.2}";
  assert.throws(() => compile(value), /type mismatch/);
  value = clone();
  value.sets.palette.neutral.ref.color.neutral["0"].$value =
    "{sys.color.content.default}";
  assert.throws(() => compile(value), /forbidden layer dependency/);
  value = clone();
  const width = structuredClone(value.sets.shared.sys.focus.width);
  width.$value = "{sys.focus.width}";
  value.sets.shared.comp = {
    input: { root: { width } },
    button: {
      root: {
        width: { ...structuredClone(width), $value: "{comp.input.root.width}" },
      },
    },
  };
  assert.throws(() => compile(value), /cross-component alias/);
});

test("stable tokens cannot hide experimental dependencies behind deprecated aliases", () => {
  const value = clone();
  const token = dark(value).surface.canvas;
  meta(token).status = "stable";
  token.$value = "{sys.color.surface.default}";
  const intermediate = dark(value).surface.default;
  meta(intermediate).status = "deprecated";
  intermediate.$deprecated = "Use surface.canvas";
  assert.throws(() => compile(value), /transitively depends on experimental/);
});

test("invalid names, alias syntax and flattening collisions are rejected", () => {
  let value = clone();
  dark(value).surface["bad_name"] = dark(value).surface.canvas;
  assert.throws(() => compile(value), /invalid name/);
  value = clone();
  dark(value).surface.canvas.$value = "{ref.color.neutral.0} extra";
  assert.throws(() => compile(value), /malformed alias/);
  value = clone();
  value.sets.theme.dark.sys["color-content"] = {
    default: structuredClone(dark(value).content.default),
  };
  assert.throws(() => compile(value), /CSS name collision/);
});

test("set ownership and complete public contracts are checked across themes", () => {
  let value = clone();
  value.sets.shared.sys.color = structuredClone(dark(value));
  assert.throws(() => compile(value), /overlapping set ownership/);
  value = clone();
  value.sets.theme.light = structuredClone(value.sets.theme.dark);
  delete value.sets.theme.light.sys.color.divider;
  value.presets.neutral.themes.push("light");
  assert.throws(() => compile(value), /public roles\/types differ/);
  value = clone();
  value.sets.theme.light = structuredClone(value.sets.theme.dark);
  assert.throws(() => compile(value), /unused palette or theme/);
});

test("metadata and supported value types reject unsafe or ambiguous input", () => {
  let value = clone();
  dark(value).content.default.$description = "";
  assert.throws(() => compile(value), /description required/);
  value = clone();
  meta(dark(value).content.default).status = "ready";
  assert.throws(() => compile(value), /invalid status/);
  value = clone();
  value.sets.palette.neutral.ref.color.neutral["0"].$value.alpha = 2;
  assert.throws(() => compile(value), /alpha outside/);
  value = clone();
  value.sets.shared.ref.stroke.width["2"].$value.unit = "%";
  assert.throws(() => compile(value), /invalid dimension/);
  value = clone();
  value.sets.shared.ref.stroke.width["2"].$type = "shadow";
  assert.throws(() => compile(value), /unsupported type shadow/);
  value = clone();
  value.legacy.dark.text = "white; color:red";
  assert.throws(() => compile(value), /unsafe declaration/);
  value = clone();
  value.formatVersion = 99;
  assert.throws(() => compile(value), /unsupported source formatVersion/);
});

test("a component alias chain resolves without exposing internal reference names", () => {
  const value = clone();
  value.sets.shared.comp = {
    text: {
      label: {
        color: {
          ...structuredClone(dark(value).content.default),
          $value: "{sys.color.content.default}",
        },
      },
    },
  };
  const result = compile(value);
  const token = result.contexts[0].catalog.find(
    (x) => x.id === "comp.text.label.color",
  );
  assert.deepEqual(token.dependencies, [
    "sys.color.content.default",
    "ref.color.neutral.0",
  ]);
  assert.match(
    result.css,
    /--flood-comp-text-label-color: var\(--flood-sys-color-content-default\)/,
  );
});

test("all supported scalar types serialize through the same validated pipeline", () => {
  for (const [type, input, expected] of [
    ["dimension", { value: 1.5, unit: "rem" }, "1.5rem"],
    ["dimension", { value: -0.02, unit: "em" }, "-0.02em"],
    ["duration", { value: 140, unit: "ms" }, "140ms"],
    ["number", 1.6, "1.6"],
    ["fontWeight", 500, "500"],
    ["fontFamily", ["Arial", "sans-serif"], '"Arial", sans-serif'],
    ["cubicBezier", [0.2, -1, 0.3, 2], "cubic-bezier(0.2, -1, 0.3, 2)"],
    [
      "color",
      { colorSpace: "srgb", components: [1, 0, 0], alpha: 0.5 },
      "rgb(255 0 0 / 0.5)",
    ],
  ]) {
    const value = clone();
    const sample = structuredClone(value.sets.shared.ref.stroke.width["2"]);
    sample.$type = type;
    sample.$value = input;
    value.sets.shared.ref.test = { sample };
    const result = compile(value);
    assert.ok(
      result.css.includes(`--flood-ref-test-sample: ${expected};`),
      type,
    );
  }
});

test("unsupported scalar values, literal semantic values and changing identity fail", () => {
  for (const [type, input] of [
    ["dimension", { value: -1, unit: "px" }],
    ["dimension", { value: -1, unit: "rem" }],
    ["duration", { value: 1, unit: "frames" }],
    ["number", Infinity],
    ["fontWeight", 1001],
    ["fontFamily", 'Arial"; color:red'],
    ["cubicBezier", [2, 0, 0.5, 1]],
  ]) {
    const value = clone();
    const token = value.sets.shared.ref.stroke.width["2"];
    token.$type = type;
    token.$value = input;
    assert.throws(() => compile(value), /Tokens:/, type);
  }
  let value = clone();
  dark(value).content.default.$value = {
    colorSpace: "srgb",
    components: [1, 1, 1],
  };
  assert.throws(() => compile(value), /require aliases/);
  value = clone();
  value.sets.theme.light = structuredClone(value.sets.theme.dark);
  meta(value.sets.theme.light.sys.color.content.default).owner =
    "another-owner";
  value.presets.neutral.themes.push("light");
  assert.throws(() => compile(value), /identity differs across contexts/);
});
