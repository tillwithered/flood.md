<script lang="ts">
  import { ArrowRight, Bold, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Circle, Clipboard, Folder, FolderPlus, Heading1, Italic, Link, ListTodo, MessageSquareText, Minus, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Paperclip, Pencil, Plus, Plug, RotateCcw, Search, Settings, Square, Trash2, Underline, X } from "@lucide/svelte";
  import { convertFileSrc, invoke } from "@tauri-apps/api/core";
  import { listen, type UnlistenFn } from "@tauri-apps/api/event";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { onMount, tick } from "svelte";
  import FloodGlyph from "./components/FloodGlyph.svelte";

  type Section = "tasks" | "trash" | "mcp" | "settings";
  type WorkspaceView = "project" | "task";
  type Urgency = "normal" | "important" | "urgent";
  type SaveState = "idle" | "saving" | "saved" | "error";
  type ThemePreference = "system" | "light" | "dark";
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
  let activeSection: Section = "tasks";
  let workspaceView: WorkspaceView = "project";
  let selectedTaskId = "";
  let selectedChatId = "all";
  let query = "";
  let showCompleted = false;
  let sidebarCollapsed = false;
  let expandedChatIds = new Set<string>();
  let themePreference: ThemePreference = "system";
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
  let newTaskMenuOpen = false;
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

  const uiPreferencesKey = "flood.ui.preferences";

  function saveUiPreferences() {
    localStorage.setItem(uiPreferencesKey, JSON.stringify({
      theme: themePreference,
      showCompleted,
      sidebarCollapsed,
      expandedChatIds: [...expandedChatIds]
    }));
  }

  function applyTheme() {
    const dark = themePreference === "dark" || (themePreference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", dark ? "#111110" : "#ffffff");
  }

  function loadUiPreferences() {
    try {
      const stored = JSON.parse(localStorage.getItem(uiPreferencesKey) ?? "{}") as Record<string, unknown>;
      if (stored.theme === "system" || stored.theme === "light" || stored.theme === "dark") themePreference = stored.theme;
      if (typeof stored.showCompleted === "boolean") showCompleted = stored.showCompleted;
      if (typeof stored.sidebarCollapsed === "boolean") sidebarCollapsed = stored.sidebarCollapsed;
      if (Array.isArray(stored.expandedChatIds)) expandedChatIds = new Set(stored.expandedChatIds.filter((id): id is string => typeof id === "string"));
    } catch {
      localStorage.removeItem(uiPreferencesKey);
    }
    applyTheme();
  }

  function setTheme(theme: ThemePreference) {
    themePreference = theme;
    applyTheme();
    saveUiPreferences();
  }

  function setSidebarCollapsed(collapsed: boolean) {
    sidebarCollapsed = collapsed;
    saveUiPreferences();
  }

  function toggleCompletedVisibility() {
    showCompleted = !showCompleted;
    saveUiPreferences();
  }

  function isChatExpanded(chatId: string) {
    return expandedChatIds.has(chatId);
  }

  function setChatExpanded(chatId: string, expanded = true) {
    const next = new Set(expandedChatIds);
    if (expanded) next.add(chatId);
    else next.delete(chatId);
    expandedChatIds = next;
    saveUiPreferences();
  }

  function taskTitle(description: string) {
    const first = description.split("\n").find((line) => line.trim())?.trim() ?? "Без названия";
    return first.replace(/^#{1,3}\s+/, "").replace(/^[-*>]\s+/, "").trim() || "Без названия";
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
    return records.find((chat) => chat.id === chatId)?.title ?? "Неизвестный чат";
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
    const token = /(!\[([^\]]*)\]\((attachments\/[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|<u>([^<]+)<\/u>|\[([^\]]+)\]\((https?:\/\/[^\s)]+|attachments\/[^\s)]+)\))/g;
    for (const match of value.matchAll(token)) {
      const index = match.index ?? 0;
      if (index > cursor) parent.append(document.createTextNode(value.slice(cursor, index)));
      if (match[2] !== undefined && match[3]) {
        const image = document.createElement("img");
        image.alt = match[2];
        image.dataset.attachmentPath = match[3];
        image.contentEditable = "false";
        parent.append(image);
      } else if (match[4]) {
        const strong = document.createElement("strong");
        strong.textContent = match[4];
        parent.append(strong);
      } else if (match[5]) {
        const em = document.createElement("em");
        em.textContent = match[5];
        parent.append(em);
      } else if (match[6]) {
        const underline = document.createElement("u");
        underline.textContent = match[6];
        parent.append(underline);
      } else if (match[7] && match[8]) {
        const link = document.createElement("a");
        link.textContent = match[7];
        link.dataset.attachmentPath = match[8].startsWith("attachments/") ? match[8] : "";
        link.href = match[8];
        link.target = "_blank";
        link.rel = "noreferrer";
        parent.append(link);
      }
      cursor = index + match[0].length;
    }
    if (cursor < value.length) parent.append(document.createTextNode(value.slice(cursor)));
  }

  function createBlock(kind: BlockKind, text = "") {
    const block = document.createElement("div");
    block.dataset.block = kind;
    block.className = `editor-block ${kind}`;
    if (text) appendInlineMarkdown(block, text);
    else block.append(document.createElement("br"));
    return block;
  }

  function serializeInline(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (!(node instanceof HTMLElement)) return "";
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
    for (const element of editorRoot.querySelectorAll<HTMLElement>("[data-attachment-path]")) {
      const relativePath = element.dataset.attachmentPath;
      if (!relativePath) continue;
      try {
        const path = await invoke<string>("resolve_task_attachment", { id: selectedTaskId, relativePath });
        const url = convertFileSrc(path);
        if (element instanceof HTMLImageElement) element.src = url;
        else if (element instanceof HTMLAnchorElement) element.href = url;
      } catch {
        element.classList.add("missing-attachment");
      }
    }
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
      return;
    }
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer instanceof Element ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
    if (!container || !editorRoot.contains(container)) {
      selectionToolbar = null;
      savedSelection = null;
      return;
    }
    savedSelection = range.cloneRange();
    if (selection.isCollapsed) {
      selectionToolbar = null;
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

  function applyInlineFormat(command: "bold" | "italic" | "underline") {
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

  function createSelectionLink(url: string) {
    if (!isHttpUrl(url) || !restoreSelection()) return false;
    document.execCommand("createLink", false, url.trim());
    const selection = window.getSelection();
    const anchor = selection?.anchorNode instanceof Element ? selection.anchorNode.closest("a") : selection?.anchorNode?.parentElement?.closest("a");
    if (anchor) {
      anchor.target = "_blank";
      anchor.rel = "noreferrer";
    }
    serializeEditor();
    updateSelectionToolbar();
    return true;
  }

  async function linkSelectionFromClipboard() {
    try {
      createSelectionLink(await navigator.clipboard.readText());
    } catch {
      // Ctrl+V over a selection remains available when clipboard read permission is denied.
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
          fileName: file.name || "вложение",
          bytes: [...new Uint8Array(await file.arrayBuffer())]
        });
        const absolutePath = await invoke<string>("resolve_task_attachment", { id: selectedTaskId, relativePath });
        const node = file.type.startsWith("image/") ? document.createElement("img") : document.createElement("a");
        node.dataset.attachmentPath = relativePath;
        if (node instanceof HTMLImageElement) {
          node.alt = file.name || "Изображение";
          node.src = convertFileSrc(absolutePath);
          node.contentEditable = "false";
        } else {
          node.textContent = file.name || "Вложение";
          node.href = convertFileSrc(absolutePath);
          node.target = "_blank";
          node.rel = "noreferrer";
        }
        restoreSelection();
        const selection = window.getSelection();
        const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
        const block = currentBlock() ?? editorRoot.lastElementChild as HTMLElement | null;
        if (range && block) {
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
    return haystack.includes(query.trim().toLocaleLowerCase("ru"));
  }

  $: visibleTasks = tasks.filter((task) => {
    const matchesStatus = showCompleted || !task.completed;
    const matchesChat = selectedChatId === "all" || task.chat === chats.find((chat) => chat.id === selectedChatId)?.title;
    return matchesStatus && matchesChat && taskMatchesQuery(task);
  });

  $: currentChat = chats.find((chat) => chat.id === selectedChatId) ?? allChat(0);
  $: currentProjectTasks = tasks
    .filter((task) => (selectedChatId === "all" || task.chat === currentChat.title) && taskMatchesQuery(task))
    .sort((left, right) => ({ urgent: 0, important: 1, normal: 2 })[left.urgency] - ({ urgent: 0, important: 1, normal: 2 })[right.urgency]);
  $: currentOpenTasks = currentProjectTasks.filter((task) => !task.completed);
  $: currentCompletedTasks = currentProjectTasks.filter((task) => task.completed);

  function tasksForChat(chat: ChatItem) {
    return tasks.filter((task) => task.chat === chat.title && (showCompleted || !task.completed) && taskMatchesQuery(task));
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
    if (chat.id !== "all") setChatExpanded(chat.id);
    editorHint = null;
    sourceEditorOpen = false;
    datePickerOpen = false;
    taskActionMenuOpen = false;
  }

  function toggleChat(chat: ChatItem, event: MouseEvent) {
    event.stopPropagation();
    setChatExpanded(chat.id, !isChatExpanded(chat.id));
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

  function requestNewTask() {
    if (activeSection === "tasks" && selectedChatId !== "all" && currentChat.id !== "all") {
      void createDraft(currentChat);
    } else {
      newTaskMenuOpen = !newTaskMenuOpen;
    }
  }

  async function createDraft(chosenChat?: ChatItem) {
    await saveNow();
    if (conflictRemote) return;
    const targetChat = chosenChat ?? (selectedChatId === "all" ? undefined : currentChat);
    if (!targetChat || targetChat.id === "all" || !inTauri()) return;
    newTaskMenuOpen = false;
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
    await navigator.clipboard.writeText(`{"command":"C:\\\\path\\\\to\\\\flood-mcp.exe"}`);
    copied = true;
    window.setTimeout(() => (copied = false), 1400);
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
      if (!target?.closest(".new-task-menu") && !target?.closest(".new-task-button")) newTaskMenuOpen = false;
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
      unlisten?.();
      unlistenClose?.();
    };
  });
</script>

<svelte:head><title>flood.md</title></svelte:head>

{#if editorHint}
  <aside class="editor-hint" style:left={`${editorHint.left}px`} style:top={`${editorHint.top}px`} aria-live="polite">{editorHint.title}</aside>
{/if}
{#if selectionToolbar}
  <div class="selection-toolbar" style:left={`${selectionToolbar.left}px`} style:top={`${selectionToolbar.top}px`} role="toolbar" tabindex="-1" aria-label="Форматирование текста" onpointerdown={(event) => event.preventDefault()}>
    <button aria-label="Большой заголовок" title="Большой" onclick={applyLargeHeading}><Heading1 size={15} /></button>
    <button aria-label="Жирный" title="Жирный" onclick={() => applyInlineFormat("bold")}><Bold size={14} /></button>
    <button aria-label="Курсив" title="Курсив" onclick={() => applyInlineFormat("italic")}><Italic size={14} /></button>
    <button aria-label="Подчёркнутый" title="Подчёркнутый" onclick={() => applyInlineFormat("underline")}><Underline size={14} /></button>
    <span></span>
    <button aria-label="Вставить ссылку из буфера" title="Ссылка из буфера" onclick={linkSelectionFromClipboard}><Link size={14} /></button>
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
        <span>{activeSection === "trash" ? "Корзина" : activeSection === "mcp" ? "MCP" : "Настройки"}</span>
      {/if}
    </div>
    <div class="window-actions" data-tauri-drag-region="false">
      {#if activeSection === "tasks" && workspaceView === "task" && selectedTask}
        <span class:error={saveState === "error"} class="save-state" title={saveError}>{saveState === "saving" ? "Сохраняю…" : saveState === "error" ? "Не сохранено" : saveState === "saved" ? "Сохранено" : ""}</span>
        <div class="urgency-menu topbar-urgency">
          <button class="urgency-trigger" aria-haspopup="menu" aria-expanded={urgencyMenuOpen} onclick={() => { urgencyMenuOpen = !urgencyMenuOpen; sourceEditorOpen = false; taskActionMenuOpen = false; }}><FloodGlyph kind={selectedTask.urgency} size={14} /><span>{urgencyTitle(selectedTask.urgency)}</span><ChevronDown size={12} /></button>
          {#if urgencyMenuOpen}
            <div class="urgency-options" role="menu">
              {#each (["normal", "important", "urgent"] as Urgency[]) as urgency}
                <button class:selected={selectedTask.urgency === urgency} role="menuitem" onclick={() => changeUrgency(urgency)}><FloodGlyph kind={urgency} size={14} /><span>{urgencyTitle(urgency)}</span>{#if selectedTask.urgency === urgency}<Check size={14} />{/if}</button>
              {/each}
            </div>
          {/if}
        </div>
        <input class="attachment-input" bind:this={attachmentInput} type="file" multiple accept="image/*,audio/*,video/*,.pdf,.txt,.md" onchange={(event) => void importAttachments([...(event.currentTarget.files ?? [])])} />
        <button class="topbar-action" aria-label="Добавить вложение" title="Добавить фото или файл" onclick={() => attachmentInput.click()}><Paperclip size={15} /><span>Вложение</span></button>
        <button class:active={sourceEditorOpen} class="topbar-action source-action-button" aria-expanded={sourceEditorOpen} onclick={openSourceEditor}><MessageSquareText size={15} /><span>{selectedTask.hasSource ? "Источник" : "Добавить источник"}</span></button>
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
        <button class:completed={selectedTask.completed} class="complete-button" aria-label={selectedTask.completed ? "Вернуть задачу" : "Завершить задачу"} onclick={toggleComplete}>{#if selectedTask.completed}<CheckCircle2 size={17} />{:else}<Circle size={17} />{/if}<span>{selectedTask.completed ? "Выполнено" : "Завершить"}</span></button>
        <button class="icon-button" aria-label="Другие действия" aria-expanded={taskActionMenuOpen} onclick={() => { taskActionMenuOpen = !taskActionMenuOpen; moveMenuOpen = false; urgencyMenuOpen = false; sourceEditorOpen = false; }}><MoreHorizontal size={18} /></button>
        {#if taskActionMenuOpen}
          <div class="task-actions-menu">
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
        <button class="new-task-button" aria-label="Новая задача" aria-expanded={newTaskMenuOpen} onclick={requestNewTask}><Plus size={17} /><span>Новая задача</span></button>
        {#if newTaskMenuOpen && !sidebarCollapsed}
          <div class="new-task-menu">
            <small>Выберите чат-проект</small>
            {#each chats.slice(1) as chat}<button onclick={() => createDraft(chat)}><Folder size={15} /><span>{chat.title}</span></button>{/each}
          </div>
        {/if}
        {#if sidebarCollapsed}
          <button class="sidebar-icon" aria-label="Поиск" onclick={() => setSidebarCollapsed(false)}><Search size={17} /></button>
        {:else}
          <label class="search-field"><Search size={15} aria-hidden="true" /><input bind:value={query} aria-label="Поиск задач" placeholder="Поиск" /></label>
        {/if}
      </div>

      <nav class="sidebar-navigation" aria-label="Чаты и задачи">
        <button class:active={activeSection === "tasks" && selectedChatId === "all"} class="sidebar-row all-tasks" onclick={() => chats[0] && selectChat(chats[0])} title="Все задачи">
          <ListTodo size={17} /><span>Все задачи</span><small>{tasks.filter((task) => !task.completed).length}</small>
        </button>

        {#if !sidebarCollapsed && selectedChatId === "all" && activeSection === "tasks"}
          <div class="nested-tasks all-task-list">
            {#each visibleTasks as task}
              <button class:selected={workspaceView === "task" && selectedTaskId === task.id} class="nested-task" onclick={() => openTask(task)}><FloodGlyph kind={task.completed ? "completed" : task.urgency} size={14} /><span>{task.title}</span></button>
            {/each}
          </div>
        {/if}

        {#each chats.slice(1) as chat}
          <div class="chat-group">
            <div class:active={activeSection === "tasks" && selectedChatId === chat.id} class="project-row" title={chat.title}>
              <button class="project-open" onclick={() => selectChat(chat)} aria-label={`Открыть ${chat.title}`}>
                {#if sidebarCollapsed}
                  <span class="chat-avatar">{chat.title.slice(0, 1)}</span>
                {:else}
                  <Folder size={16} /><span>{chat.title}</span><small>{openTaskCount(chat.id) || ""}</small>
                {/if}
              </button>
              {#if !sidebarCollapsed}
                <button class="project-expand" onclick={(event) => toggleChat(chat, event)} aria-label={isChatExpanded(chat.id) ? `Свернуть ${chat.title}` : `Раскрыть ${chat.title}`}>
                  {#if isChatExpanded(chat.id)}<ChevronDown size={13} />{:else}<ChevronRight size={13} />{/if}
                </button>
              {/if}
            </div>
            {#if !sidebarCollapsed && isChatExpanded(chat.id) && activeSection === "tasks"}
              <div class="nested-tasks">
                {#each tasksForChat(chat) as task}
                  <button class:selected={workspaceView === "task" && selectedTaskId === task.id} class="nested-task" onclick={() => openTask(task)}><FloodGlyph kind={task.completed ? "completed" : task.urgency} size={14} /><span>{task.title}</span></button>
                {:else}<span class="nested-empty">Нет открытых задач</span>{/each}
              </div>
            {/if}
          </div>
        {/each}

        {#if !sidebarCollapsed}
          {#if createChatOpen}
            <form class="create-chat-form" onsubmit={submitCreateChat}>
              <FolderPlus size={15} />
              <input bind:value={createChatTitle} aria-label="Название чат-проекта" placeholder="Название чат-проекта" />
              <button aria-label="Создать"><Check size={14} /></button>
              <button type="button" aria-label="Отмена" onclick={() => { createChatOpen = false; createChatTitle = ""; }}><X size={14} /></button>
            </form>
          {:else}
            <button class="sidebar-row add-chat-row" onclick={() => (createChatOpen = true)}><FolderPlus size={16} /><span>Новый чат-проект</span></button>
          {/if}
        {/if}

        <button class:active={activeSection === "trash"} class="sidebar-row trash-row" onclick={() => changeSection("trash")} title="Корзина"><Trash2 size={16} /><span>Корзина</span><small>{trashedTasks.length || ""}</small></button>
      </nav>

      <nav class="sidebar-footer" aria-label="Системные разделы">
        <button class:active={activeSection === "mcp"} class="sidebar-row" onclick={() => changeSection("mcp")} title="MCP"><Plug size={17} /><span>MCP</span><FloodGlyph kind="connected" size={10} label="Готов" /></button>
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
          <div class="editor" bind:this={editorRoot} contenteditable="true" role="textbox" tabindex="0" aria-multiline="true" aria-label="Редактор задачи" spellcheck="true" oninput={syncEditor} onkeydown={handleEditorKeydown} onpaste={handleEditorPaste} ondrop={handleEditorDrop} ondragover={(event) => event.preventDefault()} onpointerup={updateSelectionToolbar} onkeyup={() => { updateHint(currentBlock()); updateSelectionToolbar(); }} onclick={() => updateHint(currentBlock())} onblur={() => { editorHint = null; void saveNow(); }}></div>
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
                <form class="rename-chat-form" onsubmit={submitRenameChat}><input bind:value={renameChatTitle} aria-label="Название чат-проекта" /><button aria-label="Сохранить"><Check size={16} /></button><button type="button" aria-label="Отмена" onclick={() => (renameChatOpen = false)}><X size={16} /></button></form>
                {#if formError}<span class="form-error">{formError}</span>{/if}
              {:else}
                <div class="project-title-row">
                  <h1>{currentChat.title}</h1>
                  {#if currentChat.id !== "all"}
                    <button class="icon-button" aria-label="Переименовать чат-проект" onclick={startRenameChat}><Pencil size={15} /></button>
                    <button class="icon-button danger-icon" aria-label="Удалить чат-проект" onclick={() => (deleteChatConfirmOpen = true)}><Trash2 size={15} /></button>
                  {/if}
                </div>
              {/if}
              <p>{loading ? "Загружаю задачи…" : `${currentOpenTasks.length} ${currentOpenTasks.length === 1 ? "открытая задача" : currentOpenTasks.length > 1 && currentOpenTasks.length < 5 ? "открытые задачи" : "открытых задач"}`}</p>
            </div>
            <button class="project-add-button" onclick={requestNewTask}><Plus size={16} />Новая задача</button>
          </header>

          {#if deleteChatConfirmOpen}
            <div class="destructive-confirm" role="alert">
              <span><strong>Удалить «{currentChat.title}»?</strong><small>Чат-проект и все его задачи будут удалены навсегда.</small></span>
              <div><button onclick={() => (deleteChatConfirmOpen = false)}>Отмена</button><button class="danger-button" onclick={deleteCurrentChat}>Удалить</button></div>
            </div>
          {/if}

          {#if selectedChatId === "all"}
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
            <div class="project-task-list standalone">
              {#each currentOpenTasks as task}
                <button class="project-task" onclick={() => openTask(task)}>
                  <FloodGlyph kind={task.urgency} size={14} />
                  <span class="project-task-copy"><strong>{task.title}</strong><small>{task.updated}{task.urgency !== "normal" ? ` · ${task.urgency === "urgent" ? "Срочно" : "Важно"}` : ""}</small></span>
                  <ChevronRight size={15} />
                </button>
              {:else}
                <div class="project-empty"><p>Открытых задач нет</p><button onclick={requestNewTask}>Добавить задачу</button></div>
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
              <span><strong>Очистить корзину?</strong><small>Все задачи в корзине будут удалены без возможности восстановления.</small></span>
              <div><button onclick={() => (emptyTrashConfirmOpen = false)}>Отмена</button><button class="danger-button" onclick={emptyTrash}>Удалить всё</button></div>
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
    {:else if activeSection === "mcp"}
      <section class="workspace simple-workspace"><div class="mcp-card"><span class="status-pill"><FloodGlyph kind="connected" size={11} motion="pulse" />Готов</span><h2>Подключить агента</h2><p>Добавьте локальный сервер в MCP-клиент. Задачи останутся на этом компьютере.</p><div class="code-row"><code>target/release/flood-mcp.exe</code><button class="icon-button" aria-label="Копировать конфигурацию" onclick={copyMcpConfig}>{#if copied}<Check size={16} />{:else}<Clipboard size={16} />{/if}</button></div></div></section>
    {:else}
      <section class="workspace simple-workspace">
        <div class="settings-page">
          <h2>Настройки</h2>
          <section class="settings-group">
            <div class="settings-heading"><strong>Внешний вид</strong><small>Тема интерфейса применяется сразу</small></div>
            <div class="theme-picker" aria-label="Тема интерфейса">
              <button class:active={themePreference === "system"} onclick={() => setTheme("system")}>Системная</button>
              <button class:active={themePreference === "light"} onclick={() => setTheme("light")}>Светлая</button>
              <button class:active={themePreference === "dark"} onclick={() => setTheme("dark")}>Тёмная</button>
            </div>
          </section>
          <section class="settings-group">
            <div class="settings-heading"><strong>Задачи</strong><small>Настройка списков в навигации</small></div>
            <button class:active={showCompleted} class="setting-row" onclick={toggleCompletedVisibility}><span><strong>Показывать выполненные</strong><small>Включает завершённые задачи в списках</small></span><span class="switch"><span></span></span></button>
          </section>
        </div>
      </section>
    {/if}
  </div>
</main>
