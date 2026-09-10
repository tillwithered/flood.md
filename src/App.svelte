<script lang="ts">
  import { ArrowRight, Bold, Bot, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Circle, Clipboard, Database, Download, ExternalLink, Folder, FolderOpen, FolderPlus, Heading1, Info, Languages, Link, ListChecks, ListTodo, LogOut, Maximize2, MessageSquareText, Minus, MoreHorizontal, Palette, PanelLeftClose, PanelLeftOpen, Paperclip, Pencil, Plus, Plug, QrCode, RefreshCw, RotateCcw, Search, Send, Settings, ShieldCheck, Square, Trash2, Underline, X, ZoomIn, ZoomOut } from "@lucide/svelte";
  import { getVersion } from "@tauri-apps/api/app";
  import { invoke } from "@tauri-apps/api/core";
  import { listen, type UnlistenFn } from "@tauri-apps/api/event";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
  import { openUrl } from "@tauri-apps/plugin-opener";
  import { check, type Update } from "@tauri-apps/plugin-updater";
  import { onMount, tick } from "svelte";
  import QRCode from "qrcode";
  import FloodGlyph from "./components/FloodGlyph.svelte";
  import { translate, type Locale, type MessageKey } from "./i18n";

  type Section = "tasks" | "trash" | "settings";
  type SettingsSection = "general" | "appearance" | "data" | "integrations" | "mcp" | "about";
  type WorkspaceView = "project" | "task";
  type Urgency = "normal" | "important" | "urgent";
  type SaveState = "idle" | "saving" | "saved" | "error";
  type ThemePreference = "system" | "light" | "dark";
  type UpdateState = "idle" | "checking" | "available" | "current" | "downloading" | "error";
  type DataActionState = "idle" | "backing-up" | "restoring" | "success" | "error";
  type AttachmentCleanupState = "idle" | "checking" | "cleaning" | "success" | "error";
  type TelegramInboxMode = "manual" | "mentions_and_replies" | "all";
  type SourceMedia = { kind: "photo" | "video" | "document" | "audio" | "voice" | "animation" | "other"; file_name: string; provider_file_id?: number; mime_type?: string; size?: number; relative_path?: string };
  type MessageSnapshot = { text: string; author?: string; sent_at?: string; url?: string; provider?: string; chat_id?: number; chat_title?: string; message_id?: number; message_ids?: number[]; media?: SourceMedia[] };
  type TelegramProjectLink = { chat_id: number; title: string; inbox_mode: TelegramInboxMode };
  type ProjectRecord = { id: string; title: string; created_at: string; updated_at: string; telegram_chats?: TelegramProjectLink[]; version: string };
  type TaskRecord = {
    id: string;
    project_id: string;
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
  type ChatItem = Omit<ProjectRecord, "telegram_chats"> & { telegram_chats: TelegramProjectLink[]; open: number };
  type MarkdownHint = { title: string; left: number; top: number };
  type TelegramStatus = { step: string; configured: boolean; managed_credentials: boolean; account_name?: string; account_username?: string; qr_link?: string; password_hint?: string; error?: string };
  type TelegramChat = { id: number; title: string };
  type TelegramLinkedTask = { id: string; title: string; urgency: Urgency; status: "open" | "completed"; trashed: boolean };
  type TelegramMessage = { id: number; message_ids?: number[]; chat_id: number; text: string; author: string; sent_at: number; url?: string; chat_title: string; media: SourceMedia[]; is_mention: boolean; is_reply_to_me: boolean; linked_task?: TelegramLinkedTask };
  type TelegramInboxCandidate = { id: string; project_id: string; chat_id: number; chat_title: string; message_id: number; message_ids?: number[]; text: string; author: string; sent_at: string; url?: string; reason: "manual" | "mention" | "reply" | "linked_chat"; status: "pending" | "dismissed" | "imported"; media?: SourceMedia[]; discovered_at: string; processed_at?: string; task_id?: string; linked_task?: TelegramLinkedTask };
  type TelegramInboxPage = { candidates: TelegramInboxCandidate[]; total: number; next_cursor?: string; remaining: number };
  type TelegramTaskCreationResult = { task: TaskRecord; media_errors: string[] };
  type TelegramInboxSyncResult = { scanned_projects: number; added: number; failed_projects: number; errors: string[]; busy: boolean };
  type TelegramMediaSyncResult = { downloaded: number; failed: number; errors: string[]; busy: boolean };
  type TelegramSyncStatus = { completed_at: string; health: "success" | "partial" | "error"; scanned_projects: number; added_candidates: number; downloaded_media: number; failures: number; errors: string[] };
  type TelegramSyncRequest = { id: string; requested_at: string };
  type TelegramSyncResult = { inbox: TelegramInboxSyncResult; media: TelegramMediaSyncResult; status?: TelegramSyncStatus };
  type TelegramSyncState = "idle" | "syncing" | "success" | "partial" | "error";
  type TelegramSyncSummary = { added: number; downloaded: number; failed: number; syncedAt: string };
  type TelegramTaskDraft = { title: string; notes: string; urgency: Urgency };
  type StoreDiagnostics = { healthy: boolean; root: string; format_version: number; project_count: number; linked_chat_count: number; open_task_count: number; completed_task_count: number; trashed_task_count: number; pending_inbox_count: number; issues: string[] };
  type AttachmentCleanupReport = { total_files: number; total_bytes: number; orphaned_files: number; orphaned_bytes: number };
  type AttachmentCleanupResult = { removed_files: number; removed_bytes: number };
  type SelfCheckItem = { name: string; passed: boolean; detail?: string };
  type SelfCheckResult = { passed: boolean; duration_ms: number; checks: SelfCheckItem[] };
  type McpCheckState = "idle" | "checking" | "success" | "error";
  type McpClient = "codex" | "claude" | "cursor" | "manual";
  type McpRuntimeInfo = { executable_path: string; launch_command: string; launch_args: string[]; available: boolean; version?: string; app_version: string; compatible: boolean; source: "bundled" | "development" };
  type InstallationRuntimeInfo = { executable_path: string; directory_path: string; kind: "installed" | "development" | "portable"; parallel_installed_copy?: string };
  type ActivityAction = "project_created" | "project_updated" | "project_deleted" | "task_created" | "task_updated" | "task_completed" | "task_moved" | "task_trashed" | "task_restored" | "task_deleted" | "trash_emptied" | "telegram_task_created" | "telegram_candidate_dismissed" | "telegram_candidate_restored" | "telegram_sync_requested";
  type ActivityEvent = { id: string; occurred_at: string; source: "mcp"; action: ActivityAction; entity_kind: "workspace" | "project" | "task" | "telegram_candidate"; entity_id?: string; project_id?: string; reversible: boolean };
  type ActivityPage = { events: ActivityEvent[]; total: number; next_cursor?: string; remaining: number };
  type CommandGroup = "actions" | "projects" | "tasks";
  type CommandItem = { id: string; group: CommandGroup; title: string; meta?: string; keywords: string; urgency?: Urgency; completed?: boolean };

  const markdownHints: Record<string, MessageKey> = {
    "#": "largeHeading"
  };
  const pendingUpdateVersionKey = "flood.pending-update-version";
  const maxAttachmentBytes = 25 * 1024 * 1024;
  const telegramModes: TelegramInboxMode[] = ["manual", "mentions_and_replies", "all"];
  const mcpClients: McpClient[] = ["codex", "claude", "cursor", "manual"];

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
  let draftTaskId = "";
  let draftDirty = false;
  let selectedChatId = "all";
  let query = "";
  let searchInput: HTMLInputElement;
  let showCompleted = false;
  let sidebarCollapsed = false;
  let expandedChatIds: string[] = [];
  let allTasksExpanded = true;
  let locale: Locale = "ru";
  let themePreference: ThemePreference = "system";
  let reduceMotion = false;
  let settingsSection: SettingsSection = "general";
  let appVersion = "0.1.0";
  let dataDirectory = "";
  let dataActionState: DataActionState = "idle";
  let dataActionMessage = "";
  let pendingRestorePath = "";
  let attachmentCleanupReport: AttachmentCleanupReport | null = null;
  let attachmentCleanupState: AttachmentCleanupState = "idle";
  let attachmentCleanupConfirm = false;
  let attachmentCleanupMessage = "";
  let mcpExecutable = "";
  let mcpRuntime: McpRuntimeInfo | null = null;
  let installationRuntime: InstallationRuntimeInfo | null = null;
  let mcpClient: McpClient = "codex";
  let storeDiagnostics: StoreDiagnostics | null = null;
  let mcpCheckState: McpCheckState = "idle";
  let mcpSelfCheck: SelfCheckResult | null = null;
  let mcpActivity: ActivityEvent[] = [];
  let mcpActivityTotal = 0;
  let mcpActivityNextCursor = "";
  let mcpActivityRemaining = 0;
  let mcpActivityState: "idle" | "loading" | "error" = "idle";
  let mcpActivityError = "";
  let telegramStatus: TelegramStatus = { step: "unconfigured", configured: false, managed_credentials: false };
  let telegramApiId = "";
  let telegramApiHash = "";
  let telegramPhone = "";
  let telegramCode = "";
  let telegramPassword = "";
  let telegramBusy = false;
  let telegramError = "";
  let telegramSyncState: TelegramSyncState = "idle";
  let telegramSyncSummary: TelegramSyncSummary | null = null;
  let telegramSyncRequest: TelegramSyncRequest | null = null;
  let telegramSyncErrors: string[] = [];
  let telegramQrDataUrl = "";
  let telegramChats: TelegramChat[] = [];
  let telegramImportOpen = false;
  let telegramMessages: TelegramMessage[] = [];
  let telegramMessagesLoading = false;
  let telegramImportError = "";
  let telegramImportingId = 0;
  let telegramImportChatId = 0;
  let telegramQueuedMessageIds: number[] = [];
  let telegramPickerProjectId = "";
  let telegramChatSearch = "";
  let telegramSearchResults: TelegramChat[] = [];
  let telegramSearchLoading = false;
  let telegramSearchTimer: number | undefined;
  let telegramInboxOpen = false;
  let telegramInbox: TelegramInboxCandidate[] = [];
  let telegramInboxView: "pending" | "history" = "pending";
  let telegramInboxTotal = 0;
  let telegramInboxNextCursor = "";
  let telegramInboxRemaining = 0;
  let telegramInboxLoadingMore = false;
  let telegramInboxLoading = false;
  let telegramInboxError = "";
  let telegramInboxProcessingId = "";
  let telegramInboxSelection: string[] = [];
  let telegramTriageQueue: string[] = [];
  let telegramTriageTotal = 0;
  let telegramTriageCreated = 0;
  let telegramTriageMediaFailures = 0;
  let telegramTriageNotice = "";
  let telegramTriageNoticeWarning = false;
  let telegramDismissUndo: TelegramInboxCandidate | null = null;
  let telegramDismissUndoTimer: number | undefined;
  let telegramTaskDraftCandidate: TelegramInboxCandidate | null = null;
  let telegramTaskDraftTitle = "";
  let telegramTaskDraftNotes = "";
  let telegramTaskDraftUrgency: Urgency = "normal";
  let telegramTaskDrafts: Record<string, TelegramTaskDraft> = {};
  let telegramTaskDraftRestored = false;
  let telegramTaskTitleInput: HTMLInputElement;
  let downloadingSourceMedia = -1;
  let telegramScanTimer: number | undefined;
  let telegramRequestTimer: number | undefined;
  let updateState: UpdateState = "idle";
  let updateMessage = "";
  let availableUpdate: Update | null = null;
  let updateProgress = 0;
  let markdown = "";
  let editorHint: MarkdownHint | null = null;
  let copied = false;
  let copiedMcpPrompt = "";
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
  let sourceViewerOpen = false;
  let sourceViewerDialog: HTMLDivElement;
  let sourceViewerReturnFocus: HTMLElement | null = null;
  let telegramConnectionsDialog: HTMLDivElement;
  let telegramConnectionsReturnFocus: HTMLElement | null = null;
  let telegramImportDialog: HTMLDivElement;
  let telegramImportReturnFocus: HTMLElement | null = null;
  let telegramInboxDialog: HTMLDivElement;
  let telegramInboxReturnFocus: HTMLElement | null = null;
  let sourceMediaPreviews: Record<number, string> = {};
  let sourcePreviewObjectUrls: string[] = [];
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
  let imageViewerReturnFocus: HTMLElement | null = null;
  let sidebarProjectHint: { label: string; left: number; top: number } | null = null;
  let commandPaletteOpen = false;
  let commandPaletteReturnFocus: HTMLElement | null = null;
  let commandQuery = "";
  let commandActiveIndex = 0;
  let commandInput: HTMLInputElement;

  const uiPreferencesKey = "flood.ui.preferences";

  function translator(forLocale: Locale) {
    return (key: MessageKey, values: Record<string, string | number> = {}) => translate(forLocale, key, values);
  }

  let t = translator(locale);

  function saveUiPreferences() {
    localStorage.setItem(uiPreferencesKey, JSON.stringify({
      theme: themePreference,
      locale,
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
      if (stored.locale === "ru" || stored.locale === "en") locale = stored.locale;
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
    document.documentElement.lang = locale;
    t = translator(locale);
  }

  function setLocale(nextLocale: Locale) {
    locale = nextLocale;
    t = translator(locale);
    document.documentElement.lang = locale;
    chats = chats.map((chat) => chat.id === "all" ? { ...chat, title: t("allTasks") } : chat);
    tasks = tasks.map((task) => ({ ...task, updated: relativeDate(task.updatedAt) }));
    trashedTasks = trashedTasks.map((task) => ({ ...task, updated: relativeDate(task.updatedAt) }));
    dataActionMessage = "";
    updateMessage = "";
    saveUiPreferences();
  }

  function openTasksLabel(count: number) {
    if (locale === "en") return t(count === 1 ? "openTaskOne" : "openTaskMany", { count });
    const lastTwo = count % 100;
    const last = count % 10;
    const key: MessageKey = lastTwo >= 11 && lastTwo <= 14
      ? "openTaskMany"
      : last === 1
        ? "openTaskOne"
        : last >= 2 && last <= 4
          ? "openTaskFew"
          : "openTaskMany";
    return t(key, { count });
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
    const first = description.split("\n").find((line) => line.trim())?.trim() ?? t("untitled");
    const plain = first
      .replace(/^#{1,3}\s+/, "")
      .replace(/^[-*>]\s+/, "")
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\*\*|\*/g, "")
      .replace(/<\/?u>/g, "")
      .trim();
    return plain || t("untitled");
  }

  function relativeDate(value: string) {
    const date = new Date(value);
    const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
    if (seconds < 60) return t("now");
    if (seconds < 3600) return t("minutesShort", { count: Math.floor(seconds / 60) });
    if (seconds < 86400) return t("hoursShort", { count: Math.floor(seconds / 3600) });
    if (seconds < 172800) return t("yesterday");
    return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "short" }).format(date);
  }

  function fullDate(value: string) {
    return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  }

  function compactDate(value: string) {
    return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
  }

  function fileName(path: string) {
    return path.split(/[\\/]/).pop() || path;
  }

  function fileDirectory(path: string) {
    const separator = Math.max(path.lastIndexOf("\\"), path.lastIndexOf("/"));
    return separator >= 0 ? path.slice(0, separator) : path;
  }

  function chatTitle(chatId: string, records = chats) {
    return records.find((chat) => chat.id === chatId)?.title ?? t("unknownProject");
  }

  function toTaskItem(task: TaskRecord | TaskSummaryRecord, records = chats): TaskItem {
    const source = "source" in task ? task.source : undefined;
    return {
      id: task.id,
      title: taskTitle(task.description),
      chat: chatTitle(task.project_id, records),
      chatId: task.project_id,
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
    return { id: "all", title: t("allTasks"), open, created_at: now, updated_at: now, telegram_chats: [], version: "" };
  }

  async function loadData(preserveSelection = true) {
    if (!inTauri()) {
      loadError = t("desktopFiles");
      loading = false;
      return;
    }
    try {
      const previousSelected = tasks.find((task) => task.id === selectedTaskId);
      let records = await invoke<ProjectRecord[]>("list_projects");
      if (!records.length) {
        await invoke<ProjectRecord>("create_project", { title: t("personal") });
        records = await invoke<ProjectRecord[]>("list_projects");
      }
      const [summaries, trash] = await Promise.all([
        invoke<TaskSummaryRecord[]>("list_tasks", { projectId: null, includeCompleted: true }),
        invoke<TaskSummaryRecord[]>("list_trashed_tasks")
      ]);
      const openCount = summaries.filter((task) => task.status === "open").length;
      const nextChats = [allChat(openCount), ...records.map((chat) => ({ ...chat, telegram_chats: chat.telegram_chats ?? [], open: summaries.filter((task) => task.project_id === chat.id && task.status === "open").length }))];
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
    if (kind === "heading-1" && !text) block.dataset.placeholder = t("newTask");
    if (text) appendInlineMarkdown(block, text);
    else block.append(document.createElement("br"));
    return block;
  }

  function createImageAttachment(alt: string, relativePath: string, source = "") {
    const card = document.createElement("span");
    card.className = "attachment-card";
    card.dataset.attachmentKind = "image";
    card.dataset.attachmentPath = relativePath;
    card.dataset.attachmentAlt = alt || t("image");
    card.contentEditable = "false";
    const image = document.createElement("img");
    image.alt = alt || t("image");
    if (source) image.src = source;
    image.draggable = false;
    const tools = document.createElement("span");
    tools.className = "attachment-tools";
    const view = document.createElement("button");
    view.type = "button";
    view.className = "attachment-tool";
    view.dataset.viewAttachment = "true";
    view.setAttribute("aria-label", `${t("openFullscreen")}: ${image.alt}`);
    view.title = t("openFullscreen");
    view.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>';
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "attachment-tool danger";
    remove.dataset.removeAttachment = "true";
    remove.setAttribute("aria-label", `${t("removeImage")}: ${image.alt}`);
    remove.title = t("removeImage");
    remove.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6"/></svg>';
    tools.append(view, remove);
    card.append(image, tools);
    return card;
  }

  function serializeInline(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (!(node instanceof HTMLElement)) return "";
    if (node.dataset.attachmentKind === "image") return `![${node.dataset.attachmentAlt ?? t("image")}](${node.dataset.attachmentPath ?? ""})`;
    const content = [...node.childNodes].map(serializeInline).join("");
    if (node.tagName === "STRONG" || node.tagName === "B") return `**${content}**`;
    if (node.tagName === "EM" || node.tagName === "I") return `*${content}*`;
    if (node.tagName === "U") return `<u>${content}</u>`;
    if (node.tagName === "IMG") return `![${node.getAttribute("alt") ?? t("image")}](${node.dataset.attachmentPath ?? ""})`;
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

  function isLocalDraft(task: TaskItem) {
    return task.id === draftTaskId;
  }

  function hasUnsavedTaskChanges() {
    const task = tasks.find((item) => item.id === selectedTaskId);
    if (!task) return false;
    return isLocalDraft(task) ? draftDirty : task.markdown !== lastSavedMarkdown;
  }

  async function persistCurrentTask(forceDraft = false) {
    await saveNow(forceDraft);
    return !conflictRemote && !hasUnsavedTaskChanges();
  }

  function discardLocalDraft() {
    if (!draftTaskId) return;
    tasks = tasks.filter((task) => task.id !== draftTaskId);
    if (selectedTaskId === draftTaskId) selectedTaskId = "";
    draftTaskId = "";
    draftDirty = false;
    markdown = "";
    lastSavedMarkdown = "";
    saveState = "idle";
  }

  async function saveNow(forceDraft = false) {
    window.clearTimeout(saveTimer);
    if (!inTauri() || !selectedTaskId) return;
    const currentTask = tasks.find((item) => item.id === selectedTaskId);
    if (currentTask && isLocalDraft(currentTask)) {
      if (!draftDirty && !forceDraft) {
        saveState = "idle";
        return;
      }
      if (saveInFlight) {
        await saveInFlight;
        return;
      }
      const localId = currentTask.id;
      const content = currentTask.markdown.replace(/^#\s*$/, `# ${t("newTask")}`);
      saveState = "saving";
      const work = (async () => {
        try {
          const created = await invoke<TaskRecord>("create_task", {
            input: { project_id: currentTask.chatId, description: content, urgency: currentTask.urgency, source: null }
          });
          const converted = toTaskItem(created);
          const latestDraft = tasks.find((task) => task.id === localId);
          const hasNewerText = Boolean(latestDraft && latestDraft.markdown !== currentTask.markdown);
          const nextTask = hasNewerText && latestDraft
            ? { ...converted, markdown: latestDraft.markdown, title: latestDraft.title }
            : converted;
          tasks = tasks.map((task) => task.id === localId ? nextTask : task);
          if (selectedTaskId === localId) {
            selectedTaskId = converted.id;
            markdown = nextTask.markdown;
            lastSavedMarkdown = converted.markdown;
          }
          draftTaskId = "";
          draftDirty = false;
          saveState = "saved";
          saveError = "";
          if (hasNewerText) scheduleSave();
        } catch (error) {
          saveState = "error";
          saveError = String(error);
        }
      })();
      saveInFlight = work;
      await work;
      saveInFlight = null;
      return;
    }
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
    anchor.dataset.linkHint = t("holdCtrl");
    anchor.rel = "noreferrer";
  }

  async function openTaskLink(url: string) {
    if (!isHttpUrl(url)) return;
    try {
      if (inTauri()) await openUrl(url);
      else window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      saveState = "error";
      saveError = t("openLinkError", { error: String(error) });
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
    if (!await persistCurrentTask(true)) return;
    for (const file of files) {
      if (file.size > maxAttachmentBytes) {
        saveState = "error";
        saveError = t("attachmentTooLarge", { file: file.name || t("attachment") });
        continue;
      }
      try {
        const relativePath = await invoke<string>("save_task_attachment", {
          id: selectedTaskId,
          fileName: file.name || (file.type === "image/png" ? "image.png" : file.type === "image/jpeg" ? "image.jpg" : "attachment"),
          bytes: [...new Uint8Array(await file.arrayBuffer())]
        });
        const bytes = await invoke<ArrayBuffer>("read_task_attachment", { id: selectedTaskId, relativePath });
        const objectUrl = URL.createObjectURL(new Blob([bytes], { type: file.type || attachmentMimeType(relativePath) }));
        attachmentObjectUrls.push(objectUrl);
        const imageFile = file.type.startsWith("image/");
        const node = imageFile ? createImageAttachment(file.name || t("image"), relativePath, objectUrl) : document.createElement("a");
        if (node instanceof HTMLAnchorElement) {
          node.dataset.attachmentPath = relativePath;
          node.textContent = file.name || t("attachment");
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
        saveError = t("attachmentError", { error: String(error) });
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
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    let remaining = Math.max(0, offset);
    let textNode = walker.nextNode();
    while (textNode) {
      const length = textNode.textContent?.length ?? 0;
      if (remaining <= length) {
        range.setStart(textNode, remaining);
        range.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(range);
        return;
      }
      remaining -= length;
      textNode = walker.nextNode();
    }
    range.setStart(block, offset > 0 ? block.childNodes.length : 0);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  function ensureBlockContent(block: HTMLElement) {
    if (!(block.textContent ?? "").length && !block.querySelector("[data-attachment-path]")) {
      block.replaceChildren(document.createElement("br"));
    }
  }

  function selectedAttachment() {
    return editorRoot?.querySelector<HTMLElement>(".attachment-card.keyboard-selected") ?? null;
  }

  function clearAttachmentSelection() {
    selectedAttachment()?.classList.remove("keyboard-selected");
  }

  function selectAttachment(card: HTMLElement) {
    clearAttachmentSelection();
    card.classList.add("keyboard-selected");
  }

  function removeSelectedAttachment(card: HTMLElement) {
    const block = card.closest<HTMLElement>(".editor-block");
    if (!block) return;
    const next = block.nextElementSibling as HTMLElement | null;
    const previous = block.previousElementSibling as HTMLElement | null;
    card.remove();
    if (!(block.textContent ?? "").length && editorRoot.children.length > 1) {
      block.remove();
      if (next) placeCaret(next, 0);
      else if (previous) placeCaret(previous, previous.textContent?.length ?? 0);
    } else {
      ensureBlockContent(block);
      placeCaret(block, 0);
    }
    serializeEditor();
  }

  function splitBlockAtSelection(block: HTMLElement, nextKind: BlockKind) {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return null;
    const selectionRange = selection.getRangeAt(0);
    if (!selectionRange.collapsed) selectionRange.deleteContents();
    const tailRange = document.createRange();
    tailRange.setStart(selectionRange.startContainer, selectionRange.startOffset);
    tailRange.setEnd(block, block.childNodes.length);
    const tail = tailRange.extractContents();
    const next = createBlock(nextKind);
    if (tail.childNodes.length) next.replaceChildren(tail);
    ensureBlockContent(block);
    ensureBlockContent(next);
    block.after(next);
    placeCaret(next, 0);
    return next;
  }

  function setBlockKind(block: HTMLElement, kind: BlockKind) {
    block.dataset.block = kind;
    block.className = `editor-block ${kind}`;
  }

  function updateHint(block: HTMLElement | null) {
    const typed = block?.textContent ?? "";
    const hintKey = markdownHints[typed];
    if (!block || !hintKey) { editorHint = null; return; }
    const bounds = block.getBoundingClientRect();
    const sidebarEdge = sidebarCollapsed ? 58 : 304;
    const title = t(hintKey);
    const estimatedWidth = Math.min(180, title.length * 7 + 24);
    editorHint = {
      title,
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
  $: telegramConnectionsProject = chats.find((chat) => chat.id === telegramPickerProjectId && chat.id !== "all");
  $: telegramVisibleChats = telegramChatSearch.trim() ? telegramSearchResults : telegramChats;
  $: normalizedQuery = query.trim().toLocaleLowerCase("ru");
  $: searchActive = normalizedQuery.length > 0;
  $: visibleTasks = tasks.filter((task) => !isLocalDraft(task) && (showCompleted || !task.completed));
  $: sidebarSearchGroups = searchActive ? chats.slice(1).map((chat) => {
    const projectMatches = chat.title.toLocaleLowerCase("ru").includes(normalizedQuery);
    const projectTasks = tasks.filter((task) => !isLocalDraft(task) && task.chatId === chat.id);
    return { chat, tasks: projectMatches ? projectTasks : projectTasks.filter(taskMatchesQuery), projectMatches };
  }).filter((group) => group.projectMatches || group.tasks.length) : [];
  $: currentProjectTasks = tasks
    .filter((task) => !isLocalDraft(task) && (selectedChatId === "all" || task.chatId === selectedChatId))
    .sort((left, right) => ({ urgent: 0, important: 1, normal: 2 })[left.urgency] - ({ urgent: 0, important: 1, normal: 2 })[right.urgency]);
  $: currentOpenTasks = currentProjectTasks.filter((task) => !task.completed);
  $: currentCompletedTasks = currentProjectTasks.filter((task) => task.completed);
  $: commandResults = buildCommandResults(commandQuery, tasks, chats, locale, telegramStatus.step);
  $: setupHasProject = chats.length > 1;
  $: setupHasTask = tasks.some((task) => !isLocalDraft(task)) || trashedTasks.length > 0;
  $: setupCompleted = Number(setupHasProject) + Number(setupHasTask);

  function tasksForChat(chat: ChatItem) {
    return tasks.filter((task) => !isLocalDraft(task) && task.chatId === chat.id && (showCompleted || !task.completed));
  }

  function openTaskCount(chatId: string) {
    return tasks.filter((task) => !isLocalDraft(task) && !task.completed && (chatId === "all" || task.chatId === chatId)).length;
  }

  async function selectChat(chat: ChatItem) {
    if (!await persistCurrentTask()) return;
    discardLocalDraft();
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

  function buildCommandResults(value: string, taskList: TaskItem[], projectList: ChatItem[], _locale: Locale, telegramStep: string): CommandItem[] {
    const needle = value.trim().toLocaleLowerCase(locale);
    const actions: CommandItem[] = [
      { id: "action:new-task", group: "actions", title: t("newTask"), meta: "Ctrl+N", keywords: `${t("newTask")} создать добавить` },
      { id: "action:inbox", group: "actions", title: t("openTelegramInbox"), meta: telegramStep === "ready" ? t("connected") : t("notConnected"), keywords: `${t("inbox")} telegram сообщения` },
      { id: "action:all-tasks", group: "actions", title: t("allTasks"), meta: openTasksLabel(taskList.filter((task) => !task.completed && !isLocalDraft(task)).length), keywords: `${t("allTasks")} список` },
      { id: "action:integrations", group: "actions", title: t("integrations"), meta: "Telegram", keywords: `${t("integrations")} telegram настройки` },
      { id: "action:mcp", group: "actions", title: t("mcpAndAi"), meta: "MCP", keywords: `${t("mcpAndAi")} codex claude cursor агент` },
      { id: "action:data", group: "actions", title: t("data"), meta: t("settings"), keywords: `${t("data")} markdown backup папка` }
    ];
    const projects = projectList.slice(1).map<CommandItem>((project) => ({
      id: `project:${project.id}`,
      group: "projects",
      title: project.title,
      meta: openTasksLabel(openTaskCount(project.id)),
      keywords: `${project.title} проект`
    }));
    const taskItems = taskList
      .filter((task) => !isLocalDraft(task))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map<CommandItem>((task) => ({
        id: `task:${task.id}`,
        group: "tasks",
        title: task.title,
        meta: task.chat,
        keywords: `${task.title} ${task.markdown} ${task.chat} ${task.sourceAuthor || ""}`,
        urgency: task.urgency,
        completed: task.completed
      }));
    const matches = (item: CommandItem) => !needle || `${item.title} ${item.keywords}`.toLocaleLowerCase(locale).includes(needle);
    if (needle) return [...actions, ...projects, ...taskItems].filter(matches).slice(0, 18);
    return [...actions, ...projects.slice(0, 3), ...taskItems.slice(0, 5)];
  }

  async function openCommandPalette() {
    if (!commandPaletteOpen) commandPaletteReturnFocus = focusedElement();
    commandPaletteOpen = true;
    commandQuery = "";
    commandActiveIndex = 0;
    newTaskMenuAnchor = null;
    urgencyMenuOpen = false;
    taskActionMenuOpen = false;
    moveMenuOpen = false;
    datePickerOpen = false;
    await tick();
    commandInput?.focus();
  }

  function closeCommandPalette() {
    const returnFocus = commandPaletteReturnFocus;
    commandPaletteReturnFocus = null;
    commandPaletteOpen = false;
    commandQuery = "";
    commandActiveIndex = 0;
    restoreModalFocus(returnFocus);
  }

  function updateCommandQuery(value: string) {
    commandQuery = value;
    commandActiveIndex = 0;
  }

  async function openSettingsSection(section: SettingsSection) {
    await changeSection("settings");
    settingsSection = section;
    if (section === "data" && !attachmentCleanupReport) void loadAttachmentCleanupReport();
    if (section === "mcp") {
      if (!attachmentCleanupReport) void loadAttachmentCleanupReport();
      if (!mcpSelfCheck) void runMcpSelfCheck();
      if (!mcpActivity.length && mcpActivityState === "idle") void loadMcpActivity();
    }
  }

  async function continueInitialSetup() {
    await changeSection("tasks");
    if (activeSection !== "tasks") return;
    if (!setupHasProject) {
      createChatOpen = true;
      return;
    }
    const project = chats[1];
    if (!project) return;
    await selectChat(project);
    await createDraft(project);
  }

  async function executeCommand(item: CommandItem | undefined) {
    if (!item) return;
    closeCommandPalette();
    if (item.id === "action:new-task") {
      if (currentChat.id !== "all") await createDraft(currentChat);
      else if (chats.length > 1) requestNewTask("workspace");
      else createChatOpen = true;
      return;
    }
    if (item.id === "action:inbox") {
      if (telegramStatus.step === "ready") await openTelegramInbox(false);
      else await openSettingsSection("integrations");
      return;
    }
    if (item.id === "action:all-tasks") {
      if (chats[0]) await selectChat(chats[0]);
      return;
    }
    if (item.id === "action:integrations") return openSettingsSection("integrations");
    if (item.id === "action:mcp") return openSettingsSection("mcp");
    if (item.id === "action:data") return openSettingsSection("data");
    if (item.id.startsWith("project:")) {
      const project = chats.find((chat) => chat.id === item.id.slice(8));
      if (project) await selectChat(project);
      return;
    }
    if (item.id.startsWith("task:")) {
      const task = tasks.find((candidate) => candidate.id === item.id.slice(5));
      if (task) await openTask(task);
    }
  }

  function handleCommandKeydown(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      commandActiveIndex = commandResults.length ? (commandActiveIndex + 1) % commandResults.length : 0;
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      commandActiveIndex = commandResults.length ? (commandActiveIndex - 1 + commandResults.length) % commandResults.length : 0;
    } else if (event.key === "Enter") {
      event.preventDefault();
      void executeCommand(commandResults[commandActiveIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeCommandPalette();
    }
  }

  function trapModalFocus(event: KeyboardEvent) {
    if (event.key !== "Tab") return;
    const dialog = event.currentTarget as HTMLElement;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])'
    )).filter((element) => element.offsetParent !== null);
    if (!focusable.length) {
      event.preventDefault();
      dialog.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  }

  function focusedElement() {
    return document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }

  function restoreModalFocus(element: HTMLElement | null) {
    void tick().then(() => {
      if (element?.isConnected) element.focus();
    });
  }

  function commandGroupLabel(group: CommandGroup) {
    return t(group === "actions" ? "quickActions" : group === "projects" ? "projectResults" : "taskResults");
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
    if (!imageViewer) imageViewerReturnFocus = focusedElement();
    imageViewer = { src: image.src, alt: image.alt || t("image") };
    imageViewerZoom = 1;
    await tick();
    imageViewerDialog?.focus();
  }

  function closeImageViewer() {
    const returnFocus = imageViewerReturnFocus;
    imageViewerReturnFocus = null;
    imageViewer = null;
    imageViewerZoom = 1;
    restoreModalFocus(returnFocus);
  }

  function changeImageZoom(step: number) {
    imageViewerZoom = Math.min(4, Math.max(.5, Math.round((imageViewerZoom + step) * 10) / 10));
  }

  async function handleWindowKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      if (commandPaletteOpen) closeCommandPalette();
      else if (telegramConnectionsProject) closeTelegramConnections();
      else if (telegramInboxOpen && !telegramInboxProcessingId) closeTelegramInbox();
      else if (telegramImportOpen) closeTelegramImporter();
      else if (imageViewer) closeImageViewer();
      else if (sourceViewerOpen) closeSourceViewer();
      else if (newTaskMenuAnchor || urgencyMenuOpen || taskActionMenuOpen || sourceEditorOpen || datePickerOpen) {
        newTaskMenuAnchor = null;
        urgencyMenuOpen = false;
        taskActionMenuOpen = false;
        moveMenuOpen = false;
        sourceEditorOpen = false;
        datePickerOpen = false;
      }
      else if (activeSection === "tasks" && workspaceView === "task") await backToProject();
      return;
    }
    if (event.ctrlKey && event.key.toLocaleLowerCase() === "k") {
      event.preventDefault();
      if (commandPaletteOpen) closeCommandPalette();
      else await openCommandPalette();
      return;
    }
    if (commandPaletteOpen) return;
    if (event.ctrlKey && event.key.toLocaleLowerCase() === "n") {
      event.preventDefault();
      requestNewTask(workspaceView === "project" ? "workspace" : "sidebar");
      return;
    }
    if (event.ctrlKey && event.key.toLocaleLowerCase() === "s") {
      event.preventDefault();
      await saveNow();
      return;
    }
    if (event.altKey && event.key === "ArrowLeft" && activeSection === "tasks" && workspaceView === "task") {
      event.preventDefault();
      await backToProject();
    }
  }

  function handleEditorClick(event: MouseEvent) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target?.closest(".attachment-card")) clearAttachmentSelection();
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
      if (block) ensureBlockContent(block);
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
    clearAttachmentSelection();
    const block = currentBlock();
    if (!block) return;
    if (selectedTaskId === draftTaskId) draftDirty = true;
    const transformed = transformTypedMarker(block);
    serializeEditor();
    updateHint(transformed ? null : block);
  }

  function handleEditorKeydown(event: KeyboardEvent) {
    const block = currentBlock();
    if (!block) return;
    const keyboardAttachment = selectedAttachment();
    if (keyboardAttachment && (event.key === "Backspace" || event.key === "Delete")) {
      event.preventDefault();
      removeSelectedAttachment(keyboardAttachment);
      return;
    }
    if (keyboardAttachment && !["Shift", "Control", "Alt", "Meta"].includes(event.key)) clearAttachmentSelection();
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
      splitBlockAtSelection(block, nextKind);
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
        const previousAttachment = previous.querySelector<HTMLElement>(".attachment-card");
        if (previousAttachment) {
          selectAttachment(previousAttachment);
          return;
        }
        const previousText = previous.textContent ?? "";
        if (previous.querySelector(":scope > br:only-child")) previous.replaceChildren();
        while (block.firstChild) previous.append(block.firstChild);
        block.remove();
        ensureBlockContent(previous);
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
    if (!await persistCurrentTask()) return;
    discardLocalDraft();
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
    closeSourceViewer();
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
    if (!await persistCurrentTask()) return;
    discardLocalDraft();
    const targetChat = chosenChat ?? (selectedChatId === "all" ? undefined : currentChat);
    if (!targetChat || targetChat.id === "all" || !inTauri()) return;
    newTaskMenuAnchor = null;
    const now = new Date().toISOString();
    const draft: TaskItem = {
      id: `draft-${Date.now()}`,
      title: t("newTask"),
      chat: targetChat.title,
      chatId: targetChat.id,
      updated: t("now"),
      createdAt: now,
      updatedAt: now,
      urgency: "normal",
      completed: false,
      markdown: "# ",
      hasSource: false,
      version: ""
    };
    draftTaskId = draft.id;
    draftDirty = false;
    tasks = [draft, ...tasks];
    selectedChatId = targetChat.id;
    setChatExpanded(targetChat.id);
    selectedTaskId = draft.id;
    markdown = draft.markdown;
    lastSavedMarkdown = draft.markdown;
    saveState = "idle";
    workspaceView = "task";
    void tick().then(() => { renderMarkdown(markdown); void focusEditor(); });
  }

  async function backToProject() {
    if (!await persistCurrentTask()) return;
    discardLocalDraft();
    workspaceView = "project";
    selectedTaskId = "";
    markdown = "";
    lastSavedMarkdown = "";
    editorHint = null;
    selectionToolbar = null;
    taskActionMenuOpen = false;
    sourceEditorOpen = false;
    closeSourceViewer();
    datePickerOpen = false;
  }

  async function submitCreateChat(event: SubmitEvent) {
    event.preventDefault();
    const title = createChatTitle.trim();
    if (!title || !inTauri()) return;
    try {
      const created = await invoke<ProjectRecord>("create_project", { title });
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
      const updated = await invoke<ProjectRecord>("update_project", { id: currentChat.id, title, expectedVersion: currentChat.version });
      chats = chats.map((chat) => chat.id === updated.id ? { ...updated, telegram_chats: updated.telegram_chats ?? [], open: openTaskCount(updated.id) } : chat);
      tasks = tasks.map((task) => task.chatId === updated.id ? { ...task, chat: updated.title } : task);
      trashedTasks = trashedTasks.map((task) => task.chatId === updated.id ? { ...task, chat: updated.title } : task);
      renameChatOpen = false;
    } catch (error) {
      formError = String(error);
    }
  }

  async function deleteCurrentChat() {
    if (currentChat.id === "all" || !inTauri()) return;
    if (!await persistCurrentTask()) return;
    try {
      const deletedId = currentChat.id;
      await invoke("delete_project", { id: deletedId, expectedVersion: currentChat.version });
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
    if (!value) return t("dateNotSpecified");
    return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  }

  function calendarTitle(month: Date) {
    return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", { month: "long", year: "numeric" }).format(month);
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
    if (!await persistCurrentTask(true)) return;
    const task = tasks.find((item) => item.id === selectedTaskId);
    if (!task || !sourceText.trim() || conflictRemote || !inTauri()) {
      if (!sourceText.trim()) formError = t("addSourceText");
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
    if (!await persistCurrentTask()) return;
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
    if (!await persistCurrentTask(true)) return;
    const task = tasks.find((item) => item.id === selectedTaskId);
    if (!task || chat.id === "all" || task.chatId === chat.id || conflictRemote || !inTauri()) return;
    try {
      const moved = await invoke<TaskRecord>("move_task", { id: task.id, projectId: chat.id, expectedVersion: task.version });
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
    if (selectedTaskId === draftTaskId) {
      discardLocalDraft();
      workspaceView = "project";
      taskActionMenuOpen = false;
      return;
    }
    if (!await persistCurrentTask()) return;
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
    if (!await persistCurrentTask(true)) return;
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
    return urgency === "urgent" ? t("urgent") : urgency === "important" ? t("important") : t("normal");
  }

  function taskSourceLabel(task: TaskItem) {
    if (task.source?.author) return t("fromMessageAuthor", { author: task.source.author });
    return task.hasSource ? t("fromMessage") : t("addedManually");
  }

  function taskSourceMetaLabel(task: TaskItem) {
    return task.source?.provider === "telegram" ? t("fromTelegram") : taskSourceLabel(task);
  }

  function clearSourceMediaPreviews() {
    for (const url of sourcePreviewObjectUrls) URL.revokeObjectURL(url);
    sourcePreviewObjectUrls = [];
    sourceMediaPreviews = {};
  }

  async function loadSourceMediaPreviews() {
    clearSourceMediaPreviews();
    const task = selectedTask;
    if (!task?.source?.media?.length || !inTauri()) return;
    const taskId = task.id;
    await Promise.all(task.source.media.map(async (media, index) => {
      if (!media.relative_path || (media.kind !== "photo" && !media.mime_type?.startsWith("image/"))) return;
      try {
        const bytes = await invoke<ArrayBuffer>("read_task_attachment", { id: taskId, relativePath: media.relative_path });
        if (!sourceViewerOpen || selectedTaskId !== taskId) return;
        const url = URL.createObjectURL(new Blob([bytes], { type: media.mime_type || attachmentMimeType(media.relative_path) }));
        sourcePreviewObjectUrls.push(url);
        sourceMediaPreviews = { ...sourceMediaPreviews, [index]: url };
      } catch {
        // Keep the file row available even if a local thumbnail cannot be read.
      }
    }));
  }

  async function openSourceViewer() {
    if (!selectedTask?.source) return;
    if (!sourceViewerOpen) sourceViewerReturnFocus = focusedElement();
    sourceViewerOpen = true;
    sourceEditorOpen = false;
    taskActionMenuOpen = false;
    await tick();
    sourceViewerDialog?.focus();
    void loadSourceMediaPreviews();
  }

  function closeSourceViewer() {
    const returnFocus = sourceViewerReturnFocus;
    sourceViewerReturnFocus = null;
    sourceViewerOpen = false;
    clearSourceMediaPreviews();
    restoreModalFocus(returnFocus);
  }

  async function changeUrgency(urgency: Urgency) {
    urgencyMenuOpen = false;
    if (!await persistCurrentTask(true)) return;
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
    if (!await persistCurrentTask()) return;
    discardLocalDraft();
    activeSection = section;
    deleteChatConfirmOpen = false;
    emptyTrashConfirmOpen = false;
    purgeTaskId = "";
    editorHint = null;
    if (section === "tasks") { await tick(); renderMarkdown(markdown); await focusEditor(); }
  }

  async function copyMcpConfig() {
    await navigator.clipboard.writeText(mcpConfiguration(mcpClient));
    copied = true;
    window.setTimeout(() => (copied = false), 1400);
  }

  async function copyMcpPrompt(prompt: string) {
    await navigator.clipboard.writeText(prompt);
    copiedMcpPrompt = prompt;
    window.setTimeout(() => {
      if (copiedMcpPrompt === prompt) copiedMcpPrompt = "";
    }, 1400);
  }

  function mcpConfiguration(client: McpClient) {
    const executable = mcpRuntime?.launch_command || mcpExecutable || "flood-mcp.exe";
    const args = mcpRuntime?.launch_args ?? [];
    if (client === "codex") {
      return `[mcp_servers.flood]\ncommand = ${JSON.stringify(executable)}${args.length ? `\nargs = ${JSON.stringify(args)}` : ""}`;
    }
    if (client === "manual") return [executable, ...args.map((arg) => JSON.stringify(arg))].join(" ");
    return JSON.stringify({ mcpServers: { flood: { command: executable, ...(args.length ? { args } : {}) } } }, null, 2);
  }

  function mcpRuntimeLabel() {
    if (!mcpRuntime?.available) return t("mcpMissing");
    if (!mcpRuntime.compatible) return t("mcpVersionMismatch");
    if (mcpCheckState === "success") return t("mcpReady");
    return t("mcpAvailable");
  }

  function telegramAgentReady() {
    if (!storeDiagnostics) return false;
    if (storeDiagnostics.linked_chat_count === 0) return true;
    return telegramStatus.step === "ready"
      && telegramSyncState === "success"
      && !telegramSyncRequest
      && !telegramSyncIsStale(5 * 60_000);
  }

  function telegramAgentReadinessLabel() {
    if (!storeDiagnostics) return t("notChecked");
    if (storeDiagnostics.linked_chat_count === 0) return t("telegramNotRequired");
    if (telegramAgentReady()) return t("telegramAgentReady");
    return telegramSyncLabel();
  }

  async function applyTelegramStatus(status: TelegramStatus) {
    const becameReady = telegramStatus.step !== "ready" && status.step === "ready";
    telegramStatus = status;
    telegramError = status.error ?? "";
    telegramQrDataUrl = status.qr_link
      ? await QRCode.toDataURL(status.qr_link, { width: 184, margin: 1, color: { dark: "#111111", light: "#ffffff" } })
      : "";
    if (status.step === "ready") {
      telegramChats = await invoke<TelegramChat[]>("telegram_list_chats").catch(() => []);
      if (becameReady) void syncTelegram();
    }
  }

  function telegramStatusLabel() {
    if (telegramStatus.step === "ready") return t("connected");
    if (telegramStatus.step === "unconfigured") return t("notConnected");
    if (["code", "password", "qr", "phone"].includes(telegramStatus.step)) return t("authorization");
    if (["database_error", "error"].includes(telegramStatus.step)) return t("needsAttention");
    return t("connecting");
  }

  async function runTelegramAction(action: () => Promise<unknown>) {
    if (telegramBusy) return;
    telegramBusy = true;
    telegramError = "";
    try { await action(); }
    catch (error) { telegramError = String(error); }
    finally { telegramBusy = false; }
  }

  function configureTelegram(event: SubmitEvent) {
    event.preventDefault();
    const apiId = Number.parseInt(telegramApiId.trim(), 10);
    void runTelegramAction(async () => {
      const status = await invoke<TelegramStatus>("telegram_configure", { apiId, apiHash: telegramApiHash.trim() });
      telegramApiHash = "";
      await applyTelegramStatus(status);
    });
  }

  function requestTelegramQr() { void runTelegramAction(() => invoke("telegram_request_qr")); }
  function submitTelegramPhone(event: SubmitEvent) { event.preventDefault(); void runTelegramAction(() => invoke("telegram_submit_phone", { phone: telegramPhone.trim() })); }
  function submitTelegramCode(event: SubmitEvent) { event.preventDefault(); void runTelegramAction(() => invoke("telegram_submit_code", { code: telegramCode.trim() })); }
  function submitTelegramPassword(event: SubmitEvent) { event.preventDefault(); void runTelegramAction(() => invoke("telegram_submit_password", { password: telegramPassword })); }
  function disconnectTelegram() {
    void runTelegramAction(async () => {
      await invoke("telegram_disconnect");
      telegramChats = [];
      telegramSyncState = "idle";
      telegramSyncSummary = null;
      telegramSyncErrors = [];
    });
  }

  function resetTelegramDatabase() {
    void runTelegramAction(async () => {
      await invoke("telegram_reset_database");
    });
  }

  function telegramSyncLabel() {
    if (telegramSyncState === "syncing") return t("telegramSyncing");
    if (telegramSyncState === "error") return t("telegramSyncFailed");
    if (telegramSyncState === "partial") return t("telegramSyncPartial");
    if (telegramSyncRequest) return telegramSyncRequestIsDelayed() ? t("telegramSyncDelayed") : t("telegramSyncRequested");
    if (telegramSyncSummary) {
      return t("telegramSyncSummary", {
        time: new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", { hour: "2-digit", minute: "2-digit" }).format(new Date(telegramSyncSummary.syncedAt)),
        added: telegramSyncSummary.added,
        downloaded: telegramSyncSummary.downloaded
      });
    }
    return t("telegramSyncAutomatic");
  }

  function telegramSyncRequestIsDelayed(maxAgeMs = 120_000) {
    if (!telegramSyncRequest?.requested_at) return false;
    const requestedAt = new Date(telegramSyncRequest.requested_at).getTime();
    return !Number.isFinite(requestedAt) || Date.now() - requestedAt > maxAgeMs;
  }

  function applyTelegramSyncStatus(status: TelegramSyncStatus | null | undefined) {
    if (!status) return;
    telegramSyncState = status.health;
    telegramSyncErrors = status.errors;
    telegramSyncSummary = {
      added: status.added_candidates,
      downloaded: status.downloaded_media,
      failed: status.failures,
      syncedAt: status.completed_at
    };
  }

  async function syncTelegram(includeInbox = true) {
    if (!inTauri() || telegramStatus.step !== "ready" || telegramSyncState === "syncing") return;
    const previousState = telegramSyncState;
    telegramSyncState = "syncing";
    telegramSyncErrors = [];
    try {
      const sync = await invoke<TelegramSyncResult>("telegram_sync", { includeInbox });
      if (sync.inbox.busy || sync.media.busy) {
        if (sync.status) applyTelegramSyncStatus(sync.status);
        else telegramSyncState = previousState;
        return;
      }
      applyTelegramSyncStatus(sync.status);
      if (includeInbox && telegramInboxOpen && !telegramTaskDraftCandidate) {
        await loadTelegramInboxPage();
      }
    } catch (error) {
      telegramSyncState = "error";
      telegramSyncErrors = [String(error)];
    } finally {
      telegramSyncRequest = await invoke<TelegramSyncRequest | null>("telegram_pending_sync_request").catch(() => telegramSyncRequest);
    }
  }

  async function refreshTelegramSyncRequest() {
    telegramSyncRequest = await invoke<TelegramSyncRequest | null>("telegram_pending_sync_request").catch(() => telegramSyncRequest);
    return telegramSyncRequest;
  }

  function telegramSyncIsStale(maxAgeMs = 60_000) {
    if (!telegramSyncSummary?.syncedAt) return true;
    const completedAt = new Date(telegramSyncSummary.syncedAt).getTime();
    return !Number.isFinite(completedAt) || Date.now() - completedAt >= maxAgeMs;
  }

  function catchUpTelegramSync() {
    if (document.visibilityState === "visible" && telegramStatus.step === "ready" && telegramSyncIsStale()) {
      void syncTelegram();
    }
  }

  async function runMcpSelfCheck() {
    if (mcpCheckState === "checking") return;
    mcpCheckState = "checking";
    mcpSelfCheck = null;
    try {
      const [runtime, diagnostics, selfCheck] = await Promise.all([
        invoke<McpRuntimeInfo>("mcp_runtime_info"),
        invoke<StoreDiagnostics>("diagnose_store"),
        invoke<SelfCheckResult>("run_mcp_self_check")
      ]);
      mcpRuntime = runtime;
      mcpExecutable = runtime.executable_path;
      storeDiagnostics = diagnostics;
      mcpSelfCheck = selfCheck;
      mcpCheckState = runtime.available && runtime.compatible && diagnostics.healthy && selfCheck.passed ? "success" : "error";
    } catch (error) {
      mcpSelfCheck = { passed: false, duration_ms: 0, checks: [{ name: t("mcpSelfCheckFailed"), passed: false, detail: String(error) }] };
      mcpCheckState = "error";
    }
  }

  const activityActionKeys: Record<ActivityAction, MessageKey> = {
    project_created: "activityProjectCreated",
    project_updated: "activityProjectUpdated",
    project_deleted: "activityProjectDeleted",
    task_created: "activityTaskCreated",
    task_updated: "activityTaskUpdated",
    task_completed: "activityTaskCompleted",
    task_moved: "activityTaskMoved",
    task_trashed: "activityTaskTrashed",
    task_restored: "activityTaskRestored",
    task_deleted: "activityTaskDeleted",
    trash_emptied: "activityTrashEmptied",
    telegram_task_created: "activityTelegramTaskCreated",
    telegram_candidate_dismissed: "activityTelegramCandidateDismissed",
    telegram_candidate_restored: "activityTelegramCandidateRestored",
    telegram_sync_requested: "activityTelegramSyncRequested"
  };

  function activityEntityLabel(event: ActivityEvent) {
    if (event.entity_kind === "project" && event.entity_id) {
      return chats.find((project) => project.id === event.entity_id)?.title ?? `${t("activityProject")} · ${event.entity_id.slice(-6)}`;
    }
    if (event.entity_kind === "task" && event.entity_id) {
      const task = [...tasks, ...trashedTasks].find((item) => item.id === event.entity_id);
      return task?.title ?? `${t("activityTask")} · ${event.entity_id.slice(-6)}`;
    }
    if (event.entity_kind === "telegram_candidate") return t("telegramInboxItem");
    return "flood.md";
  }

  function activityGlyph(event: ActivityEvent): "brand" | "info" | "connected" | "completed" | "urgent" {
    if (["task_deleted", "project_deleted", "trash_emptied"].includes(event.action)) return "urgent";
    if (event.action === "task_completed") return "completed";
    if (event.action.startsWith("telegram_")) return "info";
    if (["task_created", "project_created", "task_restored"].includes(event.action)) return "connected";
    return "brand";
  }

  async function loadMcpActivity(append = false) {
    if (!inTauri() || mcpActivityState === "loading") return;
    mcpActivityState = "loading";
    mcpActivityError = "";
    try {
      const page = await invoke<ActivityPage>("list_activity", {
        cursor: append && mcpActivityNextCursor ? mcpActivityNextCursor : null,
        limit: 20
      });
      mcpActivity = append
        ? [...mcpActivity, ...page.events.filter((event) => !mcpActivity.some((current) => current.id === event.id))]
        : page.events;
      mcpActivityTotal = page.total;
      mcpActivityNextCursor = page.next_cursor ?? "";
      mcpActivityRemaining = page.remaining;
      mcpActivityState = "idle";
    } catch (error) {
      mcpActivityState = "error";
      mcpActivityError = String(error);
    }
  }

  function telegramModeLabel(mode: TelegramInboxMode) {
    return t(mode === "manual" ? "telegramModeManual" : mode === "all" ? "telegramModeAll" : "telegramModeMentions");
  }

  function openTelegramConnections(projectId: string) {
    if (!telegramPickerProjectId) telegramConnectionsReturnFocus = focusedElement();
    telegramPickerProjectId = projectId;
    telegramChatSearch = "";
    telegramSearchResults = [];
    telegramSearchLoading = false;
    void tick().then(() => telegramConnectionsDialog?.focus());
  }

  function closeTelegramConnections() {
    const returnFocus = telegramConnectionsReturnFocus;
    telegramConnectionsReturnFocus = null;
    window.clearTimeout(telegramSearchTimer);
    telegramPickerProjectId = "";
    telegramChatSearch = "";
    telegramSearchResults = [];
    telegramSearchLoading = false;
    restoreModalFocus(returnFocus);
  }

  function searchTelegramChats(value: string) {
    telegramChatSearch = value;
    window.clearTimeout(telegramSearchTimer);
    const query = value.trim();
    if (!query) {
      telegramSearchResults = [];
      telegramSearchLoading = false;
      return;
    }
    telegramSearchResults = [];
    const projectId = telegramPickerProjectId;
    telegramSearchLoading = true;
    telegramSearchTimer = window.setTimeout(async () => {
      try {
        const result = await invoke<TelegramChat[]>("telegram_search_chats", { query, limit: 80 });
        if (telegramPickerProjectId === projectId && telegramChatSearch.trim() === query) telegramSearchResults = result;
      } catch (error) {
        telegramError = String(error);
      } finally {
        if (telegramPickerProjectId === projectId && telegramChatSearch.trim() === query) telegramSearchLoading = false;
      }
    }, 260);
  }

  async function saveProjectTelegramLinks(project: ChatItem, links: TelegramProjectLink[]) {
    try {
      const updated = await invoke<ProjectRecord>("set_project_telegram_chats", {
        id: project.id,
        telegramChats: links,
        expectedVersion: project.version
      });
      chats = chats.map((chat) => chat.id === updated.id ? { ...updated, telegram_chats: updated.telegram_chats ?? [], open: chat.open } : chat);
      if (updated.telegram_chats?.some((link) => link.inbox_mode !== "manual")) {
        const inbox = await invoke<TelegramInboxCandidate[]>("telegram_refresh_inbox", { projectId: updated.id, limitPerChat: 40 });
        if (telegramInboxOpen && currentChat.id === updated.id) telegramInbox = inbox;
        else if (telegramInboxOpen && currentChat.id === "all") telegramInbox = await invoke<TelegramInboxCandidate[]>("telegram_list_inbox", { projectId: null, includeProcessed: false });
      }
      telegramError = "";
    } catch (error) {
      telegramError = String(error);
    }
  }

  async function toggleProjectTelegramChat(project: ChatItem, chat: TelegramChat) {
    const exists = project.telegram_chats.some((link) => link.chat_id === chat.id);
    const links = exists
      ? project.telegram_chats.filter((link) => link.chat_id !== chat.id)
      : [...project.telegram_chats, { chat_id: chat.id, title: chat.title, inbox_mode: "mentions_and_replies" as const }];
    await saveProjectTelegramLinks(project, links);
  }

  async function setProjectTelegramMode(project: ChatItem, link: TelegramProjectLink, mode: TelegramInboxMode) {
    if (link.inbox_mode === mode) return;
    await saveProjectTelegramLinks(project, project.telegram_chats.map((item) => item.chat_id === link.chat_id ? { ...item, inbox_mode: mode } : item));
  }

  async function loadTelegramImportChat(chatId: number) {
    if (telegramMessagesLoading) return;
    telegramImportChatId = chatId;
    telegramMessagesLoading = true;
    telegramImportError = "";
    telegramMessages = [];
    try {
      telegramMessages = await invoke<TelegramMessage[]>("telegram_list_messages", { chatId, limit: 50, projectId: currentChat.id === "all" ? null : currentChat.id });
    } catch (error) {
      telegramImportError = String(error);
    } finally {
      telegramMessagesLoading = false;
    }
  }

  async function openTelegramImporter() {
    const first = currentChat.telegram_chats[0];
    if (!first || telegramMessagesLoading) return;
    if (!telegramImportOpen) telegramImportReturnFocus = focusedElement();
    telegramImportOpen = true;
    await tick();
    telegramImportDialog?.focus();
    try {
      const pending = await invoke<TelegramInboxCandidate[]>("telegram_list_inbox", { projectId: currentChat.id, includeProcessed: false });
      telegramQueuedMessageIds = pending.flatMap((candidate) => candidate.message_ids?.length ? candidate.message_ids : [candidate.message_id]);
      await loadTelegramImportChat(first.chat_id);
    } catch (error) {
      telegramImportError = String(error);
    }
  }

  function closeTelegramImporter() {
    if (telegramImportingId) return;
    const returnFocus = telegramImportReturnFocus;
    telegramImportReturnFocus = null;
    telegramImportOpen = false;
    telegramMessages = [];
    telegramImportError = "";
    restoreModalFocus(returnFocus);
  }

  async function importTelegramMessage(message: TelegramMessage) {
    if (telegramImportingId || currentChat.id === "all") return;
    telegramImportingId = message.id;
    telegramImportError = "";
    try {
      await invoke<TelegramInboxCandidate>("telegram_add_inbox_message", {
        projectId: currentChat.id,
        chatId: message.chat_id,
        messageIds: message.message_ids?.length ? message.message_ids : [message.id]
      });
      telegramQueuedMessageIds = [...telegramQueuedMessageIds, message.id];
    } catch (error) {
      telegramImportError = String(error);
    } finally {
      telegramImportingId = 0;
    }
  }

  async function openTelegramInbox(refresh = false) {
    const wasOpen = telegramInboxOpen;
    if (!wasOpen) telegramInboxReturnFocus = focusedElement();
    telegramInboxOpen = true;
    telegramInboxLoading = true;
    telegramInboxError = "";
    telegramInboxSelection = [];
    telegramTriageQueue = [];
    telegramTriageTotal = 0;
    telegramTriageCreated = 0;
    telegramTriageMediaFailures = 0;
    telegramTriageNotice = "";
    telegramTriageNoticeWarning = false;
    if (!wasOpen) telegramInboxView = "pending";
    if (!wasOpen) {
      await tick();
      telegramInboxDialog?.focus();
    }
    try {
      const projectId = currentChat.id === "all" ? null : currentChat.id;
      if (refresh && projectId) {
        applyTelegramInboxPage(await invoke<TelegramInboxPage>("telegram_refresh_inbox", { projectId, limitPerChat: 80 }));
      } else {
        await loadTelegramInboxPage();
      }
    } catch (error) {
      telegramInboxError = String(error);
    } finally {
      telegramInboxLoading = false;
    }
  }

  function applyTelegramInboxPage(page: TelegramInboxPage, append = false) {
    telegramInbox = append
      ? [...telegramInbox, ...page.candidates.filter((candidate) => !telegramInbox.some((existing) => existing.id === candidate.id))]
      : page.candidates;
    telegramInboxTotal = page.total;
    telegramInboxNextCursor = page.next_cursor ?? "";
    telegramInboxRemaining = page.remaining;
  }

  async function loadTelegramInboxPage(append = false) {
    if (!inTauri()) return;
    const page = await invoke<TelegramInboxPage>("telegram_list_inbox_page", {
      projectId: currentChat.id === "all" ? null : currentChat.id,
      includePending: telegramInboxView === "pending",
      includeProcessed: telegramInboxView === "history",
      cursor: append ? telegramInboxNextCursor || null : null,
      limit: 30
    });
    applyTelegramInboxPage(page, append);
  }

  async function setTelegramInboxView(view: "pending" | "history") {
    if (view === telegramInboxView || telegramInboxLoading || telegramInboxProcessingId || telegramTaskDraftCandidate) return;
    telegramInboxView = view;
    telegramInboxLoading = true;
    telegramInboxError = "";
    telegramInboxSelection = [];
    telegramDismissUndo = null;
    window.clearTimeout(telegramDismissUndoTimer);
    try {
      await loadTelegramInboxPage();
    } catch (error) {
      telegramInboxError = String(error);
    } finally {
      telegramInboxLoading = false;
    }
  }

  async function loadMoreTelegramInbox() {
    if (!telegramInboxNextCursor || telegramInboxLoadingMore) return;
    telegramInboxLoadingMore = true;
    telegramInboxError = "";
    try {
      await loadTelegramInboxPage(true);
    } catch (error) {
      telegramInboxError = String(error);
    } finally {
      telegramInboxLoadingMore = false;
    }
  }

  function suggestedTelegramTaskTitle(candidate: TelegramInboxCandidate) {
    const words = candidate.text.trim().split(/\s+/).filter(Boolean);
    while (words[0]?.startsWith("@")) words.shift();
    const normalized = words.join(" ").split(/\r?\n/)[0]?.trim();
    if (!normalized) return candidate.media?.length ? t("telegramMediaTaskTitle", { count: candidate.media.length }) : t("telegramMessageTaskTitle");
    const sentence = `${normalized.charAt(0).toLocaleUpperCase(locale)}${normalized.slice(1)}`;
    return sentence.length > 88 ? `${sentence.slice(0, 87).trimEnd()}…` : sentence;
  }

  async function beginTaskFromCandidate(candidate: TelegramInboxCandidate, preserveQueue = false) {
    if (!preserveQueue) {
      telegramTriageQueue = [];
      telegramTriageTotal = 0;
      telegramTriageCreated = 0;
      telegramTriageMediaFailures = 0;
      telegramTriageNotice = "";
      telegramTriageNoticeWarning = false;
    }
    const savedDraft = telegramTaskDrafts[candidate.id];
    telegramTaskDraftCandidate = candidate;
    telegramTaskDraftTitle = savedDraft?.title ?? suggestedTelegramTaskTitle(candidate);
    telegramTaskDraftNotes = savedDraft?.notes ?? "";
    telegramTaskDraftUrgency = savedDraft?.urgency ?? "normal";
    telegramTaskDraftRestored = Boolean(savedDraft);
    telegramInboxError = "";
    await tick();
    telegramTaskTitleInput?.focus();
  }

  function rememberTelegramTaskDraft() {
    const candidate = telegramTaskDraftCandidate;
    if (!candidate) return;
    const suggestedTitle = suggestedTelegramTaskTitle(candidate);
    const draft = {
      title: telegramTaskDraftTitle,
      notes: telegramTaskDraftNotes,
      urgency: telegramTaskDraftUrgency
    };
    if (draft.title !== suggestedTitle || draft.notes.trim() || draft.urgency !== "normal") {
      telegramTaskDrafts = { ...telegramTaskDrafts, [candidate.id]: draft };
    } else {
      discardTelegramTaskDraft(candidate.id);
    }
  }

  function discardTelegramTaskDraft(candidateId: string) {
    if (!telegramTaskDrafts[candidateId]) return;
    const drafts = { ...telegramTaskDrafts };
    delete drafts[candidateId];
    telegramTaskDrafts = drafts;
  }

  function closeTelegramTaskDraft() {
    if (telegramInboxProcessingId) return;
    rememberTelegramTaskDraft();
    telegramTaskDraftCandidate = null;
    telegramTaskDraftRestored = false;
    telegramTriageQueue = [];
    telegramTriageTotal = 0;
    telegramTriageCreated = 0;
    telegramTriageMediaFailures = 0;
  }

  function closeTelegramInbox() {
    if (telegramInboxProcessingId) return;
    rememberTelegramTaskDraft();
    const returnFocus = telegramInboxReturnFocus;
    telegramInboxReturnFocus = null;
    telegramTaskDraftCandidate = null;
    telegramInboxOpen = false;
    telegramInboxSelection = [];
    telegramTriageQueue = [];
    telegramTriageTotal = 0;
    telegramTriageCreated = 0;
    telegramTriageMediaFailures = 0;
    telegramTriageNotice = "";
    telegramTriageNoticeWarning = false;
    telegramDismissUndo = null;
    window.clearTimeout(telegramDismissUndoTimer);
    telegramTaskDraftRestored = false;
    restoreModalFocus(returnFocus);
  }

  function toggleTelegramInboxCandidate(candidateId: string) {
    telegramInboxSelection = telegramInboxSelection.includes(candidateId)
      ? telegramInboxSelection.filter((id) => id !== candidateId)
      : [...telegramInboxSelection, candidateId];
  }

  function allTelegramInboxCandidatesSelected() {
    const ids = telegramInbox.filter((candidate) => !candidate.linked_task).map((candidate) => candidate.id);
    return ids.length > 0 && ids.every((id) => telegramInboxSelection.includes(id));
  }

  function toggleAllTelegramInboxCandidates() {
    const ids = telegramInbox.filter((candidate) => !candidate.linked_task).map((candidate) => candidate.id);
    telegramInboxSelection = allTelegramInboxCandidatesSelected() ? [] : ids;
  }

  async function beginSelectedTelegramTriage() {
    const queue = telegramInboxSelection.filter((id) => telegramInbox.some((candidate) => candidate.id === id && !candidate.linked_task));
    if (!queue.length) return;
    telegramTriageQueue = queue;
    telegramTriageTotal = queue.length;
    telegramTriageCreated = 0;
    telegramTriageMediaFailures = 0;
    telegramTriageNotice = "";
    telegramTriageNoticeWarning = false;
    const first = telegramInbox.find((candidate) => candidate.id === queue[0]);
    if (first) await beginTaskFromCandidate(first, true);
  }

  async function advanceTelegramTriage(candidateId: string) {
    telegramInboxSelection = telegramInboxSelection.filter((id) => id !== candidateId);
    telegramTriageQueue = telegramTriageQueue.filter((id) => id !== candidateId);
    const next = telegramInbox.find((candidate) => candidate.id === telegramTriageQueue[0]);
    if (next) {
      await beginTaskFromCandidate(next, true);
      return;
    }
    telegramTaskDraftCandidate = null;
    telegramTaskDraftRestored = false;
    telegramTriageNoticeWarning = telegramTriageMediaFailures > 0;
    telegramTriageNotice = telegramTriageMediaFailures
      ? t("triageCompleteWithMedia", { created: telegramTriageCreated, total: telegramTriageTotal, count: telegramTriageMediaFailures })
      : t("triageComplete", { created: telegramTriageCreated, total: telegramTriageTotal });
    telegramTriageQueue = [];
    telegramTriageTotal = 0;
  }

  function skipTelegramTriageCandidate() {
    const candidate = telegramTaskDraftCandidate;
    if (!candidate || !telegramTriageQueue.length || telegramInboxProcessingId) return;
    rememberTelegramTaskDraft();
    void advanceTelegramTriage(candidate.id);
  }

  async function createTaskFromCandidate() {
    const candidate = telegramTaskDraftCandidate;
    const title = telegramTaskDraftTitle.trim();
    if (!candidate || !title || telegramInboxProcessingId) return;
    telegramInboxProcessingId = candidate.id;
    const batchMode = telegramTriageQueue.includes(candidate.id);
    try {
      const description = telegramTaskDraftNotes.trim() ? `${title}\n\n${telegramTaskDraftNotes.trim()}` : title;
      const result = await invoke<TelegramTaskCreationResult>("telegram_create_task_from_candidate", { candidateId: candidate.id, description, urgency: telegramTaskDraftUrgency });
      const created = result.task;
      discardTelegramTaskDraft(candidate.id);
      telegramInbox = telegramInbox.filter((item) => item.id !== candidate.id);
      telegramInboxTotal = Math.max(0, telegramInboxTotal - 1);
      await loadData(true);
      if (batchMode) {
        telegramTriageCreated += 1;
        telegramTriageMediaFailures += result.media_errors.length;
        await advanceTelegramTriage(candidate.id);
        return;
      }
      telegramTaskDraftCandidate = null;
      telegramTaskDraftRestored = false;
      telegramInboxOpen = false;
      await openTask(toTaskItem(created, chats));
      if (result.media_errors.length) saveError = t("someMediaNotAdded", { count: result.media_errors.length });
    } catch (error) {
      telegramInboxError = String(error);
    } finally {
      telegramInboxProcessingId = "";
    }
  }

  async function dismissTelegramCandidate(candidate: TelegramInboxCandidate) {
    if (telegramInboxProcessingId) return;
    telegramInboxProcessingId = candidate.id;
    try {
      if (!(import.meta.env.DEV && !inTauri() && candidate.id.startsWith("preview-"))) {
        await invoke("telegram_set_candidate_status", { candidateId: candidate.id, status: "dismissed" });
      }
      discardTelegramTaskDraft(candidate.id);
      telegramInbox = telegramInbox.filter((item) => item.id !== candidate.id);
      telegramInboxTotal = Math.max(0, telegramInboxTotal - 1);
      telegramInboxSelection = telegramInboxSelection.filter((id) => id !== candidate.id);
      telegramDismissUndo = { ...candidate, status: "dismissed", processed_at: new Date().toISOString() };
      window.clearTimeout(telegramDismissUndoTimer);
      telegramDismissUndoTimer = window.setTimeout(() => {
        telegramDismissUndo = null;
      }, 8_000);
    } catch (error) {
      telegramInboxError = String(error);
    } finally {
      telegramInboxProcessingId = "";
    }
  }

  async function restoreTelegramCandidate(candidate: TelegramInboxCandidate | null) {
    if (!candidate || telegramInboxProcessingId) return;
    telegramInboxProcessingId = candidate.id;
    telegramInboxError = "";
    try {
      const restored = import.meta.env.DEV && !inTauri() && candidate.id.startsWith("preview-")
        ? { ...candidate, status: "pending" as const, processed_at: undefined }
        : await invoke<TelegramInboxCandidate>("telegram_set_candidate_status", { candidateId: candidate.id, status: "pending" });
      if (telegramInboxView === "pending") {
        telegramInbox = [...telegramInbox.filter((item) => item.id !== restored.id), restored]
          .sort((left, right) => new Date(right.sent_at).getTime() - new Date(left.sent_at).getTime());
        telegramInboxTotal += 1;
      } else {
        telegramInbox = telegramInbox.filter((item) => item.id !== restored.id);
        telegramInboxTotal = Math.max(0, telegramInboxTotal - 1);
      }
      if (telegramDismissUndo?.id === candidate.id) {
        telegramDismissUndo = null;
        window.clearTimeout(telegramDismissUndoTimer);
      }
    } catch (error) {
      telegramInboxError = String(error);
    } finally {
      telegramInboxProcessingId = "";
    }
  }

  function undoDismissTelegramCandidate() {
    void restoreTelegramCandidate(telegramDismissUndo);
  }

  function telegramReasonLabel(reason: TelegramInboxCandidate["reason"]) {
    return t(reason === "mention" ? "telegramReasonMention" : reason === "reply" ? "telegramReasonReply" : reason === "manual" ? "telegramReasonManual" : "telegramReasonChat");
  }

  function telegramLinkedTaskState(task: TelegramLinkedTask) {
    if (task.trashed) return t("taskInTrash");
    return task.status === "completed" ? t("completed") : urgencyTitle(task.urgency);
  }

  async function openTelegramLinkedTask(task: TelegramLinkedTask) {
    if (task.trashed) return;
    try {
      const record = await invoke<TaskRecord>("get_task", { id: task.id });
      if (telegramImportOpen) closeTelegramImporter();
      if (telegramInboxOpen) closeTelegramInbox();
      await openTask(toTaskItem(record, chats));
    } catch (error) {
      telegramImportError = String(error);
    }
  }

  async function downloadTelegramSourceMedia(index: number) {
    if (!selectedTask || downloadingSourceMedia >= 0) return;
    if (!await persistCurrentTask(true)) return;
    downloadingSourceMedia = index;
    try {
      let saved = await invoke<TaskRecord>("telegram_download_source_media", { taskId: selectedTask.id, mediaIndex: index });
      saved = await insertSourceMediaRecord(saved, index);
      await applyUpdatedTask(saved);
      if (sourceViewerOpen) void loadSourceMediaPreviews();
    } catch (error) {
      saveError = String(error);
    } finally {
      downloadingSourceMedia = -1;
    }
  }

  function sourceMediaMarkdown(media: SourceMedia) {
    if (!media.relative_path) return "";
    const label = media.file_name.replace(/[\[\]\r\n]/g, " ").trim() || t("attachment");
    return media.kind === "photo" ? `![${label}](${media.relative_path})` : `[${label}](${media.relative_path})`;
  }

  function sourceMediaInTask(media: SourceMedia) {
    return Boolean(media.relative_path && selectedTask?.markdown.includes(`](${media.relative_path})`));
  }

  async function insertSourceMediaRecord(task: TaskRecord, index: number) {
    const media = task.source?.media?.[index];
    const attachment = media ? sourceMediaMarkdown(media) : "";
    if (!media?.relative_path || !attachment || task.description.includes(`](${media.relative_path})`)) return task;
    return invoke<TaskRecord>("update_task", {
      id: task.id,
      patch: { description: `${task.description.trimEnd()}\n\n${attachment}` },
      expectedVersion: task.version
    });
  }

  async function applyUpdatedTask(saved: TaskRecord) {
    const converted = toTaskItem(saved, chats);
    tasks = tasks.map((task) => task.id === converted.id ? converted : task);
    if (selectedTaskId === converted.id) {
      markdown = converted.markdown;
      lastSavedMarkdown = converted.markdown;
      saveState = "saved";
      await tick();
      renderMarkdown(markdown);
    }
  }

  async function insertDownloadedSourceMedia(index: number) {
    if (!selectedTask || downloadingSourceMedia >= 0 || !await persistCurrentTask(true)) return;
    downloadingSourceMedia = index;
    try {
      const current = await invoke<TaskRecord>("get_task", { id: selectedTask.id });
      await applyUpdatedTask(await insertSourceMediaRecord(current, index));
    } catch (error) {
      saveError = String(error);
    } finally {
      downloadingSourceMedia = -1;
    }
  }

  async function openSourceMedia(media: SourceMedia) {
    if (!selectedTask || !media.relative_path) return;
    try {
      if (media.kind === "photo" || media.mime_type?.startsWith("image/")) {
        const bytes = await invoke<ArrayBuffer>("read_task_attachment", { id: selectedTask.id, relativePath: media.relative_path });
        const url = URL.createObjectURL(new Blob([bytes], { type: media.mime_type || attachmentMimeType(media.relative_path) }));
        attachmentObjectUrls.push(url);
        if (!imageViewer) imageViewerReturnFocus = focusedElement();
        imageViewer = { src: url, alt: media.file_name || t("image") };
        imageViewerZoom = 1;
        await tick();
        imageViewerDialog?.focus();
      } else {
        await invoke("open_task_attachment", { id: selectedTask.id, relativePath: media.relative_path });
      }
    } catch (error) {
      saveError = String(error);
    }
  }

  async function openDataDirectory() {
    if (!dataDirectory) return;
    try { await invoke("open_data_directory"); }
    catch (error) {
      dataActionState = "error";
      dataActionMessage = String(error);
    }
  }

  async function openApplicationDirectory(path: string) {
    try { await invoke("open_application_directory", { path }); }
    catch (error) { updateMessage = String(error); }
  }

  function installationKindLabel() {
    if (!installationRuntime) return "";
    return t(installationRuntime.kind === "installed" ? "installedBuild" : installationRuntime.kind === "development" ? "developmentBuild" : "portableBuild");
  }

  async function createDataBackup() {
    if (!await persistCurrentTask() || dataActionState === "backing-up" || dataActionState === "restoring") return;
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const destination = await saveDialog({
      title: t("saveBackup"),
      defaultPath: `flood-backup-${date}.zip`,
      filters: [{ name: t("backupFile"), extensions: ["zip"] }]
    });
    if (!destination) return;
    dataActionState = "backing-up";
    dataActionMessage = "";
    try {
      await invoke("create_backup", { destination });
      dataActionState = "success";
      dataActionMessage = t("backupSaved", { file: fileName(destination) });
    } catch (error) {
      dataActionState = "error";
      dataActionMessage = String(error);
    }
  }

  async function chooseBackupToRestore() {
    if (dataActionState === "backing-up" || dataActionState === "restoring") return;
    const source = await openDialog({
      title: t("chooseBackup"),
      multiple: false,
      directory: false,
      filters: [{ name: t("backupFile"), extensions: ["zip"] }]
    });
    if (!source) return;
    pendingRestorePath = source;
    dataActionState = "idle";
    dataActionMessage = "";
  }

  async function restoreDataBackup() {
    if (!pendingRestorePath || dataActionState === "restoring") return;
    if (!await persistCurrentTask()) return;
    dataActionState = "restoring";
    dataActionMessage = "";
    try {
      await invoke("restore_backup", { source: pendingRestorePath });
      discardLocalDraft();
      selectedTaskId = "";
      selectedChatId = "all";
      workspaceView = "project";
      await loadData(false);
      dataActionState = "success";
      dataActionMessage = t("dataRestored");
      pendingRestorePath = "";
    } catch (error) {
      dataActionState = "error";
      dataActionMessage = String(error);
    }
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} ${t("bytes")}`;
    const value = bytes < 1024 * 1024 ? bytes / 1024 : bytes / (1024 * 1024);
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)} ${t(bytes < 1024 * 1024 ? "kilobytes" : "megabytes")}`;
  }

  async function loadAttachmentCleanupReport() {
    if (!inTauri() || attachmentCleanupState === "checking" || attachmentCleanupState === "cleaning") return;
    attachmentCleanupState = "checking";
    attachmentCleanupMessage = "";
    try {
      attachmentCleanupReport = await invoke<AttachmentCleanupReport>("attachment_cleanup_report");
      attachmentCleanupState = "idle";
      if (!attachmentCleanupReport.orphaned_files) attachmentCleanupConfirm = false;
    } catch (error) {
      attachmentCleanupState = "error";
      attachmentCleanupMessage = t("attachmentCleanupFailed", { error: String(error) });
    }
  }

  async function cleanupOrphanedAttachments() {
    if (attachmentCleanupState === "cleaning" || !await persistCurrentTask()) return;
    attachmentCleanupState = "cleaning";
    attachmentCleanupMessage = "";
    try {
      const cleanup = await invoke<AttachmentCleanupResult>("cleanup_orphaned_attachments");
      attachmentCleanupReport = await invoke<AttachmentCleanupReport>("attachment_cleanup_report");
      attachmentCleanupState = "success";
      attachmentCleanupConfirm = false;
      attachmentCleanupMessage = t("attachmentCleanupDone", {
        count: cleanup.removed_files,
        size: formatFileSize(cleanup.removed_bytes)
      });
    } catch (error) {
      attachmentCleanupState = "error";
      attachmentCleanupMessage = t("attachmentCleanupFailed", { error: String(error) });
    }
  }

  async function checkForUpdates() {
    if (!inTauri() || updateState === "checking" || updateState === "downloading") return;
    if (installationRuntime?.kind === "development") {
      updateState = "error";
      updateMessage = t("updateDevelopmentUnavailable");
      return;
    }
    updateState = "checking";
    updateMessage = t("updateChecking");
    updateProgress = 0;
    try {
      availableUpdate?.close();
      availableUpdate = await check({ timeout: 15_000 });
      if (availableUpdate) {
        updateState = "available";
        updateMessage = t("updateAvailable", { version: availableUpdate.version });
      } else {
        updateState = "current";
        updateMessage = t("updateCurrent");
      }
    } catch (error) {
      updateState = "error";
      const details = String(error);
      updateMessage = details.includes("valid release JSON")
        ? t("updateNoPublished")
        : t("updateFailed");
    }
  }

  async function installAvailableUpdate() {
    if (!availableUpdate || updateState === "downloading") return;
    updateState = "downloading";
    updateMessage = t("updateDownloading");
    let downloaded = 0;
    let total = 0;
    try {
      await availableUpdate.download((event) => {
        if (event.event === "Started") total = event.data.contentLength ?? 0;
        if (event.event === "Progress") downloaded += event.data.chunkLength;
        if (total > 0) updateProgress = Math.min(100, Math.round(downloaded / total * 100));
      });
      updateMessage = t("updateRestarting");
      localStorage.setItem(pendingUpdateVersionKey, availableUpdate.version);
      await availableUpdate.install({ restartAfterInstall: true });
    } catch (error) {
      localStorage.removeItem(pendingUpdateVersionKey);
      updateState = "error";
      updateMessage = t("updateInstallFailed", { error: String(error) });
    }
  }

  function reconcilePendingUpdate() {
    const expectedVersion = localStorage.getItem(pendingUpdateVersionKey);
    if (!expectedVersion) return;
    if (installationRuntime?.kind === "development") {
      updateState = "error";
      updateMessage = t("updatePendingInstalledCopy", { version: expectedVersion });
      return;
    }
    if (versionAtLeast(appVersion, expectedVersion)) {
      localStorage.removeItem(pendingUpdateVersionKey);
      updateState = "current";
      updateMessage = t("updateInstalled", { version: appVersion });
      return;
    }
    updateState = "error";
    updateMessage = t("updateVersionMismatch", { expected: expectedVersion, current: appVersion });
  }

  function versionAtLeast(current: string, expected: string) {
    const parse = (value: string) => value.split(".").slice(0, 3).map((part) => Number.parseInt(part, 10));
    const currentParts = parse(current);
    const expectedParts = parse(expected);
    if (currentParts.some(Number.isNaN) || expectedParts.some(Number.isNaN)) return current === expected;
    for (let index = 0; index < 3; index += 1) {
      const currentPart = currentParts[index] ?? 0;
      const expectedPart = expectedParts[index] ?? 0;
      if (currentPart !== expectedPart) return currentPart > expectedPart;
    }
    return true;
  }

  function inTauri() {
    return "__TAURI_INTERNALS__" in window;
  }

  function applySettingsDevPreview() {
    if (!import.meta.env.DEV || inTauri()) return;
    if (new URLSearchParams(window.location.search).get("preview") !== "mcp-readiness") return;
    activeSection = "settings";
    settingsSection = "mcp";
    appVersion = "0.1.4";
    mcpExecutable = "C:\\Program Files\\flood.md\\flood-mcp.exe";
    mcpRuntime = { executable_path: mcpExecutable, launch_command: mcpExecutable, launch_args: [], available: true, version: "0.1.4", app_version: "0.1.4", compatible: true, source: "bundled" };
    storeDiagnostics = { healthy: true, root: "preview", format_version: 1, project_count: 4, linked_chat_count: 2, open_task_count: 12, completed_task_count: 8, trashed_task_count: 1, pending_inbox_count: 5, issues: [] };
    mcpSelfCheck = { passed: true, duration_ms: 34, checks: [
      { name: "Изолированное хранилище", passed: true },
      { name: "Создание, изменение и конфликты", passed: true },
      { name: "Telegram-входящие и защита от дублей", passed: true },
      { name: "MCP-контракты и аннотации безопасности", passed: true }
    ] };
    mcpCheckState = "success";
    mcpActivity = [
      { id: "01JOURNAL03", occurred_at: "2026-09-11T00:04:00Z", source: "mcp", action: "telegram_task_created", entity_kind: "task", entity_id: "01PREVIEWTASK", project_id: "01PREVIEWPROJECT", reversible: true },
      { id: "01JOURNAL02", occurred_at: "2026-09-11T00:03:00Z", source: "mcp", action: "task_completed", entity_kind: "task", entity_id: "01COMPLETEDTASK", project_id: "01PREVIEWPROJECT", reversible: true },
      { id: "01JOURNAL01", occurred_at: "2026-09-11T00:02:00Z", source: "mcp", action: "telegram_sync_requested", entity_kind: "workspace", reversible: false }
    ];
    mcpActivityTotal = mcpActivity.length;
    mcpActivityRemaining = 0;
    attachmentCleanupReport = { total_files: 42, total_bytes: 8_800_000, orphaned_files: 3, orphaned_bytes: 640_000 };
    telegramStatus = { step: "ready", configured: true, managed_credentials: true, account_name: "Олег" };
    telegramSyncState = "partial";
  }

  function applyTelegramDevPreview() {
    if (!import.meta.env.DEV || inTauri()) return;
    const preview = new URLSearchParams(window.location.search).get("preview");
    if (!preview?.startsWith("telegram-")) return;
    telegramInboxOpen = true;
    void tick().then(() => telegramInboxDialog?.focus());
    telegramInboxLoading = preview === "telegram-loading";
    telegramInboxError = preview === "telegram-error" ? t("telegramPreviewError") : "";
    if (preview !== "telegram-inbox" && preview !== "telegram-undo" && preview !== "telegram-history") return;
    telegramInbox = [
      {
        id: "preview-1", project_id: "preview", chat_id: -1001, chat_title: "Команда продукта", message_id: 101,
        text: "@tillwithered собери, пожалуйста, итоговые правки по экрану интеграций и проверь пустые состояния.",
        author: "Анна", sent_at: "2026-09-10T17:42:00Z", reason: "mention", status: "pending", media: [], discovered_at: "2026-09-10T17:42:10Z"
      },
      {
        id: "preview-2", project_id: "preview", chat_id: -1001, chat_title: "Команда продукта", message_id: 102,
        text: "Нужно сверить альбом с референсами и выбрать изображения для первой версии.",
        author: "Илья", sent_at: "2026-09-10T17:31:00Z", reason: "reply", status: "pending",
        media: [{ kind: "photo", file_name: "reference-1.jpg" }, { kind: "photo", file_name: "reference-2.jpg" }], discovered_at: "2026-09-10T17:31:10Z"
      },
      {
        id: "preview-3", project_id: "preview", chat_id: -1002, chat_title: "Личное", message_id: 103,
        text: "Зафиксировать результаты созвона и разнести следующие действия по проектам.",
        author: "Олег", sent_at: "2026-09-10T16:58:00Z", reason: "manual", status: "pending", media: [], discovered_at: "2026-09-10T16:58:10Z"
      }
    ];
    telegramInboxTotal = telegramInbox.length;
    telegramInboxNextCursor = "";
    telegramInboxRemaining = 0;
    if (preview === "telegram-undo") {
      telegramDismissUndo = { ...telegramInbox[0], status: "dismissed", processed_at: new Date().toISOString() };
      telegramInbox = telegramInbox.slice(1);
      telegramInboxTotal = telegramInbox.length;
    } else if (preview === "telegram-history") {
      telegramInboxView = "history";
      telegramInbox = [
        { ...telegramInbox[0], status: "dismissed", processed_at: "2026-09-10T17:49:00Z" },
        {
          ...telegramInbox[1], status: "imported", processed_at: "2026-09-10T17:36:00Z", task_id: "preview-task",
          linked_task: { id: "preview-task", title: "Сверить альбом с референсами", urgency: "important", status: "open", trashed: false }
        }
      ];
      telegramInboxTotal = telegramInbox.length;
    }
  }

  function minimizeWindow() {
    if (inTauri()) void getCurrentWindow().minimize();
  }

  function toggleMaximizeWindow() {
    if (inTauri()) void getCurrentWindow().toggleMaximize();
  }

  async function closeWindow() {
    if (!inTauri() || closingWindow) return;
    if (!await persistCurrentTask()) return;
    closingWindow = true;
    try {
      await getCurrentWindow().destroy();
    } catch (error) {
      closingWindow = false;
      saveState = "error";
      saveError = t("closeAppError", { error: String(error) });
    }
  }

  onMount(() => {
    loadUiPreferences();
    applySettingsDevPreview();
    applyTelegramDevPreview();
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => { if (themePreference === "system") applyTheme(); };
    colorScheme.addEventListener("change", updateSystemTheme);
    document.addEventListener("visibilitychange", catchUpTelegramSync);
    window.addEventListener("focus", catchUpTelegramSync);
    let unlisten: UnlistenFn | undefined;
    let unlistenClose: UnlistenFn | undefined;
    let unlistenTelegram: UnlistenFn | undefined;
    let disposed = false;
    void (async () => {
      if (inTauri()) {
        appVersion = await getVersion();
        installationRuntime = await invoke<InstallationRuntimeInfo>("installation_runtime_info").catch(() => null);
        reconcilePendingUpdate();
        dataDirectory = await invoke<string>("data_directory");
        mcpRuntime = await invoke<McpRuntimeInfo>("mcp_runtime_info").catch(() => null);
        mcpExecutable = mcpRuntime?.executable_path || await invoke<string>("mcp_executable_path");
        if (mcpRuntime && (!mcpRuntime.available || !mcpRuntime.compatible)) mcpCheckState = "error";
        storeDiagnostics = await invoke<StoreDiagnostics>("diagnose_store").catch(() => null);
        applyTelegramSyncStatus(await invoke<TelegramSyncStatus | null>("telegram_sync_status").catch(() => null));
        await refreshTelegramSyncRequest();
        await applyTelegramStatus(await invoke<TelegramStatus>("telegram_status"));
        unlistenTelegram = await listen<TelegramStatus>("telegram-status", (event) => void applyTelegramStatus(event.payload));
        unlistenClose = await getCurrentWindow().onCloseRequested(async (event) => {
          if (closingWindow) return;
          event.preventDefault();
          await closeWindow();
        });
      }
      await loadData(false);
      if (disposed || !inTauri()) return;
      if (telegramStatus.step === "ready") {
        void syncTelegram();
      }
      telegramScanTimer = window.setInterval(() => {
        if (telegramStatus.step === "ready") void syncTelegram();
      }, 120_000);
      telegramRequestTimer = window.setInterval(() => {
        void refreshTelegramSyncRequest().then((request) => {
          if (request && telegramStatus.step === "ready") void syncTelegram();
        });
      }, 3_000);
      unlisten = await listen<string[]>("data-changed", (event) => {
        const changedPaths = event.payload.map((path) => path.toLocaleLowerCase());
        const telegramSyncRequested = changedPaths.some((path) => path.includes("telegram-sync-request"));
        if (activeSection === "settings" && settingsSection === "mcp" && changedPaths.some((path) => path.endsWith("activity.json"))) void loadMcpActivity();
        if (telegramSyncRequested) {
          void refreshTelegramSyncRequest();
          if (telegramStatus.step === "ready") void syncTelegram();
        } else if (telegramStatus.step === "ready" && changedPaths.some((path) => path.endsWith(".md"))) void syncTelegram(false);
        window.clearTimeout(refreshTimer);
        refreshTimer = window.setTimeout(() => {
          if (!draftTaskId && dataActionState !== "restoring" && saveState !== "saving" && markdown === lastSavedMarkdown) void loadData(true);
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
      if (!target?.closest(".task-actions-menu") && !target?.closest(".task-actions-trigger")) {
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
      window.clearInterval(telegramScanTimer);
      window.clearInterval(telegramRequestTimer);
      window.clearTimeout(telegramSearchTimer);
      window.clearTimeout(telegramDismissUndoTimer);
      window.removeEventListener("blur", flush);
      document.removeEventListener("pointerdown", closeMenus);
      colorScheme.removeEventListener("change", updateSystemTheme);
      document.removeEventListener("visibilitychange", catchUpTelegramSync);
      window.removeEventListener("focus", catchUpTelegramSync);
      for (const url of attachmentObjectUrls) URL.revokeObjectURL(url);
      clearSourceMediaPreviews();
      unlisten?.();
      unlistenClose?.();
      unlistenTelegram?.();
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
  <div class:link-open={linkEditorOpen} class="selection-toolbar" style:left={`${selectionToolbar.left}px`} style:top={`${selectionToolbar.top}px`} role="toolbar" tabindex="-1" aria-label={t("formatting")}>
    <div class="selection-toolbar-actions" role="group" aria-label={t("textStyle")} onpointerdown={(event) => event.preventDefault()}>
      <button aria-label={t("largeHeading")} title={t("large")} onclick={applyLargeHeading}><Heading1 size={15} /></button>
      <button aria-label={t("bold")} title={t("bold")} onclick={() => applyInlineFormat("bold")}><Bold size={14} /></button>
      <button aria-label={t("underline")} title={t("underline")} onclick={() => applyInlineFormat("underline")}><Underline size={14} /></button>
      <span></span>
      <button class:active={linkEditorOpen} aria-label={t("addLink")} title={t("addLink")} onclick={linkSelectionFromClipboard}><Link size={14} /></button>
    </div>
    {#if linkEditorOpen}
      <form class="selection-link-form" onsubmit={submitSelectionLink}>
        <input bind:value={linkDraft} inputmode="url" aria-label={t("linkAddress")} placeholder="https://…" />
        <button aria-label={t("applyLink")}><Check size={14} /></button>
      </form>
    {/if}
  </div>
{/if}

{#if commandPaletteOpen}
  <div class="command-palette-backdrop" role="presentation" onclick={(event) => { if (event.target === event.currentTarget) closeCommandPalette(); }}>
    <div class="command-palette" role="dialog" aria-modal="true" aria-label={t("commandPalette")} tabindex="-1" onkeydown={trapModalFocus}>
      <header class="command-palette-search">
        <Search size={18} aria-hidden="true" />
        <input bind:this={commandInput} value={commandQuery} aria-label={t("commandSearch")} aria-controls="command-results" aria-activedescendant={commandResults[commandActiveIndex] ? `command-${commandResults[commandActiveIndex].id.replaceAll(":", "-")}` : undefined} placeholder={t("commandSearchPlaceholder")} oninput={(event) => updateCommandQuery(event.currentTarget.value)} onkeydown={handleCommandKeydown} />
        <kbd>Esc</kbd>
      </header>
      <div id="command-results" class="command-results" role="listbox" aria-label={t("commandResults")}>
        {#each commandResults as item, index (item.id)}
          {#if index === 0 || commandResults[index - 1].group !== item.group}<small class="command-group-label">{commandGroupLabel(item.group)}</small>{/if}
          <button id={`command-${item.id.replaceAll(":", "-")}`} class:active={commandActiveIndex === index} role="option" aria-selected={commandActiveIndex === index} onmouseenter={() => (commandActiveIndex = index)} onclick={() => executeCommand(item)}>
            <i>
              {#if item.group === "tasks"}<FloodGlyph kind={item.completed ? "completed" : item.urgency || "normal"} size={15} />
              {:else if item.group === "projects"}<Folder size={16} />
              {:else if item.id === "action:new-task"}<Plus size={16} />
              {:else if item.id === "action:inbox"}<MessageSquareText size={16} />
              {:else if item.id === "action:all-tasks"}<ListTodo size={16} />
              {:else if item.id === "action:integrations"}<Plug size={16} />
              {:else if item.id === "action:mcp"}<Bot size={16} />
              {:else}<Database size={16} />{/if}
            </i>
            <span><strong>{item.title}</strong>{#if item.meta}<small>{item.meta}</small>{/if}</span>
            {#if commandActiveIndex === index}<kbd>↵</kbd>{/if}
          </button>
        {:else}
          <div class="command-empty"><Search size={20} /><strong>{t("nothingFound")}</strong><small>{t("commandEmptyDescription")}</small></div>
        {/each}
      </div>
      <footer><span><kbd>↑</kbd><kbd>↓</kbd>{t("navigate")}</span><span><kbd>↵</kbd>{t("open")}</span><span><kbd>Esc</kbd>{t("close")}</span></footer>
    </div>
  </div>
{/if}

<main class:sidebar-collapsed={sidebarCollapsed} class="app-shell">
  <header class="window-bar" data-tauri-drag-region="deep">
    <div class="sidebar-titlebar" data-tauri-drag-region="deep">
      {#if !sidebarCollapsed}<FloodGlyph kind="brand" size={22} /><strong>flood.md</strong>{/if}
      <button class="icon-button collapse-button" aria-label={sidebarCollapsed ? t("expandSidebar") : t("collapseSidebar")} data-tauri-drag-region="false" onclick={() => setSidebarCollapsed(!sidebarCollapsed)}>
        {#if sidebarCollapsed}<PanelLeftOpen size={17} />{:else}<PanelLeftClose size={17} />{/if}
      </button>
    </div>
    <div class="window-context" data-tauri-drag-region="deep">
      {#if activeSection === "tasks"}
        {#if workspaceView === "task" && selectedTask}
          <button class="window-context-back" aria-label={t("backToProject", { project: selectedTask.chat })} title={`${t("backToProject", { project: selectedTask.chat })} · Alt+←`} onclick={backToProject}><ChevronLeft size={14} /><span>{selectedTask.chat}</span></button>
        {:else}
          <span>{currentChat.title}</span>
        {/if}
      {:else}
        <span>{activeSection === "trash" ? t("trash") : t("settings")}</span>
      {/if}
    </div>
    <div class="window-actions" data-tauri-drag-region="false">
      {#if activeSection === "tasks" && workspaceView === "task" && selectedTask}
        {#if saveState === "error" && hasUnsavedTaskChanges()}
          <button class="save-state save-retry" title={`${t("retrySave")}: ${saveError}`} aria-label={t("retrySave")} onclick={() => void saveNow()}><RefreshCw size={12} /><span class="save-retry-label">{t("notSaved")}</span></button>
        {:else}
          <span class="save-state" title={saveError}>{saveState === "saving" ? t("saving") : saveState === "saved" ? t("saved") : ""}</span>
        {/if}
        <div class="urgency-menu topbar-urgency">
          <button class="urgency-trigger" aria-label={t("urgency", { value: urgencyTitle(selectedTask.urgency) })} title={t("urgency", { value: urgencyTitle(selectedTask.urgency) })} aria-haspopup="menu" aria-expanded={urgencyMenuOpen} onclick={() => { urgencyMenuOpen = !urgencyMenuOpen; sourceEditorOpen = false; taskActionMenuOpen = false; }}><FloodGlyph kind={selectedTask.urgency} size={14} /><span class="action-label">{urgencyTitle(selectedTask.urgency)}</span><ChevronDown size={12} /></button>
          {#if urgencyMenuOpen}
            <div class="urgency-options" role="menu">
              {#each (["normal", "important", "urgent"] as Urgency[]) as urgency}
                <button class:selected={selectedTask.urgency === urgency} role="menuitem" onclick={() => changeUrgency(urgency)}><FloodGlyph kind={urgency} size={14} /><span>{urgencyTitle(urgency)}</span>{#if selectedTask.urgency === urgency}<Check size={14} />{/if}</button>
              {/each}
            </div>
          {/if}
        </div>
        <input class="attachment-input" bind:this={attachmentInput} type="file" multiple accept="image/*,audio/*,video/*,.pdf,.txt,.md" onchange={(event) => void importAttachments([...(event.currentTarget.files ?? [])])} />
        <button class="topbar-action" aria-label={t("addAttachment")} title={t("attachmentTitle")} onclick={() => attachmentInput.click()}><Paperclip size={15} /><span class="action-label">{t("attachment")}</span></button>
        <button class:active={sourceEditorOpen} class="topbar-action source-action-button" aria-label={selectedTask.hasSource ? t("source") : t("addSource")} title={selectedTask.hasSource ? t("source") : t("addSource")} aria-expanded={sourceEditorOpen} onclick={openSourceEditor}><MessageSquareText size={15} /><span class="action-label">{selectedTask.hasSource ? t("source") : t("addSource")}</span></button>
        {#if sourceEditorOpen}
          <form class="source-editor source-popover" onsubmit={saveSource}>
            <div class="source-popover-head"><strong>{selectedTask.hasSource ? t("taskSource") : t("addSource")}</strong><button type="button" class="icon-button" aria-label={t("close")} onclick={() => (sourceEditorOpen = false)}><X size={14} /></button></div>
            <label class="source-message"><span>{t("message")}</span><textarea bind:value={sourceText} rows="4" placeholder={t("sourcePlaceholder")}></textarea></label>
            <div class="source-detail-row"><span>{t("author")}</span><input bind:value={sourceAuthor} placeholder={t("notSpecified")} /></div>
            <div class="source-detail-row date-picker-wrap">
              <span>{t("date")}</span>
              <button type="button" class="source-date-button" aria-expanded={datePickerOpen} onclick={openDatePicker}><CalendarDays size={15} /><span>{sourceDateLabel(sourceSentAt)}</span><ChevronDown size={12} /></button>
              {#if datePickerOpen}
                <div class="date-picker">
                  <div class="date-picker-head"><button type="button" aria-label={t("previousMonth")} onclick={() => changeCalendarMonth(-1)}><ChevronLeft size={15} /></button><strong>{calendarTitle(calendarMonth)}</strong><button type="button" aria-label={t("nextMonth")} onclick={() => changeCalendarMonth(1)}><ChevronRight size={15} /></button></div>
                  <div class="calendar-weekdays">{#each (locale === "ru" ? ["пн", "вт", "ср", "чт", "пт", "сб", "вс"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) as day}<span>{day}</span>{/each}</div>
                  <div class="calendar-grid">
                    {#each calendarDays(calendarMonth) as day (day.date.toISOString())}
                      <button type="button" class:outside={!day.currentMonth} class:selected={isSelectedSourceDay(day.date, sourceSentAt)} class:today={sameCalendarDay(day.date, new Date())} onclick={() => setSourceDate(day.date)}>{day.date.getDate()}</button>
                    {/each}
                  </div>
                  <div class="date-picker-footer"><button type="button" class="today-button" onclick={() => { const today = new Date(); calendarMonth = new Date(today.getFullYear(), today.getMonth(), 1); setSourceDate(today); }}>{t("today")}</button><div class="time-fields"><input bind:value={sourceHour} inputmode="numeric" maxlength="2" aria-label={t("hours")} onblur={updateSourceTime} /><span>:</span><input bind:value={sourceMinute} inputmode="numeric" maxlength="2" aria-label={t("minutes")} onblur={updateSourceTime} /></div></div>
                </div>
              {/if}
            </div>
            <div class="source-detail-row"><span>{t("link")}</span><input bind:value={sourceUrl} type="url" placeholder={t("notSpecified")} /></div>
            {#if formError}<p class="form-error">{formError}</p>{/if}
            <div class="form-actions">{#if selectedTask.hasSource}<button type="button" class="danger-text" onclick={clearSource}>{t("delete")}</button>{/if}<span></span><button type="button" onclick={() => (sourceEditorOpen = false)}>{t("cancel")}</button><button>{t("save")}</button></div>
          </form>
        {/if}
        <button class:completed={selectedTask.completed} class="complete-button" aria-label={selectedTask.completed ? t("restoreTask") : t("completeTask")} title={selectedTask.completed ? t("restoreTask") : t("completeTask")} onclick={toggleComplete}>{#if selectedTask.completed}<CheckCircle2 size={17} />{:else}<Circle size={17} />{/if}<span class="action-label">{selectedTask.completed ? t("completed") : t("complete")}</span></button>
        <button class="icon-button task-actions-trigger" aria-label={t("otherActions")} title={t("otherActions")} aria-expanded={taskActionMenuOpen} onclick={() => { taskActionMenuOpen = !taskActionMenuOpen; moveMenuOpen = false; urgencyMenuOpen = false; sourceEditorOpen = false; }}><MoreHorizontal size={18} /></button>
        {#if taskActionMenuOpen}
          <div class:move-open={moveMenuOpen} class="task-actions-menu">
            {#if moveMenuOpen}
              <button class="menu-back" onclick={() => (moveMenuOpen = false)}><ChevronRight size={14} />{t("moveTo")}</button>
              {#each chats.slice(1) as chat}
                <button disabled={chat.id === selectedTask.chatId} onclick={() => moveSelectedTask(chat)}><Folder size={15} /><span>{chat.title}</span>{#if chat.id === selectedTask.chatId}<Check size={14} />{/if}</button>
              {/each}
            {:else}
              <button onclick={() => (moveMenuOpen = true)}><ArrowRight size={15} /><span>{t("move")}</span><ChevronRight size={14} /></button>
              <button class="danger" onclick={trashSelectedTask}><Trash2 size={15} /><span>{t("moveToTrash")}</span></button>
            {/if}
          </div>
        {/if}
        <span class="window-divider" aria-hidden="true"></span>
      {/if}
      <div class="window-controls">
        <button aria-label={t("minimize")} onclick={minimizeWindow}><Minus size={15} strokeWidth={1.6} /></button>
        <button aria-label={t("maximize")} onclick={toggleMaximizeWindow}><Square size={12} strokeWidth={1.6} /></button>
        <button class="window-close" aria-label={t("close")} onclick={closeWindow}><X size={16} strokeWidth={1.6} /></button>
      </div>
    </div>
  </header>

  <div class="app-content">
    <aside class:collapsed={sidebarCollapsed} class="sidebar-panel" aria-label={t("navigation")}>
      <div class="sidebar-primary">
        <button class="new-task-button" aria-label={t("newTask")} aria-expanded={newTaskMenuAnchor === "sidebar"} onclick={() => requestNewTask("sidebar")}><Plus size={17} /><span>{t("newTask")}</span></button>
        {#if newTaskMenuAnchor === "sidebar" && !sidebarCollapsed}
          <div class="new-task-menu">
            <small>{t("chooseProject")}</small>
            {#each chats.slice(1) as chat}<button title={chat.title} onclick={() => createDraft(chat)}><Folder size={15} /><span>{chat.title}</span></button>{/each}
          </div>
        {/if}
        {#if sidebarCollapsed}
          <button class="sidebar-icon" aria-label={t("search")} onclick={() => setSidebarCollapsed(false)}><Search size={17} /></button>
        {:else}
          <div class="search-field"><Search size={15} aria-hidden="true" /><input bind:this={searchInput} bind:value={query} aria-label={t("searchTasks")} placeholder={t("search")} />{#if searchActive}<button class="search-clear" aria-label={t("clearSearch")} title={t("clearSearch")} onclick={() => (query = "")}><X size={14} /></button>{:else}<button class="command-shortcut" aria-label={t("openCommandPalette")} title={t("openCommandPalette")} onclick={openCommandPalette}><kbd>Ctrl K</kbd></button>{/if}</div>
        {/if}
      </div>

      <nav class="sidebar-navigation" aria-label={t("projectsAndTasks")}>
        {#if searchActive && !sidebarCollapsed}
          <div class="sidebar-search-results" aria-label={t("searchResults")}>
            {#each sidebarSearchGroups as group (group.chat.id)}
              <section class="sidebar-search-group">
                <button class="search-project-result" onclick={() => selectChat(group.chat)}><Folder size={15} /><span>{group.chat.title}</span><small>{group.tasks.length}</small></button>
                {#each group.tasks as task (task.id)}
                  <button class:selected={workspaceView === "task" && selectedTaskId === task.id} class="nested-task" onclick={() => openTask(task)}><FloodGlyph kind={task.completed ? "completed" : task.urgency} size={14} /><span>{task.title}</span></button>
                {/each}
              </section>
            {:else}
              <div class="sidebar-search-empty"><Search size={15} /><span>{t("nothingFound")}</span></div>
            {/each}
          </div>
        {:else}
          <div class:active={activeSection === "tasks" && selectedChatId === "all"} class="project-row all-tasks-row">
            <button class="project-open" onclick={() => chats[0] && selectChat(chats[0])} onmouseenter={(event) => showSidebarProjectHint(event, t("allTasks"))} onmouseleave={hideSidebarProjectHint} onfocus={(event) => showSidebarProjectHint(event, t("allTasks"))} onblur={hideSidebarProjectHint} aria-label={t("openAllTasks")}>
              <ListTodo size={17} /><span>{t("allTasks")}</span><small>{tasks.filter((task) => !isLocalDraft(task) && !task.completed).length}</small>
            </button>
            {#if !sidebarCollapsed}
              <button type="button" class:expanded={allTasksExpanded} class="project-expand" aria-expanded={allTasksExpanded} onclick={toggleAllTasks} aria-label={allTasksExpanded ? t("collapseAllTasks") : t("expandAllTasks")}><ChevronRight size={13} /></button>
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
                <button class="project-open" onclick={() => selectChat(chat)} onmouseenter={(event) => showSidebarProjectHint(event, chat.title)} onmouseleave={hideSidebarProjectHint} onfocus={(event) => showSidebarProjectHint(event, chat.title)} onblur={hideSidebarProjectHint} aria-label={t("openProject", { project: chat.title })}>
                  <Folder size={16} /><span>{chat.title}</span><small>{openTaskCount(chat.id) || ""}</small>
                </button>
                {#if !sidebarCollapsed}
                  <button type="button" class:expanded={expandedChatIds.includes(chat.id)} class="project-expand" aria-expanded={expandedChatIds.includes(chat.id)} onclick={() => toggleChat(chat.id)} aria-label={expandedChatIds.includes(chat.id) ? t("collapseProject", { project: chat.title }) : t("expandProject", { project: chat.title })}><ChevronRight size={13} /></button>
                {/if}
              </div>
              {#if !sidebarCollapsed && expandedChatIds.includes(chat.id)}
                <div class="nested-tasks">
                  {#each tasksForChat(chat) as task}
                    <button class:selected={workspaceView === "task" && selectedTaskId === task.id} class="nested-task" onclick={() => openTask(task)}><FloodGlyph kind={task.completed ? "completed" : task.urgency} size={14} /><span>{task.title}</span></button>
                  {:else}<span class="nested-empty">{t("noOpenTasks")}</span>{/each}
                </div>
              {/if}
            </div>
          {/each}
        {/if}

        {#if !sidebarCollapsed}
          {#if createChatOpen}
            <form class="create-chat-form" onsubmit={submitCreateChat}>
              <FolderPlus size={15} />
              <input bind:value={createChatTitle} aria-label={t("projectName")} placeholder={t("projectName")} />
              <button aria-label={t("create")}><Check size={14} /></button>
              <button type="button" aria-label={t("cancel")} onclick={() => { createChatOpen = false; createChatTitle = ""; }}><X size={14} /></button>
            </form>
          {:else}
            <button class="sidebar-row add-chat-row" onclick={() => (createChatOpen = true)}><FolderPlus size={16} /><span>{t("newProject")}</span></button>
          {/if}
        {/if}

        <button class:active={activeSection === "trash"} class="sidebar-row trash-row" onclick={() => changeSection("trash")} title={t("trash")}><Trash2 size={16} /><span>{t("trash")}</span><small>{trashedTasks.length || ""}</small></button>
      </nav>

      <nav class="sidebar-footer" aria-label={t("systemSections")}>
        <button class:active={activeSection === "settings"} class="sidebar-row" onclick={() => changeSection("settings")} title={t("settings")}><Settings size={17} /><span>{t("settings")}</span></button>
      </nav>
    </aside>

    {#if activeSection === "tasks" && workspaceView === "task" && selectedTask}
      <section class="workspace">
        <div class="editor-page">
          <div class="task-meta" aria-label={t("taskMetadata")}>
            <span class="task-project-meta" title={selectedTask.chat}>{selectedTask.chat}</span>
            <span title={fullDate(selectedTask.createdAt)}>{t("created", { date: compactDate(selectedTask.createdAt) })}</span>
            <span class="source-meta" title={taskSourceLabel(selectedTask)}><FloodGlyph kind="info" size={13} /><span class="source-meta-label">{taskSourceMetaLabel(selectedTask)}</span></span>
            {#if selectedTask.source?.url}<a href={selectedTask.source.url} target="_blank" rel="noreferrer">{t("openMessage")}</a>{/if}
          </div>
          {#if conflictRemote}
            <div class="save-conflict" role="alert">
              <span><strong>{t("externalChange")}</strong> {t("chooseVersion")}</span>
              <div><button onclick={useDiskVersion}>{t("diskVersion")}</button><button onclick={keepLocalVersion}>{t("localVersion")}</button></div>
            </div>
          {/if}
          <div class:draft-editor={selectedTaskId === draftTaskId} class="editor" bind:this={editorRoot} contenteditable="true" role="textbox" tabindex="0" aria-multiline="true" aria-label={t("taskEditor")} spellcheck="true" oninput={syncEditor} onkeydown={handleEditorKeydown} onpaste={handleEditorPaste} ondrop={handleEditorDrop} ondragover={(event) => event.preventDefault()} onpointerup={updateSelectionToolbar} onkeyup={() => { updateHint(currentBlock()); updateSelectionToolbar(); }} onclick={handleEditorClick} onblur={() => { editorHint = null; clearAttachmentSelection(); void saveNow(); }}></div>
          {#if selectedTask.source}
            <button class="source-snapshot" aria-haspopup="dialog" onclick={openSourceViewer}>
              <FloodGlyph kind="info" size={18} />
              <span><strong>{selectedTask.source.chat_title || t("sourceMessage")}</strong><small>{selectedTask.source.author || t("notSpecified")}{selectedTask.source.sent_at ? ` · ${fullDate(selectedTask.source.sent_at)}` : ""}</small></span>
              <span class="source-snapshot-action">{selectedTask.source.media?.length ? t("mediaCount", { count: selectedTask.source.media.length }) : t("viewSource")}<ChevronRight size={14} /></span>
            </button>
          {/if}
        </div>
      </section>
    {:else if activeSection === "tasks"}
      <section class="workspace project-workspace">
        <div class="project-page">
          {#if loadError}<div class="data-error"><strong>{t("dataOpenError")}</strong><span>{loadError}</span></div>{/if}
          <header class="project-header">
            <div>
              {#if renameChatOpen}
                <form class="rename-chat-form" onsubmit={submitRenameChat}><input bind:value={renameChatTitle} aria-label={t("projectName")} /><button aria-label={t("save")}><Check size={16} /></button><button type="button" aria-label={t("cancel")} onclick={() => (renameChatOpen = false)}><X size={16} /></button></form>
                {#if formError}<span class="form-error">{formError}</span>{/if}
              {:else}
                <div class="project-title-row">
                  <h1>{currentChat.title}</h1>
                  {#if currentChat.id !== "all"}
                    <button class="icon-button" aria-label={t("renameProject")} onclick={startRenameChat}><Pencil size={15} /></button>
                    <button class="icon-button danger-icon" aria-label={t("deleteProject")} onclick={() => (deleteChatConfirmOpen = true)}><Trash2 size={15} /></button>
                  {/if}
                </div>
              {/if}
              <p>{loading ? t("loadingTasks") : openTasksLabel(currentOpenTasks.length)}</p>
            </div>
            <div class="project-header-actions">
              {#if currentChat.id === "all" && telegramStatus.step === "ready"}
                <button class="project-add-button inbox-button" onclick={() => openTelegramInbox(false)}><MessageSquareText size={15} />{t("inbox")}</button>
              {/if}
              {#if currentChat.id !== "all" && currentChat.telegram_chats.length}
                <button class="project-add-button inbox-button" onclick={() => openTelegramInbox(false)}><MessageSquareText size={15} />{t("inbox")}</button>
                <button class="project-add-button telegram-import-button" title={t("importFromTelegramChat", { chat: currentChat.telegram_chats[0].title })} onclick={openTelegramImporter}><Send size={15} />{t("fromTelegram")}</button>
              {/if}
              <button class="project-add-button" aria-expanded={newTaskMenuAnchor === "workspace"} onclick={() => requestNewTask("workspace")}><Plus size={16} />{t("newTask")}</button>
              {#if newTaskMenuAnchor === "workspace"}
                <div class="new-task-menu workspace-new-task-menu">
                  <small>{t("chooseProject")}</small>
                  {#each chats.slice(1) as chat}<button title={chat.title} onclick={() => createDraft(chat)}><Folder size={15} /><span>{chat.title}</span></button>{/each}
                </div>
              {/if}
            </div>
          </header>

          {#if deleteChatConfirmOpen}
            <div class="destructive-confirm project-delete-confirm" role="alert">
              <span class="confirm-glyph"><FloodGlyph kind="urgent" size={40} motion="pop" label={t("deleteProject")} /></span>
              <span class="confirm-copy"><strong>{t("deleteProjectQuestion", { project: currentChat.title })}</strong><small>{t("deleteProjectWarning")}</small></span>
              <div class="confirm-actions"><button onclick={() => (deleteChatConfirmOpen = false)}>{t("cancel")}</button><button class="danger-button" onclick={deleteCurrentChat}>{t("delete")}</button></div>
            </div>
          {/if}

          {#if selectedChatId === "all"}
            {#if currentOpenTasks.length}
              <div class="project-groups">
                {#each chats.slice(1) as chat}
                  {@const chatTasks = currentOpenTasks.filter((task) => task.chatId === chat.id)}
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
              <div class="project-empty"><p>{t("noOpenTasks")}</p></div>
            {/if}
          {:else}
            <div class="project-task-list standalone">
              {#each currentOpenTasks as task}
                <button class="project-task" onclick={() => openTask(task)}>
                  <FloodGlyph kind={task.urgency} size={14} />
                  <span class="project-task-copy"><strong>{task.title}</strong><small>{task.updated}{task.urgency !== "normal" ? ` · ${t(task.urgency === "urgent" ? "urgentShort" : "importantShort")}` : ""}</small></span>
                  <ChevronRight size={15} />
                </button>
              {:else}
                <div class="project-empty"><p>{t("noOpenTasks")}</p><button onclick={() => requestNewTask("workspace")}>{t("addTask")}</button></div>
              {/each}
            </div>
          {/if}

          {#if currentCompletedTasks.length}
            <section class="completed-group">
              <button class="completed-toggle" onclick={() => (completedGroupOpen = !completedGroupOpen)}>
                {#if completedGroupOpen}<ChevronDown size={14} />{:else}<ChevronRight size={14} />{/if}
                <span>{t("completedGroup")}</span><small>{currentCompletedTasks.length}</small>
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
            <div><h1>{t("trash")}</h1><p>{t("trashDescription")}</p></div>
            {#if trashedTasks.length}<button class="quiet-danger-button" onclick={() => (emptyTrashConfirmOpen = true)}><Trash2 size={14} />{t("clear")}</button>{/if}
          </header>
          {#if emptyTrashConfirmOpen}
            <div class="destructive-confirm" role="alert">
              <span class="confirm-copy"><strong>{t("clearTrashQuestion")}</strong><small>{t("clearTrashWarning")}</small></span>
              <div class="confirm-actions"><button onclick={() => (emptyTrashConfirmOpen = false)}>{t("cancel")}</button><button class="danger-button" onclick={emptyTrash}>{t("deleteAll")}</button></div>
            </div>
          {/if}
          <div class="project-task-list standalone">
            {#each trashedTasks as task}
              <div class="project-task trash-task">
                <Trash2 size={16} />
                <span class="project-task-copy"><strong>{task.title}</strong><small>{task.chat}{task.trashedAt ? ` · ${t("deletedAgo", { date: relativeDate(task.trashedAt) })}` : ""}</small></span>
                <span class="trash-actions">
                  {#if purgeTaskId === task.id}
                    <button onclick={() => (purgeTaskId = "")}>{t("cancel")}</button><button class="danger-text" onclick={() => deleteTrashedTask(task)}>{t("delete")}</button>
                  {:else}
                    <button class="restore-button" onclick={() => restoreTask(task)}><RotateCcw size={14} />{t("restore")}</button>
                    <button class="trash-delete-button" aria-label={t("deleteForever")} title={t("deleteForever")} onclick={() => (purgeTaskId = task.id)}><Trash2 size={14} /></button>
                  {/if}
                </span>
              </div>
            {:else}
              <div class="project-empty"><p>{t("emptyTrash")}</p></div>
            {/each}
          </div>
        </div>
      </section>
    {:else}
      <section class="workspace settings-workspace">
        <div class="settings-page">
          <header class="settings-header"><h2>{t("settings")}</h2><p>{t("settingsDescription")}</p></header>
          <div class="settings-layout">
            <nav class="settings-nav" aria-label={t("settingsSections")}>
              <button class:active={settingsSection === "general"} aria-current={settingsSection === "general" ? "page" : undefined} onclick={() => openSettingsSection("general")}><Settings size={16} />{t("general")}</button>
              <button class:active={settingsSection === "appearance"} aria-current={settingsSection === "appearance" ? "page" : undefined} onclick={() => openSettingsSection("appearance")}><Palette size={16} />{t("appearance")}</button>
              <button class:active={settingsSection === "data"} aria-current={settingsSection === "data" ? "page" : undefined} onclick={() => openSettingsSection("data")}><Database size={16} />{t("data")}</button>
              <button class:active={settingsSection === "integrations"} aria-current={settingsSection === "integrations" ? "page" : undefined} onclick={() => openSettingsSection("integrations")}><Plug size={16} />{t("integrations")} <span class:connected={telegramStatus.step === "ready"} class:error={["database_error", "error"].includes(telegramStatus.step) || ["partial", "error"].includes(telegramSyncState)} class="integration-chip">{["database_error", "error"].includes(telegramStatus.step) || ["partial", "error"].includes(telegramSyncState) ? "!" : telegramStatus.step === "ready" ? "1" : "·"}</span></button>
              <button class:active={settingsSection === "mcp"} aria-current={settingsSection === "mcp" ? "page" : undefined} onclick={() => openSettingsSection("mcp")}><Bot size={16} />{t("mcpAndAi")} <span class:connected={mcpCheckState === "success"} class:error={mcpCheckState === "error"} class="integration-chip">{mcpCheckState === "success" ? "✓" : "·"}</span></button>
              <button class:active={settingsSection === "about"} aria-current={settingsSection === "about" ? "page" : undefined} onclick={() => openSettingsSection("about")}><Info size={16} />{t("about")}</button>
            </nav>
            <div class="settings-content">
              {#if settingsSection === "general"}
                <section class="settings-section">
                  <div class="settings-section-title"><h3>{t("general")}</h3><p>{t("generalDescription")}</p></div>
                  {#if setupCompleted < 2}
                    <div class="setup-guide" aria-label={t("gettingStarted")}>
                      <header><span><strong>{t("gettingStarted")}</strong><small>{t("setupProgress", { completed: setupCompleted, total: 2 })}</small></span><div class="setup-progress" aria-hidden="true"><span class:complete={setupHasProject}></span><span class:complete={setupHasTask}></span></div></header>
                      <div class="setup-steps">
                        <span class:complete={setupHasProject}><FloodGlyph kind={setupHasProject ? "completed" : "normal"} size={15} /><span><strong>{t("setupProject")}</strong><small>{t("setupProjectDescription")}</small></span></span>
                        <span class:complete={setupHasTask}><FloodGlyph kind={setupHasTask ? "completed" : "normal"} size={15} /><span><strong>{t("setupFirstTask")}</strong><small>{t("setupFirstTaskDescription")}</small></span></span>
                      </div>
                      <button onclick={continueInitialSetup}>{setupHasProject ? t("addFirstTask") : t("createFirstProject")}<ArrowRight size={14} /></button>
                    </div>
                  {/if}
                  <div class="setting-static"><span><Languages size={16} /><span><strong>{t("language")}</strong><small>{t("interfaceLanguage")}</small></span></span><div class="language-picker" aria-label={t("interfaceLanguage")}><button class:active={locale === "ru"} aria-pressed={locale === "ru"} onclick={() => setLocale("ru")}>{t("russian")}</button><button class:active={locale === "en"} aria-pressed={locale === "en"} onclick={() => setLocale("en")}>{t("english")}</button></div></div>
                  <button class:active={showCompleted} class="setting-row" role="switch" aria-checked={showCompleted} onclick={toggleCompletedVisibility}><span><ListTodo size={16} /><span><strong>{t("showCompleted")}</strong><small>{t("showCompletedDescription")}</small></span></span><span class="switch"><span></span></span></button>
                </section>
              {:else if settingsSection === "appearance"}
                <section class="settings-section">
                  <div class="settings-section-title"><h3>{t("appearance")}</h3><p>{t("appearanceDescription")}</p></div>
                  <div class="settings-control"><strong>{t("theme")}</strong><div class="theme-picker" aria-label={t("interfaceTheme")}><button class:active={themePreference === "system"} aria-pressed={themePreference === "system"} onclick={() => setTheme("system")}>{t("systemTheme")}</button><button class:active={themePreference === "light"} aria-pressed={themePreference === "light"} onclick={() => setTheme("light")}>{t("lightTheme")}</button><button class:active={themePreference === "dark"} aria-pressed={themePreference === "dark"} onclick={() => setTheme("dark")}>{t("darkTheme")}</button></div></div>
                  <button class:active={reduceMotion} class="setting-row" role="switch" aria-checked={reduceMotion} onclick={toggleMotionPreference}><span><span><strong>{t("reduceMotion")}</strong><small>{t("reduceMotionDescription")}</small></span></span><span class="switch"><span></span></span></button>
                </section>
              {:else if settingsSection === "data"}
                <section class="settings-section">
                  <div class="settings-section-title"><h3>{t("data")}</h3><p>{t("dataDescription")}</p></div>
                  <div class="data-location"><span><FolderOpen size={17} /><span><strong>{t("tasksFolder")}</strong><code>{dataDirectory || t("availableInApp")}</code></span></span><button onclick={openDataDirectory} disabled={!dataDirectory}>{t("open")}</button></div>
                  <div class="data-location attachment-cleanup-row">
                    <span><Paperclip size={17} /><span><strong>{t("unusedAttachments")}</strong><small>{#if attachmentCleanupState === "checking"}{t("checkingAttachments")}{:else if attachmentCleanupReport}{attachmentCleanupReport.orphaned_files ? t("attachmentCleanupSummary", { count: attachmentCleanupReport.orphaned_files, size: formatFileSize(attachmentCleanupReport.orphaned_bytes) }) : t("attachmentsHealthy")}{:else}{t("unusedAttachmentsDescription")}{/if}</small></span></span>
                    {#if attachmentCleanupReport?.orphaned_files}
                      <button class="danger-text" onclick={() => (attachmentCleanupConfirm = true)} disabled={attachmentCleanupState === "checking" || attachmentCleanupState === "cleaning"}><Trash2 size={14} />{t("cleanAttachments")}</button>
                    {:else}
                      <button onclick={loadAttachmentCleanupReport} disabled={attachmentCleanupState === "checking" || attachmentCleanupState === "cleaning"}><RefreshCw class={attachmentCleanupState === "checking" ? "spinning" : ""} size={14} />{t("checkAttachments")}</button>
                    {/if}
                  </div>
                  {#if attachmentCleanupConfirm && attachmentCleanupReport?.orphaned_files}
                    <div class="restore-confirm attachment-cleanup-confirm" role="alert">
                      <FloodGlyph kind="important" size={32} />
                      <span><strong>{t("attachmentCleanupQuestion", { count: attachmentCleanupReport.orphaned_files, size: formatFileSize(attachmentCleanupReport.orphaned_bytes) })}</strong><small>{t("attachmentCleanupWarning")}</small></span>
                      <div><button onclick={() => (attachmentCleanupConfirm = false)} disabled={attachmentCleanupState === "cleaning"}>{t("cancel")}</button><button class="cleanup-button" onclick={cleanupOrphanedAttachments} disabled={attachmentCleanupState === "cleaning"}>{attachmentCleanupState === "cleaning" ? t("cleaningAttachments") : t("delete")}</button></div>
                    </div>
                  {/if}
                  {#if attachmentCleanupMessage}<p class:error={attachmentCleanupState === "error"} class:success={attachmentCleanupState === "success"} class="data-action-message" role="status">{attachmentCleanupMessage}</p>{/if}
                  <div class="data-actions">
                    <button onclick={createDataBackup} disabled={dataActionState === "backing-up" || dataActionState === "restoring"}><Download size={15} />{dataActionState === "backing-up" ? t("backingUp") : t("createBackup")}</button>
                    <button onclick={chooseBackupToRestore} disabled={dataActionState === "backing-up" || dataActionState === "restoring"}><RotateCcw size={15} />{t("restoreBackup")}</button>
                    <button onclick={() => loadData(true)} disabled={dataActionState === "restoring"}><RefreshCw size={15} />{t("reload")}</button>
                  </div>
                  {#if pendingRestorePath}
                    <div class="restore-confirm" role="alert">
                      <FloodGlyph kind="info" size={32} />
                      <span><strong>{t("restoreBackupQuestion", { file: fileName(pendingRestorePath) })}</strong><small>{t("restoreBackupWarning")}</small></span>
                      <div><button onclick={() => (pendingRestorePath = "")}>{t("cancel")}</button><button class="restore-button" onclick={restoreDataBackup}>{t("restoreBackup")}</button></div>
                    </div>
                  {/if}
                  {#if dataActionMessage}<p class:error={dataActionState === "error"} class="data-action-message" role="status">{dataActionMessage}</p>{/if}
                </section>
              {:else if settingsSection === "integrations"}
                <section class="settings-section">
                  <div class="settings-section-title"><h3>{t("integrations")}</h3><p>{t("integrationsDescription")}</p></div>
                  <div class="integration-card telegram-card">
                    <div class="integration-head"><span><FloodGlyph kind={["database_error", "error"].includes(telegramStatus.step) ? "urgent" : telegramStatus.step === "ready" ? "connected" : "brand"} size={18} motion={telegramStatus.step === "ready" ? "pop" : "none"} /><span><strong>Telegram</strong><small>{telegramStatus.account_name || t("tdlibClient")}</small></span></span><span class:connected={telegramStatus.step === "ready"} class="status-text">{telegramStatusLabel()}</span></div>
                    {#if telegramSyncRequest && telegramStatus.step !== "ready"}<div class="telegram-sync-request-note"><FloodGlyph kind="important" size={16} /><span><strong>{t("telegramSyncWaiting")}</strong><small>{t("telegramSyncWaitingDescription")}</small></span></div>{/if}
                    {#if telegramStatus.step === "unconfigured"}
                      <p>{t("telegramDescription")}</p>
                      <form class="telegram-form credentials" onsubmit={configureTelegram}>
                        <label><span>API ID</span><input bind:value={telegramApiId} inputmode="numeric" autocomplete="off" placeholder="12345678" required /></label>
                        <label><span>API Hash</span><input bind:value={telegramApiHash} type="password" autocomplete="off" placeholder="••••••••••••••••" required /></label>
                        <button class="primary-button" disabled={telegramBusy}>{t("connect")}</button>
                      </form>
                      <button class="telegram-help" onclick={() => openUrl("https://my.telegram.org/apps")}><ExternalLink size={13} />{t("getTelegramKeys")}</button>
                    {:else if telegramStatus.step === "phone"}
                      <p>{t("telegramChooseLogin")}</p>
                      <div class="telegram-login-options"><button class="primary-button" disabled={telegramBusy} onclick={requestTelegramQr}><QrCode size={15} />{t("loginWithQr")}</button><span>{t("or")}</span></div>
                      <form class="telegram-form inline" onsubmit={submitTelegramPhone}><label><span>{t("phoneNumber")}</span><input bind:value={telegramPhone} type="tel" autocomplete="tel" placeholder="+7 700 000 00 00" required /></label><button disabled={telegramBusy}>{t("continue")}</button></form>
                    {:else if telegramStatus.step === "qr"}
                      <div class="telegram-qr">{#if telegramQrDataUrl}<img src={telegramQrDataUrl} alt={t("telegramQrCode")} />{/if}<span><strong>{t("scanQr")}</strong><small>{t("scanQrDescription")}</small></span></div>
                      <button class="telegram-help" onclick={() => openUrl(telegramStatus.qr_link || "tg://login")}><ExternalLink size={13} />{t("openInTelegram")}</button>
                    {:else if telegramStatus.step === "code"}
                      <form class="telegram-form inline" onsubmit={submitTelegramCode}><label><span>{t("telegramCode")}</span><input bind:value={telegramCode} inputmode="numeric" autocomplete="one-time-code" required /></label><button disabled={telegramBusy}>{t("continue")}</button></form>
                    {:else if telegramStatus.step === "password"}
                      <form class="telegram-form inline" onsubmit={submitTelegramPassword}><label><span>{t("telegramPassword")}</span><input bind:value={telegramPassword} type="password" autocomplete="current-password" placeholder={telegramStatus.password_hint || ""} required /></label><button disabled={telegramBusy}>{t("continue")}</button></form>
                    {:else if telegramStatus.step === "ready"}
                      <p>{t("telegramReady", { count: telegramChats.length })}</p>
                      <div class:warning={telegramSyncState === "partial"} class:error={telegramSyncState === "error"} class="telegram-sync-row" role="status" title={telegramSyncErrors.join("\n")}><span><RefreshCw class={telegramSyncState === "syncing" ? "spinning" : ""} size={14} /><span><strong>{t("telegramSynchronization")}</strong><small>{telegramSyncLabel()}</small>{#if telegramSyncErrors[0]}<small class="sync-error">{telegramSyncErrors[0]}{telegramSyncErrors.length > 1 ? ` · +${telegramSyncErrors.length - 1}` : ""}</small>{/if}</span></span><button disabled={telegramSyncState === "syncing"} onclick={() => syncTelegram()}>{t("syncNow")}</button></div>
                      <div class="telegram-project-links">
                        <strong>{t("projectConnections")}</strong>
                        {#each chats.slice(1) as project (project.id)}
                          <div class="telegram-project-link">
                            <span><Folder size={14} /><span title={project.title}>{project.title}</span></span>
                            <div class="telegram-link-summary"><span>{project.telegram_chats.length ? t("linkedChats", { count: project.telegram_chats.length }) : t("notLinked")}</span><button onclick={() => openTelegramConnections(project.id)}>{t("configure")}</button></div>
                          </div>
                        {/each}
                      </div>
                      <div class="telegram-local-note"><ShieldCheck size={14} /><span><strong>{t("telegramLocalSession")}</strong><small>{t("telegramLocalSessionDescription")}</small></span></div>
                      <button class="telegram-help danger" disabled={telegramBusy} onclick={disconnectTelegram}><LogOut size={13} />{t("disconnect")}</button>
                    {:else if telegramStatus.step === "database_error"}
                      <div class="integration-recovery" role="alert">
                        <FloodGlyph kind="urgent" size={32} />
                        <span><strong>{t("telegramDatabaseError")}</strong><small>{t("telegramDatabaseErrorDescription")}</small></span>
                      </div>
                      <button class="primary-button recovery-button" disabled={telegramBusy} onclick={resetTelegramDatabase}><RotateCcw size={14} />{t("repairConnection")}</button>
                    {:else}
                      <div class="telegram-loading"><RefreshCw class="spinning" size={15} />{t("connecting")}</div>
                    {/if}
                    {#if telegramError && telegramStatus.step !== "database_error"}<p class="telegram-error">{telegramError}</p>{/if}
                  </div>
                </section>
              {:else if settingsSection === "mcp"}
                <section class="settings-section mcp-settings-section">
                  <div class="settings-section-title"><h3>{t("mcpAndAi")}</h3><p>{t("mcpPageDescription")}</p></div>
                  <div class="mcp-readiness" aria-label={t("agentReadiness")}>
                    <div class="mcp-readiness-head"><span><FloodGlyph kind={mcpCheckState === "error" ? "urgent" : mcpCheckState === "success" ? "connected" : "brand"} size={28} /><span><strong>{t("agentReadiness")}</strong><small>{mcpRuntimeLabel()}</small></span></span><button class="mcp-check-button" disabled={mcpCheckState === "checking"} onclick={runMcpSelfCheck}><RefreshCw class={mcpCheckState === "checking" ? "spinning" : ""} size={14} />{t("runSelfCheck")}</button></div>
                    <div class="readiness-list">
                      <span class:done={Boolean(mcpRuntime?.available)}><i>{#if mcpRuntime?.available}<Check size={12} />{:else}<Circle size={10} />{/if}</i><span><strong>{t("mcpBinary")}</strong><small>{mcpRuntime?.available ? `${fileName(mcpExecutable)} · ${mcpRuntime.version || "?"}` : t("mcpMissingDescription")}</small></span></span>
                      <span class:done={Boolean(mcpRuntime?.compatible)}><i>{#if mcpRuntime?.compatible}<Check size={12} />{:else}<Circle size={10} />{/if}</i><span><strong>{t("versionCompatibility")}</strong><small>{mcpRuntime ? `${t("appVersionLabel")} ${mcpRuntime.app_version} · MCP ${mcpRuntime.version || "?"}` : t("notChecked")}</small></span></span>
                      <span class:done={Boolean(storeDiagnostics?.healthy)}><i>{#if storeDiagnostics?.healthy}<Check size={12} />{:else}<Circle size={10} />{/if}</i><span><strong>{t("storeDiagnostics")}</strong><small>{storeDiagnostics ? t("storageSummary", { projects: storeDiagnostics.project_count, tasks: storeDiagnostics.open_task_count, inbox: storeDiagnostics.pending_inbox_count }) : t("notChecked")}</small></span></span>
                      <span class:done={Boolean(mcpSelfCheck?.passed)}><i>{#if mcpSelfCheck?.passed}<Check size={12} />{:else}<Circle size={10} />{/if}</i><span><strong>{t("isolatedSelfCheck")}</strong><small>{mcpSelfCheck ? t("checksCompleted", { count: mcpSelfCheck.checks.filter((check) => check.passed).length, total: mcpSelfCheck.checks.length, duration: mcpSelfCheck.duration_ms }) : t("selfCheckDescription")}</small></span></span>
                      <button class:attention={Boolean(attachmentCleanupReport?.orphaned_files)} class:done={attachmentCleanupReport?.orphaned_files === 0} onclick={() => openSettingsSection("data")}><i>{#if attachmentCleanupReport?.orphaned_files === 0}<Check size={12} />{:else if attachmentCleanupReport?.orphaned_files}<Paperclip size={11} />{:else}<Circle size={10} />{/if}</i><span><strong>{t("unusedAttachments")}</strong><small>{#if attachmentCleanupReport}{attachmentCleanupReport.orphaned_files ? t("attachmentCleanupSummary", { count: attachmentCleanupReport.orphaned_files, size: formatFileSize(attachmentCleanupReport.orphaned_bytes) }) : t("attachmentsHealthy")}{:else}{t("notChecked")}{/if}</small></span><ChevronRight size={13} /></button>
                      <button class:attention={Boolean(storeDiagnostics && storeDiagnostics.linked_chat_count > 0 && !telegramAgentReady())} class:done={telegramAgentReady()} onclick={() => openSettingsSection("integrations")}><i>{#if telegramAgentReady()}<Check size={12} />{:else if storeDiagnostics?.linked_chat_count}<Send size={11} />{:else}<Circle size={10} />{/if}</i><span><strong>{t("telegramSynchronization")}</strong><small>{telegramAgentReadinessLabel()}</small></span><ChevronRight size={13} /></button>
                    </div>
                    {#if mcpSelfCheck}
                      <details class:error={!mcpSelfCheck.passed} class="mcp-check-result" open={!mcpSelfCheck.passed}>
                        <summary><span>{#if mcpSelfCheck.passed}<CheckCircle2 size={14} />{:else}<X size={14} />{/if}<strong>{mcpSelfCheck.passed ? t("allChecksPassed") : t("someChecksFailed")}</strong></span><small>{t("checksCompleted", { count: mcpSelfCheck.checks.filter((check) => check.passed).length, total: mcpSelfCheck.checks.length, duration: mcpSelfCheck.duration_ms })}</small><ChevronDown size={14} /></summary>
                        <ul>{#each mcpSelfCheck.checks as check}<li class:passed={check.passed}>{#if check.passed}<Check size={12} />{:else}<X size={12} />{/if}<span>{check.name}{check.detail ? `: ${check.detail}` : ""}</span></li>{/each}</ul>
                      </details>
                    {/if}
                  </div>

                  <div class="mcp-block mcp-activity">
                    <div class="mcp-activity-head">
                      <div class="mcp-block-title"><FloodGlyph kind="info" size={17} /><span><strong>{t("mcpActivity")}</strong><small>{t("mcpActivityDescription")}</small></span></div>
                      <span><small>{t("mcpActivityCount", { count: mcpActivityTotal })}</small><button class="icon-button" aria-label={t("reload")} title={t("reload")} disabled={mcpActivityState === "loading"} onclick={() => loadMcpActivity()}><RefreshCw class={mcpActivityState === "loading" ? "spinning" : ""} size={14} /></button></span>
                    </div>
                    {#if mcpActivityState === "error"}
                      <div class="mcp-activity-empty error" role="status"><FloodGlyph kind="urgent" size={18} /><span><strong>{t("mcpActivityFailed")}</strong><small>{mcpActivityError}</small></span></div>
                    {:else if !mcpActivity.length}
                      <div class="mcp-activity-empty"><FloodGlyph kind="brand" size={18} /><span><strong>{t("mcpActivityEmpty")}</strong><small>{t("mcpActivityDescription")}</small></span></div>
                    {:else}
                      <div class="mcp-activity-list">
                        {#each mcpActivity as event (event.id)}
                          <div class="mcp-activity-row">
                            <FloodGlyph kind={activityGlyph(event)} size={16} />
                            <span><strong>{t(activityActionKeys[event.action])}</strong><small title={event.entity_id}>{activityEntityLabel(event)}</small></span>
                            <time datetime={event.occurred_at} title={fullDate(event.occurred_at)}>{relativeDate(event.occurred_at)}</time>
                          </div>
                        {/each}
                      </div>
                      {#if mcpActivityRemaining > 0}<button class="mcp-activity-more" disabled={mcpActivityState === "loading"} onclick={() => loadMcpActivity(true)}>{t("showMoreMessages", { count: mcpActivityRemaining })}</button>{/if}
                    {/if}
                  </div>

                  <div class="mcp-block">
                    <div class="mcp-block-title"><span><strong>{t("connectAgent")}</strong><small>{t("connectAgentDescription")}</small></span></div>
                    <div class="mcp-client-tabs" role="tablist" aria-label={t("mcpClient")}>
                      {#each mcpClients as client}
                        <button class:active={mcpClient === client} role="tab" aria-selected={mcpClient === client} onclick={() => (mcpClient = client)}>{client === "manual" ? t("manual") : client === "codex" ? "Codex" : client === "claude" ? "Claude" : "Cursor"}</button>
                      {/each}
                    </div>
                    <div class="mcp-code" title={mcpExecutable || "flood-mcp.exe"}><pre>{mcpConfiguration(mcpClient)}</pre><button class="icon-button" aria-label={t("copyConfiguration")} title={copied ? t("copied") : t("copyConfiguration")} onclick={copyMcpConfig}>{#if copied}<Check size={16} />{:else}<Clipboard size={16} />{/if}</button></div>
                    <p class="mcp-hint">{t("restartMcpClient")}</p>
                    {#if mcpRuntime?.source === "development"}<p class="mcp-hint mcp-dev-hint"><ShieldCheck size={13} />{t("mcpDevLauncherDescription")}</p>{/if}
                  </div>

                  <div class="mcp-block mcp-examples">
                    <div class="mcp-block-title"><MessageSquareText size={17} /><span><strong>{t("mcpExampleTitle")}</strong><small>{t("mcpExampleDescription")}</small></span></div>
                    <div class="mcp-example-list">
                      {#each [{ icon: ListTodo, prompt: t("mcpPromptPriorities") }, { icon: ListChecks, prompt: t("mcpPromptTelegram") }, { icon: Search, prompt: t("mcpPromptSearch") }, { icon: ShieldCheck, prompt: t("mcpPromptDiagnostics") }] as example (example.prompt)}
                        <button onclick={() => copyMcpPrompt(example.prompt)}><svelte:component this={example.icon} size={15} /><span>{example.prompt}</span><small>{copiedMcpPrompt === example.prompt ? t("copied") : t("copyPrompt")}</small></button>
                      {/each}
                    </div>
                  </div>

                  <div class="mcp-block mcp-safety">
                    <div class="mcp-block-title"><ShieldCheck size={17} /><span><strong>{t("mcpSafety")}</strong><small>{t("mcpSafetyDescription")}</small></span></div>
                    <div class="mcp-capability-list"><span><Check size={13} />{t("mcpCanRead")}</span><span><Check size={13} />{t("mcpCanSearch")}</span><span><Check size={13} />{t("mcpBoundedTasks")}</span><span><Check size={13} />{t("mcpCanChange")}</span><span><Check size={13} />{t("mcpCanProcessInbox")}</span><span><Check size={13} />{t("mcpBoundedInbox")}</span><span class="protected"><ShieldCheck size={13} />{t("mcpDestructiveProtected")}</span><span class="protected"><ShieldCheck size={13} />{t("mcpHumanConfirmation")}</span></div>
                  </div>
                </section>
              {:else}
                <section class="settings-section">
                  <div class="settings-section-title"><h3>{t("about")}</h3><p>flood.md {appVersion}</p></div>
                  <div class="about-brand"><FloodGlyph kind="brand" size={42} /><span><strong>flood.md</strong><small>{t("localTasksNoNoise")}</small></span></div>
                  {#if installationRuntime}
                    <div class="installation-runtime">
                      <span class="installation-runtime-summary"><FloodGlyph kind={installationRuntime.parallel_installed_copy ? "important" : installationRuntime.kind === "installed" ? "connected" : "brand"} size={18} /><span><strong>{t("applicationLaunch")}</strong><small>{installationKindLabel()}</small></span></span>
                      <div class="installation-path"><code title={installationRuntime.executable_path}>{installationRuntime.executable_path}</code><button onclick={() => openApplicationDirectory(installationRuntime!.directory_path)}><FolderOpen size={14} />{t("openFolder")}</button></div>
                    </div>
                    {#if installationRuntime.parallel_installed_copy}
                      <div class="parallel-install-warning" role="status">
                        <FloodGlyph kind="important" size={18} />
                        <span><strong>{t("parallelInstallFound")}</strong><small>{t("parallelInstallDescription")}</small><code title={installationRuntime.parallel_installed_copy}>{installationRuntime.parallel_installed_copy}</code></span>
                        <button onclick={() => openApplicationDirectory(fileDirectory(installationRuntime!.parallel_installed_copy!))}><FolderOpen size={14} />{t("show")}</button>
                      </div>
                    {/if}
                  {/if}
                  <div class:error={updateState === "error"} class:success={updateState === "current" && Boolean(updateMessage)} class="update-row"><span><strong>{t("updates")}</strong><small>{updateMessage || (installationRuntime?.kind === "development" ? t("updateDevelopmentDescription") : t("updateViaGithub"))}</small>{#if updateState === "downloading"}<progress max="100" value={updateProgress}></progress>{/if}</span>{#if updateState === "available"}<button class="primary-small" onclick={installAvailableUpdate}><Download size={15} />{t("installVersion", { version: availableUpdate?.version ?? "" })}</button>{:else}<button onclick={checkForUpdates} disabled={updateState === "checking" || updateState === "downloading" || installationRuntime?.kind === "development"}><span class:spinning={updateState === "checking"} class="update-icon"><RefreshCw size={15} /></span>{updateState === "checking" ? t("checking") : t("check")}</button>{/if}</div>
                  <button class="settings-action" onclick={() => openUrl("https://github.com/tillwithered/flood.md")}><ExternalLink size={15} />{t("openGithub")}</button>
                </section>
              {/if}
            </div>
          </div>
        </div>
      </section>
    {/if}
  </div>
</main>

{#if telegramConnectionsProject}
  <div class="telegram-import-backdrop" role="presentation" onclick={(event) => { if (event.target === event.currentTarget) closeTelegramConnections(); }}>
    <div class="telegram-import-panel telegram-connections-panel" bind:this={telegramConnectionsDialog} role="dialog" aria-modal="true" aria-label={t("telegramConnectionsTitle")} tabindex="-1" onkeydown={trapModalFocus}>
      <header><span><Send size={17} /><span><strong>{t("telegramConnectionsTitle")}</strong><small title={telegramConnectionsProject.title}>{telegramConnectionsProject.title}</small></span></span><button class="icon-button" aria-label={t("close")} onclick={closeTelegramConnections}><X size={16} /></button></header>
      <div class="telegram-connections-body">
        <p>{t("telegramConnectionsDescription")}</p>
        <label class="telegram-chat-search telegram-connections-search"><Search size={15} /><input value={telegramChatSearch} placeholder={t("searchChats")} oninput={(event) => searchTelegramChats(event.currentTarget.value)} />{#if telegramSearchLoading}<RefreshCw class="spinning" size={14} />{/if}</label>

        {#if telegramConnectionsProject.telegram_chats.length}
          <section class="telegram-connections-section">
            <h4>{t("linkedTelegramChats")}</h4>
            <div class="telegram-selected-chats">
              {#each telegramConnectionsProject.telegram_chats as link (link.chat_id)}
                <article class="telegram-selected-chat">
                  <div><Send size={14} /><strong title={link.title}>{link.title}</strong><button class="icon-button" aria-label={t("removeConnection")} title={t("removeConnection")} onclick={() => toggleProjectTelegramChat(telegramConnectionsProject, { id: link.chat_id, title: link.title })}><X size={14} /></button></div>
                  <div class="telegram-mode-picker" aria-label={t("collectionMode")}>{#each telegramModes as mode}<button class:active={link.inbox_mode === mode} onclick={() => setProjectTelegramMode(telegramConnectionsProject, link, mode)}>{telegramModeLabel(mode)}</button>{/each}</div>
                </article>
              {/each}
            </div>
          </section>
        {/if}

        <section class="telegram-connections-section available">
          <h4>{t("availableTelegramChats")}</h4>
          <div class="telegram-connections-list">
            {#each telegramVisibleChats as telegramChat (telegramChat.id)}
              {@const linked = telegramConnectionsProject.telegram_chats.some((link) => link.chat_id === telegramChat.id)}
              <button class:active={linked} onclick={() => toggleProjectTelegramChat(telegramConnectionsProject, telegramChat)}><span class="picker-check">{#if linked}<Check size={13} />{/if}</span><span title={telegramChat.title}>{telegramChat.title}</span><small>{linked ? t("linked") : t("add")}</small></button>
            {:else}<div class="telegram-connections-empty">{t("nothingFound")}</div>{/each}
          </div>
        </section>
      </div>
    </div>
  </div>
{/if}

{#if telegramImportOpen}
  <div class="telegram-import-backdrop" role="presentation" onclick={(event) => { if (event.target === event.currentTarget) closeTelegramImporter(); }}>
    <div class="telegram-import-panel" bind:this={telegramImportDialog} role="dialog" aria-modal="true" aria-label={t("telegramMessages")} tabindex="-1" onkeydown={trapModalFocus}>
      <header><span><Send size={17} /><span><strong>Telegram</strong><small>{t("chooseMessageForInbox")}</small></span></span><button class="icon-button" aria-label={t("close")} onclick={closeTelegramImporter}><X size={16} /></button></header>
      {#if currentChat.telegram_chats.length > 1}<div class="telegram-import-tabs">{#each currentChat.telegram_chats as link (link.chat_id)}<button class:active={telegramImportChatId === link.chat_id} onclick={() => loadTelegramImportChat(link.chat_id)}>{link.title}</button>{/each}</div>{/if}
      <div class="telegram-message-list">
        {#if telegramMessagesLoading}
          <div class="telegram-list-skeleton" role="status"><span class="sr-only">{t("loadingMessages")}</span>{#each Array(6) as _}<div class="telegram-skeleton-row" aria-hidden="true"><span></span><span><i></i><i></i></span><span></span></div>{/each}</div>
        {:else if telegramImportError}
          <div class="telegram-import-state error"><span>{telegramImportError}</span><button onclick={() => loadTelegramImportChat(telegramImportChatId)}><RefreshCw size={13} />{t("retry")}</button></div>
        {:else}
          {#each telegramMessages as message (message.id)}
            <article class="telegram-message"><div><span><strong>{message.author || "Telegram"}</strong><small>{fullDate(new Date(message.sent_at * 1000).toISOString())}</small></span>{#if message.text}<p>{message.text}</p>{/if}{#if message.media.length}<small class="telegram-media-note"><Paperclip size={12} />{t("mediaCount", { count: message.media.length })}</small>{/if}</div>{#if message.linked_task}<button class="telegram-task-link" disabled={message.linked_task.trashed} title={message.linked_task.title} onclick={() => openTelegramLinkedTask(message.linked_task!)}><FloodGlyph kind={message.linked_task.status === "completed" ? "completed" : message.linked_task.urgency} size={13} /><span><strong>{message.linked_task.title}</strong><small>{telegramLinkedTaskState(message.linked_task)}</small></span><ChevronRight size={14} /></button>{:else}<button class:queued={telegramQueuedMessageIds.includes(message.id)} disabled={Boolean(telegramImportingId) || telegramQueuedMessageIds.includes(message.id)} aria-label={t("addToInbox")} title={telegramQueuedMessageIds.includes(message.id) ? t("alreadyInInbox") : t("addToInbox")} onclick={() => importTelegramMessage(message)}>{#if telegramImportingId === message.id}<RefreshCw class="spinning" size={15} />{:else if telegramQueuedMessageIds.includes(message.id)}<Check size={16} />{:else}<Plus size={16} />{/if}</button>{/if}</article>
          {:else}
            <div class="telegram-import-state">{t("noTextMessages")}</div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}

{#if telegramInboxOpen}
  <div class="telegram-import-backdrop" role="presentation" onclick={(event) => { if (event.target === event.currentTarget) closeTelegramInbox(); }}>
    <div class="telegram-import-panel telegram-inbox-panel" bind:this={telegramInboxDialog} role="dialog" aria-modal="true" aria-label={t("inbox")} tabindex="-1" onkeydown={trapModalFocus}>
      <header><span>{#if telegramTaskDraftCandidate}<button class="icon-button" aria-label={t("back")} onclick={closeTelegramTaskDraft}><ChevronLeft size={16} /></button>{:else}<MessageSquareText size={17} />{/if}<span><strong>{telegramTaskDraftCandidate ? t("telegramTaskDraft") : t("inbox")}</strong><small>{telegramTaskDraftCandidate && telegramTriageTotal ? t("triageProgress", { current: telegramTriageTotal - telegramTriageQueue.length + 1, total: telegramTriageTotal }) : telegramTaskDraftCandidate ? t("telegramTaskDraftDescription") : t("inboxDescription")}</small></span></span><div>{#if !telegramTaskDraftCandidate && telegramInboxView === "pending"}<button class="icon-button" title={t("scanMessages")} disabled={telegramInboxLoading || currentChat.id === "all"} onclick={() => openTelegramInbox(true)}><RefreshCw class={telegramInboxLoading ? "spinning" : ""} size={16} /></button>{/if}<button class="icon-button" aria-label={t("close")} onclick={closeTelegramInbox}><X size={16} /></button></div></header>
      {#if telegramTaskDraftCandidate}
        <form class="telegram-task-composer" onsubmit={(event) => { event.preventDefault(); createTaskFromCandidate(); }}>
          <div class="telegram-task-fields">
            {#if telegramTaskDraftRestored}<div class="telegram-draft-restored" role="status"><Check size={13} />{t("telegramDraftRestored")}</div>{/if}
            <label><span>{t("taskTitle")}</span><input bind:this={telegramTaskTitleInput} bind:value={telegramTaskDraftTitle} maxlength="120" placeholder={t("taskTitlePlaceholder")} oninput={() => (telegramTaskDraftRestored = false)} /></label>
            <label><span>{t("taskNotes")}</span><textarea bind:value={telegramTaskDraftNotes} rows="4" placeholder={t("taskNotesPlaceholder")} oninput={() => (telegramTaskDraftRestored = false)}></textarea></label>
            <fieldset><legend>{t("urgencyLabel")}</legend><div class="telegram-task-urgency">{#each (["normal", "important", "urgent"] as Urgency[]) as urgency}<button type="button" class:active={telegramTaskDraftUrgency === urgency} onclick={() => { telegramTaskDraftUrgency = urgency; telegramTaskDraftRestored = false; }}><FloodGlyph kind={urgency} size={14} />{urgencyTitle(urgency)}</button>{/each}</div></fieldset>
          </div>
          <section class="telegram-task-source-preview"><div><Send size={14} /><span><strong>{telegramTaskDraftCandidate.author}</strong><small>{telegramTaskDraftCandidate.chat_title} · {fullDate(telegramTaskDraftCandidate.sent_at)}</small></span></div>{#if telegramTaskDraftCandidate.text}<p>{telegramTaskDraftCandidate.text}</p>{/if}{#if telegramTaskDraftCandidate.media?.length}<span class="telegram-auto-media"><Paperclip size={13} />{t("mediaWillBeAdded", { count: telegramTaskDraftCandidate.media.length })}</span>{/if}</section>
          {#if telegramInboxError}<p class="telegram-composer-error">{telegramInboxError}</p>{/if}
          <footer>{#if telegramTriageQueue.length}<button type="button" onclick={skipTelegramTriageCandidate} disabled={Boolean(telegramInboxProcessingId)}>{t("keepInInbox")}</button>{:else}<button type="button" onclick={closeTelegramTaskDraft} disabled={Boolean(telegramInboxProcessingId)}>{t("cancel")}</button>{/if}<button class="primary-button" type="submit" disabled={!telegramTaskDraftTitle.trim() || Boolean(telegramInboxProcessingId)}>{#if telegramInboxProcessingId}<RefreshCw class="spinning" size={14} />{:else}<Plus size={14} />{/if}{telegramTriageQueue.length > 1 ? t("createAndContinue") : t("createTask")}</button></footer>
        </form>
      {:else}<div class="telegram-inbox-body">
        <div class="telegram-inbox-view-tabs" role="tablist" aria-label={t("telegramInboxViews")}>
          <button class:active={telegramInboxView === "pending"} role="tab" aria-selected={telegramInboxView === "pending"} onclick={() => setTelegramInboxView("pending")}><span>{t("telegramInboxPending")}</span>{#if telegramInboxView === "pending"}<small>{telegramInboxTotal}</small>{/if}</button>
          <button class:active={telegramInboxView === "history"} role="tab" aria-selected={telegramInboxView === "history"} onclick={() => setTelegramInboxView("history")}><span>{t("telegramInboxHistory")}</span>{#if telegramInboxView === "history"}<small>{telegramInboxTotal}</small>{/if}</button>
        </div>
        {#if telegramInboxView === "pending" && telegramDismissUndo}<div class="telegram-dismiss-undo" role="status"><span><Check size={14} /><span><strong>{t("telegramMessageDismissed")}</strong><small>{t("telegramMessageDismissedDescription", { author: telegramDismissUndo.author })}</small></span></span><button disabled={Boolean(telegramInboxProcessingId)} onclick={undoDismissTelegramCandidate}><RotateCcw size={13} />{t("undo")}</button></div>{/if}
        {#if telegramInboxView === "pending" && telegramTriageNotice}<div class:warning={telegramTriageNoticeWarning} class="telegram-triage-notice" role="status">{#if telegramTriageNoticeWarning}<Paperclip size={14} />{:else}<CheckCircle2 size={14} />{/if}{telegramTriageNotice}</div>{/if}
        {#if telegramInboxView === "pending" && !telegramInboxLoading && !telegramInboxError && telegramInbox.length}<div class="telegram-inbox-batch"><button class:active={allTelegramInboxCandidatesSelected()} aria-pressed={allTelegramInboxCandidatesSelected()} onclick={toggleAllTelegramInboxCandidates}><span class="picker-check">{#if allTelegramInboxCandidatesSelected()}<Check size={12} />{/if}</span>{allTelegramInboxCandidatesSelected() ? t("clearSelection") : t("selectAllMessages")}</button><small>{t("batchTriageHint")}</small></div>{/if}
        <div class:with-action-island={telegramInboxSelection.length > 0} class="telegram-message-list telegram-inbox-list">
          {#if telegramInboxLoading}<div class="telegram-list-skeleton" role="status"><span class="sr-only">{t("scanningMessages")}</span>{#each Array(6) as _}<div class="telegram-skeleton-row with-check" aria-hidden="true"><span></span><span><i></i><i></i></span><span></span></div>{/each}</div>
          {:else if telegramInboxError}<div class="telegram-import-state error"><span>{telegramInboxError}</span><button onclick={() => openTelegramInbox(false)}><RefreshCw size={13} />{t("retry")}</button></div>
          {:else}
            {#each telegramInbox as candidate (candidate.id)}
              <article class:history={telegramInboxView === "history"} class:selected={telegramInboxSelection.includes(candidate.id)} class="inbox-candidate">
                {#if telegramInboxView === "pending"}<button class:active={telegramInboxSelection.includes(candidate.id)} class="inbox-select" disabled={Boolean(candidate.linked_task)} aria-label={telegramInboxSelection.includes(candidate.id) ? t("removeFromSelection") : t("addToSelection")} aria-pressed={telegramInboxSelection.includes(candidate.id)} onclick={() => toggleTelegramInboxCandidate(candidate.id)}><span class="picker-check">{#if telegramInboxSelection.includes(candidate.id)}<Check size={12} />{/if}</span></button>{:else}<span class:imported={candidate.status === "imported"} class="inbox-history-state" title={candidate.status === "imported" ? t("telegramStatusImported") : t("telegramStatusDismissed")}>{#if candidate.status === "imported"}<Check size={14} />{:else}<RotateCcw size={14} />{/if}</span>{/if}
                <div class="inbox-candidate-content"><div class="inbox-candidate-meta"><strong>{candidate.author}</strong><span title={candidate.chat_title}>{candidate.chat_title}</span><small>{telegramInboxView === "history" ? (candidate.status === "imported" ? t("telegramStatusImported") : t("telegramStatusDismissed")) : telegramReasonLabel(candidate.reason)} · {fullDate(candidate.processed_at ?? candidate.sent_at)}</small></div>{#if candidate.text}<p>{candidate.text}</p>{/if}{#if candidate.media?.length}<small class="telegram-media-note"><Paperclip size={12} />{t("mediaCount", { count: candidate.media.length })}</small>{/if}</div>
                <div class="inbox-candidate-actions">{#if candidate.linked_task}<button class="inbox-linked-task" disabled={candidate.linked_task.trashed} title={candidate.linked_task.title} onclick={() => openTelegramLinkedTask(candidate.linked_task!)}><FloodGlyph kind={candidate.linked_task.status === "completed" ? "completed" : candidate.linked_task.urgency} size={13} /><span>{candidate.linked_task.title}</span><small>{telegramLinkedTaskState(candidate.linked_task)}</small><ChevronRight size={13} /></button>{:else if telegramInboxView === "history" && candidate.status === "dismissed"}<button disabled={Boolean(telegramInboxProcessingId)} onclick={() => restoreTelegramCandidate(candidate)}><RotateCcw size={13} />{t("restoreToInbox")}</button>{:else if telegramInboxView === "history"}<span class="inbox-missing-task">{t("linkedTaskUnavailable")}</span>{:else}<button disabled={Boolean(telegramInboxProcessingId)} onclick={() => dismissTelegramCandidate(candidate)}>{t("dismiss")}</button><button class="primary-button" disabled={Boolean(telegramInboxProcessingId)} aria-label={t("prepareTask")} title={t("prepareTask")} onclick={() => beginTaskFromCandidate(candidate)}><Plus size={14} />{t("prepareTaskShort")}</button>{/if}</div>
              </article>
            {:else}<div class="telegram-import-state">{telegramInboxView === "history" ? t("telegramHistoryEmpty") : t("inboxEmpty")}</div>{/each}
            {#if telegramInboxRemaining > 0}<button class="telegram-load-more" disabled={telegramInboxLoadingMore} onclick={loadMoreTelegramInbox}>{#if telegramInboxLoadingMore}<RefreshCw class="spinning" size={13} />{/if}{t("showMoreMessages", { count: telegramInboxRemaining })}</button>{/if}
          {/if}
        </div>
        {#if telegramInboxView === "pending" && telegramInboxSelection.length}<div class="telegram-triage-island" aria-label={t("selectedMessages", { count: telegramInboxSelection.length })}><span><ListChecks size={15} />{t("selectedMessages", { count: telegramInboxSelection.length })}</span><button class="primary-button" onclick={beginSelectedTelegramTriage}><span>{t("reviewSelected")}</span><ArrowRight size={14} /></button></div>{/if}
      </div>{/if}
    </div>
  </div>
{/if}

{#if sourceViewerOpen && selectedTask?.source}
  <div class="telegram-import-backdrop source-viewer-backdrop" role="presentation" onclick={(event) => { if (event.target === event.currentTarget) closeSourceViewer(); }}>
    <div class="telegram-import-panel source-viewer-panel" bind:this={sourceViewerDialog} role="dialog" aria-modal="true" aria-label={t("taskSource")} tabindex="-1" onkeydown={trapModalFocus}>
      <header><span><FloodGlyph kind="info" size={22} /><span><strong>{t("taskSource")}</strong><small>{selectedTask.source.chat_title || t("sourceMessage")}</small></span></span><button class="icon-button" aria-label={t("close")} onclick={closeSourceViewer}><X size={16} /></button></header>
      <div class="source-viewer-body">
        <section class="source-message-card">
          <div class="source-message-meta"><span><strong>{selectedTask.source.author || t("notSpecified")}</strong><small>{selectedTask.source.provider === "telegram" ? "Telegram" : t("sourceMessage")}</small></span>{#if selectedTask.source.sent_at}<time datetime={selectedTask.source.sent_at}>{fullDate(selectedTask.source.sent_at)}</time>{/if}</div>
          {#if selectedTask.source.text}<p>{selectedTask.source.text}</p>{:else}<p class="source-empty-text">{t("noSourceText")}</p>{/if}
        </section>
        {#if selectedTask.source.media?.length}
          <section class="source-viewer-section">
            <h4>{t("sourceFiles")} <span>{selectedTask.source.media.length}</span></h4>
            <div class="source-media-list">
              {#each selectedTask.source.media as media, index}
                <div class:with-preview={Boolean(sourceMediaPreviews[index])} class="source-media-row">
                  {#if sourceMediaPreviews[index]}<button class="source-media-preview" aria-label={`${t("open")} ${media.file_name}`} onclick={() => openSourceMedia(media)}><img src={sourceMediaPreviews[index]} alt={media.file_name} /></button>{:else}<span class="source-media-icon"><Paperclip size={15} /></span>{/if}
                  <span><strong title={media.file_name}>{media.file_name}</strong><small>{t("telegramMedia")} · {media.size ? `${Math.max(1, Math.round(media.size / 1024))} КБ` : t("sizeUnknown")}</small></span>
                  <div class="source-media-actions">{#if media.relative_path}{#if sourceMediaInTask(media)}<span><Check size={12} />{t("inTask")}</span>{:else}<button disabled={downloadingSourceMedia >= 0} onclick={() => insertDownloadedSourceMedia(index)}><Plus size={13} />{t("addToTask")}</button>{/if}<button onclick={() => openSourceMedia(media)}>{t("open")}</button>{:else}<button disabled={downloadingSourceMedia >= 0} onclick={() => downloadTelegramSourceMedia(index)}>{#if downloadingSourceMedia === index}<RefreshCw class="spinning" size={13} />{:else}<Download size={13} />{/if}{t("downloadAndAdd")}</button>{/if}</div>
                </div>
              {/each}
            </div>
          </section>
        {/if}
      </div>
      {#if selectedTask.source.url}<footer class="source-viewer-footer"><button onclick={() => openUrl(selectedTask.source!.url!)}><ExternalLink size={14} />{t("openMessage")}</button></footer>{/if}
    </div>
  </div>
{/if}

{#if imageViewer}
  <div class="image-viewer" bind:this={imageViewerDialog} role="dialog" aria-modal="true" aria-label={t("imageViewer", { image: imageViewer.alt })} tabindex="-1" onkeydown={trapModalFocus}>
    <div class="image-viewer-stage" onwheel={(event) => { event.preventDefault(); changeImageZoom(event.deltaY < 0 ? .2 : -.2); }}>
      <img src={imageViewer.src} alt={imageViewer.alt} draggable="false" style:zoom={imageViewerZoom} />
    </div>
    <div class="image-viewer-toolbar" aria-label={t("imageZoom")}>
      <button aria-label={t("zoomOut")} title={t("zoomOut")} onclick={() => changeImageZoom(-.2)}><ZoomOut size={17} /></button>
      <button class="image-zoom-value" aria-label={t("resetZoom")} title={t("resetZoom")} onclick={() => (imageViewerZoom = 1)}>{Math.round(imageViewerZoom * 100)}%</button>
      <button aria-label={t("zoomIn")} title={t("zoomIn")} onclick={() => changeImageZoom(.2)}><ZoomIn size={17} /></button>
    </div>
    <button class="image-viewer-close" aria-label={t("closeViewer")} title={t("close")} onclick={closeImageViewer}><X size={18} /></button>
  </div>
{/if}
