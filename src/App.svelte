<script lang="ts">
  import { ArrowRight, Bold, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Circle, Clipboard, Database, Download, ExternalLink, Folder, FolderOpen, FolderPlus, Heading1, Info, Languages, Link, ListTodo, Maximize2, MessageSquareText, Minus, MoreHorizontal, Palette, PanelLeftClose, PanelLeftOpen, Paperclip, Pencil, Plus, Plug, RefreshCw, RotateCcw, Search, Settings, Square, Trash2, Underline, X, ZoomIn, ZoomOut } from "@lucide/svelte";
  import { getVersion } from "@tauri-apps/api/app";
  import { invoke } from "@tauri-apps/api/core";
  import { listen, type UnlistenFn } from "@tauri-apps/api/event";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { openPath, openUrl } from "@tauri-apps/plugin-opener";
  import { relaunch } from "@tauri-apps/plugin-process";
  import { check, type Update } from "@tauri-apps/plugin-updater";
  import { onMount, tick } from "svelte";
  import FloodGlyph from "./components/FloodGlyph.svelte";

  type Section = "tasks" | "trash" | "settings";
  type SettingsSection = "general" | "appearance" | "data" | "integrations" | "about";
  type WorkspaceView = "project" | "task";
  type Urgency = "normal" | "important" | "urgent";
  type SaveState = "idle" | "saving" | "saved" | "error";
  type ThemePreference = "system" | "light" | "dark";
  type UpdateState = "idle" | "checking" | "available" | "current" | "downloading" | "error";
  type MessageSnapshot = { text: string; author?: string; sent_at?: string; url?: string };
  type ChatRecord = { id: string; title: string; created_at: string; updated_at: string; version: string };
  type TaskRecord = {
    id: string;
    chat_id: string;
    description: string;
    created_at: string;
    updated_at: string;
    urgency: Urgency;
    status: "open" | "completed";
    source?: MessageSnapshot;
    trashed_at?: string;
    version: string;
  };
  type TaskSummaryRecord = Omit<TaskRecord, "source"> & { has_source: boolean; source_author?: string };
  type TaskItem = {
    id: string;
    title: string;
    chat: string;
    chatId: string;
    updated: string;
    createdAt: string;
    updatedAt: string;
    urgency: Urgency;
    completed: boolean;
    markdown: string;
    source?: MessageSnapshot;
    sourceAuthor?: string;
    hasSource: boolean;
    trashedAt?: string;
    version: string;
  };
  type ChatItem = ChatRecord & { open: number };
  type MarkdownHint = { title: string; left: number; top: number };

  const markdownHints: Record<string, Pick<MarkdownHint, "title">> = {
    "#": { title: "Большой заголовок" },
    "##": { title: "Средний заголовок" },
    "###": { title: "Маленький заголовок" },
    "-": { title: "Маркированный список" },
    "1.": { title: "Нумерованный список" },
    ">": { title: "Цитата" },
    "```": { title: "Блок кода" }
  };

  let tasks: TaskItem[] = [];
  let trashedTasks: TaskItem[] = [];
  let chats: ChatItem[] = [];

  type BlockKind = "paragraph" | "heading-1" | "heading-2" | "heading-3" | "bullet" | "number" | "quote" | "code";

  let editorRoot: HTMLDivElement;
  let attachmentInput: HTMLInputElement;
  let attachmentObjectUrls: string[] = [];
  let activeSection: Section = "tasks";
  let workspaceView: WorkspaceView = "project";
  let selectedTaskId = "";
  let selectedChatId = "all";
  let query = "";
  let showCompleted = false;
  let sidebarCollapsed = false;
  let expandedChatIds: string[] = [];
  let allTasksExpanded = true;
  let themePreference: ThemePreference = "system";
  let reduceMotion = false;
  let settingsSection: SettingsSection = "general";
  let appVersion = "0.1.0";
  let dataDirectory = "";
  let mcpExecutable = "";
  let updateState: UpdateState = "idle";
  let updateMessage = "";
  let availableUpdate: Update | null = null;
  let updateProgress = 0;
  let markdown = "";
  let editorHint: MarkdownHint | null = null;
  let copied = false;
  let completedGroupOpen = false;
  let loading = true;
  let loadError = "";
  let saveState: SaveState = "idle";
  let saveError = "";
  let saveTimer: number | undefined;
  let refreshTimer: number | undefined;
  let lastSavedMarkdown = "";
  let saveInFlight: Promise<void> | null = null;
  let conflictRemote: TaskRecord | null = null;
  let urgencyMenuOpen = false;
  let newTaskMenuAnchor: "sidebar" | "workspace" | null = null;
  let createChatOpen = false;
  let createChatTitle = "";
  let renameChatOpen = false;
  let renameChatTitle = "";
  let taskActionMenuOpen = false;
  let moveMenuOpen = false;
  let sourceEditorOpen = false;
  let sourceText = "";
  let sourceAuthor = "";
  let sourceUrl = "";
  let sourceSentAt = "";
  let sourceHour = "";
  let sourceMinute = "";
  let datePickerOpen = false;
  let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  let formError = "";
  let closingWindow = false;
  let deleteChatConfirmOpen = false;
  let emptyTrashConfirmOpen = false;
  let purgeTaskId = "";
  let selectionToolbar: { left: number; top: number } | null = null;
  let savedSelection: Range | null = null;
  let linkEditorOpen = false;
  let linkDraft = "";
  let imageViewer: { src: string; alt: string } | null = null;
  let imageViewerZoom = 1;
  let imageViewerDialog: HTMLDivElement;
  let sidebarProjectHint: { label: string; left: number; top: number } | null = null;

  const uiPreferencesKey = "flood.ui.preferences";

  function saveUiPreferences() {
    localStorage.setItem(uiPreferencesKey, JSON.stringify({
      theme: themePreference,
      reduceMotion,
      showCompleted,
      sidebarCollapsed,
      expandedChatIds,
      allTasksExpanded
    }));
  }

  function applyTheme() {
    const dark = themePreference === "dark" || (themePreference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", dark ? "#111110" : "#ffffff");
  }

  function applyMotionPreference() {
    document.documentElement.dataset.motion = reduceMotion ? "reduced" : "full";
  }

  function loadUiPreferences() {
    try {
      const stored = JSON.parse(localStorage.getItem(uiPreferencesKey) ?? "{}") as Record<string, unknown>;
      if (stored.theme === "system" || stored.theme === "light" || stored.theme === "dark") themePreference = stored.theme;
      if (typeof stored.reduceMotion === "boolean") reduceMotion = stored.reduceMotion;
      if (typeof stored.showCompleted === "boolean") showCompleted = stored.showCompleted;
      if (typeof stored.sidebarCollapsed === "boolean") sidebarCollapsed = stored.sidebarCollapsed;
      if (Array.isArray(stored.expandedChatIds)) expandedChatIds = stored.expandedChatIds.filter((id): id is string => typeof id === "string");
      if (typeof stored.allTasksExpanded === "boolean") allTasksExpanded = stored.allTasksExpanded;
    } catch {
      localStorage.removeItem(uiPreferencesKey);
    }
    applyTheme();
    applyMotionPreference();
  }

  function setTheme(theme: ThemePreference) {
    themePreference = theme;
    applyTheme();
    saveUiPreferences();
  }

  function setSidebarCollapsed(collapsed: boolean) {
    sidebarCollapsed = collapsed;
    sidebarProjectHint = null;
    saveUiPreferences();
  }

  function showSidebarProjectHint(event: MouseEvent | FocusEvent, label: string) {
    if (!sidebarCollapsed || !(event.currentTarget instanceof HTMLElement)) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    sidebarProjectHint = {
      label,
      left: bounds.right + 10,
      top: bounds.top + bounds.height / 2
    };
  }

  function hideSidebarProjectHint() {
    sidebarProjectHint = null;
  }

  function toggleCompletedVisibility() {
    showCompleted = !showCompleted;
    saveUiPreferences();
  }

  function toggleMotionPreference() {
    reduceMotion = !reduceMotion;
    applyMotionPreference();
    saveUiPreferences();
  }

  function isChatExpanded(chatId: string) {
    return expandedChatIds.includes(chatId);
  }

  function setChatExpanded(chatId: string, expanded = true) {
    expandedChatIds = expanded
      ? [...new Set([...expandedChatIds, chatId])]
      : expandedChatIds.filter((id) => id !== chatId);
    saveUiPreferences();
  }

  function toggleAllTasks() {
    allTasksExpanded = !allTasksExpanded;
    saveUiPreferences();
  }

  function taskTitle(description: string) {
    const first = description.split("\n").find((line) => line.trim())?.trim() ?? "Без названия";
    const plain = first
      .replace(/^#{1,3}\s+/, "")
      .replace(/^[-*>]\s+/, "")
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\*\*|\*/g, "")
      .replace(/<\/?u>/g, "")
      .trim();
    return plain || "Без названия";
  }

  function relativeDate(value: string) {
    const date = new Date(value);
    const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
    if (seconds < 60) return "сейчас";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} мин`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ч`;
    if (seconds < 172800) return "вчера";
    return new Intl.DateTimeFormat("ru", { day: "numeric", month: "short" }).format(date);
  }

  function fullDate(value: string) {
    return new Intl.DateTimeFormat("ru", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  }

  function chatTitle(chatId: string, records = chats) {
    return records.find((chat) => chat.id === chatId)?.title ?? "Неизвестный проект";
  }

  function toTaskItem(task: TaskRecord | TaskSummaryRecord, records = chats): TaskItem {
    const source = "source" in task ? task.source : undefined;
    return {
      id: task.id,
      title: taskTitle(task.description),
      chat: chatTitle(task.chat_id, records),
      chatId: task.chat_id,
      updated: relativeDate(task.updated_at),
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      urgency: task.urgency,
      completed: task.status === "completed",
      markdown: task.description,
      source,
      sourceAuthor: source?.author ?? ("source_author" in task ? task.source_author : undefined),
      hasSource: "has_source" in task ? task.has_source : Boolean(source),
      trashedAt: task.trashed_at,
      version: task.version
    };
  }

  function allChat(open: number): ChatItem {
    const now = new Date(0).toISOString();
    return { id: "all", title: "Все задачи", open, created_at: now, updated_at: now, version: "" };
  }

  async function loadData(preserveSelection = true) {
    if (!inTauri()) {
      loadError = "Файлы доступны в окне desktop-приложения";
      loading = false;
      return;
    }
    try {
      const previousSelected = tasks.find((task) => task.id === selectedTaskId);
      let records = await invoke<ChatRecord[]>("list_chats");
      if (!records.length) {
        await invoke<ChatRecord>("create_chat", { title: "Личное" });
        records = await invoke<ChatRecord[]>("list_chats");
      }
      const [summaries, trash] = await Promise.all([
        invoke<TaskSummaryRecord[]>("list_tasks", { chatId: null, includeCompleted: true }),
        invoke<TaskSummaryRecord[]>("list_trashed_tasks")
      ]);
      const openCount = summaries.filter((task) => task.status === "open").length;
      const nextChats = [allChat(openCount), ...records.map((chat) => ({ ...chat, open: summaries.filter((task) => task.chat_id === chat.id && task.status === "open").length }))];
      chats = nextChats;
      tasks = summaries.map((task) => {
        const converted = toTaskItem(task, nextChats);
        if (previousSelected?.id === converted.id && previousSelected.version === converted.version) {
          return { ...converted, source: previousSelected.source, hasSource: previousSelected.hasSource };
        }
        return converted;
      });
      trashedTasks = trash.map((task) => toTaskItem(task, nextChats));
      if (!preserveSelection || !nextChats.some((chat) => chat.id === selectedChatId)) selectedChatId = "all";
      if (selectedTaskId) {
        const current = tasks.find((task) => task.id === selectedTaskId);
        if (current && markdown === lastSavedMarkdown && current.version !== previousSelected?.version) {
          const full = await invoke<TaskRecord>("get_task", { id: current.id });
          const updated = toTaskItem(full, nextChats);
          tasks = tasks.map((task) => task.id === updated.id ? updated : task);
          markdown = updated.markdown;
          lastSavedMarkdown = updated.markdown;
          await tick();
          renderMarkdown(markdown);
        }
      }
      loadError = "";
    } catch (error) {
      loadError = String(error);
    } finally {
      loading = false;
    }
  }

  const blockPrefixes: Record<BlockKind, string> = {
    "paragraph": "",
    "heading-1": "# ",
    "heading-2": "## ",
    "heading-3": "### ",
    "bullet": "- ",
    "number": "1. ",
    "quote": "> ",
    "code": "``` "
  };

  function parseLine(line: string): { kind: BlockKind; text: string } {
    if (line.startsWith("### ")) return { kind: "heading-3", text: line.slice(4) };
    if (line.startsWith("## ")) return { kind: "heading-2", text: line.slice(3) };
    if (line.startsWith("# ")) return { kind: "heading-1", text: line.slice(2) };
    if (line.startsWith("- ")) return { kind: "bullet", text: line.slice(2) };
    if (/^\d+\. /.test(line)) return { kind: "number", text: line.replace(/^\d+\. /, "") };
    if (line.startsWith("> ")) return { kind: "quote", text: line.slice(2) };
    if (line.startsWith("``` ")) return { kind: "code", text: line.slice(4) };
    return { kind: "paragraph", text: line };
  }

  function appendInlineMarkdown(parent: HTMLElement, value: string) {
    let cursor = 0;
    while (cursor < value.length) {
      if (value.startsWith("![", cursor)) {
        const labelEnd = value.indexOf("](", cursor + 2);
        const pathEnd = labelEnd >= 0 ? value.indexOf(")", labelEnd + 2) : -1;
        const path = pathEnd >= 0 ? value.slice(labelEnd + 2, pathEnd) : "";
        if (labelEnd >= 0 && pathEnd >= 0 && path.startsWith("attachments/")) {
          parent.append(createImageAttachment(value.slice(cursor + 2, labelEnd), path));
          cursor = pathEnd + 1;
          continue;
        }
      }
      if (value.startsWith("**", cursor)) {
        const end = value.indexOf("**", cursor + 2);
        if (end > cursor + 2) {
          const strong = document.createElement("strong");
          appendInlineMarkdown(strong, value.slice(cursor + 2, end));
          parent.append(strong);
          cursor = end + 2;
          continue;
        }
      }
      if (value[cursor] === "*") {
        const end = value.indexOf("*", cursor + 1);
        if (end > cursor + 1) {
          const em = document.createElement("em");
          appendInlineMarkdown(em, value.slice(cursor + 1, end));
          parent.append(em);
          cursor = end + 1;
          continue;
        }
      }
      if (value.startsWith("<u>", cursor)) {
        const end = value.indexOf("</u>", cursor + 3);
        if (end > cursor + 3) {
          const underline = document.createElement("u");
          appendInlineMarkdown(underline, value.slice(cursor + 3, end));
          parent.append(underline);
          cursor = end + 4;
          continue;
        }
      }
      if (value[cursor] === "[") {
        const labelEnd = value.indexOf("](", cursor + 1);
        const pathEnd = labelEnd >= 0 ? value.indexOf(")", labelEnd + 2) : -1;
        const path = pathEnd >= 0 ? value.slice(labelEnd + 2, pathEnd) : "";
        if (labelEnd >= 0 && pathEnd >= 0 && (isHttpUrl(path) || path.startsWith("attachments/"))) {
          const link = document.createElement("a");
          appendInlineMarkdown(link, value.slice(cursor + 1, labelEnd));
          link.dataset.attachmentPath = path.startsWith("attachments/") ? path : "";
          if (isHttpUrl(path)) decorateExternalLink(link, path);
          else link.href = path;
          parent.append(link);
          cursor = pathEnd + 1;
          continue;
        }
      }
      const nextCandidates = [value.indexOf("![", cursor + 1), value.indexOf("**", cursor + 1), value.indexOf("*", cursor + 1), value.indexOf("<u>", cursor + 1), value.indexOf("[", cursor + 1)].filter((index) => index >= 0);
      const next = nextCandidates.length ? Math.min(...nextCandidates) : value.length;
      parent.append(document.createTextNode(value.slice(cursor, Math.max(cursor + 1, next))));
      cursor = Math.max(cursor + 1, next);
    }
  }

  function createBlock(kind: BlockKind, text = "") {
    const block = document.createElement("div");
    block.dataset.block = kind;
    block.className = `editor-block ${kind}`;
    if (text) appendInlineMarkdown(block, text);
    else block.append(document.createElement("br"));
    return block;
  }

  function createImageAttachment(alt: string, relativePath: string, source = "") {
    const card = document.createElement("span");
    card.className = "attachment-card";
    card.dataset.attachmentKind = "image";
    card.dataset.attachmentPath = relativePath;
    card.dataset.attachmentAlt = alt || "Изображение";
    card.contentEditable = "false";
    const image = document.createElement("img");
    image.alt = alt || "Изображение";
    if (source) image.src = source;
    image.draggable = false;
    const tools = document.createElement("span");
    tools.className = "attachment-tools";
    const view = document.createElement("button");
    view.type = "button";
    view.className = "attachment-tool";
    view.dataset.viewAttachment = "true";
    view.setAttribute("aria-label", `Открыть ${image.alt} на весь экран`);
    view.title = "Открыть на весь экран";
    view.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>';
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "attachment-tool danger";
    remove.dataset.removeAttachment = "true";
    remove.setAttribute("aria-label", `Убрать изображение ${image.alt} из задачи`);
    remove.title = "Убрать изображение";
    remove.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6"/></svg>';
    tools.append(view, remove);
    card.append(image, tools);
    return card;
  }

  function serializeInline(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (!(node instanceof HTMLElement)) return "";
    if (node.dataset.attachmentKind === "image") return `![${node.dataset.attachmentAlt ?? "Изображение"}](${node.dataset.attachmentPath ?? ""})`;
    const content = [...node.childNodes].map(serializeInline).join("");
    if (node.tagName === "STRONG" || node.tagName === "B") return `**${content}**`;
    if (node.tagName === "EM" || node.tagName === "I") return `*${content}*`;
    if (node.tagName === "U") return `<u>${content}</u>`;
    if (node.tagName === "IMG") return `![${node.getAttribute("alt") ?? "Изображение"}](${node.dataset.attachmentPath ?? ""})`;
    if (node.tagName === "A") return `[${content}](${node.dataset.attachmentPath || node.getAttribute("href") || ""})`;
    return node.tagName === "BR" ? "" : content;
  }

  function renumberLists() {
    let index = 0;
    for (const block of editorRoot.querySelectorAll<HTMLElement>(":scope > .editor-block")) {
      if (block.dataset.block === "number") {
        index += 1;
        block.dataset.number = String(index);
      } else {
        index = 0;
        delete block.dataset.number;
      }
    }
  }

  function renderMarkdown(value: string) {
    if (!editorRoot) return;
    editorRoot.replaceChildren(...value.split("\n").map((line) => {
      const block = parseLine(line);
      return createBlock(block.kind, block.text);
    }));
    renumberLists();
    void hydrateAttachments();
  }

  async function hydrateAttachments() {
    if (!inTauri() || !selectedTaskId || !editorRoot) return;
    for (const url of attachmentObjectUrls) URL.revokeObjectURL(url);
    attachmentObjectUrls = [];
    for (const element of editorRoot.querySelectorAll<HTMLElement>("[data-attachment-path]")) {
      const relativePath = element.dataset.attachmentPath;
      if (!relativePath) continue;
      try {
        const bytes = await invoke<ArrayBuffer>("read_task_attachment", { id: selectedTaskId, relativePath });
        const url = URL.createObjectURL(new Blob([bytes], { type: attachmentMimeType(relativePath) }));
        attachmentObjectUrls.push(url);
        if (element.dataset.attachmentKind === "image") {
          const image = element.querySelector("img");
          if (image) image.src = url;
        } else if (element instanceof HTMLImageElement) element.src = url;
        else if (element instanceof HTMLAnchorElement) element.href = url;
      } catch {
        element.classList.add("missing-attachment");
      }
    }
  }

  function attachmentMimeType(path: string) {
    const extension = path.split(".").pop()?.toLowerCase();
    return ({ png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", svg: "image/svg+xml", pdf: "application/pdf", mp3: "audio/mpeg", wav: "audio/wav", mp4: "video/mp4", webm: "video/webm", txt: "text/plain", md: "text/markdown" } as Record<string, string>)[extension ?? ""] ?? "application/octet-stream";
  }

  function serializeEditor() {
    const blocks = [...editorRoot.querySelectorAll<HTMLElement>(":scope > .editor-block")];
    renumberLists();
    markdown = blocks.map((block) => {
      const kind = (block.dataset.block as BlockKind) || "paragraph";
      const prefix = kind === "number" ? `${block.dataset.number ?? "1"}. ` : blockPrefixes[kind];
      return `${prefix}${[...block.childNodes].map(serializeInline).join("")}`;
    }).join("\n");
    const titleBlock = blocks.find((block) => block.dataset.block === "heading-1");
    const nextTitle = titleBlock?.textContent?.trim();
    tasks = tasks.map((task) => task.id === selectedTaskId ? { ...task, markdown, ...(nextTitle ? { title: nextTitle } : {}) } : task);
    scheduleSave();
  }

  function scheduleSave() {
    if (!selectedTaskId || !inTauri()) return;
    saveState = "idle";
    saveError = "";
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => { void saveNow(); }, 900);
  }

  async function saveNow() {
    window.clearTimeout(saveTimer);
    if (!inTauri() || !selectedTaskId) return;
    if (saveInFlight) {
      await saveInFlight;
      const queued = tasks.find((task) => task.id === selectedTaskId);
      if (queued && queued.markdown !== lastSavedMarkdown) await saveNow();
      return;
    }
    const task = tasks.find((item) => item.id === selectedTaskId);
    if (!task || task.markdown === lastSavedMarkdown) {
      if (saveState !== "error") saveState = "saved";
      return;
    }
    const taskId = task.id;
    const snapshot = task.markdown;
    const expectedVersion = task.version;
    let savedOk = false;
    saveState = "saving";
    const work = (async () => {
      try {
        const saved = await invoke<TaskRecord>("update_task", {
          id: taskId,
          patch: { description: snapshot },
          expectedVersion
        });
        const converted = toTaskItem(saved);
        tasks = tasks.map((current) => {
          if (current.id !== taskId) return current;
          if (current.markdown !== snapshot) {
            return { ...current, version: saved.version, updatedAt: saved.updated_at, updated: relativeDate(saved.updated_at) };
          }
          return converted;
        });
        if (selectedTaskId === taskId) lastSavedMarkdown = snapshot;
        saveState = "saved";
        saveError = "";
        conflictRemote = null;
        savedOk = true;
      } catch (error) {
        saveState = "error";
        saveError = String(error);
        if (saveError.includes("изменились в другом процессе")) {
          try { conflictRemote = await invoke<TaskRecord>("get_task", { id: taskId }); } catch { conflictRemote = null; }
        }
      }
    })();
    saveInFlight = work;
    await work;
    saveInFlight = null;
    const current = tasks.find((item) => item.id === taskId);
    if (savedOk && current && selectedTaskId === taskId && current.markdown !== snapshot) scheduleSave();
  }

  async function keepLocalVersion() {
    const local = tasks.find((task) => task.id === selectedTaskId);
    if (!local || !conflictRemote) return;
    try {
      saveState = "saving";
      const saved = await invoke<TaskRecord>("update_task", {
        id: local.id,
        patch: { description: local.markdown },
        expectedVersion: conflictRemote.version
      });
      const converted = toTaskItem(saved);
      tasks = tasks.map((task) => task.id === saved.id ? converted : task);
      markdown = converted.markdown;
      lastSavedMarkdown = converted.markdown;
      conflictRemote = null;
      saveError = "";
      saveState = "saved";
    } catch (error) {
      saveState = "error";
      saveError = String(error);
    }
  }

  async function useDiskVersion() {
    if (!conflictRemote) return;
    const converted = toTaskItem(conflictRemote);
    tasks = tasks.map((task) => task.id === converted.id ? converted : task);
    markdown = converted.markdown;
    lastSavedMarkdown = converted.markdown;
    conflictRemote = null;
    saveError = "";
    saveState = "saved";
    await tick();
    renderMarkdown(markdown);
  }

  function currentBlock() {
    const node = window.getSelection()?.anchorNode;
    const element = node instanceof HTMLElement ? node : node?.parentElement;
    return element?.closest<HTMLElement>(".editor-block") ?? null;
  }

  function updateSelectionToolbar() {
    const selection = window.getSelection();
    if (!selection?.rangeCount || !editorRoot) {
      selectionToolbar = null;
      savedSelection = null;
      linkEditorOpen = false;
      return;
    }
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer instanceof Element ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
    if (!container || !editorRoot.contains(container)) {
      selectionToolbar = null;
      savedSelection = null;
      linkEditorOpen = false;
      return;
    }
    savedSelection = range.cloneRange();
    if (selection.isCollapsed) {
      selectionToolbar = null;
      linkEditorOpen = false;
      return;
    }
    const rect = range.getBoundingClientRect();
    selectionToolbar = {
      left: Math.max(12, Math.min(window.innerWidth - 214, rect.left + rect.width / 2 - 103)),
      top: Math.max(58, rect.top - 44)
    };
  }

  function restoreSelection() {
    if (!savedSelection) return false;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(savedSelection);
    return true;
  }

  function applyInlineFormat(command: "bold" | "underline") {
    if (!restoreSelection()) return;
    document.execCommand(command);
    serializeEditor();
    updateSelectionToolbar();
  }

  function applyLargeHeading() {
    if (!restoreSelection()) return;
    const block = currentBlock();
    if (!block) return;
    setBlockKind(block, block.dataset.block === "heading-1" ? "paragraph" : "heading-1");
    serializeEditor();
    updateSelectionToolbar();
  }

  function isHttpUrl(value: string) {
    try {
      const url = new URL(value.trim());
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  function decorateExternalLink(anchor: HTMLAnchorElement, url: string) {
    anchor.href = url;
    anchor.dataset.taskLink = "true";
    anchor.dataset.linkHint = "Зажмите Ctrl, чтобы перейти";
    anchor.rel = "noreferrer";
  }

  async function openTaskLink(url: string) {
    if (!isHttpUrl(url)) return;
    try {
      if (inTauri()) await openUrl(url);
      else window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      saveState = "error";
      saveError = `Не удалось открыть ссылку: ${String(error)}`;
    }
  }

  function createSelectionLink(url: string) {
    if (!isHttpUrl(url) || !restoreSelection()) return false;
    document.execCommand("createLink", false, url.trim());
    const selection = window.getSelection();
    const anchor = selection?.anchorNode instanceof Element ? selection.anchorNode.closest("a") : selection?.anchorNode?.parentElement?.closest("a");
    if (anchor) {
      decorateExternalLink(anchor, url.trim());
    }
    serializeEditor();
    updateSelectionToolbar();
    return true;
  }

  async function linkSelectionFromClipboard() {
    linkEditorOpen = true;
    if (selectionToolbar) selectionToolbar = { ...selectionToolbar, left: Math.min(selectionToolbar.left, window.innerWidth - 268), top: Math.max(58, selectionToolbar.top - 35) };
    try {
      const clipboard = await navigator.clipboard.readText();
      linkDraft = isHttpUrl(clipboard) ? clipboard.trim() : "";
    } catch {
      linkDraft = "";
    }
  }

  function submitSelectionLink(event: SubmitEvent) {
    event.preventDefault();
    if (createSelectionLink(linkDraft)) {
      linkEditorOpen = false;
      linkDraft = "";
    }
  }

  function handleEditorPaste(event: ClipboardEvent) {
    const files = [...(event.clipboardData?.files ?? [])];
    if (files.length) {
      event.preventDefault();
      if (window.getSelection()?.rangeCount) savedSelection = window.getSelection()!.getRangeAt(0).cloneRange();
      void importAttachments(files);
      return;
    }
    const selection = window.getSelection();
    const pasted = event.clipboardData?.getData("text/plain") ?? "";
    if (!selection?.isCollapsed && isHttpUrl(pasted)) {
      event.preventDefault();
      savedSelection = selection!.getRangeAt(0).cloneRange();
      createSelectionLink(pasted);
    }
  }

  async function importAttachments(files: File[]) {
    if (!selectedTaskId || !inTauri()) return;
    for (const file of files) {
      try {
        const relativePath = await invoke<string>("save_task_attachment", {
          id: selectedTaskId,
          fileName: file.name || (file.type === "image/png" ? "изображение.png" : file.type === "image/jpeg" ? "изображение.jpg" : "вложение"),
          bytes: [...new Uint8Array(await file.arrayBuffer())]
        });
        const bytes = await invoke<ArrayBuffer>("read_task_attachment", { id: selectedTaskId, relativePath });
        const objectUrl = URL.createObjectURL(new Blob([bytes], { type: file.type || attachmentMimeType(relativePath) }));
        attachmentObjectUrls.push(objectUrl);
        const imageFile = file.type.startsWith("image/");
        const node = imageFile ? createImageAttachment(file.name || "Изображение", relativePath, objectUrl) : document.createElement("a");
        if (node instanceof HTMLAnchorElement) {
          node.dataset.attachmentPath = relativePath;
          node.textContent = file.name || "Вложение";
          node.href = objectUrl;
          node.target = "_blank";
          node.rel = "noreferrer";
        }
        restoreSelection();
        const selection = window.getSelection();
        const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
        const block = currentBlock() ?? editorRoot.lastElementChild as HTMLElement | null;
        if (imageFile && block) {
          const attachmentBlock = createBlock("paragraph");
          attachmentBlock.replaceChildren(node);
          const blockIsEmpty = !(block.textContent ?? "").trim() && !block.querySelector("[data-attachment-path]");
          if (blockIsEmpty) block.replaceWith(attachmentBlock);
          else block.after(attachmentBlock);
          const next = createBlock("paragraph");
          attachmentBlock.after(next);
          placeCaret(next, 0);
          savedSelection = window.getSelection()?.rangeCount ? window.getSelection()!.getRangeAt(0).cloneRange() : null;
        } else if (range && block) {
          range.deleteContents();
          range.insertNode(node);
          range.setStartAfter(node);
          range.collapse(true);
          selection?.removeAllRanges();
          selection?.addRange(range);
          savedSelection = range.cloneRange();
        } else if (block) {
          block.append(node);
        }
        serializeEditor();
      } catch (error) {
        saveState = "error";
        saveError = `Не удалось добавить вложение: ${String(error)}`;
      }
    }
    attachmentInput.value = "";
  }

  function handleEditorDrop(event: DragEvent) {
    const files = [...(event.dataTransfer?.files ?? [])];
    if (!files.length) return;
    event.preventDefault();
    const range = document.caretRangeFromPoint?.(event.clientX, event.clientY);
    if (range) savedSelection = range.cloneRange();
    void importAttachments(files);
  }

  function caretOffset(block: HTMLElement) {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return 0;
    const range = selection.getRangeAt(0).cloneRange();
    range.selectNodeContents(block);
    range.setEnd(selection.anchorNode ?? block, selection.anchorOffset);
    return range.toString().length;
  }

  function placeCaret(block: HTMLElement, offset: number) {
    block.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    const text = block.firstChild?.nodeType === Node.TEXT_NODE ? block.firstChild : block;
    range.setStart(text, Math.min(offset, text.textContent?.length ?? 0));
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  function setBlockKind(block: HTMLElement, kind: BlockKind) {
    block.dataset.block = kind;
    block.className = `editor-block ${kind}`;
  }

  function updateHint(block: HTMLElement | null) {
    const typed = block?.textContent ?? "";
    const match = markdownHints[typed];
    if (!block || !match) { editorHint = null; return; }
    const bounds = block.getBoundingClientRect();
    const sidebarEdge = sidebarCollapsed ? 58 : 304;
    const estimatedWidth = Math.min(180, match.title.length * 7 + 24);
    editorHint = {
      ...match,
      left: Math.max(sidebarEdge + 8, bounds.left - 12 - estimatedWidth),
      top: Math.max(58, Math.min(bounds.top + (bounds.height - 26) / 2, window.innerHeight - 34))
    };
  }

  $: selectedTask = tasks.find((task) => task.id === selectedTaskId);
  function taskMatchesQuery(task: TaskItem) {
    const haystack = `${task.title}\n${task.markdown}\n${task.sourceAuthor ?? ""}`.toLocaleLowerCase("ru");
    return haystack.includes(normalizedQuery);
  }

  $: currentChat = chats.find((chat) => chat.id === selectedChatId) ?? allChat(0);
  $: normalizedQuery = query.trim().toLocaleLowerCase("ru");
  $: searchActive = normalizedQuery.length > 0;
  $: visibleTasks = tasks.filter((task) => showCompleted || !task.completed);
  $: sidebarSearchGroups = searchActive ? chats.slice(1).map((chat) => {
    const projectMatches = chat.title.toLocaleLowerCase("ru").includes(normalizedQuery);
    const projectTasks = tasks.filter((task) => task.chatId === chat.id);
    return { chat, tasks: projectMatches ? projectTasks : projectTasks.filter(taskMatchesQuery), projectMatches };
  }).filter((group) => group.projectMatches || group.tasks.length) : [];
  $: currentProjectTasks = tasks
    .filter((task) => selectedChatId === "all" || task.chatId === selectedChatId)
    .sort((left, right) => ({ urgent: 0, important: 1, normal: 2 })[left.urgency] - ({ urgent: 0, important: 1, normal: 2 })[right.urgency]);
  $: currentOpenTasks = currentProjectTasks.filter((task) => !task.completed);
  $: currentCompletedTasks = currentProjectTasks.filter((task) => task.completed);

  function tasksForChat(chat: ChatItem) {
    return tasks.filter((task) => task.chatId === chat.id && (showCompleted || !task.completed));
  }

  function openTaskCount(chatId: string) {
    return tasks.filter((task) => !task.completed && (chatId === "all" || task.chatId === chatId)).length;
  }

  async function selectChat(chat: ChatItem) {
    await saveNow();
    if (conflictRemote) return;
    selectedChatId = chat.id;
    activeSection = "tasks";
    workspaceView = "project";
    completedGroupOpen = false;
    deleteChatConfirmOpen = false;
    editorHint = null;
    sourceEditorOpen = false;
    datePickerOpen = false;
    taskActionMenuOpen = false;
  }

  function toggleChat(chatId: string) {
    expandedChatIds = isChatExpanded(chatId)
      ? expandedChatIds.filter((id) => id !== chatId)
      : [...expandedChatIds, chatId];
    window.setTimeout(saveUiPreferences, 0);
  }

  async function openImageViewer(card: HTMLElement) {
    const image = card.querySelector("img");
    if (!image?.src) return;
    imageViewer = { src: image.src, alt: image.alt || "Изображение" };
    imageViewerZoom = 1;
    await tick();
    imageViewerDialog?.focus();
  }

  function closeImageViewer() {
    imageViewer = null;
    imageViewerZoom = 1;
  }

  function changeImageZoom(step: number) {
    imageViewerZoom = Math.min(4, Math.max(.5, Math.round((imageViewerZoom + step) * 10) / 10));
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (imageViewer && event.key === "Escape") closeImageViewer();
  }

  function handleEditorClick(event: MouseEvent) {
    const target = event.target instanceof Element ? event.target : null;
    const taskLink = target?.closest<HTMLAnchorElement>("a[data-task-link]");
    if (taskLink) {
      event.preventDefault();
      if (event.ctrlKey) {
        event.stopPropagation();
        void openTaskLink(taskLink.href);
      }
      return;
    }
    const view = target?.closest<HTMLElement>("[data-view-attachment]");
    if (view) {
      event.preventDefault();
      event.stopPropagation();
      const card = view.closest<HTMLElement>(".attachment-card");
      if (card) void openImageViewer(card);
      return;
    }
    const remove = target?.closest<HTMLElement>("[data-remove-attachment]");
    if (remove) {
      event.preventDefault();
      event.stopPropagation();
      const card = remove.closest<HTMLElement>(".attachment-card");
      const block = card?.closest<HTMLElement>(".editor-block");
      card?.remove();
      if (block && !block.childNodes.length) block.append(document.createElement("br"));
      if (block) placeCaret(block, 0);
      serializeEditor();
      return;
    }
    updateHint(currentBlock());
  }

  function markerKind(marker: string): BlockKind | null {
    const transformations: Record<string, BlockKind> = {
      "#": "heading-1", "##": "heading-2", "###": "heading-3",
      "-": "bullet", "1.": "number", ">": "quote", "```": "code"
    };
    return transformations[marker] ?? null;
  }

  function transformTypedMarker(block: HTMLElement) {
    const currentKind = (block.dataset.block as BlockKind) || "paragraph";
    if (currentKind !== "paragraph") return false;
    const normalized = (block.textContent ?? "").replace(/\u00a0/g, " ");
    const match = normalized.match(/^(#{1,3}|-|1\.|>|```)[ \t]+(.*)$/s);
    if (!match) return false;
    const nextKind = markerKind(match[1]);
    if (!nextKind) return false;
    const remainder = match[2];
    setBlockKind(block, nextKind);
    block.replaceChildren(remainder ? document.createTextNode(remainder) : document.createElement("br"));
    placeCaret(block, remainder.length);
    return true;
  }

  function syncEditor() {
    const block = currentBlock();
    if (!block) return;
    const transformed = transformTypedMarker(block);
    serializeEditor();
    updateHint(transformed ? null : block);
  }

  function handleEditorKeydown(event: KeyboardEvent) {
    const block = currentBlock();
    if (!block) return;
    const offset = caretOffset(block);
    const text = block.textContent ?? "";
    const kind = (block.dataset.block as BlockKind) || "paragraph";

    if (event.key === " " && kind === "paragraph" && offset === text.length) {
      const nextKind = markerKind(text.replace(/\u00a0/g, " "));
      if (nextKind) {
        event.preventDefault();
        editorHint = null;
        setBlockKind(block, nextKind);
        block.replaceChildren(document.createElement("br"));
        placeCaret(block, 0);
        serializeEditor();
        return;
      }
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      editorHint = null;
      if (block.querySelector(".attachment-card")) {
        const next = createBlock("paragraph");
        block.after(next);
        placeCaret(next, 0);
        serializeEditor();
        return;
      }
      if (!text && (kind === "bullet" || kind === "number" || kind === "quote")) {
        setBlockKind(block, "paragraph");
        serializeEditor();
        return;
      }
      const nextKind = kind === "bullet" || kind === "number" ? kind : "paragraph";
      const next = createBlock(nextKind, text.slice(offset));
      block.textContent = text.slice(0, offset);
      if (!block.textContent) block.append(document.createElement("br"));
      block.after(next);
      placeCaret(next, 0);
      serializeEditor();
      return;
    }

    if (event.key === "Backspace" && offset === 0) {
      if (!text && kind !== "paragraph") {
        event.preventDefault();
        setBlockKind(block, "paragraph");
        serializeEditor();
        return;
      }
      const previous = block.previousElementSibling as HTMLElement | null;
      if (previous) {
        event.preventDefault();
        const previousText = previous.textContent ?? "";
        previous.textContent = previousText + text;
        block.remove();
        placeCaret(previous, previousText.length);
        serializeEditor();
      }
    }
  }

  async function focusEditor() {
    await tick();
    const first = editorRoot?.querySelector<HTMLElement>(".editor-block");
    if (first) placeCaret(first, first.textContent?.length ?? 0);
  }

  async function openTask(task: TaskItem) {
    await saveNow();
    if (conflictRemote) return;
    let fullTask = task;
    if (inTauri()) {
      try {
        fullTask = toTaskItem(await invoke<TaskRecord>("get_task", { id: task.id }));
        tasks = tasks.map((item) => item.id === fullTask.id ? fullTask : item);
      } catch (error) {
        loadError = String(error);
        return;
      }
    }
    const owner = chats.find((chat) => chat.id === fullTask.chatId);
    if (owner) {
      selectedChatId = owner.id;
      setChatExpanded(owner.id);
    }
    selectedTaskId = fullTask.id;
    markdown = fullTask.markdown;
    lastSavedMarkdown = fullTask.markdown;
    saveState = "idle";
    workspaceView = "task";
    activeSection = "tasks";
    editorHint = null;
    sourceEditorOpen = false;
    taskActionMenuOpen = false;
    void tick().then(() => renderMarkdown(markdown));
  }

  function requestNewTask(anchor: "sidebar" | "workspace" = "workspace") {
    if (activeSection === "tasks" && selectedChatId !== "all" && currentChat.id !== "all") {
      void createDraft(currentChat);
    } else {
      newTaskMenuAnchor = newTaskMenuAnchor === anchor ? null : anchor;
    }
  }

  async function createDraft(chosenChat?: ChatItem) {
    await saveNow();
    if (conflictRemote) return;
    const targetChat = chosenChat ?? (selectedChatId === "all" ? undefined : currentChat);
    if (!targetChat || targetChat.id === "all" || !inTauri()) return;
    newTaskMenuAnchor = null;
    let draft: TaskItem;
    try {
      const created = await invoke<TaskRecord>("create_task", {
        input: { chat_id: targetChat.id, description: "# Новая задача", urgency: "normal", source: null }
      });
      draft = toTaskItem(created);
    } catch (error) {
      loadError = String(error);
      return;
    }
    tasks = [draft, ...tasks];
    selectedChatId = targetChat.id;
    setChatExpanded(targetChat.id);
    selectedTaskId = draft.id;
    markdown = draft.markdown;
    lastSavedMarkdown = draft.markdown;
    saveState = "saved";
    workspaceView = "task";
    void tick().then(() => { renderMarkdown(markdown); void focusEditor(); });
  }

  async function submitCreateChat(event: SubmitEvent) {
    event.preventDefault();
    const title = createChatTitle.trim();
    if (!title || !inTauri()) return;
    try {
      const created = await invoke<ChatRecord>("create_chat", { title });
      createChatTitle = "";
      createChatOpen = false;
      await loadData(true);
      const chat = chats.find((item) => item.id === created.id);
      if (chat) await selectChat(chat);
    } catch (error) {
      loadError = String(error);
    }
  }

  function startRenameChat() {
    if (currentChat.id === "all") return;
    renameChatTitle = currentChat.title;
    renameChatOpen = true;
    formError = "";
  }

  async function submitRenameChat(event: SubmitEvent) {
    event.preventDefault();
    const title = renameChatTitle.trim();
    if (!title || currentChat.id === "all" || !inTauri()) return;
    try {
      const updated = await invoke<ChatRecord>("update_chat", { id: currentChat.id, title, expectedVersion: currentChat.version });
      chats = chats.map((chat) => chat.id === updated.id ? { ...updated, open: openTaskCount(updated.id) } : chat);
      tasks = tasks.map((task) => task.chatId === updated.id ? { ...task, chat: updated.title } : task);
      trashedTasks = trashedTasks.map((task) => task.chatId === updated.id ? { ...task, chat: updated.title } : task);
      renameChatOpen = false;
    } catch (error) {
      formError = String(error);
    }
  }

  async function deleteCurrentChat() {
    if (currentChat.id === "all" || !inTauri()) return;
    await saveNow();
    if (conflictRemote) return;
    try {
      const deletedId = currentChat.id;
      await invoke("delete_chat", { id: deletedId, expectedVersion: currentChat.version });
      chats = chats.filter((chat) => chat.id !== deletedId);
      tasks = tasks.filter((task) => task.chatId !== deletedId);
      trashedTasks = trashedTasks.filter((task) => task.chatId !== deletedId);
      setChatExpanded(deletedId, false);
      selectedChatId = "all";
      selectedTaskId = "";
      workspaceView = "project";
      deleteChatConfirmOpen = false;
      formError = "";
    } catch (error) {
      formError = String(error);
    }
  }

  function toLocalDateTime(value?: string) {
    if (!value) return "";
    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  function sourceDateLabel(value: string) {
    if (!value) return "Дата не указана";
    return new Intl.DateTimeFormat("ru", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  }

  function calendarTitle(month: Date) {
    return new Intl.DateTimeFormat("ru", { month: "long", year: "numeric" }).format(month);
  }

  function calendarDays(month: Date) {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const mondayOffset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - mondayOffset);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return { date, currentMonth: date.getMonth() === month.getMonth() };
    });
  }

  function sameCalendarDay(left: Date, right: Date) {
    return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
  }

  function selectedSourceDate(value: string) {
    return value ? new Date(value) : null;
  }

  function isSelectedSourceDay(date: Date, value: string) {
    const selected = selectedSourceDate(value);
    return selected ? sameCalendarDay(date, selected) : false;
  }

  function openDatePicker() {
    const base = selectedSourceDate(sourceSentAt) ?? new Date();
    calendarMonth = new Date(base.getFullYear(), base.getMonth(), 1);
    sourceHour = String(base.getHours()).padStart(2, "0");
    sourceMinute = String(base.getMinutes()).padStart(2, "0");
    datePickerOpen = !datePickerOpen;
  }

  function setSourceDate(date: Date) {
    const hours = Math.min(23, Math.max(0, Number.parseInt(sourceHour || "0", 10) || 0));
    const minutes = Math.min(59, Math.max(0, Number.parseInt(sourceMinute || "0", 10) || 0));
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    sourceSentAt = `${year}-${month}-${day}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    sourceHour = String(hours).padStart(2, "0");
    sourceMinute = String(minutes).padStart(2, "0");
  }

  function updateSourceTime() {
    const base = selectedSourceDate(sourceSentAt) ?? new Date();
    setSourceDate(base);
  }

  function changeCalendarMonth(offset: number) {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + offset, 1);
  }

  function openSourceEditor() {
    if (!selectedTask) return;
    const willOpen = !sourceEditorOpen;
    urgencyMenuOpen = false;
    taskActionMenuOpen = false;
    if (!willOpen) {
      sourceEditorOpen = false;
      datePickerOpen = false;
      return;
    }
    sourceText = selectedTask.source?.text ?? "";
    sourceAuthor = selectedTask.source?.author ?? "";
    sourceUrl = selectedTask.source?.url ?? "";
    sourceSentAt = toLocalDateTime(selectedTask.source?.sent_at);
    const sourceDate = selectedTask.source?.sent_at ? new Date(selectedTask.source.sent_at) : new Date();
    sourceHour = String(sourceDate.getHours()).padStart(2, "0");
    sourceMinute = String(sourceDate.getMinutes()).padStart(2, "0");
    datePickerOpen = false;
    sourceEditorOpen = true;
    formError = "";
  }

  async function saveSource(event: SubmitEvent) {
    event.preventDefault();
    await saveNow();
    const task = tasks.find((item) => item.id === selectedTaskId);
    if (!task || !sourceText.trim() || conflictRemote || !inTauri()) {
      if (!sourceText.trim()) formError = "Добавьте текст исходного сообщения";
      return;
    }
    try {
      const saved = await invoke<TaskRecord>("update_task", {
        id: task.id,
        patch: {
          source: {
            text: sourceText.trim(),
            author: sourceAuthor.trim() || null,
            sent_at: sourceSentAt ? new Date(sourceSentAt).toISOString() : null,
            url: sourceUrl.trim() || null
          }
        },
        expectedVersion: task.version
      });
      const converted = toTaskItem(saved);
      tasks = tasks.map((item) => item.id === saved.id ? converted : item);
      lastSavedMarkdown = converted.markdown;
      sourceEditorOpen = false;
      saveState = "saved";
    } catch (error) {
      formError = String(error);
    }
  }

  async function clearSource() {
    await saveNow();
    const task = tasks.find((item) => item.id === selectedTaskId);
    if (!task || conflictRemote || !inTauri()) return;
    try {
      const saved = await invoke<TaskRecord>("clear_task_source", { id: task.id, expectedVersion: task.version });
      const converted = toTaskItem(saved);
      tasks = tasks.map((item) => item.id === saved.id ? converted : item);
      lastSavedMarkdown = converted.markdown;
      sourceEditorOpen = false;
      saveState = "saved";
    } catch (error) {
      formError = String(error);
    }
  }

  async function moveSelectedTask(chat: ChatItem) {
    await saveNow();
    const task = tasks.find((item) => item.id === selectedTaskId);
    if (!task || chat.id === "all" || task.chatId === chat.id || conflictRemote || !inTauri()) return;
    try {
      const moved = await invoke<TaskRecord>("move_task", { id: task.id, chatId: chat.id, expectedVersion: task.version });
      const converted = toTaskItem(moved);
      tasks = tasks.map((item) => item.id === moved.id ? converted : item);
      selectedChatId = chat.id;
      setChatExpanded(chat.id);
      lastSavedMarkdown = converted.markdown;
      taskActionMenuOpen = false;
      moveMenuOpen = false;
      saveState = "saved";
    } catch (error) {
      saveError = String(error);
      saveState = "error";
    }
  }

  async function trashSelectedTask() {
    await saveNow();
    const task = tasks.find((item) => item.id === selectedTaskId);
    if (!task || conflictRemote || !inTauri()) return;
    try {
      const trashed = toTaskItem(await invoke<TaskRecord>("trash_task", { id: task.id, expectedVersion: task.version }));
      tasks = tasks.filter((item) => item.id !== task.id);
      trashedTasks = [trashed, ...trashedTasks];
      selectedTaskId = "";
      markdown = "";
      lastSavedMarkdown = "";
      workspaceView = "project";
      taskActionMenuOpen = false;
      saveState = "idle";
    } catch (error) {
      saveError = String(error);
      saveState = "error";
    }
  }

  async function restoreTask(task: TaskItem) {
    if (!inTauri()) return;
    try {
      const restored = toTaskItem(await invoke<TaskRecord>("restore_task", { id: task.id, expectedVersion: task.version }));
      trashedTasks = trashedTasks.filter((item) => item.id !== task.id);
      tasks = [restored, ...tasks];
    } catch (error) {
      loadError = String(error);
    }
  }

  async function deleteTrashedTask(task: TaskItem) {
    if (!inTauri()) return;
    try {
      await invoke("delete_trashed_task", { id: task.id, expectedVersion: task.version });
      trashedTasks = trashedTasks.filter((item) => item.id !== task.id);
      purgeTaskId = "";
      loadError = "";
    } catch (error) {
      loadError = String(error);
    }
  }

  async function emptyTrash() {
    if (!inTauri()) return;
    try {
      await invoke<number>("empty_trash");
      trashedTasks = [];
      emptyTrashConfirmOpen = false;
      loadError = "";
    } catch (error) {
      loadError = String(error);
    }
  }

  async function toggleComplete() {
    await saveNow();
    if (conflictRemote) return;
    const task = tasks.find((item) => item.id === selectedTaskId);
    if (!task || !inTauri()) return;
    try {
      const saved = await invoke<TaskRecord>("update_task", {
        id: task.id,
        patch: { status: task.completed ? "open" : "completed" },
        expectedVersion: task.version
      });
      const converted = toTaskItem(saved);
      tasks = tasks.map((item) => item.id === saved.id ? converted : item);
      lastSavedMarkdown = converted.markdown;
      saveState = "saved";
    } catch (error) {
      saveState = "error";
      saveError = String(error);
    }
  }

  function urgencyTitle(urgency: Urgency) {
    return urgency === "urgent" ? "Срочная" : urgency === "important" ? "Важная" : "Обычная";
  }

  async function changeUrgency(urgency: Urgency) {
    urgencyMenuOpen = false;
    await saveNow();
    if (conflictRemote) return;
    const task = tasks.find((item) => item.id === selectedTaskId);
    if (!task || !inTauri() || urgency === task.urgency) return;
    try {
      saveState = "saving";
      const saved = await invoke<TaskRecord>("update_task", {
        id: task.id,
        patch: { urgency },
        expectedVersion: task.version
      });
      const converted = toTaskItem(saved);
      tasks = tasks.map((item) => item.id === saved.id ? converted : item);
      lastSavedMarkdown = converted.markdown;
      saveState = "saved";
    } catch (error) {
      saveState = "error";
      saveError = String(error);
    }
  }

  async function changeSection(section: Section) {
    if (activeSection === section) return;
    await saveNow();
    if (conflictRemote) return;
    activeSection = section;
    deleteChatConfirmOpen = false;
    emptyTrashConfirmOpen = false;
    purgeTaskId = "";
    editorHint = null;
    if (section === "tasks") { await tick(); renderMarkdown(markdown); await focusEditor(); }
  }

  async function copyMcpConfig() {
    await navigator.clipboard.writeText(JSON.stringify({ command: mcpExecutable || "flood-mcp.exe" }, null, 2));
    copied = true;
    window.setTimeout(() => (copied = false), 1400);
  }

  async function openDataDirectory() {
    if (dataDirectory) await openPath(dataDirectory);
  }

  async function checkForUpdates() {
    if (!inTauri() || updateState === "checking" || updateState === "downloading") return;
    updateState = "checking";
    updateMessage = "Проверяем GitHub Releases…";
    updateProgress = 0;
    try {
      availableUpdate?.close();
      availableUpdate = await check({ timeout: 15_000 });
      if (availableUpdate) {
        updateState = "available";
        updateMessage = `Доступна версия ${availableUpdate.version}`;
      } else {
        updateState = "current";
        updateMessage = "Установлена последняя версия";
      }
    } catch (error) {
      updateState = "error";
      const details = String(error);
      updateMessage = details.includes("valid release JSON")
        ? "Канал обновлений готов — опубликованных версий пока нет"
        : "Не удалось проверить обновления. Попробуйте позже";
    }
  }

  async function installAvailableUpdate() {
    if (!availableUpdate || updateState === "downloading") return;
    updateState = "downloading";
    updateMessage = "Загружаем обновление…";
    let downloaded = 0;
    let total = 0;
    try {
      await availableUpdate.downloadAndInstall((event) => {
        if (event.event === "Started") total = event.data.contentLength ?? 0;
        if (event.event === "Progress") downloaded += event.data.chunkLength;
        if (total > 0) updateProgress = Math.min(100, Math.round(downloaded / total * 100));
      });
      updateMessage = "Обновление установлено. Перезапускаем…";
      await relaunch();
    } catch (error) {
      updateState = "error";
      updateMessage = `Не удалось установить обновление: ${String(error)}`;
    }
  }

  function inTauri() {
    return "__TAURI_INTERNALS__" in window;
  }

  function minimizeWindow() {
    if (inTauri()) void getCurrentWindow().minimize();
  }

  function toggleMaximizeWindow() {
    if (inTauri()) void getCurrentWindow().toggleMaximize();
  }

  async function closeWindow() {
    if (!inTauri() || closingWindow) return;
    await saveNow();
    if (conflictRemote) return;
    closingWindow = true;
    try {
      await getCurrentWindow().destroy();
    } catch (error) {
      closingWindow = false;
      saveState = "error";
      saveError = `Не удалось закрыть приложение: ${String(error)}`;
    }
  }

  onMount(() => {
    loadUiPreferences();
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => { if (themePreference === "system") applyTheme(); };
    colorScheme.addEventListener("change", updateSystemTheme);
    let unlisten: UnlistenFn | undefined;
    let unlistenClose: UnlistenFn | undefined;
    let disposed = false;
    void (async () => {
      if (inTauri()) {
        appVersion = await getVersion();
        dataDirectory = await invoke<string>("data_directory");
        mcpExecutable = await invoke<string>("mcp_executable_path");
        unlistenClose = await getCurrentWindow().onCloseRequested(async (event) => {
          if (closingWindow) return;
          event.preventDefault();
          await closeWindow();
        });
      }
      await loadData(false);
      if (disposed || !inTauri()) return;
      unlisten = await listen("data-changed", () => {
        window.clearTimeout(refreshTimer);
        refreshTimer = window.setTimeout(() => {
          if (saveState !== "saving" && markdown === lastSavedMarkdown) void loadData(true);
        }, 220);
      });
    })();
    const flush = () => { void saveNow(); };
    const closeMenus = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest(".urgency-menu")) urgencyMenuOpen = false;
      if (!target?.closest(".source-popover") && !target?.closest(".source-action-button")) {
        sourceEditorOpen = false;
        datePickerOpen = false;
      }
      if (!target?.closest(".date-picker-wrap")) datePickerOpen = false;
      if (!target?.closest(".new-task-menu") && !target?.closest(".new-task-button") && !target?.closest(".project-add-button")) newTaskMenuAnchor = null;
      if (!target?.closest(".task-actions-menu") && !target?.closest("[aria-label='Другие действия']")) {
        taskActionMenuOpen = false;
        moveMenuOpen = false;
      }
    };
    window.addEventListener("blur", flush);
    document.addEventListener("pointerdown", closeMenus);
    return () => {
      disposed = true;
      window.clearTimeout(saveTimer);
      window.clearTimeout(refreshTimer);
      window.removeEventListener("blur", flush);
      document.removeEventListener("pointerdown", closeMenus);
      colorScheme.removeEventListener("change", updateSystemTheme);
      for (const url of attachmentObjectUrls) URL.revokeObjectURL(url);
      unlisten?.();
      unlistenClose?.();
    };
  });
</script>

<svelte:head><title>flood.md</title></svelte:head>
<svelte:window onkeydown={handleWindowKeydown} />

{#if editorHint}
  <aside class="editor-hint" style:left={`${editorHint.left}px`} style:top={`${editorHint.top}px`} aria-live="polite">{editorHint.title}</aside>
{/if}
{#if sidebarProjectHint}
  <aside class="sidebar-project-hint" style:left={`${sidebarProjectHint.left}px`} style:top={`${sidebarProjectHint.top}px`} role="tooltip">{sidebarProjectHint.label}</aside>
{/if}
{#if selectionToolbar}
  <div class:link-open={linkEditorOpen} class="selection-toolbar" style:left={`${selectionToolbar.left}px`} style:top={`${selectionToolbar.top}px`} role="toolbar" tabindex="-1" aria-label="Форматирование текста">
    <div class="selection-toolbar-actions" role="group" aria-label="Начертание" onpointerdown={(event) => event.preventDefault()}>
      <button aria-label="Большой заголовок" title="Большой" onclick={applyLargeHeading}><Heading1 size={15} /></button>
      <button aria-label="Жирный" title="Жирный" onclick={() => applyInlineFormat("bold")}><Bold size={14} /></button>
      <button aria-label="Подчёркнутый" title="Подчёркнутый" onclick={() => applyInlineFormat("underline")}><Underline size={14} /></button>
      <span></span>
      <button class:active={linkEditorOpen} aria-label="Добавить ссылку" title="Добавить ссылку" onclick={linkSelectionFromClipboard}><Link size={14} /></button>
    </div>
    {#if linkEditorOpen}
      <form class="selection-link-form" onsubmit={submitSelectionLink}>
        <input bind:value={linkDraft} inputmode="url" aria-label="Адрес ссылки" placeholder="https://…" />
        <button aria-label="Применить ссылку"><Check size={14} /></button>
      </form>
    {/if}
  </div>
{/if}

<main class:sidebar-collapsed={sidebarCollapsed} class="app-shell">
  <header class="window-bar" data-tauri-drag-region="deep">
    <div class="sidebar-titlebar" data-tauri-drag-region="deep">
      {#if !sidebarCollapsed}<FloodGlyph kind="brand" size={22} /><strong>flood.md</strong>{/if}
      <button class="icon-button collapse-button" aria-label={sidebarCollapsed ? "Развернуть панель" : "Свернуть панель"} data-tauri-drag-region="false" onclick={() => setSidebarCollapsed(!sidebarCollapsed)}>
        {#if sidebarCollapsed}<PanelLeftOpen size={17} />{:else}<PanelLeftClose size={17} />{/if}
      </button>
    </div>
    <div class="window-context" data-tauri-drag-region="deep">
      {#if activeSection === "tasks"}
        <span>{workspaceView === "task" && selectedTask ? selectedTask.chat : currentChat.title}</span>
      {:else}
        <span>{activeSection === "trash" ? "Корзина" : "Настройки"}</span>
      {/if}
    </div>
    <div class="window-actions" data-tauri-drag-region="false">
      {#if activeSection === "tasks" && workspaceView === "task" && selectedTask}
        <span class:error={saveState === "error"} class="save-state" title={saveError}>{saveState === "saving" ? "Сохраняю…" : saveState === "error" ? "Не сохранено" : saveState === "saved" ? "Сохранено" : ""}</span>
        <div class="urgency-menu topbar-urgency">
          <button class="urgency-trigger" aria-label={`Срочность: ${urgencyTitle(selectedTask.urgency)}`} title={`Срочность: ${urgencyTitle(selectedTask.urgency)}`} aria-haspopup="menu" aria-expanded={urgencyMenuOpen} onclick={() => { urgencyMenuOpen = !urgencyMenuOpen; sourceEditorOpen = false; taskActionMenuOpen = false; }}><FloodGlyph kind={selectedTask.urgency} size={14} /><span class="action-label">{urgencyTitle(selectedTask.urgency)}</span><ChevronDown size={12} /></button>
          {#if urgencyMenuOpen}
            <div class="urgency-options" role="menu">
              {#each (["normal", "important", "urgent"] as Urgency[]) as urgency}
                <button class:selected={selectedTask.urgency === urgency} role="menuitem" onclick={() => changeUrgency(urgency)}><FloodGlyph kind={urgency} size={14} /><span>{urgencyTitle(urgency)}</span>{#if selectedTask.urgency === urgency}<Check size={14} />{/if}</button>
              {/each}
            </div>
          {/if}
        </div>
        <input class="attachment-input" bind:this={attachmentInput} type="file" multiple accept="image/*,audio/*,video/*,.pdf,.txt,.md" onchange={(event) => void importAttachments([...(event.currentTarget.files ?? [])])} />
        <button class="topbar-action" aria-label="Добавить вложение" title="Добавить фото или файл" onclick={() => attachmentInput.click()}><Paperclip size={15} /><span class="action-label">Вложение</span></button>
        <button class:active={sourceEditorOpen} class="topbar-action source-action-button" aria-label={selectedTask.hasSource ? "Источник" : "Добавить источник"} title={selectedTask.hasSource ? "Источник" : "Добавить источник"} aria-expanded={sourceEditorOpen} onclick={openSourceEditor}><MessageSquareText size={15} /><span class="action-label">{selectedTask.hasSource ? "Источник" : "Добавить источник"}</span></button>
        {#if sourceEditorOpen}
          <form class="source-editor source-popover" onsubmit={saveSource}>
            <div class="source-popover-head"><strong>{selectedTask.hasSource ? "Источник задачи" : "Добавить источник"}</strong><button type="button" class="icon-button" aria-label="Закрыть" onclick={() => (sourceEditorOpen = false)}><X size={14} /></button></div>
            <label class="source-message"><span>Сообщение</span><textarea bind:value={sourceText} rows="4" placeholder="Вставьте исходное сообщение"></textarea></label>
            <div class="source-detail-row"><span>Автор</span><input bind:value={sourceAuthor} placeholder="Не указан" /></div>
            <div class="source-detail-row date-picker-wrap">
              <span>Дата</span>
              <button type="button" class="source-date-button" aria-expanded={datePickerOpen} onclick={openDatePicker}><CalendarDays size={15} /><span>{sourceDateLabel(sourceSentAt)}</span><ChevronDown size={12} /></button>
              {#if datePickerOpen}
                <div class="date-picker">
                  <div class="date-picker-head"><button type="button" aria-label="Предыдущий месяц" onclick={() => changeCalendarMonth(-1)}><ChevronLeft size={15} /></button><strong>{calendarTitle(calendarMonth)}</strong><button type="button" aria-label="Следующий месяц" onclick={() => changeCalendarMonth(1)}><ChevronRight size={15} /></button></div>
                  <div class="calendar-weekdays">{#each ["пн", "вт", "ср", "чт", "пт", "сб", "вс"] as day}<span>{day}</span>{/each}</div>
                  <div class="calendar-grid">
                    {#each calendarDays(calendarMonth) as day (day.date.toISOString())}
                      <button type="button" class:outside={!day.currentMonth} class:selected={isSelectedSourceDay(day.date, sourceSentAt)} class:today={sameCalendarDay(day.date, new Date())} onclick={() => setSourceDate(day.date)}>{day.date.getDate()}</button>
                    {/each}
                  </div>
                  <div class="date-picker-footer"><button type="button" class="today-button" onclick={() => { const today = new Date(); calendarMonth = new Date(today.getFullYear(), today.getMonth(), 1); setSourceDate(today); }}>Сегодня</button><div class="time-fields"><input bind:value={sourceHour} inputmode="numeric" maxlength="2" aria-label="Часы" onblur={updateSourceTime} /><span>:</span><input bind:value={sourceMinute} inputmode="numeric" maxlength="2" aria-label="Минуты" onblur={updateSourceTime} /></div></div>
                </div>
              {/if}
            </div>
            <div class="source-detail-row"><span>Ссылка</span><input bind:value={sourceUrl} type="url" placeholder="Не указана" /></div>
            {#if formError}<p class="form-error">{formError}</p>{/if}
            <div class="form-actions">{#if selectedTask.hasSource}<button type="button" class="danger-text" onclick={clearSource}>Удалить</button>{/if}<span></span><button type="button" onclick={() => (sourceEditorOpen = false)}>Отмена</button><button>Сохранить</button></div>
          </form>
        {/if}
        <button class:completed={selectedTask.completed} class="complete-button" aria-label={selectedTask.completed ? "Вернуть задачу" : "Завершить задачу"} title={selectedTask.completed ? "Вернуть задачу" : "Завершить задачу"} onclick={toggleComplete}>{#if selectedTask.completed}<CheckCircle2 size={17} />{:else}<Circle size={17} />{/if}<span class="action-label">{selectedTask.completed ? "Выполнено" : "Завершить"}</span></button>
        <button class="icon-button" aria-label="Другие действия" title="Другие действия" aria-expanded={taskActionMenuOpen} onclick={() => { taskActionMenuOpen = !taskActionMenuOpen; moveMenuOpen = false; urgencyMenuOpen = false; sourceEditorOpen = false; }}><MoreHorizontal size={18} /></button>
        {#if taskActionMenuOpen}
          <div class:move-open={moveMenuOpen} class="task-actions-menu">
            {#if moveMenuOpen}
              <button class="menu-back" onclick={() => (moveMenuOpen = false)}><ChevronRight size={14} />Переместить в…</button>
              {#each chats.slice(1) as chat}
                <button disabled={chat.id === selectedTask.chatId} onclick={() => moveSelectedTask(chat)}><Folder size={15} /><span>{chat.title}</span>{#if chat.id === selectedTask.chatId}<Check size={14} />{/if}</button>
              {/each}
            {:else}
              <button onclick={() => (moveMenuOpen = true)}><ArrowRight size={15} /><span>Переместить</span><ChevronRight size={14} /></button>
              <button class="danger" onclick={trashSelectedTask}><Trash2 size={15} /><span>В корзину</span></button>
            {/if}
          </div>
        {/if}
        <span class="window-divider" aria-hidden="true"></span>
      {/if}
      <div class="window-controls">
        <button aria-label="Свернуть" onclick={minimizeWindow}><Minus size={15} strokeWidth={1.6} /></button>
        <button aria-label="Развернуть" onclick={toggleMaximizeWindow}><Square size={12} strokeWidth={1.6} /></button>
        <button class="window-close" aria-label="Закрыть" onclick={closeWindow}><X size={16} strokeWidth={1.6} /></button>
      </div>
    </div>
  </header>

  <div class="app-content">
    <aside class:collapsed={sidebarCollapsed} class="sidebar-panel" aria-label="Навигация">
      <div class="sidebar-primary">
        <button class="new-task-button" aria-label="Новая задача" aria-expanded={newTaskMenuAnchor === "sidebar"} onclick={() => requestNewTask("sidebar")}><Plus size={17} /><span>Новая задача</span></button>
        {#if newTaskMenuAnchor === "sidebar" && !sidebarCollapsed}
          <div class="new-task-menu">
            <small>Выберите проект</small>
            {#each chats.slice(1) as chat}<button onclick={() => createDraft(chat)}><Folder size={15} /><span>{chat.title}</span></button>{/each}
          </div>
        {/if}
        {#if sidebarCollapsed}
          <button class="sidebar-icon" aria-label="Поиск" onclick={() => setSidebarCollapsed(false)}><Search size={17} /></button>
        {:else}
          <div class="search-field"><Search size={15} aria-hidden="true" /><input bind:value={query} aria-label="Поиск задач" placeholder="Поиск" />{#if searchActive}<button class="search-clear" aria-label="Очистить поиск" title="Очистить поиск" onclick={() => (query = "")}><X size={14} /></button>{/if}</div>
        {/if}
      </div>

      <nav class="sidebar-navigation" aria-label="Проекты и задачи">
        {#if searchActive && !sidebarCollapsed}
          <div class="sidebar-search-results" aria-label="Результаты поиска">
            {#each sidebarSearchGroups as group (group.chat.id)}
              <section class="sidebar-search-group">
                <button class="search-project-result" onclick={() => selectChat(group.chat)}><Folder size={15} /><span>{group.chat.title}</span><small>{group.tasks.length}</small></button>
                {#each group.tasks as task (task.id)}
                  <button class:selected={workspaceView === "task" && selectedTaskId === task.id} class="nested-task" onclick={() => openTask(task)}><FloodGlyph kind={task.completed ? "completed" : task.urgency} size={14} /><span>{task.title}</span></button>
                {/each}
              </section>
            {:else}
              <div class="sidebar-search-empty"><Search size={15} /><span>Ничего не найдено</span></div>
            {/each}
          </div>
        {:else}
          <div class:active={activeSection === "tasks" && selectedChatId === "all"} class="project-row all-tasks-row">
            <button class="project-open" onclick={() => chats[0] && selectChat(chats[0])} onmouseenter={(event) => showSidebarProjectHint(event, "Все задачи")} onmouseleave={hideSidebarProjectHint} onfocus={(event) => showSidebarProjectHint(event, "Все задачи")} onblur={hideSidebarProjectHint} aria-label="Открыть все задачи">
              <ListTodo size={17} /><span>Все задачи</span><small>{tasks.filter((task) => !task.completed).length}</small>
            </button>
            {#if !sidebarCollapsed}
              <button type="button" class:expanded={allTasksExpanded} class="project-expand" aria-expanded={allTasksExpanded} onclick={toggleAllTasks} aria-label={allTasksExpanded ? "Свернуть все задачи" : "Раскрыть все задачи"}><ChevronRight size={13} /></button>
            {/if}
          </div>

          {#if !sidebarCollapsed && allTasksExpanded}
            <div class="nested-tasks all-task-list">
              {#each visibleTasks as task}
                <button class:selected={workspaceView === "task" && selectedTaskId === task.id} class="nested-task" onclick={() => openTask(task)}><FloodGlyph kind={task.completed ? "completed" : task.urgency} size={14} /><span>{task.title}</span></button>
              {/each}
            </div>
          {/if}

          {#each chats.slice(1) as chat (chat.id)}
            <div class="chat-group">
              <div class:active={activeSection === "tasks" && selectedChatId === chat.id} class="project-row">
                <button class="project-open" onclick={() => selectChat(chat)} onmouseenter={(event) => showSidebarProjectHint(event, chat.title)} onmouseleave={hideSidebarProjectHint} onfocus={(event) => showSidebarProjectHint(event, chat.title)} onblur={hideSidebarProjectHint} aria-label={`Открыть ${chat.title}`}>
                  <Folder size={16} /><span>{chat.title}</span><small>{openTaskCount(chat.id) || ""}</small>
                </button>
                {#if !sidebarCollapsed}
                  <button type="button" class:expanded={expandedChatIds.includes(chat.id)} class="project-expand" aria-expanded={expandedChatIds.includes(chat.id)} onclick={() => toggleChat(chat.id)} aria-label={expandedChatIds.includes(chat.id) ? `Свернуть ${chat.title}` : `Раскрыть ${chat.title}`}><ChevronRight size={13} /></button>
                {/if}
              </div>
              {#if !sidebarCollapsed && expandedChatIds.includes(chat.id)}
                <div class="nested-tasks">
                  {#each tasksForChat(chat) as task}
                    <button class:selected={workspaceView === "task" && selectedTaskId === task.id} class="nested-task" onclick={() => openTask(task)}><FloodGlyph kind={task.completed ? "completed" : task.urgency} size={14} /><span>{task.title}</span></button>
                  {:else}<span class="nested-empty">Нет открытых задач</span>{/each}
                </div>
              {/if}
            </div>
          {/each}
        {/if}

        {#if !sidebarCollapsed}
          {#if createChatOpen}
            <form class="create-chat-form" onsubmit={submitCreateChat}>
              <FolderPlus size={15} />
              <input bind:value={createChatTitle} aria-label="Название проекта" placeholder="Название проекта" />
              <button aria-label="Создать"><Check size={14} /></button>
              <button type="button" aria-label="Отмена" onclick={() => { createChatOpen = false; createChatTitle = ""; }}><X size={14} /></button>
            </form>
          {:else}
            <button class="sidebar-row add-chat-row" onclick={() => (createChatOpen = true)}><FolderPlus size={16} /><span>Новый проект</span></button>
          {/if}
        {/if}

        <button class:active={activeSection === "trash"} class="sidebar-row trash-row" onclick={() => changeSection("trash")} title="Корзина"><Trash2 size={16} /><span>Корзина</span><small>{trashedTasks.length || ""}</small></button>
      </nav>

      <nav class="sidebar-footer" aria-label="Системные разделы">
        <button class:active={activeSection === "settings"} class="sidebar-row" onclick={() => changeSection("settings")} title="Настройки"><Settings size={17} /><span>Настройки</span></button>
      </nav>
    </aside>

    {#if activeSection === "tasks" && workspaceView === "task" && selectedTask}
      <section class="workspace">
        <div class="editor-page">
          <div class="task-meta" aria-label="Метаданные задачи">
            <span>{selectedTask.chat}</span>
            <span title={fullDate(selectedTask.createdAt)}>Создана {fullDate(selectedTask.createdAt)}</span>
            <span class="source-meta"><FloodGlyph kind="info" size={13} />{selectedTask.source?.author ? `Из сообщения · ${selectedTask.source.author}` : selectedTask.hasSource ? "Из сообщения" : "Добавлена вручную"}</span>
            {#if selectedTask.source?.url}<a href={selectedTask.source.url} target="_blank" rel="noreferrer">Открыть сообщение</a>{/if}
          </div>
          {#if conflictRemote}
            <div class="save-conflict" role="alert">
              <span><strong>Файл изменён снаружи.</strong> Выберите, какую версию оставить.</span>
              <div><button onclick={useDiskVersion}>Версию с диска</button><button onclick={keepLocalVersion}>Мою версию</button></div>
            </div>
          {/if}
          <div class="editor" bind:this={editorRoot} contenteditable="true" role="textbox" tabindex="0" aria-multiline="true" aria-label="Редактор задачи" spellcheck="true" oninput={syncEditor} onkeydown={handleEditorKeydown} onpaste={handleEditorPaste} ondrop={handleEditorDrop} ondragover={(event) => event.preventDefault()} onpointerup={updateSelectionToolbar} onkeyup={() => { updateHint(currentBlock()); updateSelectionToolbar(); }} onclick={handleEditorClick} onblur={() => { editorHint = null; void saveNow(); }}></div>
          {#if selectedTask.source?.text}
            <details class="source-snapshot">
              <summary><FloodGlyph kind="info" size={15} />Исходное сообщение</summary>
              <p>{selectedTask.source.text}</p>
            </details>
          {/if}
        </div>
      </section>
    {:else if activeSection === "tasks"}
      <section class="workspace project-workspace">
        <div class="project-page">
          {#if loadError}<div class="data-error"><strong>Не удалось открыть данные</strong><span>{loadError}</span></div>{/if}
          <header class="project-header">
            <div>
              {#if renameChatOpen}
                <form class="rename-chat-form" onsubmit={submitRenameChat}><input bind:value={renameChatTitle} aria-label="Название проекта" /><button aria-label="Сохранить"><Check size={16} /></button><button type="button" aria-label="Отмена" onclick={() => (renameChatOpen = false)}><X size={16} /></button></form>
                {#if formError}<span class="form-error">{formError}</span>{/if}
              {:else}
                <div class="project-title-row">
                  <h1>{currentChat.title}</h1>
                  {#if currentChat.id !== "all"}
                    <button class="icon-button" aria-label="Переименовать проект" onclick={startRenameChat}><Pencil size={15} /></button>
                    <button class="icon-button danger-icon" aria-label="Удалить проект" onclick={() => (deleteChatConfirmOpen = true)}><Trash2 size={15} /></button>
                  {/if}
                </div>
              {/if}
              <p>{loading ? "Загружаю задачи…" : `${currentOpenTasks.length} ${currentOpenTasks.length === 1 ? "открытая задача" : currentOpenTasks.length > 1 && currentOpenTasks.length < 5 ? "открытые задачи" : "открытых задач"}`}</p>
            </div>
            <div class="project-header-actions">
              <button class="project-add-button" aria-expanded={newTaskMenuAnchor === "workspace"} onclick={() => requestNewTask("workspace")}><Plus size={16} />Новая задача</button>
              {#if newTaskMenuAnchor === "workspace"}
                <div class="new-task-menu workspace-new-task-menu">
                  <small>Выберите проект</small>
                  {#each chats.slice(1) as chat}<button onclick={() => createDraft(chat)}><Folder size={15} /><span>{chat.title}</span></button>{/each}
                </div>
              {/if}
            </div>
          </header>

          {#if deleteChatConfirmOpen}
            <div class="destructive-confirm project-delete-confirm" role="alert">
              <span class="confirm-glyph"><FloodGlyph kind="urgent" size={40} motion="pop" label="Удаление проекта" /></span>
              <span class="confirm-copy"><strong>Удалить «{currentChat.title}»?</strong><small>Проект и все его задачи будут удалены навсегда.</small></span>
              <div class="confirm-actions"><button onclick={() => (deleteChatConfirmOpen = false)}>Отмена</button><button class="danger-button" onclick={deleteCurrentChat}>Удалить</button></div>
            </div>
          {/if}

          {#if selectedChatId === "all"}
            {#if currentOpenTasks.length}
              <div class="project-groups">
                {#each chats.slice(1) as chat}
                  {@const chatTasks = currentOpenTasks.filter((task) => task.chat === chat.title)}
                  {#if chatTasks.length}
                    <section class="project-group">
                      <button class="project-group-title" onclick={() => selectChat(chat)}><span>{chat.title}</span><small>{chatTasks.length}</small><ChevronRight size={14} /></button>
                      <div class="project-task-list">
                        {#each chatTasks as task}
                          <button class="project-task" onclick={() => openTask(task)}>
                            <FloodGlyph kind={task.urgency} size={14} />
                            <span class="project-task-copy"><strong>{task.title}</strong><small>{task.updated}</small></span>
                            <ChevronRight size={15} />
                          </button>
                        {/each}
                      </div>
                    </section>
                  {/if}
                {/each}
              </div>
            {:else}
              <div class="project-empty"><p>Открытых задач нет</p></div>
            {/if}
          {:else}
            <div class="project-task-list standalone">
              {#each currentOpenTasks as task}
                <button class="project-task" onclick={() => openTask(task)}>
                  <FloodGlyph kind={task.urgency} size={14} />
                  <span class="project-task-copy"><strong>{task.title}</strong><small>{task.updated}{task.urgency !== "normal" ? ` · ${task.urgency === "urgent" ? "Срочно" : "Важно"}` : ""}</small></span>
                  <ChevronRight size={15} />
                </button>
              {:else}
                <div class="project-empty"><p>Открытых задач нет</p><button onclick={() => requestNewTask("workspace")}>Добавить задачу</button></div>
              {/each}
            </div>
          {/if}

          {#if currentCompletedTasks.length}
            <section class="completed-group">
              <button class="completed-toggle" onclick={() => (completedGroupOpen = !completedGroupOpen)}>
                {#if completedGroupOpen}<ChevronDown size={14} />{:else}<ChevronRight size={14} />{/if}
                <span>Выполненные</span><small>{currentCompletedTasks.length}</small>
              </button>
              {#if completedGroupOpen}
                <div class="project-task-list completed-list">
                  {#each currentCompletedTasks as task}
                    <button class="project-task completed-task" onclick={() => openTask(task)}><FloodGlyph kind="completed" size={16} motion="pop" /><span class="project-task-copy"><strong>{task.title}</strong><small>{task.chat}</small></span><ChevronRight size={15} /></button>
                  {/each}
                </div>
              {/if}
            </section>
          {/if}
        </div>
      </section>
    {:else if activeSection === "trash"}
      <section class="workspace project-workspace">
        <div class="project-page trash-page">
          <header class="project-header">
            <div><h1>Корзина</h1><p>Задачи можно восстановить вместе со всеми метаданными</p></div>
            {#if trashedTasks.length}<button class="quiet-danger-button" onclick={() => (emptyTrashConfirmOpen = true)}><Trash2 size={14} />Очистить</button>{/if}
          </header>
          {#if emptyTrashConfirmOpen}
            <div class="destructive-confirm" role="alert">
              <span class="confirm-copy"><strong>Очистить корзину?</strong><small>Все задачи в корзине будут удалены без возможности восстановления.</small></span>
              <div class="confirm-actions"><button onclick={() => (emptyTrashConfirmOpen = false)}>Отмена</button><button class="danger-button" onclick={emptyTrash}>Удалить всё</button></div>
            </div>
          {/if}
          <div class="project-task-list standalone">
            {#each trashedTasks as task}
              <div class="project-task trash-task">
                <Trash2 size={16} />
                <span class="project-task-copy"><strong>{task.title}</strong><small>{task.chat}{task.trashedAt ? ` · удалена ${relativeDate(task.trashedAt)}` : ""}</small></span>
                <span class="trash-actions">
                  {#if purgeTaskId === task.id}
                    <button onclick={() => (purgeTaskId = "")}>Отмена</button><button class="danger-text" onclick={() => deleteTrashedTask(task)}>Удалить</button>
                  {:else}
                    <button class="restore-button" onclick={() => restoreTask(task)}><RotateCcw size={14} />Восстановить</button>
                    <button class="trash-delete-button" aria-label="Удалить навсегда" title="Удалить навсегда" onclick={() => (purgeTaskId = task.id)}><Trash2 size={14} /></button>
                  {/if}
                </span>
              </div>
            {:else}
              <div class="project-empty"><p>Корзина пуста</p></div>
            {/each}
          </div>
        </div>
      </section>
    {:else}
      <section class="workspace settings-workspace">
        <div class="settings-page">
          <header class="settings-header"><h2>Настройки</h2><p>Приложение, данные и локальные подключения</p></header>
          <div class="settings-layout">
            <nav class="settings-nav" aria-label="Разделы настроек">
              <button class:active={settingsSection === "general"} onclick={() => (settingsSection = "general")}><Settings size={16} />Общие</button>
              <button class:active={settingsSection === "appearance"} onclick={() => (settingsSection = "appearance")}><Palette size={16} />Внешний вид</button>
              <button class:active={settingsSection === "data"} onclick={() => (settingsSection = "data")}><Database size={16} />Данные</button>
              <button class:active={settingsSection === "integrations"} onclick={() => (settingsSection = "integrations")}><Plug size={16} />Интеграции <span class="integration-chip"><FloodGlyph kind="connected" size={8} />MCP</span></button>
              <button class:active={settingsSection === "about"} onclick={() => (settingsSection = "about")}><Info size={16} />О приложении</button>
            </nav>
            <div class="settings-content">
              {#if settingsSection === "general"}
                <section class="settings-section">
                  <div class="settings-section-title"><h3>Общие</h3><p>Основное поведение flood.md</p></div>
                  <div class="setting-static"><span><Languages size={16} /><span><strong>Язык</strong><small>Язык интерфейса</small></span></span><span class="setting-value">Русский</span></div>
                  <button class:active={showCompleted} class="setting-row" onclick={toggleCompletedVisibility}><span><ListTodo size={16} /><span><strong>Показывать выполненные</strong><small>Включает завершённые задачи в списках</small></span></span><span class="switch"><span></span></span></button>
                </section>
              {:else if settingsSection === "appearance"}
                <section class="settings-section">
                  <div class="settings-section-title"><h3>Внешний вид</h3><p>Тема и движение интерфейса</p></div>
                  <div class="settings-control"><strong>Тема</strong><div class="theme-picker" aria-label="Тема интерфейса"><button class:active={themePreference === "system"} onclick={() => setTheme("system")}>Системная</button><button class:active={themePreference === "light"} onclick={() => setTheme("light")}>Светлая</button><button class:active={themePreference === "dark"} onclick={() => setTheme("dark")}>Тёмная</button></div></div>
                  <button class:active={reduceMotion} class="setting-row" onclick={toggleMotionPreference}><span><span><strong>Уменьшить анимации</strong><small>Отключает декоративное движение</small></span></span><span class="switch"><span></span></span></button>
                </section>
              {:else if settingsSection === "data"}
                <section class="settings-section">
                  <div class="settings-section-title"><h3>Данные</h3><p>Markdown остаётся единственным источником правды</p></div>
                  <div class="data-location"><span><FolderOpen size={17} /><span><strong>Папка с задачами</strong><code>{dataDirectory || "Доступна в приложении"}</code></span></span><button onclick={openDataDirectory} disabled={!dataDirectory}>Открыть</button></div>
                  <button class="settings-action" onclick={() => loadData(true)}><RefreshCw size={15} />Перечитать файлы</button>
                </section>
              {:else if settingsSection === "integrations"}
                <section class="settings-section">
                  <div class="settings-section-title"><h3>Интеграции</h3><p>Локальные подключения без отправки данных в облако</p></div>
                  <div class="integration-card"><div class="integration-head"><span><FloodGlyph kind="connected" size={15} motion="pulse" /><span><strong>MCP-сервер</strong><small>Готов к подключению</small></span></span><span class="status-text">Работает локально</span></div><p>Скопируйте конфигурацию в MCP-клиент. Сервер использует те же Markdown-файлы, что и приложение.</p><div class="code-row"><code>{mcpExecutable || "flood-mcp.exe"}</code><button class="icon-button" aria-label="Копировать конфигурацию" onclick={copyMcpConfig}>{#if copied}<Check size={16} />{:else}<Clipboard size={16} />{/if}</button></div></div>
                </section>
              {:else}
                <section class="settings-section">
                  <div class="settings-section-title"><h3>О приложении</h3><p>flood.md {appVersion}</p></div>
                  <div class="about-brand"><FloodGlyph kind="brand" size={42} /><span><strong>flood.md</strong><small>Локальные задачи без лишнего шума</small></span></div>
                  <div class="update-row"><span><strong>Обновления</strong><small>{updateMessage || "Проверка через GitHub Releases"}</small>{#if updateState === "downloading"}<progress max="100" value={updateProgress}></progress>{/if}</span>{#if updateState === "available"}<button class="primary-small" onclick={installAvailableUpdate}><Download size={15} />Установить {availableUpdate?.version}</button>{:else}<button onclick={checkForUpdates} disabled={updateState === "checking" || updateState === "downloading"}><span class:spinning={updateState === "checking"} class="update-icon"><RefreshCw size={15} /></span>{updateState === "checking" ? "Проверяем" : "Проверить"}</button>{/if}</div>
                  <button class="settings-action" onclick={() => openUrl("https://github.com/tillwithered/flood")}><ExternalLink size={15} />Открыть GitHub</button>
                </section>
              {/if}
            </div>
          </div>
        </div>
      </section>
    {/if}
  </div>
</main>

{#if imageViewer}
  <div class="image-viewer" bind:this={imageViewerDialog} role="dialog" aria-modal="true" aria-label={`Просмотр ${imageViewer.alt}`} tabindex="-1">
    <div class="image-viewer-stage" onwheel={(event) => { event.preventDefault(); changeImageZoom(event.deltaY < 0 ? .2 : -.2); }}>
      <img src={imageViewer.src} alt={imageViewer.alt} draggable="false" style:zoom={imageViewerZoom} />
    </div>
    <div class="image-viewer-toolbar" aria-label="Масштаб изображения">
      <button aria-label="Уменьшить" title="Уменьшить" onclick={() => changeImageZoom(-.2)}><ZoomOut size={17} /></button>
      <button class="image-zoom-value" aria-label="Сбросить масштаб" title="Сбросить масштаб" onclick={() => (imageViewerZoom = 1)}>{Math.round(imageViewerZoom * 100)}%</button>
      <button aria-label="Увеличить" title="Увеличить" onclick={() => changeImageZoom(.2)}><ZoomIn size={17} /></button>
    </div>
    <button class="image-viewer-close" aria-label="Закрыть просмотр" title="Закрыть" onclick={closeImageViewer}><X size={18} /></button>
  </div>
{/if}
