import { createHash } from "node:crypto";

const pageBytes = 16 * 1024;
const stopWords = new Set(
  "a an and are build can choose create find flood for from help how i in is last me need of on or show the to use want week with using а в где для и из к как мне на найди нужна нужен нужны нужно по покажи помоги с сделать со что чтобы".split(" "),
);

// Catalog names and descriptions remain canonical. These aliases bridge common
// user vocabulary and inflected Russian words to the same searchable terms.
const synonyms = new Map([
  ["table", "tables таблица таблицу таблицы таблице таблиц табличный табличная"],
  ["filters", "filter filtering фильтра фильтров фильтры фильтрами фильтр фильтром фильтрация фильтрацией фильтрации"],
  ["bulk", "batch mass массов массовое массовые массовыми массового пакетные пакетными"],
  ["actions", "action commands действие действия действиями действий"],
  ["sidebar", "sidebars сайдбар сайдбара сайдбаром сайдбаре боковая боковую боковой"],
  ["navigation", "navigate nav навигация навигации навигацию навигацией"],
  ["collapsible", "collapse collapsing disclosure collapses сворачиваемые сворачиваемыми сворачиваемых сворачиваемой раскрывающиеся раскрывающимися раскрываемые раскрываемыми"],
  ["groups", "group grouped группа группы группами групп группировка разделами разделы"],
  ["line", "lines linear линейный линейного линейным линии линия линий"],
  ["chart", "charts graph graphs plot график графика графиков графиком графики чарты диаграмма диаграмму"],
  ["comparison", "compare compared comparing comparative comparable сравнение сравнить сравнением сравнения сравнительный сравнивать"],
  ["trends", "trend тренд тренды тенденция динамика динамики"],
  ["scroll", "scrolling scrollbar scrollbars скролл скроллбар прокрутка прокруткой прокрутки"],
  ["requests", "request заявка заявки заявок заявками"],
  ["selection", "select selecting selected выделение выделением выбор выбором"],
  ["rows", "row строки строк строками"],
  ["approval", "approve approving одобрить одобрение одобрения"],
  ["latency", "задержка задержки задержек задержкой задержку"],
  ["distribution", "распределение распределения распределению распределением"],
  ["service", "services сервис сервиса сервисам сервисов сервисами"],
  ["dashboard", "analytics аналитика дашборд дашборда дешборд панель"],
].flatMap(([canonical, alternatives]) => alternatives.split(" ").map(word => [word, canonical])));

// Short product-specific queries can refer to several materials at once.
// Keep the hints attached to stable IDs and resolve all output from the reader.
const hints = new Map([
  ["recipe:table-bulk-actions", "requests table search filters bulk actions selected rows archive approve"],
  ["recipe:collection-views", "table saved views filters search collection"],
  ["component:data-table", "table filters bulk actions rows records grid"],
  ["component:collection-toolbar", "table filters search bulk actions toolbar"],
  ["component:bulk-action-bar", "table filters bulk actions selected rows"],
  ["recipe:navigation-workspace", "sidebar navigation collapsible groups rail workspace"],
  ["component:sidebar", "sidebar navigation collapsible groups rail"],
  ["component:navigation-group", "sidebar navigation collapsible groups"],
  ["component:line-chart", "line chart comparison trends analytics"],
  ["guide:charts", "requests latency dashboard comparison distribution service filters"],
  ["component:histogram", "requests latency dashboard distribution service"],
  ["component:box-plot", "requests latency dashboard comparison distribution service"],
]);

function words(value) {
  const normalized = value.normalize("NFKC")
    .replace(/([\p{Ll}\d])(\p{Lu})/gu, "$1 $2")
    .toLowerCase()
    .replaceAll("ё", "е");
  return (normalized.match(/[\p{L}\p{N}]+/gu) ?? []).filter(word => !stopWords.has(word));
}

const terms = value => new Set(words(value).map(word => synonyms.get(word) ?? word));
const normalizedLabel = value => words(value).join(" ");

function catalogIndex(items) {
  return items.map(item => {
    const slug = item.id.slice(item.id.indexOf(":") + 1);
    return {
      item,
      labels: new Set([normalizedLabel(item.name), normalizedLabel(slug), normalizedLabel(slug).replaceAll(" ", "")]),
      title: terms(`${item.name} ${slug}`),
      hints: terms(hints.get(item.id) ?? ""),
      description: terms(item.description),
    };
  });
}

function rank(index, query) {
  const title = normalizedLabel(query.search);
  const queryTerms = terms(query.search);
  if (!queryTerms.size) return [];
  const materialId = /^(guide|workflow|reference|component|recipe|token):[a-z0-9][a-z0-9.-]*$/.test(query.search);
  const minimumMatches = Math.ceil(queryTerms.size / 2);
  const ranked = [];
  for (const entry of index) {
    const { item } = entry;
    if ((query.kind && item.kind !== query.kind) || (query.group && !item.groups.includes(query.group))) continue;
    if (materialId) {
      if (item.id === query.search) return [item];
      continue;
    }
    const exact = entry.labels.has(title);
    let matched = 0;
    let strength = 0;
    for (const term of queryTerms) {
      const weight = entry.title.has(term) ? 5 : entry.hints.has(term) ? 3 : entry.description.has(term) ? 1 : 0;
      if (!weight) continue;
      matched++;
      strength += weight;
    }
    const completeRecipe = item.kind === "recipe" && matched === queryTerms.size && matched >= 3;
    if (exact || matched >= minimumMatches) ranked.push({ item, exact, matched, strength, completeRecipe });
  }
  // Stable sort preserves canonical ID order for equally relevant results.
  return ranked.sort((a, b) =>
    b.exact - a.exact || b.matched - a.matched || b.completeRecipe - a.completeRecipe || b.strength - a.strength,
  )
    .map(({ item }) => item);
}

function invalid(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

async function readIndex(reader, fingerprint) {
  const items = [];
  let cursor;
  do {
    const page = await reader.list({ limit: 50, cursor });
    if (page.fingerprint !== fingerprint) invalid("STALE_CURSOR", "Catalog changed; start a fresh search.");
    items.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);
  return catalogIndex(items);
}

export function createMcpSearch(reader) {
  let cached;
  return async ({ kind, group, search = "", limit = 12, cursor }) => {
    if (!search.trim()) return reader.list({ kind, group, search, limit, cursor });

    const { fingerprint, schemaVersion, version, groups } = await reader.info();
    if (group !== undefined && !groups.some(item => item.id === group)) invalid("INVALID_QUERY", "Unknown knowledge group.");
    const query = { kind: kind ?? null, group: group ?? null, search: search.trim().toLowerCase() };
    const queryHash = createHash("sha256").update(JSON.stringify(query)).digest("hex");
    let offset = 0;
    if (cursor !== undefined) {
      let state;
      try {
        if (!/^[A-Za-z0-9_-]+$/.test(cursor)) throw Error();
        state = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
      } catch {
        invalid("INVALID_CURSOR", "Malformed knowledge cursor.");
      }
      if (state?.fingerprint !== fingerprint || state.query !== queryHash || state.ranking !== 1 ||
          !Number.isSafeInteger(state.offset) || state.offset < 1) {
        invalid("STALE_CURSOR", "Catalog or query changed; start a fresh search.");
      }
      offset = state.offset;
    }

    if (cached?.fingerprint !== fingerprint) {
      const snapshot = { fingerprint, index: readIndex(reader, fingerprint) };
      cached = snapshot;
      snapshot.index.catch(() => { if (cached === snapshot) cached = undefined; });
    }
    const matches = rank(await cached.index, query);
    if (offset > matches.length) invalid("INVALID_CURSOR", "Knowledge cursor is outside the result set.");
    const items = [];
    const result = () => {
      const next = offset + items.length;
      return { schemaVersion, version, fingerprint, query, total: matches.length, items,
        truncated: next < matches.length,
        nextCursor: next < matches.length ? Buffer.from(JSON.stringify({ fingerprint, query: queryHash, offset: next, ranking: 1 })).toString("base64url") : null,
      };
    };
    for (const item of matches.slice(offset, offset + limit)) {
      items.push(item);
      if (Buffer.byteLength(JSON.stringify(result())) > pageBytes) { items.pop(); break; }
    }
    if (!items.length && offset < matches.length) invalid("INVALID_CATALOG", "A catalog entry exceeds the discovery budget.");
    return result();
  };
}
