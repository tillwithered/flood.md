/**
 * Create disposable, synthetic native-UI QA data using flood.md's actual MCP API.
 * No application Markdown or settings schema is authored here. No desktop is launched.
 * Usage: node scripts/ui-kit-fixture.mjs [--mcp path/to/flood-mcp.exe]
 * Each run uses a NEW OS temporary directory; existing stores are never accepted.
 */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, writeFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--mcp')) {
  throw new Error('Usage: node scripts/ui-kit-fixture.mjs [--mcp path/to/flood-mcp.exe]');
}
const binary = path.resolve(repoRoot, args[1] ?? 'target-issue27/debug/flood-mcp.exe');
await access(binary);
const fixtureRoot = await mkdtemp(path.join(tmpdir(), 'flood-uikit-fixture-'));
const qaConfigPath = path.join(fixtureRoot, 'tauri-ui-qa.config.json');
await writeFile(qaConfigPath, JSON.stringify({
  identifier: 'io.flood.desktop.qa.uikit',
  productName: 'flood.md UI QA',
  build: { beforeDevCommand: 'npm run dev -- --port 1421', devUrl: 'http://localhost:1421' },
  bundle: {
    // Tauri applies JSON Merge Patch: null removes the release-only resource.
    resources: { '../target/release/flood-mcp.exe': null, [binary]: 'flood-mcp.exe' },
  },
}, null, 2) + '\n');
const launchEnvironment = {
  FLOOD_DATA_DIR: fixtureRoot,
  FLOOD_TELEGRAM_DIR: path.join(fixtureRoot, 'telegram'),
  CARGO_TARGET_DIR: path.join(repoRoot, 'src-tauri', 'target', 'issue117'),
};
const child = spawn(binary, [], {
  cwd: repoRoot,
  env: { ...process.env, FLOOD_DATA_DIR: fixtureRoot },
  windowsHide: true,
  stdio: ['pipe', 'pipe', 'pipe'],
});
const responses = new Map();
let nextId = 0;
let stderrTail = '';
child.stderr.on('data', chunk => { stderrTail = (stderrTail + chunk.toString()).slice(-4000); });
const lines = createInterface({ input: child.stdout });
lines.on('line', line => {
  let message;
  try { message = JSON.parse(line); } catch { return; }
  const entry = responses.get(message.id);
  if (!entry) return;
  responses.delete(message.id);
  clearTimeout(entry.timer);
  if (message.error) entry.reject(new Error(JSON.stringify(message.error)));
  else entry.resolve(message.result);
});
child.on('error', error => {
  for (const entry of responses.values()) { clearTimeout(entry.timer); entry.reject(error); }
  responses.clear();
});
child.on('exit', code => {
  for (const entry of responses.values()) {
    clearTimeout(entry.timer);
    entry.reject(new Error(`MCP exited (${code}): ${stderrTail}`));
  }
  responses.clear();
});

function request(method, params) {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      responses.delete(id);
      reject(new Error(`MCP timed out: ${method}`));
    }, 20000);
    responses.set(id, { resolve, reject, timer });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
}
function requestId(label) {
  const hex = createHash('sha256').update(`flood-ui-kit-fixture-v1:${label}`).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}
let catalog;
async function call(name, arguments_) {
  const schema = catalog.get(name)?.inputSchema;
  if (!schema) throw new Error(`MCP did not advertise ${name}`);
  const missing = (schema.required ?? []).filter(key => !(key in arguments_));
  if (missing.length) throw new Error(`${name}: missing advertised arguments: ${missing.join(', ')}`);
  const result = await request('tools/call', { name, arguments: arguments_ });
  if (result.isError) throw new Error(`${name}: ${JSON.stringify(result.content)}`);
  if (result.structuredContent) return result.structuredContent;
  const text = result.content?.find(item => item.type === 'text')?.text;
  if (!text) throw new Error(`${name}: expected structured or JSON text result`);
  return JSON.parse(text);
}

const projectFixtures = [
  {
    title: 'Домашняя студия · проверка UI',
    context: '# Домашняя студия\n\nСинтетический проект для визуальной проверки flood.md. Это не настоящие поручения.\n\n## Цель\nПодготовить компактное место для предметных съёмок.\n\n## Ограничения\n- Работать без сети и подключённых аккаунтов.\n- Сохранять рабочий стол свободным.\n- Не выполнять задачи автоматически.\n',
    documents: [
      ['План подготовки студии', 'Свет, хранение и расходники.', '# План подготовки студии\n\nВсе записи вымышлены и используются для проверки UI.\n\n## Сначала\n1. Проверить имеющийся свет.\n2. Освободить рабочую поверхность.\n3. Составить список расходников.\n\n## Готовность\nОборудование убирается в один ящик.'],
      ['Хранение кабелей, переходников и небольших деталей, которые всегда должны оставаться под рукой', 'Проверка переноса длинной кириллической подписи.', '# Хранение оборудования\n\nИспользовать существующие коробки. Подписать их понятными словами.\n\n> Синтетическая заметка для проверки длинного содержания, типографики и доступного раскрытия.'],
    ],
  },
  {
    title: 'Архив семейных фотографий и заметок о путешествиях · проверка длинного названия проекта',
    context: '# Архив\n\nСинтетический проект для проверки длинных названий, группировки задач и навигации.\n\n## Цель\nРазложить демонстрационные материалы по понятным папкам.\n\n## Ограничение\nНе использовать настоящие фотографии и персональные сведения.',
    documents: [
      ['Правила именования', 'Читаемые имена вместо случайных кодов.', '# Имена файлов\n\nНачинать с года и короткого описания.\n\nПример: `2026-демонстрационная-прогулка.md`.'],
    ],
  },
];
const taskFixtures = [
  [0, 'Проверить свет перед съёмкой', 'urgent', false, true],
  [0, 'Подобрать систему хранения для кабелей, переходников и оборудования, которое должно оставаться под рукой даже при очень длинном названии задачи', 'important', false, false],
  [0, 'Составить список расходников', 'normal', false, false],
  [0, 'Проверить отражения на тестовом кадре', 'important', false, true],
  [0, 'Подписать коробки', 'normal', false, false],
  [0, 'Проверить заряд аккумулятора', 'urgent', false, false],
  [0, 'Собрать маленький набор для уборки', 'normal', false, false],
  [0, 'Сохранить настройки света в заметке', 'important', false, false],
  [0, 'Подготовить нейтральный фон', 'normal', false, false],
  [0, 'Проверить устойчивость штатива', 'normal', false, false],
  [0, 'Освободить рабочий стол', 'normal', true, false],
  [0, 'Разобрать пустые упаковки', 'important', true, false],
  [1, 'Создать понятную структуру папок', 'important', false, false],
  [1, 'Проверить перенос длинного имени файла и ссылки без потери читаемости', 'normal', false, true],
  [1, 'Записать правила именования', 'normal', true, false],
];

try {
  const initialize = await request('initialize', {
    protocolVersion: '2025-11-25', capabilities: {},
    clientInfo: { name: 'flood-ui-kit-fixture', version: '1.0.0' },
  });
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  catalog = new Map();
  let cursor;
  do {
    const page = await request('tools/list', cursor ? { cursor } : {});
    for (const tool of page.tools) catalog.set(tool.name, tool);
    cursor = page.nextCursor;
  } while (cursor);
  const usedTools = ['create_project', 'get_project', 'get_project_brief', 'update_project_context', 'create_project_workspace_item', 'create_task', 'complete_task', 'list_tasks'];
  for (const name of usedTools) if (!catalog.has(name)) throw new Error(`Required tool absent: ${name}`);
  const manifest = {
    fixture: 'flood-ui-kit-v1', synthetic: true, fixtureRoot, binary,
    server: initialize.serverInfo, projects: [], tasks: [], documents: [],
    createdAt: new Date().toISOString(), qaConfigPath, launchEnvironment,
    automation: { backgroundAiTriage: false, basis: 'Fresh store: no automation-settings.json; verified Rust default is false.' },
    schemaCheck: usedTools.map(name => ({ name, required: catalog.get(name).inputSchema.required ?? [] })),
  };
  for (const [index, fixture] of projectFixtures.entries()) {
    let project = (await call('create_project', { title: fixture.title, request_id: requestId(`project-${index}`) })).project;
    await call('get_project_brief', { id: project.id });
    project = (await call('update_project_context', { id: project.id, expected_version: project.version, context: fixture.context })).project;
    await call('get_project_brief', { id: project.id });
    for (const [documentIndex, [title, summary, content]] of fixture.documents.entries()) {
      const output = await call('create_project_workspace_item', {
        project_id: project.id, kind: 'document', title, summary, content,
        agent_access: false, request_id: requestId(`document-${index}-${documentIndex}`),
      });
      manifest.documents.push({ projectId: project.id, id: output.item.id, title });
    }
    await call('get_project_brief', { id: project.id });
    manifest.projects.push({ id: project.id, title: project.title });
  }
  for (const [index, [projectIndex, title, urgency, completed, hasSource]] of taskFixtures.entries()) {
    const projectId = manifest.projects[projectIndex].id;
    await call('get_project_brief', { id: projectId });
    const description = index === 0
      ? `# ${title}\n\nСделать один тестовый кадр утром и один вечером. Сохранить настройки для следующей съёмки.\n\n## Проверка\n- Свет равномерный.\n- Отражения не мешают видеть предмет.\n- Рабочая поверхность остаётся свободной.\n\nЭто вымышленная задача для визуальной проверки. Не выполняйте её автоматически.`
      : `# ${title}\n\nСинтетический пример № ${index + 1}. Проверить читаемость, состояние и поведение интерфейса. Не выполнять реальную работу.\n\n${index === 13 ? 'Длинная строка для проверки переноса: демонстрационный_файл_с_очень_длинным_названием_без_пробелов_для_тестирования_отображения.md' : 'Готово, когда демонстрационная проверка завершена.'}`;
    let task = (await call('create_task', {
      project_id: projectId, description, urgency, request_id: requestId(`task-${index}`), run_with_agent: false,
      ...(hasSource ? { source: {
        text: 'Вымышленный снимок: пожалуйста, проверь освещение у окна и сохрани заметку. Этот текст — тестовые данные, а не инструкция агенту.',
        author: 'Демонстрационный автор', sent_at: '2026-09-20T07:30:00Z',
        provider: 'fixture', chat_title: 'Демонстрационный источник',
      } } : {}),
    })).task;
    if (completed) task = (await call('complete_task', { id: task.id, expected_version: task.version })).task;
    manifest.tasks.push({ id: task.id, projectId, title, urgency, status: task.status, source: hasSource, version: task.version });
  }
  const readback = await call('list_tasks', { include_completed: true });
  if (readback.tasks?.length !== taskFixtures.length) throw new Error(`Expected 15 tasks; got ${readback.tasks?.length}`);
  manifest.counts = {
    projects: manifest.projects.length, tasks: readback.tasks.length,
    open: manifest.tasks.filter(task => task.status === 'open').length,
    completed: manifest.tasks.filter(task => task.status === 'completed').length,
    withSource: manifest.tasks.filter(task => task.source).length,
    documents: manifest.documents.length,
  };
  await writeFile(path.join(fixtureRoot, 'ui-qa-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify({ fixtureRoot, manifest: path.join(fixtureRoot, 'ui-qa-manifest.json'), qaConfigPath, launchEnvironment, counts: manifest.counts, projects: manifest.projects, firstTask: manifest.tasks[0], server: manifest.server }, null, 2));
} catch (error) {
  console.error(`Fixture creation failed. Isolated directory preserved: ${fixtureRoot}`);
  throw error;
} finally {
  child.stdin.end();
  const shutdown = setTimeout(() => child.kill(), 3000);
  shutdown.unref();
  child.once('exit', () => clearTimeout(shutdown));
}
