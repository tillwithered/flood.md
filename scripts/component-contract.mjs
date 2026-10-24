import { parse } from "@babel/parser";

/** Return the explicit preview cases; a fallback cannot satisfy recipe coverage. */
export function readRecipeSlugs(source) {
  const ast = parse(source, { sourceType: "module", plugins: ["typescript", "jsx"] });
  const declarations = ast.program.body.map((statement) => statement.type === "ExportNamedDeclaration" ? statement.declaration : statement);
  const recipe = declarations.find((declaration) => declaration?.type === "FunctionDeclaration" && declaration.id.name === "recipeFor");
  if (!recipe) throw new Error("Component contract: recipeFor function is missing");
  const switches = recipe.body.body.filter((statement) => statement.type === "SwitchStatement" && statement.discriminant.type === "Identifier" && statement.discriminant.name === "slug");
  if (switches.length !== 1) throw new Error("Component contract: expected one recipeFor switch on slug");
  const slugs = switches[0].cases.filter((branch) => branch.test !== null).map((branch) => {
    if (branch.test.type !== "StringLiteral") throw new Error("Component contract: preview case must be a literal slug");
    return branch.test.value;
  });
  if (new Set(slugs).size !== slugs.length) throw new Error("Component contract: duplicate preview slug");
  return slugs;
}

/** Extract the supported, local TypeScript component declarations without executing source. */
export function readComponentContract(source) {
  const ast = parse(source, { sourceType: "module", plugins: ["typescript", "jsx"] });
  const declarations = new Map();
  const exports = [];
  const forwardRefs = new Set();
  const raw = (node) => source.slice(node.start, node.end).trim();
  const args = (node) => (node.typeArguments ?? node.typeParameters)?.params ?? [];
  const nameOf = (node) => node?.name ?? (node ? raw(node) : "");
  const since = (node) => node?.leadingComments?.flatMap((comment) => {
    const match = comment.value.match(/@since\s+(\S+)/);
    return match ? [match[1]] : [];
  })[0];

  for (const statement of ast.program.body) {
    if (statement.type === "ImportDeclaration" && statement.source.value === "react") {
      for (const specifier of statement.specifiers)
        if (specifier.type === "ImportSpecifier" && nameOf(specifier.imported) === "forwardRef") forwardRefs.add(specifier.local.name);
    }
    const declaration = statement.type === "ExportNamedDeclaration" ? statement.declaration : statement;
    if (declaration?.type === "VariableDeclaration") {
      for (const item of declaration.declarations) {
        if (item.id.type !== "Identifier") continue;
        declarations.set(item.id.name, item);
        if (statement.type === "ExportNamedDeclaration") exports.push({ name: item.id.name, local: item.id.name, statement });
      }
    } else if (declaration?.id?.name) {
      declarations.set(declaration.id.name, declaration);
      if (statement.type === "ExportNamedDeclaration" && !["TSInterfaceDeclaration", "TSTypeAliasDeclaration", "TSDeclareFunction"].includes(declaration.type)) exports.push({ name: declaration.id.name, local: declaration.id.name, statement });
    }
    if (statement.type === "ExportNamedDeclaration" && statement.exportKind !== "type") {
      for (const specifier of statement.specifiers) {
        if (specifier.type === "ExportSpecifier" && specifier.exportKind !== "type") exports.push({ name: nameOf(specifier.exported), local: nameOf(specifier.local), statement });
        else if (specifier.exportKind !== "type") throw new Error("Component contract: unsupported runtime re-export");
      }
      if (statement.source) throw new Error("Component contract: external re-exports need an explicit source resolver");
    }
    if (statement.type === "ExportAllDeclaration" || statement.type === "ExportDefaultDeclaration") throw new Error("Component contract: unsupported default or wildcard export");
  }

  function typeText(node, visiting = new Set()) {
    if (!node) return "unknown";
    if (node.type === "TSTypeReference") {
      const name = nameOf(node.typeName);
      const declaration = declarations.get(name);
      if (declaration?.type === "TSTypeAliasDeclaration" && !args(node).length) {
        if (visiting.has(name)) throw new Error(`Component contract: cyclic type alias ${name}`);
        return typeText(declaration.typeAnnotation, new Set([...visiting, name]));
      }
      return args(node).length ? `${name}<${args(node).map((value) => typeText(value, visiting)).join(", ")}>` : name;
    }
    if (node.type === "TSUnionType") return node.types.map((value) => typeText(value, visiting)).join(" | ");
    if (node.type === "TSIntersectionType") return node.types.map((value) => typeText(value, visiting)).join(" & ");
    if (node.type === "TSLiteralType") return raw(node.literal);
    return raw(node);
  }

  function literalKeys(node) {
    if (node.type === "TSUnionType") return node.types.flatMap(literalKeys);
    if (node.type === "TSLiteralType" && node.literal.type === "StringLiteral") return [node.literal.value];
    throw new Error(`Component contract: unsupported utility keys ${raw(node)}`);
  }

  function literalOptions(node, visiting = new Set()) {
    if (!node) return undefined;
    if (node.type === "TSParenthesizedType") return literalOptions(node.typeAnnotation, visiting);
    if (node.type === "TSTypeReference" && !args(node).length) {
      const name = nameOf(node.typeName), declaration = declarations.get(name);
      if (declaration?.type !== "TSTypeAliasDeclaration") return undefined;
      if (visiting.has(name)) throw new Error(`Component contract: cyclic type alias ${name}`);
      return literalOptions(declaration.typeAnnotation, new Set([...visiting, name]));
    }
    if (node.type === "TSUnionType") {
      const branches = node.types.map((branch) => literalOptions(branch, visiting));
      return branches.every(Boolean) ? [...new Set(branches.flat())] : undefined;
    }
    if (node.type === "TSLiteralType" && ["StringLiteral", "NumericLiteral", "BooleanLiteral"].includes(node.literal.type)) return [node.literal.value];
    return undefined;
  }

  function resolveProps(node, visiting = new Set()) {
    if (!node) throw new Error("Component contract: component props type is missing");
    if (node.type === "TSIntersectionType") return merge(node.types.map((part) => resolveProps(part, visiting)));
    if (node.type === "TSParenthesizedType") return resolveProps(node.typeAnnotation, visiting);
    if (node.type === "TSTypeLiteral") return members(node.members, visiting);
    const name = nameOf(node.typeName ?? node.expression);
    const parameters = args(node);
    if (["Omit", "Pick", "Partial", "Required"].includes(name)) {
      const base = resolveProps(parameters[0], visiting);
      const keys = ["Omit", "Pick"].includes(name) ? literalKeys(parameters[1]) : [];
      const props = base.props.filter((prop) => name === "Omit" ? !keys.includes(prop.name) : name === "Pick" ? keys.includes(prop.name) : true).map((prop) => ({ ...prop, ...(["Partial", "Required"].includes(name) ? { required: name === "Required" } : {}) }));
      return { props, nativeProps: base.nativeProps.map((native) => `${name}<${native}${parameters[1] ? `, ${typeText(parameters[1])}` : ""}>`) };
    }
    const declaration = declarations.get(name);
    if (declaration) {
      if (visiting.has(name)) throw new Error(`Component contract: cyclic props inheritance ${name}`);
      const next = new Set([...visiting, name]);
      if (declaration.type === "TSTypeAliasDeclaration") return resolveProps(declaration.typeAnnotation, next);
      if (declaration.type === "TSInterfaceDeclaration") return merge([...(declaration.extends ?? []).map((base) => resolveProps(base, next)), members(declaration.body.body, next)]);
      throw new Error(`Component contract: unsupported props declaration ${name}`);
    }
    // Imported DOM/React attributes stay opaque. This is not a DOM type checker.
    if (name.endsWith("HTMLAttributes") || name === "HTMLAttributes") return { props: [], nativeProps: [`${name}${parameters.length ? `<${parameters.map((value) => typeText(value)).join(", ")}>` : ""}`] };
    throw new Error(`Component contract: unresolved props type ${name || raw(node)}`);
  }

  function members(body) {
    return { props: body.map((member) => {
      if (member.type !== "TSPropertySignature" || member.computed) throw new Error(`Component contract: unsupported interface member ${raw(member)}`);
      const annotation = member.typeAnnotation?.typeAnnotation;
      const options = literalOptions(annotation);
      const prop = { name: member.key.type === "StringLiteral" ? member.key.value : nameOf(member.key), type: typeText(annotation), required: !member.optional, ...(options ? { options } : {}) };
      return { ...prop, ...(since(member) ? { since: since(member) } : {}) };
    }), nativeProps: [] };
  }

  function merge(contracts) {
    const props = new Map();
    for (const contract of contracts) for (const prop of contract.props) props.set(prop.name, prop);
    return { props: [...props.values()], nativeProps: [...new Set(contracts.flatMap((contract) => contract.nativeProps))] };
  }

  return exports.filter((entry) => /^[A-Z]/.test(entry.name)).map((entry) => {
    const declaration = declarations.get(entry.local);
    let render, propsType;
    if (declaration?.type === "FunctionDeclaration") render = declaration;
    else if (declaration?.type === "VariableDeclarator") {
      const initializer = declaration.init;
      if (initializer?.type === "CallExpression" && forwardRefs.has(nameOf(initializer.callee))) {
        render = initializer.arguments[0];
        propsType = args(initializer)[1];
      } else if (["ArrowFunctionExpression", "FunctionExpression"].includes(initializer?.type)) render = initializer;
    }
    if (!["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(render?.type)) throw new Error(`Component contract: unsupported runtime export ${entry.name}`);
    const parameter = render.params[0]?.type === "AssignmentPattern" ? render.params[0].left : render.params[0];
    propsType ??= parameter?.typeAnnotation?.typeAnnotation;
    const contract = resolveProps(propsType);
    const defaults = new Map();
    const defaultLiterals = new Map();
    if (parameter?.type === "ObjectPattern") {
      for (const property of parameter.properties) {
        if (property.type === "ObjectProperty" && property.value.type === "AssignmentPattern") {
          const name = nameOf(property.key), value = property.value.right;
          defaults.set(name, raw(value));
          if (["StringLiteral", "NumericLiteral", "BooleanLiteral"].includes(value.type)) defaultLiterals.set(name, value.value);
        }
      }
    }
    for (const prop of contract.props) if (defaults.has(prop.name)) {
      prop.defaultValue = defaults.get(prop.name);
      if (defaultLiterals.has(prop.name)) prop.defaultLiteral = defaultLiterals.get(prop.name);
    }
    // A default on an inherited native prop is useful even without expanding DOM types.
    for (const [name, defaultValue] of defaults) if (!contract.props.some((prop) => prop.name === name)) contract.props.push({ name, type: "Inherited native HTML prop", required: false, defaultValue, ...(defaultLiterals.has(name) ? { defaultLiteral: defaultLiterals.get(name) } : {}), inherited: true });
    const version = since(entry.statement) ?? since(declaration);
    return { name: entry.name, propsType: typeText(propsType), ...contract, ...(version ? { since: version } : {}) };
  });
}
