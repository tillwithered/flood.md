import { parse } from '@babel/parser';

// Ignore source coordinates, never executable syntax. Changes outside the two
// explicit slug registries must retain full verification.
const canonical = node => JSON.stringify(node, (key, value) =>
  ['loc', 'start', 'end', 'extra', 'comments', 'leadingComments', 'trailingComments', 'innerComments', 'tokens'].includes(key) ? undefined : value);

export function recipeFingerprints(source, slugs) {
  const ast = parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  const declarations = ast.program.body.map(node => node.declaration ?? node);
  const knobDeclarations = declarations.filter(node => node.type === 'VariableDeclaration')
    .flatMap(node => node.declarations).filter(node => node.id?.name === 'knobs');
  const recipes = declarations.filter(node => node.type === 'FunctionDeclaration' && node.id?.name === 'recipeFor');
  if (knobDeclarations.length !== 1 || knobDeclarations[0].init?.type !== 'ObjectExpression' || recipes.length !== 1)
    throw Error('Unknown playground registry shape');
  const switches = recipes[0].body.body.filter(node => node.type === 'SwitchStatement' && node.discriminant.type === 'Identifier' && node.discriminant.name === 'slug');
  if (switches.length !== 1) throw Error('Unknown recipe dispatch');
  const known = new Set(slugs), knobs = new Map(), cases = new Map();
  for (const property of knobDeclarations[0].init.properties) {
    const key = property.key?.type === 'StringLiteral' ? property.key.value : property.key?.name;
    if (property.type !== 'ObjectProperty' || property.computed || !known.has(key) || knobs.has(key))
      throw Error('Unknown or duplicate playground controls');
    knobs.set(key, canonical(property));
  }
  let following;
  for (const branch of [...switches[0].cases].reverse()) {
    if (branch.test === null) { following = canonical(branch); continue; }
    if (branch.test.type !== 'StringLiteral' || !known.has(branch.test.value) || cases.has(branch.test.value))
      throw Error('Unknown or duplicate playground recipe');
    // Empty labels are explicit aliases of the following branch. Include that
    // branch's fingerprint for every alias; executable fallthrough stays full.
    const last = branch.consequent.at(-1);
    if (branch.consequent.length && last?.type !== 'ReturnStatement' && !(last?.type === 'BlockStatement' && last.body.at(-1)?.type === 'ReturnStatement'))
      throw Error('Recipe fallthrough requires full verification');
    if (!branch.consequent.length && !following) throw Error('Unresolved recipe alias');
    following = canonical([branch, branch.consequent.length ? null : following]);
    cases.set(branch.test.value, following);
  }
  if (cases.size !== known.size) throw Error('Incomplete playground recipe inventory');
  knobDeclarations[0].init.properties = [];
  switches[0].cases = switches[0].cases.filter(node => node.test === null);
  return { context: canonical(ast), entries: new Map(slugs.map(slug => [slug, JSON.stringify([knobs.get(slug), cases.get(slug)])])) };
}

export function changedRecipes(before, after, slugs) {
  const old = recipeFingerprints(before, slugs), next = recipeFingerprints(after, slugs);
  if (old.context !== next.context) throw Error('Shared playground code changed');
  return slugs.filter(slug => old.entries.get(slug) !== next.entries.get(slug));
}
