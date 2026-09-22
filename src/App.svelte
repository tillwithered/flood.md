<script lang="ts">
  import { version as packageVersion } from "../package.json";
  import { ArrowRight, Bold, Bot, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Circle, Clipboard, Database, Download, ExternalLink, FileDiff, FileText, Folder, FolderOpen, FolderPlus, Heading1, Home, Info, Languages, Link, ListChecks, ListTodo, LogOut, Maximize2, MessageSquareText, Minus, MoreHorizontal, Palette, PanelLeftClose, PanelLeftOpen, Paperclip, Pencil, Pin, Plus, Plug, QrCode, RefreshCw, RotateCcw, Search, Send, Settings, ShieldCheck, Square, Trash2, Underline, X, ZoomIn, ZoomOut } from "@lucide/svelte";
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
  import Dock from "./components/Dock.svelte";
  import AgentConversationSettings from "./components/AgentConversationSettings.svelte";
  import IntegrationCard from "./components/IntegrationCard.svelte";
  import IntegrationModal from "./components/IntegrationModal.svelte";
  import MarkdownInline from "./components/MarkdownInline.svelte";
  import ProjectKnowledgeReview from "./components/ProjectKnowledgeReview.svelte";
  import TelegramChatIdentity from "./components/TelegramChatIdentity.svelte";
  import { UiButton, UiIconButton, UiModal, UiSwitch, PageHeader, SectionNav, SegmentedControl, EmptyState, InlineNotice, NoticeAction, TextArea, TextField, SelectField, TaskRow, MaterialRow } from "./components/ui";
  import { translate, type Locale, type MessageKey } from "./i18n";
  import {
    connectorUiRegistry,
    type ConnectorProvider,
    type ConnectorTone,
    type ConnectorUiDefinition
  } from "./integrations/registry";

  type Section = "tasks" | "trash" | "settings";
  type SettingsSection = "general" | "appearance" | "data" | "integrations" | "agents" | "mcp" | "about";
  type WorkspaceView = "project" | "task" | "context";
  type Urgency = "normal" | "important" | "urgent";
  type TaskRelationKind = "related" | "subtask_of" | "blocked_by";
  type TaskRelation = { task_id: string; kind: TaskRelationKind };
  type TaskCheckpoint = { id: string; created_at: string; source: "user" | "agent"; summary: string; verification?: string[]; remaining?: string[]; blocker?: string; result?: string; agent_run_id?: string };
  type SaveState = "idle" | "saving" | "saved" | "error";
  type UpdateState = "idle" | "checking" | "available" | "current" | "downloading" | "error";
  type DataActionState = "idle" | "backing-up" | "restoring" | "success" | "error";
  type AttachmentCleanupState = "idle" | "checking" | "cleaning" | "success" | "error";
  type TelegramInboxMode = "manual" | "mentions_and_replies" | "all";
  type ProjectResourceKind = "repository" | "directory" | "skill" | "figma" | "documentation" | "website" | "other";
  type ProjectResource = { id: string; kind: ProjectResourceKind; label: string; location: string; notes?: string; agent_access: boolean };
  type ProjectWorkspaceSection = "context" | "integrations";
  type ProjectWorkspaceItemKind = "document" | "rule" | "skill";
  type ProjectWorkspaceRevision = { title: string; summary?: string; content: string; agent_access: boolean; changed_at: string };
  type ProjectWorkspaceItem = { id: string; project_id: string; kind: ProjectWorkspaceItemKind; title: string; summary?: string; content: string; agent_access: boolean; created_at: string; updated_at: string; revisions?: ProjectWorkspaceRevision[]; version: string };
  type ProjectKnowledgeProposalTarget = { kind: "workspace_item"; item_id: string; item_kind: ProjectWorkspaceItemKind } | { kind: "project_memory"; memory_id: string };
  type ProjectKnowledgeProposalPayload = { kind: "workspace_item"; title: string; summary?: string; content: string; agent_access: boolean } | { kind: "project_memory"; text: string; pinned: boolean };
  type ProjectKnowledgeProposal = { id: string; project_id: string; target: ProjectKnowledgeProposalTarget; base_version: string; payload: ProjectKnowledgeProposalPayload; summary: string; reason: string; evidence?: string[]; state: "pending" | "applied" | "rejected"; decision_reason?: string; created_at: string; updated_at: string };
  type ProjectKnowledgeProposalDecision = { proposal: ProjectKnowledgeProposal; workspaceItem?: ProjectWorkspaceItem; project?: ProjectRecord };
  type ProjectMemoryRevision = { text: string; changed_at: string };
  type ProjectMemoryEntry = { id: string; text: string; created_at: string; updated_at?: string; source_task_id?: string; pinned?: boolean; state?: "active" | "superseded"; superseded_by?: string; revisions?: ProjectMemoryRevision[] };
  type ProjectContextPreviewBlock = { kind: "heading" | "paragraph" | "bullets" | "numbers" | "quote" | "code"; level?: number; text?: string; items?: string[] };
  type SourceMedia = { kind: "photo" | "video" | "document" | "audio" | "voice" | "animation" | "other"; file_name: string; provider_file_id?: number; mime_type?: string; size?: number; relative_path?: string };
  type TelegramContextMessage = { message_id: number; message_ids?: number[]; author: string; sender_id?: string; sender_username?: string; is_outgoing?: boolean; sent_at: string; text: string; url?: string; reply_to_message_id?: number; is_target: boolean; media?: SourceMedia[] };
  type MessageSnapshot = { text: string; author?: string; sent_at?: string; url?: string; provider?: string; chat_id?: number; chat_title?: string; message_id?: number; message_ids?: number[]; media?: SourceMedia[]; context?: TelegramContextMessage[] };
  type TelegramProjectLink = { chat_id: number; title: string; inbox_mode: TelegramInboxMode };
  type TelegramParticipantRole = { sender_id: string; display_name: string; username?: string; role: string; source: "manual" | "agent" };
  type ProjectRecord = { id: string; title: string; context?: string; resources?: ProjectResource[]; memory?: ProjectMemoryEntry[]; created_at: string; updated_at: string; telegram_chats?: TelegramProjectLink[]; telegram_participants?: TelegramParticipantRole[]; version: string };
  type CommandError = { code: string; message: string };
  type TaskRecord = {
    id: string;
    project_id: string;
    description: string;
    created_at: string;
    updated_at: string;
    urgency: Urgency;
    status: "open" | "completed";
    relations?: TaskRelation[];
    checkpoints?: TaskCheckpoint[];
    checkpoint_count?: number;
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
    relations: TaskRelation[];
    checkpoints: TaskCheckpoint[];
    checkpointCount: number;
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
  type TelegramChat = { id: number; title: string; kind?: "private" | "secret" | "group" | "channel" | "direct" | "unknown"; username?: string; avatar_data_url?: string; avatar_file_id?: number };
  type TelegramLinkedTask = { id: string; title: string; urgency: Urgency; status: "open" | "completed"; trashed: boolean };
  type TelegramMessage = { id: number; message_ids?: number[]; chat_id: number; text: string; author: string; sender_id?: string; sender_username?: string; is_outgoing?: boolean; sent_at: number; url?: string; chat_title: string; media: SourceMedia[]; is_mention: boolean; is_reply_to_me: boolean; linked_task?: TelegramLinkedTask };
  type TelegramInboxCandidate = { id: string; project_id: string; chat_id: number; chat_title: string; message_id: number; message_ids?: number[]; text: string; author: string; sender_id?: string; sender_username?: string; is_outgoing?: boolean; sent_at: string; url?: string; reason: "manual" | "mention" | "reply" | "linked_chat"; status: "pending" | "dismissed" | "imported"; media?: SourceMedia[]; context?: TelegramContextMessage[]; discovered_at: string; processed_at?: string; task_id?: string; linked_task?: TelegramLinkedTask };
  type TelegramInboxPage = { candidates: TelegramInboxCandidate[]; total: number; next_cursor?: string; remaining: number };
  type TelegramTaskCreationResult = { task: TaskRecord; media_errors: string[] };
  type TelegramInboxSyncResult = { scanned_projects: number; added: number; failed_projects: number; errors: string[]; busy: boolean };
  type TelegramMediaSyncResult = { downloaded: number; failed: number; errors: string[]; busy: boolean };
  type TelegramSyncStatus = { completed_at: string; health: "success" | "partial" | "error"; scanned_projects: number; added_candidates: number; downloaded_media: number; failures: number; errors?: string[] };
  type TelegramSyncRequest = { id: string; requested_at: string };
  type TelegramSyncResult = { inbox: TelegramInboxSyncResult; media: TelegramMediaSyncResult; status?: TelegramSyncStatus };
  type TelegramSyncState = "idle" | "syncing" | "success" | "partial" | "error";
  type TelegramSyncSummary = { added: number; downloaded: number; failed: number; syncedAt: string };
  type GitHubAccount = { id: number; login: string; name?: string; avatar_url: string; html_url: string };
  type GitHubStatus = { configured: boolean; managed_app: boolean; connected: boolean; app_slug?: string; account?: GitHubAccount; token_expires_at?: string; needs_reauthorization: boolean; credential_store_available: boolean; error?: string };
  type GitHubDeviceCode = { user_code: string; verification_uri: string; expires_at: string; interval_seconds: number };
  type GitHubAuthorizationResult = { state: "pending"; retry_after_seconds: number } | { state: "authorized"; account: GitHubAccount };
  type GitHubInstallation = { id: number; account_login: string; account_type: string; repository_selection: string; html_url: string };
  type GitHubRepository = { id: number; installation_id: number; name: string; full_name: string; private: boolean; html_url: string; description?: string; default_branch: string; archived: boolean; pushed_at?: string; owner_avatar_url: string };
  type GitHubRepositoryCatalog = { installations: GitHubInstallation[]; repositories: GitHubRepository[] };
  type TelegramTaskDraft = { title: string; notes: string; urgency: Urgency };
  type StoreDiagnostics = { healthy: boolean; root: string; format_version: number; project_count: number; linked_chat_count: number; open_task_count: number; completed_task_count: number; trashed_task_count: number; pending_inbox_count: number; pending_automation_event_count: number; failed_automation_event_count: number; issues: string[] };
  type AttachmentCleanupReport = { total_files: number; total_bytes: number; orphaned_files: number; orphaned_bytes: number };
  type AttachmentCleanupResult = { removed_files: number; removed_bytes: number };
  type SelfCheckItem = { name: string; passed: boolean; detail?: string };
  type SelfCheckResult = { passed: boolean; duration_ms: number; checks: SelfCheckItem[] };
  type McpCheckState = "idle" | "checking" | "success" | "error";
  type McpClient = "codex" | "claude" | "cursor" | "manual";
  type McpRuntimeInfo = { executable_path: string; launch_command: string; launch_args: string[]; available: boolean; version?: string; protocol_version?: string; tool_catalog_revision?: string; tool_count?: number; app_version: string; compatible: boolean; source: "bundled" | "development" };
  type AgentAdapterClient = "codex" | "claude";
  type AgentAdapterStatus = { client: AgentAdapterClient; installed: boolean; version?: string; connected: boolean; connection_detail?: string; project_adapter_installed: boolean; project_adapter_current: boolean };
  type AgentAdapterResult = { status: AgentAdapterStatus; changed: boolean; restart_required: boolean };
  type InstallationRuntimeInfo = { executable_path: string; directory_path: string; kind: "installed" | "development" | "portable"; parallel_installed_copy?: string };
  type ActivityAction = "project_created" | "project_updated" | "project_deleted" | "task_created" | "task_updated" | "task_completed" | "task_moved" | "task_trashed" | "task_restored" | "task_deleted" | "trash_emptied" | "telegram_task_created" | "telegram_candidate_dismissed" | "telegram_candidate_restored" | "telegram_sync_requested" | "mutation_applied";
  type ActivityProvenance = { initiator: { kind: "human" | "agent" | "automation" | "connector" | "system"; id?: string; provider?: string }; run_id?: string; guidance: { kind: "rule" | "skill"; id: string; version: string }[]; sources: { kind: string; id: string; version?: string }[]; approved_plan_id: string; approved_plan_digest: string; operations: { operation_id: string; kind: string; target_id?: string; changed: boolean }[]; result: "applied" | "no_changes"; recovery: "available" | "best_effort" | "unavailable" };
  type ActivityEvent = { id: string; occurred_at: string; source: "mcp"; action: ActivityAction; entity_kind: "workspace" | "project" | "task" | "telegram_candidate"; entity_id?: string; project_id?: string; reversible: boolean; provenance?: ActivityProvenance };
  type ActivityPage = { events: ActivityEvent[]; total: number; next_cursor?: string; remaining: number };
  type AgentRunState = "queued" | "running" | "ready_for_review" | "accepted" | "needs_input" | "failed" | "cancelled" | "interrupted";
  type AppliedGuidance = { kind: "rule" | "skill"; id: string; title: string; version: string; reason: string };
  type AgentRun = { id: string; task_id: string; project_id: string; provider: string; state: AgentRunState; created_at: string; updated_at: string; started_at?: string; finished_at?: string; thread_id?: string; working_directory: string; progress?: string; result?: string; memory?: string[]; guidance?: AppliedGuidance[]; blocker?: string; last_response?: string; error?: string };
  type ProjectAttention = { kind: "agent_question" | "source_question"; message: string; task_id?: string; event_id?: string; occurred_at: string };
  type ProjectAutomationPolicy = { project_id: string; auto_run_created_tasks: boolean; updated_at?: string };
  type AutomationProvider = "auto" | "codex" | "claude" | "gemini" | "jev";
  type AutomationSettings = { background_ai_triage: boolean; provider: AutomationProvider; projects?: ProjectAutomationPolicy[]; updated_at?: string };
  type LocalAgentProviderStatus = { id: Exclude<AutomationProvider, "auto" | "jev">; name: string; available: boolean; version?: string; supports_images: boolean };
  type JevStatus = { configured: boolean; source?: "keyring" | "environment"; model: string };
  type AutomationOutcome = "task_created_or_linked" | "task_updated" | "duplicate" | "no_action" | "needs_data" | "agent_queued" | "skipped_while_off";
  type AutomationStatusSummary = { pending: number; processing: number; processed: number; failed: number; last_outcome?: AutomationOutcome; last_activity_at?: string };
  type AcceptedAgentRun = { run: AgentRun; task: TaskRecord };
  type CommandGroup = "actions" | "projects" | "tasks";
  type CommandItem = { id: string; group: CommandGroup; title: string; meta?: string; keywords: string; urgency?: Urgency; completed?: boolean };

  const markdownHints: Record<string, MessageKey> = {
    "#": "largeHeading"
  };
  const pendingUpdateVersionKey = "flood.pending-update-version";
  const maxAttachmentBytes = 25 * 1024 * 1024;
  const telegramModes: TelegramInboxMode[] = ["manual", "mentions_and_replies", "all"];
  const projectResourceKinds: ProjectResourceKind[] = ["repository", "directory", "figma", "documentation", "website", "other"];
  const mcpClients: McpClient[] = ["codex", "claude", "cursor", "manual"];
  const agentAdapterClients: AgentAdapterClient[] = ["codex"];
  const automationProviders: AutomationProvider[] = ["codex"];

  let tasks: TaskItem[] = [];
  let trashedTasks: TaskItem[] = [];
  let chats: ChatItem[] = [];

  type BlockKind = "paragraph" | "heading-1" | "heading-2" | "heading-3" | "bullet" | "number" | "quote" | "code";

  let editorRoot: HTMLDivElement;
  let taskTitleInput: HTMLTextAreaElement;
  let taskTitleDraft = "";
  let attachmentInput: HTMLInputElement;
  let attachmentObjectUrls: string[] = [];
  let activeSection: Section = "tasks";
  let workspaceView: WorkspaceView = "project";
  let selectedTaskId = "";
  let selectedTaskNavigationScope = "";
  let draftTaskId = "";
  let draftDirty = false;
  let selectedChatId = "all";
  let projectTab: "all" | "urgent" | "closed" = "all";
  let projectPickerOpen = false;
  let projectPickerButton: HTMLButtonElement;
  function handleProjectTabsKeydown(event: KeyboardEvent) {
    const tabs: Array<typeof projectTab> = ["all", "urgent", "closed"];
    const current = tabs.indexOf(projectTab);
    const next = event.key === "ArrowRight" ? (current + 1) % tabs.length : event.key === "ArrowLeft" ? (current + tabs.length - 1) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
    if (next < 0) return;
    event.preventDefault();
    projectTab = tabs[next];
    (event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('button[role="tab"]')[next]?.focus();
  }
  let sidebarCollapsed = false;
  let projectActionsOpen = false;
  let projectActionsTrigger: HTMLButtonElement | null = null;
  let projectTaskPendingIds: string[] = [];
  let projectTaskError = "";
  let locale: Locale = "ru";
  let reduceMotion = false;
  let settingsSection: SettingsSection = "general";
  let mcpSettingsOpen = false;
  let conversationSettingsOpen = false;
  let appVersion = packageVersion;
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
  let agentAdapters: AgentAdapterStatus[] = [];
  let agentAdaptersState: "idle" | "loading" | "ready" | "error" = "idle";
  let agentAdapterPending: AgentAdapterClient | "" = "";
  let agentAdapterRoot = "";
  let agentAdapterMessage = "";
  let agentAdapterError = "";
  let automationSettings: AutomationSettings = { background_ai_triage: false, provider: "jev" };
  let localAgentProviders: LocalAgentProviderStatus[] = [];
  let localAgentProvidersState: "idle" | "loading" | "ready" | "error" = "idle";
  let automationSettingsState: "idle" | "saving" | "error" = "idle";
  let automationSettingsError = "";
  let jevStatus: JevStatus = { configured: false, model: "jev-latest" };
  let jevApiKey = "";
  let jevKeyState: "idle" | "saving" | "error" = "idle";
  let jevKeyError = "";
  let automationStatus: AutomationStatusSummary | null = null;
  let automationStatusState: "idle" | "loading" | "retrying" | "error" = "idle";
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
  let integrationModal: ConnectorProvider | null = null;
  let githubStatus: GitHubStatus = { configured: false, managed_app: false, connected: false, needs_reauthorization: false, credential_store_available: true };
  let githubClientId = "";
  let githubAppSlug = "";
  let githubDeviceCode: GitHubDeviceCode | null = null;
  let githubAuthorizationCompleted: GitHubAccount | null = null;
  let githubCodeCopied = false;
  let githubRepositories: GitHubRepository[] = [];
  let githubInstallations: GitHubInstallation[] = [];
  let githubSearch = "";
  let githubBusy = false;
  let githubError = "";
  let githubAuthTimer: number | undefined;
  let integrationModalReturnFocus: HTMLElement | null = null;
  let updateState: UpdateState = "idle";
  let updateMessage = "";
  let availableUpdate: Update | null = null;
  let updateProgress = 0;
  let markdown = "";
  let editorHint: MarkdownHint | null = null;
  let copied = false;
  let mcpCopyPending = false;
  let mcpCopyError = "";
  let completedGroupOpen = false;
  let loading = true;
  let loadError = "";
  let saveState: SaveState = "idle";
  let saveError = "";
  let saveTimer: number | undefined;
  let refreshTimer: number | undefined;
  let agentRunTimer: number | undefined;
  let selectedTaskRuns: AgentRun[] = [];
  let agentQueueRuns: AgentRun[] = [];
  let agentRunBusy = false;
  let agentRunError = "";
  let agentResponse = "";
  let lastSavedMarkdown = "";
  let saveInFlight: Promise<void> | null = null;
  let conflictRemote: TaskRecord | null = null;
  let urgencyMenuOpen = false;
  let newTaskMenuAnchor: "sidebar" | "workspace" | null = null;
  let createChatOpen = false;
  let createHubOpen = false;
  let dockTaskModalOpen = false;
  let dockProjectModalOpen = false;
  let dockTaskTitle = "";
  let dockTaskDetails = "";
  let dockTaskProjectId = "";
  let dockTaskUrgency: "normal" | "important" | "urgent" = "normal";
  let dockProjectTitle = "";
  let dockModalBusy = false;
  let dockModalError = "";
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
  let telegramConnectionsOpenedFromIntegration = false;
  let telegramConnectionsSaving = false;
  let telegramImportDialog: HTMLDivElement;
  let telegramImportReturnFocus: HTMLElement | null = null;
  let telegramInboxDialog: HTMLDivElement;
  let telegramInboxReturnFocus: HTMLElement | null = null;
  let projectContextOpen = false;
  let projectContextProjectId = "";
  let projectContextProjectTitle = "";
  let projectContextVersion = "";
  let projectContextDraft = "";
  let projectContextResources: ProjectResource[] = [];
  let projectContextSavedDraft = "";
  let projectContextSavedResources = "";
  let projectContextDiscardOpen = false;
  let projectAttention: ProjectAttention[] = [];
  let projectAttentionAnswerId = "";
  let projectAttentionAnswer = "";
  let projectAttentionBusy = false;
  let projectAutoRunDraft = false;
  let projectAutoRunSaved = false;
  let projectAutoRunLoading = false;
  let projectGithubOpen = false;
  let projectResourceAddOpen = false;
  let projectContextEditorMode: "edit" | "preview" = "edit";
  let projectMemoryEditorId = "";
  let projectMemoryEditorMode: "edit" | "supersede" = "edit";
  let projectMemoryDraft = "";
  let projectMemoryPinned = false;
  let projectMemorySearch = "";
  let projectMemoryShowSuperseded = false;
  let projectMemorySaving = false;
  let projectMemoryError = "";
  let projectMemoryDeleteConfirmId = "";
  let expandedProjectResourceId = "";
  let projectContextError = "";
  let projectContextConflictRemote: ProjectRecord | null = null;
  let projectContextSaving = false;
  let projectContextDialog: HTMLElement;
  let projectContextTextarea: HTMLTextAreaElement;
  let projectContextReturnFocus: HTMLElement | null = null;
  let projectWorkspaceSection: ProjectWorkspaceSection = "context";
  let projectWorkspaceItems: ProjectWorkspaceItem[] = [];
  let projectKnowledgeProposals: ProjectKnowledgeProposal[] = [];
  let projectKnowledgeLoading = false;
  let projectKnowledgeError = "";
  let projectKnowledgePendingId = "";
  let buddyActivityOpen = false;
  let projectWorkspaceLoading = false;
  let projectWorkspaceError = "";
  let projectWorkspaceConflictRemote: ProjectWorkspaceItem | null = null;
  let projectWorkspaceConflictAction: "save" | "delete" | null = null;
  let projectWorkspaceEditorId = "";
  let projectWorkspaceEditorKind: ProjectWorkspaceItemKind = "document";
  let projectWorkspaceTitle = "";
  let projectWorkspaceSummary = "";
  let projectWorkspaceContent = "";
  let projectWorkspaceAgentAccess = false;
  let projectWorkspaceSaving = false;
  let projectWorkspaceDeleteConfirm = false;
  let projectWorkspaceCloseConfirm = false;
  let projectWorkspaceOriginal = "";
  let projectWorkspaceDialog: HTMLElement;
  let projectWorkspaceReturnFocus: HTMLElement | null = null;
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
  let dock: Dock;
  let dockClearance = 260;
  let settingsNavElement: HTMLElement | undefined;
  let commandPaletteReturnFocus: HTMLElement | null = null;
  let commandQuery = "";
  let commandActiveIndex = 0;
  let commandInput: HTMLInputElement;

  const uiPreferencesKey = "flood.ui.preferences";

  function translator(forLocale: Locale) {
    return (key: MessageKey, values: Record<string, string | number> = {}) => translate(forLocale, key, values);
  }

  let t = translator(locale);

  function parseCommandError(error: unknown): CommandError {
    const fromObject = (value: unknown): CommandError | null => {
      if (!value || typeof value !== "object") return null;
      const candidate = value as { code?: unknown; message?: unknown };
      if (typeof candidate.message !== "string") return null;
      return { code: typeof candidate.code === "string" ? candidate.code : "", message: candidate.message };
    };
    const direct = fromObject(error);
    if (direct) return direct;
    if (typeof error === "string") {
      try {
        const parsed = fromObject(JSON.parse(error));
        if (parsed) return parsed;
      } catch {
        // Older Tauri commands reject with a plain string.
      }
      return { code: "", message: error };
    }
    return { code: "", message: String(error) };
  }

  function commandErrorMessage(error: unknown) {
    return parseCommandError(error).message;
  }

  function isConflictError(error: unknown) {
    const parsed = parseCommandError(error);
    return parsed.code === "conflict" || parsed.message.includes("изменились в другом процессе");
  }

  function saveUiPreferences() {
    localStorage.setItem(uiPreferencesKey, JSON.stringify({
      locale,
      reduceMotion,
      sidebarCollapsed
    }));
  }

  function applyTheme() {
    document.documentElement.dataset.theme = "dark";
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", "#111110");
  }

  function applyMotionPreference() {
    document.documentElement.dataset.motion = reduceMotion ? "reduced" : "full";
  }

  function loadUiPreferences() {
    try {
      const stored = JSON.parse(localStorage.getItem(uiPreferencesKey) ?? "{}") as Record<string, unknown>;
      locale = "ru";
      if (typeof stored.reduceMotion === "boolean") reduceMotion = stored.reduceMotion;
      if (typeof stored.sidebarCollapsed === "boolean") sidebarCollapsed = stored.sidebarCollapsed;
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

  function toggleMotionPreference() {
    reduceMotion = !reduceMotion;
    applyMotionPreference();
    saveUiPreferences();
  }

  function plainTaskTitle(value: string) {
    return value
      .replace(/^#{1,3}\s*/, "")
      .replace(/^[-*>]\s+/, "")
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\*\*|\*/g, "")
      .replace(/<\/?u>/g, "")
      .trim();
  }

  function splitTaskDescription(description: string) {
    const lines = description.replace(/\r\n?/g, "\n").split("\n");
    const titleIndex = lines.findIndex((line) => line.trim());
    if (titleIndex < 0) return { title: "", body: "" };
    const title = plainTaskTitle(lines[titleIndex]);
    const bodyLines = lines.slice(titleIndex + 1);
    while (bodyLines[0]?.trim() === "") bodyLines.shift();
    return { title, body: bodyLines.join("\n").trimEnd() };
  }

  function composeTaskDescription(title: string, body: string) {
    const normalizedTitle = title.trim() || t("untitled");
    const normalizedBody = body.replace(/\r\n?/g, "\n").trim();
    return normalizedBody ? `# ${normalizedTitle}\n\n${normalizedBody}` : `# ${normalizedTitle}`;
  }

  function taskTitle(description: string) {
    return splitTaskDescription(description).title || t("untitled");
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
      relations: task.relations ?? [],
      checkpoints: task.checkpoints ?? [],
      checkpointCount: task.checkpoints?.length ?? task.checkpoint_count ?? 0,
      markdown: task.description,
      source,
      sourceAuthor: source?.author ?? ("source_author" in task ? task.source_author : undefined),
      hasSource: "has_source" in task ? task.has_source : Boolean(source),
      trashedAt: task.trashed_at,
      version: task.version
    };
  }

  function taskRelationLabel(kind: TaskRelationKind) {
    return t(kind === "blocked_by" ? "blockedBy" : kind === "subtask_of" ? "subtaskOf" : "relatedTask");
  }

  function relationTarget(relation: TaskRelation) {
    return tasks.find((task) => task.id === relation.task_id);
  }

  function latestTaskCheckpoint(task: TaskItem) {
    return task.checkpoints.at(-1);
  }

  function checkpointIsRepresentedByLatestRun(checkpoint: TaskCheckpoint, run?: AgentRun) {
    return Boolean(run && checkpoint.agent_run_id === run.id && run.result);
  }

  function taskHasOpenBlockers(task: TaskItem) {
    return task.relations.some((relation) =>
      relation.kind === "blocked_by" && !relationTarget(relation)?.completed
    );
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
          return { ...converted, source: previousSelected.source, hasSource: previousSelected.hasSource, checkpoints: previousSelected.checkpoints };
        }
        return converted;
      });
      trashedTasks = trash.map((task) => toTaskItem(task, nextChats));
      if (!preserveSelection || !nextChats.some((chat) => chat.id === selectedChatId) || selectedChatId === "all") {
        const savedProjectId = localStorage.getItem("flood.selected-project");
        selectedChatId = nextChats.find((chat) => chat.id === savedProjectId)?.id ?? nextChats[1]?.id ?? "all";
      }
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
      const bareUrlMatch = value.slice(cursor).match(/^https?:\/\/[^\s]+/i);
      if (bareUrlMatch) {
        const url = bareUrlMatch[0].replace(/[.,!?;:]+$/, "");
        if (isHttpUrl(url)) {
          const link = document.createElement("a");
          link.textContent = url;
          decorateExternalLink(link, url);
          parent.append(link);
          cursor += url.length;
          continue;
        }
      }
      const nextCandidates = [value.indexOf("![", cursor + 1), value.indexOf("**", cursor + 1), value.indexOf("*", cursor + 1), value.indexOf("<u>", cursor + 1), value.indexOf("[", cursor + 1), value.indexOf("http://", cursor + 1), value.indexOf("https://", cursor + 1)].filter((index) => index >= 0);
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
    const description = splitTaskDescription(value);
    taskTitleDraft = description.title;
    editorRoot.replaceChildren(...description.body.split("\n").map((line) => {
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
    const body = blocks.map((block) => {
      const kind = (block.dataset.block as BlockKind) || "paragraph";
      const prefix = kind === "number" ? `${block.dataset.number ?? "1"}. ` : blockPrefixes[kind];
      return `${prefix}${[...block.childNodes].map(serializeInline).join("")}`;
    }).join("\n");
    markdown = composeTaskDescription(taskTitleDraft, body);
    const nextTitle = taskTitleDraft.trim() || t("untitled");
    tasks = tasks.map((task) => task.id === selectedTaskId ? { ...task, markdown, title: nextTitle } : task);
    scheduleSave();
  }

  function syncTaskTitle(event: Event) {
    const field = event.currentTarget as HTMLTextAreaElement;
    taskTitleDraft = field.value.replace(/[\r\n]+/g, " ");
    field.value = taskTitleDraft;
    if (selectedTaskId === draftTaskId) draftDirty = true;
    serializeEditor();
  }

  function handleTaskTitleKeydown(event: KeyboardEvent) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    void focusEditor();
  }

  function fitTaskTitle(node: HTMLTextAreaElement, _value: string) {
    if (CSS.supports("field-sizing", "content")) return {};
    const resize = () => {
      node.style.height = "auto";
      node.style.height = `${node.scrollHeight}px`;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(node.parentElement!);
    resize();
    void document.fonts.ready.then(() => { if (node.isConnected) resize(); });
    return { update: () => { void tick().then(resize); }, destroy: () => observer.disconnect() };
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
    if (selectedTaskId === draftTaskId) {
      selectedTaskId = "";
      selectedTaskNavigationScope = "";
    }
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
          saveError = commandErrorMessage(error);
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
        saveError = commandErrorMessage(error);
        if (isConflictError(error)) {
          try {
            conflictRemote = await invoke<TaskRecord>("get_task", { id: taskId });
          } catch {
            conflictRemote = null;
          }
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
    const snapshot = local.markdown;
    try {
      saveState = "saving";
      const saved = await invoke<TaskRecord>("update_task", {
        id: local.id,
        patch: { description: snapshot },
        expectedVersion: conflictRemote.version
      });
      const converted = toTaskItem(saved);
      tasks = tasks.map((task) => {
        if (task.id !== saved.id) return task;
        if (task.markdown !== snapshot) {
          return { ...task, version: saved.version, updatedAt: saved.updated_at, updated: relativeDate(saved.updated_at) };
        }
        return converted;
      });
      const current = tasks.find((task) => task.id === saved.id);
      markdown = current?.markdown ?? converted.markdown;
      lastSavedMarkdown = snapshot;
      conflictRemote = null;
      saveError = "";
      saveState = "saved";
      if (current && current.markdown !== snapshot) scheduleSave();
    } catch (error) {
      saveState = "error";
      saveError = commandErrorMessage(error);
      if (isConflictError(error)) {
        try {
          conflictRemote = await invoke<TaskRecord>("get_task", { id: local.id });
        } catch {
          // Keep the previous remote version so the local draft remains recoverable.
        }
      }
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
      closeSelectionToolbar();
      return;
    }
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer instanceof Element ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
    if (!container || !editorRoot.contains(container)) {
      closeSelectionToolbar();
      return;
    }
    savedSelection = range.cloneRange();
    if (selection.isCollapsed) {
      closeSelectionToolbar();
      return;
    }
    const rect = range.getBoundingClientRect();
    selectionToolbar = {
      left: Math.max(12, Math.min(window.innerWidth - 214, rect.left + rect.width / 2 - 103)),
      top: Math.max(58, rect.top - 44)
    };
  }

  function closeSelectionToolbar() {
    selectionToolbar = null;
    savedSelection = null;
    linkEditorOpen = false;
    linkDraft = "";
  }

  function handleEditorBlur() {
    editorHint = null;
    clearAttachmentSelection();
    void saveNow();
    window.setTimeout(() => {
      const active = document.activeElement;
      if (!(active instanceof Element && active.closest(".selection-toolbar"))) closeSelectionToolbar();
    });
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
    const sidebarEdge = document.querySelector(".sidebar-panel")?.getBoundingClientRect().right ?? 0;
    const title = t(hintKey);
    const estimatedWidth = Math.min(180, title.length * 7 + 24);
    editorHint = {
      title,
      left: Math.max(sidebarEdge + 8, bounds.left - 12 - estimatedWidth),
      top: Math.max(58, Math.min(bounds.top + (bounds.height - 26) / 2, window.innerHeight - 34))
    };
  }

  $: selectedTask = tasks.find((task) => task.id === selectedTaskId);
  $: latestAgentRun = selectedTaskRuns[0];
  $: latestCheckpoint = selectedTask ? latestTaskCheckpoint(selectedTask) : undefined;
  $: visibleAgentQueue = agentQueueRuns.filter((run) => ["queued", "running", "needs_input"].includes(run.state));
  $: currentProjectAgentRuns = visibleAgentQueue.filter((run) => selectedChatId === "all" || run.project_id === selectedChatId);
  $: currentProjectPrimaryRun = currentProjectAgentRuns.find((run) => run.state === "running") ?? currentProjectAgentRuns.find((run) => run.state === "needs_input") ?? currentProjectAgentRuns.find((run) => run.state === "queued");
  $: currentProjectQueuedCount = currentProjectAgentRuns.filter((run) => run.state === "queued").length;
  $: currentChat = chats.find((chat) => chat.id === selectedChatId) ?? allChat(0);
  $: dockProject = workspaceView === "task" && selectedTask ? chats.find((chat) => chat.id === selectedTask.chatId) : currentChat;
  $: telegramConnectionsProject = chats.find((chat) => chat.id === telegramPickerProjectId && chat.id !== "all");
  $: telegramVisibleChats = telegramChatSearch.trim() ? telegramSearchResults : telegramChats;
  // Navigation owns projects; tasks appear once, in the working list or search.
  $: sidebarOpenTasks = tasks.filter((task) => !isLocalDraft(task) && !task.completed);
  $: currentProjectTasks = tasks
    .filter((task) => !isLocalDraft(task) && (selectedChatId === "all" || task.chatId === selectedChatId))
    .sort((left, right) => ({ urgent: 0, important: 1, normal: 2 })[left.urgency] - ({ urgent: 0, important: 1, normal: 2 })[right.urgency]);
  $: currentOpenTasks = currentProjectTasks.filter((task) => !task.completed);
  $: currentCompletedTasks = currentProjectTasks.filter((task) => task.completed);
  $: urgentTaskCount = currentOpenTasks.filter((task) => task.urgency === "urgent").length;
  $: filteredProjectTasks = projectTab === "closed" ? currentCompletedTasks : projectTab === "urgent" ? currentOpenTasks.filter((task) => task.urgency === "urgent") : currentOpenTasks;
  $: commandResults = buildCommandResults(commandQuery, tasks, chats, locale, telegramStatus.step);
  $: setupHasProject = chats.length > 1;
  $: setupHasTask = tasks.some((task) => !isLocalDraft(task)) || trashedTasks.length > 0;
  $: setupCompleted = Number(setupHasProject) + Number(setupHasTask);

  function openTaskCount(chatId: string) {
    return sidebarOpenTasks.filter((task) => chatId === "all" || task.chatId === chatId).length;
  }

  async function selectChat(chat: ChatItem) {
    const leavingProjectContext = projectContextOpen;
    if (leavingProjectContext) {
      if (!closeProjectContext(false)) return;
    } else if (!await persistCurrentTask()) return;
    closeProjectActions();
    projectTaskError = "";
    renameChatOpen = false;
    discardLocalDraft();
    selectedTaskId = "";
    selectedTaskNavigationScope = "";
    markdown = "";
    lastSavedMarkdown = "";
    saveState = "idle";
    createChatOpen = false;
    createChatTitle = "";
    selectedChatId = chat.id;
    if (chat.id !== "all") localStorage.setItem("flood.selected-project", chat.id);
    projectPickerOpen = false;
    projectTab = "all";
    activeSection = "tasks";
    workspaceView = "project";
    buddyActivityOpen = false;
    projectAttention = [];
    projectWorkspaceItems = [];
    projectKnowledgeProposals = [];
    if (chat.id !== "all") void loadProjectActivity(chat.id);
    completedGroupOpen = false;
    deleteChatConfirmOpen = false;
    editorHint = null;
    sourceEditorOpen = false;
    datePickerOpen = false;
    taskActionMenuOpen = false;
    closeSelectionToolbar();
  }

  async function openHomeProject(projectId: string) {
    const project = chats.find((chat) => chat.id === projectId);
    if (project) await selectChat(project);
  }

  async function openHomeContext(projectId: string) {
    const project = chats.find((chat) => chat.id === projectId);
    if (!project) return;
    await selectChat(project);
    await openProjectContext();
  }

  async function openHomeTask(taskId: string) {
    const task = tasks.find((candidate) => candidate.id === taskId);
    if (task) await openTask(task, "all");
  }

  async function completeHomeTask(taskId: string) {
    const task = tasks.find((candidate) => candidate.id === taskId);
    if (task) await setListedTaskCompleted(task, true);
  }

  function buildCommandResults(value: string, taskList: TaskItem[], projectList: ChatItem[], _locale: Locale, _telegramStep: string): CommandItem[] {
    const needle = value.trim().toLocaleLowerCase(locale);
    const actions: CommandItem[] = [
      { id: "action:new-task", group: "actions", title: t("newTask"), meta: "Ctrl+N", keywords: `${t("newTask")} создать добавить` },
      { id: "action:all-tasks", group: "actions", title: t("home"), meta: openTasksLabel(taskList.filter((task) => !task.completed && !isLocalDraft(task)).length), keywords: `${t("home")} ${t("allTasks")} список` },
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
    if (activeSection !== "settings") return;
    settingsSection = section === "appearance" || section === "about" ? "general" : section === "mcp" ? "agents" : section;
    await tick();
    revealSettingsSection();
    document.querySelector(".settings-workspace")?.scrollTo({ top: 0 });
    if (section === "data" && !attachmentCleanupReport) void loadAttachmentCleanupReport();
    if (section === "agents" || section === "mcp") {
      void loadAgentAdapters();
      if (!mcpActivity.length && mcpActivityState === "idle") void loadMcpActivity();
    }
  }

  async function continueInitialSetup() {
    await changeSection("tasks");
    if (activeSection !== "tasks") return;
    if (!setupHasProject) {
      projectPickerOpen = true;
      createChatOpen = true;
      await tick();
      document.querySelector<HTMLInputElement>("#prototype-project-name")?.focus();
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
      await requestNewTask("workspace");
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
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog || !dialog.contains(document.activeElement))) {
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

  function closeProjectActions(restoreFocus = false) {
    projectActionsOpen = false;
    if (restoreFocus) projectActionsTrigger?.focus();
  }

  async function toggleProjectActions(trigger: HTMLButtonElement) {
    projectActionsTrigger = trigger;
    projectActionsOpen = !projectActionsOpen;
    newTaskMenuAnchor = null;
    if (projectActionsOpen) {
      await tick();
      document.querySelector<HTMLButtonElement>("#project-actions-panel button")?.focus();
    }
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
    if (event.key === "Escape" && event.target instanceof Element && event.target.closest(".dock")) return;
    if (event.key === "Escape") {
      if (projectPickerOpen) { projectPickerOpen = false; createChatOpen = false; event.preventDefault(); projectPickerButton?.focus(); }
      else if (projectActionsOpen) { event.preventDefault(); closeProjectActions(true); }
      else if (projectContextDiscardOpen) projectContextDiscardOpen = false;
      else if (commandPaletteOpen) closeCommandPalette();
      else if (projectWorkspaceEditorId && !projectWorkspaceSaving) closeProjectWorkspaceEditor();
      else if (projectContextOpen && !projectContextSaving) closeProjectContext();
      else if (telegramConnectionsProject) closeTelegramConnections();
      else if (telegramInboxOpen && !telegramInboxProcessingId) closeTelegramInbox();
      else if (telegramImportOpen) closeTelegramImporter();
      else if (imageViewer) closeImageViewer();
      else if (sourceViewerOpen) closeSourceViewer();
      else if (newTaskMenuAnchor || urgencyMenuOpen || taskActionMenuOpen || sourceEditorOpen || datePickerOpen) {
        const returnToTaskActions = sourceEditorOpen;
        newTaskMenuAnchor = null;
        urgencyMenuOpen = false;
        taskActionMenuOpen = false;
        moveMenuOpen = false;
        sourceEditorOpen = false;
        datePickerOpen = false;
        if (returnToTaskActions) void tick().then(() => document.querySelector<HTMLButtonElement>(".task-actions-trigger")?.focus());
      }
      else if (activeSection === "tasks" && workspaceView === "task") await backToProject();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k" && activeSection === "tasks" && (workspaceView === "project" || workspaceView === "task") && dockProject?.id !== "all" && !dockTaskModalOpen && !dockProjectModalOpen) {
      event.preventDefault();
      dock?.focus();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k") return;
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
    if (event.altKey && event.key === "ArrowLeft" && activeSection === "tasks" && workspaceView === "context") {
      event.preventDefault();
      closeProjectContext();
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

  async function focusTaskTitle() {
    await tick();
    taskTitleInput?.focus();
    taskTitleInput?.select();
  }

  async function openTask(task: TaskItem, navigationScope = task.chatId) {
    if (projectTaskPendingIds.includes(task.id)) return;
    if (!await persistCurrentTask()) return;
    discardLocalDraft();
    createChatOpen = false;
    createChatTitle = "";
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
    }
    selectedTaskId = fullTask.id;
    selectedTaskNavigationScope = navigationScope;
    markdown = fullTask.markdown;
    lastSavedMarkdown = fullTask.markdown;
    saveState = "idle";
    workspaceView = "task";
    activeSection = "tasks";
    editorHint = null;
    sourceEditorOpen = false;
    closeSelectionToolbar();
    closeSourceViewer();
    taskActionMenuOpen = false;
    selectedTaskRuns = [];
    agentRunError = "";
    agentResponse = "";
    void loadTaskAgentRuns(fullTask.id);
    void tick().then(() => renderMarkdown(markdown));
  }

  async function loadTaskAgentRuns(taskId = selectedTaskId) {
    if (!inTauri() || !taskId || taskId.startsWith("draft-")) return;
    try {
      selectedTaskRuns = await invoke<AgentRun[]>("list_task_agent_runs", { taskId });
      agentRunError = "";
    } catch (error) {
      agentRunError = String(error);
    }
  }

  async function loadAgentQueue() {
    if (!inTauri()) return;
    try {
      agentQueueRuns = await invoke<AgentRun[]>("list_agent_runs", { activeOnly: false });
    } catch {
      // Очередь вторична: ошибка статуса не должна мешать работе с задачами.
    }
  }

  async function startCodexTask() {
    if (!selectedTask || agentRunBusy || !await persistCurrentTask(true)) return;
    agentRunBusy = true;
    agentRunError = "";
    try {
      const run = await invoke<AgentRun>("start_codex_task", { taskId: selectedTask.id });
      selectedTaskRuns = [run, ...selectedTaskRuns];
      void loadAgentQueue();
    } catch (error) {
      agentRunError = String(error);
    } finally {
      agentRunBusy = false;
    }
  }

  async function cancelAgentRun(run: AgentRun) {
    if (agentRunBusy) return;
    agentRunBusy = true;
    try {
      const updated = await invoke<AgentRun>("cancel_agent_run", { id: run.id });
      selectedTaskRuns = selectedTaskRuns.map((item) => item.id === updated.id ? updated : item);
      void loadAgentQueue();
    } catch (error) {
      agentRunError = String(error);
    } finally {
      agentRunBusy = false;
    }
  }

  async function continueCodexTask() {
    if (!latestAgentRun || latestAgentRun.state !== "needs_input" || agentRunBusy || !agentResponse.trim()) return;
    agentRunBusy = true;
    agentRunError = "";
    try {
      const updated = await invoke<AgentRun>("continue_codex_task", { id: latestAgentRun.id, response: agentResponse.trim() });
      selectedTaskRuns = selectedTaskRuns.map((item) => item.id === updated.id ? updated : item);
      agentResponse = "";
      void loadAgentQueue();
    } catch (error) {
      agentRunError = String(error);
    } finally {
      agentRunBusy = false;
    }
  }

  async function acceptAgentResult() {
    if (!selectedTask || !latestAgentRun || latestAgentRun.state !== "ready_for_review" || agentRunBusy || !await persistCurrentTask(true)) return;
    agentRunBusy = true;
    agentRunError = "";
    try {
      const accepted = await invoke<AcceptedAgentRun>("accept_agent_run", {
        id: latestAgentRun.id,
        expectedTaskVersion: selectedTask.version
      });
      const converted = toTaskItem(accepted.task);
      tasks = tasks.map((task) => task.id === converted.id ? converted : task);
      selectedTaskRuns = selectedTaskRuns.map((run) => run.id === accepted.run.id ? accepted.run : run);
      lastSavedMarkdown = converted.markdown;
      saveState = "saved";
      void loadAgentQueue();
    } catch (error) {
      agentRunError = String(error);
    } finally {
      agentRunBusy = false;
    }
  }

  function agentRunLabel(state: AgentRunState) {
    const keys: Record<AgentRunState, MessageKey> = {
      queued: "agentRunQueued", running: "agentRunRunning", ready_for_review: "agentRunReady",
      accepted: "agentRunAccepted",
      needs_input: "agentRunNeedsInput", failed: "agentRunFailed", cancelled: "agentRunCancelled",
      interrupted: "agentRunInterrupted"
    };
    return t(keys[state]);
  }

  function agentRunTask(run: AgentRun) {
    return tasks.find((task) => task.id === run.task_id);
  }

  function openAgentRunTask(run: AgentRun) {
    const task = agentRunTask(run);
    if (task) void openTask(task, selectedChatId === "all" ? "all" : task.chatId);
  }

  function openProjectAttentionTask(item: ProjectAttention) {
    if (item.event_id) {
      projectAttentionAnswerId = projectAttentionAnswerId === item.event_id ? "" : item.event_id;
      projectAttentionAnswer = "";
      return;
    }
    if (!item.task_id) return;
    const task = tasks.find((candidate) => candidate.id === item.task_id);
    if (!task) return;
    if (!closeProjectContext()) return;
    void openTask(task, task.chatId);
  }

  async function answerProjectAttention(item: ProjectAttention) {
    if (!item.event_id || !projectAttentionAnswer.trim() || projectAttentionBusy) return;
    if (!inTauri()) {
      projectAttention = projectAttention.filter((candidate) => candidate.event_id !== item.event_id);
      projectAttentionAnswerId = "";
      projectAttentionAnswer = "";
      return;
    }
    projectAttentionBusy = true;
    projectContextError = "";
    try {
      await invoke("answer_project_attention", { eventId: item.event_id, answer: projectAttentionAnswer.trim() });
      projectAttention = projectAttention.filter((candidate) => candidate.event_id !== item.event_id);
      projectAttentionAnswerId = "";
      projectAttentionAnswer = "";
    } catch (error) {
      projectContextError = String(error);
    } finally {
      projectAttentionBusy = false;
    }
  }

  async function requestNewTask(anchor: "sidebar" | "workspace" = "workspace") {
    if (projectContextOpen && !closeProjectContext()) return;
    if (currentChat.id !== "all") {
      await createDraft(currentChat);
      return;
    }
    if (!await persistCurrentTask()) return;
    activeSection = "tasks";
    workspaceView = "project";
    if (chats.length <= 1) {
      projectPickerOpen = true;
      createChatOpen = true;
      await tick();
      document.querySelector<HTMLInputElement>("#prototype-project-name")?.focus();
      return;
    }
    newTaskMenuAnchor = newTaskMenuAnchor === anchor ? null : anchor;
    await tick();
    document.querySelector<HTMLButtonElement>(".new-task-menu button")?.focus();
  }

  async function createDraft(chosenChat?: ChatItem) {
    if (projectContextOpen && !closeProjectContext()) return;
    if (!await persistCurrentTask()) return;
    discardLocalDraft();
    const targetChat = chosenChat ?? (selectedChatId === "all" ? undefined : currentChat);
    if (!targetChat || targetChat.id === "all" || !inTauri()) return;
    activeSection = "tasks";
    closeProjectActions();
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
      relations: [],
      checkpoints: [],
      checkpointCount: 0,
      markdown: "# ",
      hasSource: false,
      version: ""
    };
    draftTaskId = draft.id;
    draftDirty = false;
    tasks = [draft, ...tasks];
    selectedChatId = targetChat.id;
    selectedTaskId = draft.id;
    selectedTaskNavigationScope = targetChat.id;
    markdown = draft.markdown;
    lastSavedMarkdown = draft.markdown;
    saveState = "idle";
    workspaceView = "task";
    void tick().then(() => { renderMarkdown(markdown); void focusTaskTitle(); });
  }

  async function backToProject() {
    if (!await persistCurrentTask()) return;
    discardLocalDraft();
    workspaceView = "project";
    selectedTaskId = "";
    selectedTaskNavigationScope = "";
    markdown = "";
    lastSavedMarkdown = "";
    editorHint = null;
    closeSelectionToolbar();
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
    closeProjectActions();
    renameChatTitle = currentChat.title;
    renameChatOpen = true;
    formError = "";
    void tick().then(() => document.querySelector<HTMLInputElement>(".rename-chat-form input")?.focus());
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

  async function openProjectContext() {
    if (currentChat.id === "all") return;
    projectContextReturnFocus = focusedElement();
    projectContextProjectId = currentChat.id;
    projectContextProjectTitle = currentChat.title;
    projectContextVersion = currentChat.version;
    projectContextDraft = currentChat.context ?? "";
    projectContextResources = (currentChat.resources ?? []).map((resource) => ({ ...resource }));
    projectContextSavedDraft = projectContextDraft;
    projectContextSavedResources = JSON.stringify(projectContextResources);
    projectContextDiscardOpen = false;
    projectAttention = [];
    projectAttentionAnswerId = "";
    projectAttentionAnswer = "";
    projectAutoRunDraft = false;
    projectAutoRunSaved = false;
    projectAutoRunLoading = inTauri();
    projectResourceAddOpen = false;
    projectGithubOpen = false;
    projectContextEditorMode = "edit";
    projectWorkspaceSection = "context";
    projectWorkspaceItems = [];
    projectKnowledgeProposals = [];
    projectKnowledgeError = "";
    projectKnowledgePendingId = "";
    projectWorkspaceError = "";
    resetProjectWorkspaceEditor();
    expandedProjectResourceId = "";
    projectContextError = "";
    projectContextConflictRemote = null;
    resetProjectMemoryEditor(true);
    projectContextOpen = true;
    workspaceView = "context";
    if (githubStatus.connected && !githubRepositories.length) void loadGithubRepositories();
    await tick();
    projectContextDialog?.focus();
    if (inTauri()) {
      void loadProjectWorkspaceItems();
      void loadProjectKnowledgeProposals();
      try {
        const policy = await invoke<ProjectAutomationPolicy>("project_automation_policy", { projectId: currentChat.id });
        projectAutoRunDraft = policy.auto_run_created_tasks;
        projectAutoRunSaved = policy.auto_run_created_tasks;
      } catch (error) {
        projectContextError = String(error);
      } finally {
        projectAutoRunLoading = false;
      }
      try {
        projectAttention = await invoke<ProjectAttention[]>("project_attention", { projectId: currentChat.id });
      } catch (error) {
        projectContextError ||= String(error);
      }
    }
  }

  function projectContextIsDirty() {
    return projectContextDraft !== projectContextSavedDraft
      || JSON.stringify(projectContextResources) !== projectContextSavedResources
      || projectAutoRunDraft !== projectAutoRunSaved;
  }

  function openDockTaskModal(title = "") {
    dockTaskTitle = title;
    dockTaskDetails = "";
    dockTaskProjectId = currentChat.id !== "all" ? currentChat.id : chats.find((chat) => chat.id !== "all")?.id ?? "";
    dockTaskUrgency = "normal";
    dockModalError = "";
    dockTaskModalOpen = true;
  }

  function openDockProjectModal() {
    dockProjectTitle = "";
    dockModalError = "";
    dockProjectModalOpen = true;
  }

  async function submitDockTask(event: SubmitEvent) {
    event.preventDefault();
    const title = dockTaskTitle.trim().replace(/\s*\r?\n\s*/g, " ");
    const projectId = dockTaskProjectId;
    if (!title || !projectId || dockModalBusy || !inTauri()) return;
    dockModalBusy = true;
    dockModalError = "";
    try {
      const details = dockTaskDetails.trim();
      const description = `# ${title}${details ? `\n\n${details}` : ""}`;
      await invoke<TaskRecord>("create_task", { input: { project_id: projectId, description, urgency: dockTaskUrgency, source: null } });
      await loadData(true);
      dockTaskModalOpen = false;
      const project = chats.find((chat) => chat.id === projectId);
      if (project && selectedChatId !== projectId) await selectChat(project);
    } catch (error) {
      dockModalError = commandErrorMessage(error);
    } finally {
      dockModalBusy = false;
    }
  }

  async function submitDockProject(event: SubmitEvent) {
    event.preventDefault();
    const title = dockProjectTitle.trim();
    if (!title || dockModalBusy || !inTauri()) return;
    dockModalBusy = true;
    dockModalError = "";
    try {
      const created = await invoke<ProjectRecord>("create_project", { title });
      await loadData(true);
      dockProjectModalOpen = false;
      const project = chats.find((chat) => chat.id === created.id);
      if (project) await selectChat(project);
    } catch (error) {
      dockModalError = commandErrorMessage(error);
    } finally {
      dockModalBusy = false;
    }
  }

  function handleWindowPointerDown(event: PointerEvent) {
    if (projectPickerOpen && event.target instanceof Node && !document.querySelector(".prototype-picker-wrap")?.contains(event.target)) {
      projectPickerOpen = false;
      createChatOpen = false;
    }
  }

  function closeProjectContext(restoreFocus = true, discard = false) {
    if (projectContextSaving || projectMemorySaving) return false;
    if (!discard && projectContextIsDirty()) {
      projectContextDiscardOpen = true;
      return false;
    }
    const returnFocus = projectContextReturnFocus;
    projectContextReturnFocus = null;
    projectContextDiscardOpen = false;
    projectContextOpen = false;
    workspaceView = "project";
    projectContextProjectId = "";
    projectContextProjectTitle = "";
    projectContextVersion = "";
    projectContextDraft = "";
    projectContextResources = [];
    projectContextSavedDraft = "";
    projectContextSavedResources = "";
    projectAttentionAnswerId = "";
    projectAttentionAnswer = "";
    projectAttentionBusy = false;
    projectAutoRunDraft = false;
    projectAutoRunSaved = false;
    projectAutoRunLoading = false;
    projectResourceAddOpen = false;
    projectGithubOpen = false;
    projectContextEditorMode = "edit";
    projectWorkspaceSection = "context";
    projectWorkspaceLoading = false;
    projectWorkspaceError = "";
    projectKnowledgeLoading = false;
    projectKnowledgeError = "";
    projectKnowledgePendingId = "";
    resetProjectWorkspaceEditor();
    expandedProjectResourceId = "";
    projectContextError = "";
    projectContextConflictRemote = null;
    resetProjectMemoryEditor(true);
    if (restoreFocus) restoreModalFocus(returnFocus);
    return true;
  }

  async function reloadProjectContext() {
    if (!projectContextProjectId) return;
    projectContextConflictRemote = null;
    await loadData(true);
    const project = chats.find((item) => item.id === projectContextProjectId);
    if (!project) return;
    projectContextProjectTitle = project.title;
    projectContextVersion = project.version;
    projectContextDraft = project.context ?? "";
    projectContextResources = (project.resources ?? []).map((resource) => ({ ...resource }));
    projectContextSavedDraft = projectContextDraft;
    projectContextSavedResources = JSON.stringify(projectContextResources);
    projectContextDiscardOpen = false;
    projectAttention = inTauri()
      ? await invoke<ProjectAttention[]>("project_attention", { projectId: project.id }).catch(() => [])
      : projectAttention;
    projectAutoRunLoading = inTauri();
    projectResourceAddOpen = false;
    projectGithubOpen = false;
    expandedProjectResourceId = "";
    projectContextError = "";
    projectContextConflictRemote = null;
    resetProjectMemoryEditor(false);
    resetProjectWorkspaceEditor();
    if (inTauri()) void loadProjectWorkspaceItems();
    if (inTauri()) {
      try {
        const policy = await invoke<ProjectAutomationPolicy>("project_automation_policy", { projectId: project.id });
        projectAutoRunDraft = policy.auto_run_created_tasks;
        projectAutoRunSaved = policy.auto_run_created_tasks;
      } catch (error) {
        projectContextError = String(error);
      } finally {
        projectAutoRunLoading = false;
      }
    }
    await tick();
    projectContextDialog?.focus();
  }

  function resetProjectMemoryEditor(clearSearch = false) {
    projectMemoryEditorId = "";
    projectMemoryEditorMode = "edit";
    projectMemoryDraft = "";
    projectMemoryPinned = false;
    projectMemorySaving = false;
    projectMemoryError = "";
    projectMemoryDeleteConfirmId = "";
    if (clearSearch) {
      projectMemorySearch = "";
      projectMemoryShowSuperseded = false;
    }
  }

  function resetProjectWorkspaceEditor() {
    projectWorkspaceEditorId = "";
    projectWorkspaceTitle = "";
    projectWorkspaceSummary = "";
    projectWorkspaceContent = "";
    projectWorkspaceAgentAccess = false;
    projectWorkspaceSaving = false;
    projectWorkspaceDeleteConfirm = false;
    projectWorkspaceCloseConfirm = false;
    projectWorkspaceOriginal = "";
    projectWorkspaceConflictRemote = null;
    projectWorkspaceConflictAction = null;
  }

  function projectWorkspaceDraftSignature() {
    return JSON.stringify({
      title: projectWorkspaceTitle,
      summary: projectWorkspaceSummary,
      content: projectWorkspaceContent,
      agent_access: projectWorkspaceAgentAccess
    });
  }

  function projectWorkspaceHasUnsavedChanges() {
    return Boolean(projectWorkspaceEditorId) && projectWorkspaceDraftSignature() !== projectWorkspaceOriginal;
  }

  function projectWorkspaceModalTitle() {
    if (projectWorkspaceEditorId !== "new") return projectWorkspaceTitle || t("projectWorkspaceTitlePlaceholder");
    if (projectWorkspaceEditorKind === "document") return t("newProjectDocument");
    if (projectWorkspaceEditorKind === "rule") return t("newProjectRule");
    return t("newProjectSkill");
  }

  function closeProjectWorkspaceEditor(force = false) {
    if (projectWorkspaceSaving && !force) return;
    if (!force && projectWorkspaceHasUnsavedChanges()) {
      projectWorkspaceCloseConfirm = true;
      return;
    }
    const returnFocus = projectWorkspaceReturnFocus;
    projectWorkspaceReturnFocus = null;
    resetProjectWorkspaceEditor();
    restoreModalFocus(returnFocus);
  }

  function keepEditingProjectWorkspaceItem() {
    projectWorkspaceCloseConfirm = false;
    void tick().then(() => projectWorkspaceDialog?.focus());
  }

  function handleProjectWorkspaceModalKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeProjectWorkspaceEditor();
      return;
    }
    trapModalFocus(event);
  }

  function activeBuddyProjectId() {
    if (projectContextOpen && projectContextProjectId) return projectContextProjectId;
    return selectedChatId === "all" ? "" : selectedChatId;
  }

  async function loadProjectWorkspaceItems(projectId = activeBuddyProjectId()) {
    if (!projectId || !inTauri()) return;
    projectWorkspaceLoading = true;
    projectWorkspaceError = "";
    try {
      const items = await invoke<ProjectWorkspaceItem[]>("list_project_workspace_items", { projectId });
      if (activeBuddyProjectId() === projectId) projectWorkspaceItems = items;
    } catch (error) {
      if (activeBuddyProjectId() === projectId) projectWorkspaceError = String(error);
    } finally {
      if (activeBuddyProjectId() === projectId) projectWorkspaceLoading = false;
    }
  }

  async function loadProjectKnowledgeProposals(projectId = activeBuddyProjectId()) {
    if (!projectId || !inTauri()) return;
    projectKnowledgeLoading = true;
    projectKnowledgeError = "";
    try {
      const proposals = await invoke<ProjectKnowledgeProposal[]>("list_project_knowledge_proposals", { projectId });
      if (activeBuddyProjectId() === projectId) projectKnowledgeProposals = proposals;
    } catch (error) {
      if (activeBuddyProjectId() === projectId) projectKnowledgeError = commandErrorMessage(error);
    } finally {
      if (activeBuddyProjectId() === projectId) projectKnowledgeLoading = false;
    }
  }

  async function loadProjectActivity(projectId = activeBuddyProjectId()) {
    if (!projectId || !inTauri()) return;
    void loadProjectWorkspaceItems(projectId);
    void loadProjectKnowledgeProposals(projectId);
    try {
      const attention = await invoke<ProjectAttention[]>("project_attention", { projectId });
      if (activeBuddyProjectId() === projectId) projectAttention = attention;
    } catch (error) {
      if (activeBuddyProjectId() === projectId) projectKnowledgeError ||= commandErrorMessage(error);
    }
  }

  async function applyProjectKnowledgeProposal(proposal: ProjectKnowledgeProposal) {
    if (!proposal.project_id || !inTauri() || projectKnowledgePendingId) return false;
    projectKnowledgePendingId = proposal.id;
    projectKnowledgeError = "";
    try {
      const decision = await invoke<ProjectKnowledgeProposalDecision>("apply_project_knowledge_proposal", {
        projectId: proposal.project_id,
        proposalId: proposal.id
      });
      projectKnowledgeProposals = projectKnowledgeProposals.map((item) => item.id === decision.proposal.id ? decision.proposal : item);
      if (decision.workspaceItem) {
        projectWorkspaceItems = projectWorkspaceItems.map((item) => item.id === decision.workspaceItem!.id ? decision.workspaceItem! : item);
      }
      if (decision.project) applyProjectMemoryUpdate(decision.project);
      return true;
    } catch (error) {
      const parsed = parseCommandError(error);
      projectKnowledgeError = parsed.code === "conflict" ? t("knowledgeProposalConflict") : parsed.message;
      await loadProjectWorkspaceItems(proposal.project_id);
      return false;
    } finally {
      projectKnowledgePendingId = "";
    }
  }

  async function rejectProjectKnowledgeProposal(proposal: ProjectKnowledgeProposal, decisionReason: string) {
    if (!proposal.project_id || !inTauri() || projectKnowledgePendingId) return false;
    projectKnowledgePendingId = proposal.id;
    projectKnowledgeError = "";
    try {
      const rejected = await invoke<ProjectKnowledgeProposal>("reject_project_knowledge_proposal", {
        projectId: proposal.project_id,
        proposalId: proposal.id,
        decisionReason: decisionReason.trim() || null
      });
      projectKnowledgeProposals = projectKnowledgeProposals.map((item) => item.id === rejected.id ? rejected : item);
      return true;
    } catch (error) {
      projectKnowledgeError = commandErrorMessage(error);
      return false;
    } finally {
      projectKnowledgePendingId = "";
    }
  }

  function projectWorkspaceItemsFor(kind: ProjectWorkspaceItemKind) {
    return projectWorkspaceItems.filter((item) => item.kind === kind);
  }

  function openProjectWorkspaceSection(section: ProjectWorkspaceSection) {
    projectWorkspaceSection = section;
    projectWorkspaceError = "";
    resetProjectWorkspaceEditor();
    if (inTauri() && section === "context") void loadProjectWorkspaceItems();
  }

  function beginCreateProjectWorkspaceItem(kind: ProjectWorkspaceItemKind) {
    projectWorkspaceReturnFocus = focusedElement();
    resetProjectWorkspaceEditor();
    projectWorkspaceEditorId = "new";
    projectWorkspaceEditorKind = kind;
    projectWorkspaceOriginal = projectWorkspaceDraftSignature();
    void tick().then(() => projectWorkspaceDialog?.focus());
  }

  function editProjectWorkspaceItem(item: ProjectWorkspaceItem) {
    projectWorkspaceReturnFocus = focusedElement();
    projectWorkspaceEditorId = item.id;
    projectWorkspaceEditorKind = item.kind;
    projectWorkspaceTitle = item.title;
    projectWorkspaceSummary = item.summary ?? "";
    projectWorkspaceContent = item.content;
    projectWorkspaceAgentAccess = item.agent_access;
    projectWorkspaceDeleteConfirm = false;
    projectWorkspaceCloseConfirm = false;
    projectWorkspaceError = "";
    projectWorkspaceConflictRemote = null;
    projectWorkspaceConflictAction = null;
    projectWorkspaceOriginal = projectWorkspaceDraftSignature();
    void tick().then(() => projectWorkspaceDialog?.focus());
  }

  function restoreProjectWorkspaceRevision(item: ProjectWorkspaceItem, revision: ProjectWorkspaceRevision) {
    projectWorkspaceSection = "context";
    editProjectWorkspaceItem(item);
    projectWorkspaceTitle = revision.title;
    projectWorkspaceSummary = revision.summary ?? "";
    projectWorkspaceContent = revision.content;
    projectWorkspaceAgentAccess = revision.agent_access;
  }

  async function refreshProjectWorkspaceConflict(id: string, action: "save" | "delete") {
    try {
      const latestItems = await invoke<ProjectWorkspaceItem[]>("list_project_workspace_items", {
        projectId: projectContextProjectId
      });
      projectWorkspaceItems = latestItems;
      projectWorkspaceConflictRemote = latestItems.find((item) => item.id === id) ?? null;
      projectWorkspaceConflictAction = projectWorkspaceConflictRemote ? action : null;
    } catch {
      // Preserve the local draft and the original error if rereading also fails.
    }
  }

  async function updateProjectWorkspaceItemAgainst(expectedVersion: string) {
    const id = projectWorkspaceEditorId;
    if (!id || id === "new") return false;
    try {
      const saved = await invoke<ProjectWorkspaceItem>("update_project_workspace_item", {
        projectId: projectContextProjectId,
        id,
        title: projectWorkspaceTitle,
        summary: projectWorkspaceSummary || null,
        content: projectWorkspaceContent,
        agentAccess: projectWorkspaceAgentAccess,
        expectedVersion
      });
      projectWorkspaceItems = projectWorkspaceItems.map((item) => item.id === saved.id ? saved : item);
      projectWorkspaceConflictRemote = null;
      projectWorkspaceConflictAction = null;
      projectWorkspaceError = "";
      return true;
    } catch (error) {
      projectWorkspaceError = commandErrorMessage(error);
      if (isConflictError(error)) await refreshProjectWorkspaceConflict(id, "save");
      return false;
    }
  }

  async function deleteProjectWorkspaceItemAgainst(id: string, expectedVersion: string) {
    try {
      await invoke("delete_project_workspace_item", {
        projectId: projectContextProjectId,
        id,
        expectedVersion
      });
      projectWorkspaceItems = projectWorkspaceItems.filter((item) => item.id !== id);
      projectWorkspaceConflictRemote = null;
      projectWorkspaceConflictAction = null;
      projectWorkspaceError = "";
      return true;
    } catch (error) {
      projectWorkspaceError = commandErrorMessage(error);
      if (isConflictError(error)) await refreshProjectWorkspaceConflict(id, "delete");
      return false;
    }
  }

  async function saveProjectWorkspaceItem() {
    if (!projectContextProjectId || !projectWorkspaceTitle.trim() || !projectWorkspaceContent.trim() || !inTauri() || projectWorkspaceSaving) return;
    projectWorkspaceSaving = true;
    projectWorkspaceError = "";
    try {
      if (projectWorkspaceEditorId === "new") {
        const saved = await invoke<ProjectWorkspaceItem>("create_project_workspace_item", {
          projectId: projectContextProjectId,
          kind: projectWorkspaceEditorKind,
          title: projectWorkspaceTitle,
          summary: projectWorkspaceSummary || null,
          content: projectWorkspaceContent,
          agentAccess: projectWorkspaceAgentAccess,
          requestId: crypto.randomUUID()
        });
        projectWorkspaceItems = [saved, ...projectWorkspaceItems];
        closeProjectWorkspaceEditor(true);
      } else {
        const current = projectWorkspaceItems.find((item) => item.id === projectWorkspaceEditorId);
        if (!current) return;
        if (await updateProjectWorkspaceItemAgainst(current.version)) closeProjectWorkspaceEditor(true);
      }
    } catch (error) {
      projectWorkspaceError = commandErrorMessage(error);
    } finally {
      projectWorkspaceSaving = false;
    }
  }

  async function deleteProjectWorkspaceItem() {
    const current = projectWorkspaceItems.find((item) => item.id === projectWorkspaceEditorId);
    if (!current || !inTauri() || projectWorkspaceSaving) return;
    if (!projectWorkspaceDeleteConfirm) {
      projectWorkspaceDeleteConfirm = true;
      return;
    }
    projectWorkspaceSaving = true;
    projectWorkspaceError = "";
    try {
      if (await deleteProjectWorkspaceItemAgainst(current.id, current.version)) closeProjectWorkspaceEditor(true);
    } finally {
      projectWorkspaceSaving = false;
    }
  }

  function useDiskProjectWorkspaceVersion() {
    const remote = projectWorkspaceConflictRemote;
    if (!remote) return;
    projectWorkspaceTitle = remote.title;
    projectWorkspaceSummary = remote.summary ?? "";
    projectWorkspaceContent = remote.content;
    projectWorkspaceAgentAccess = remote.agent_access;
    projectWorkspaceDeleteConfirm = false;
    projectWorkspaceError = "";
    projectWorkspaceConflictRemote = null;
    projectWorkspaceConflictAction = null;
    projectWorkspaceOriginal = projectWorkspaceDraftSignature();
  }

  async function keepLocalProjectWorkspaceVersion() {
    const remote = projectWorkspaceConflictRemote;
    const action = projectWorkspaceConflictAction;
    if (!remote || !action || projectWorkspaceSaving) return;
    projectWorkspaceSaving = true;
    projectWorkspaceError = "";
    try {
      const succeeded = action === "delete"
        ? await deleteProjectWorkspaceItemAgainst(remote.id, remote.version)
        : await updateProjectWorkspaceItemAgainst(remote.version);
      if (succeeded) closeProjectWorkspaceEditor(true);
    } finally {
      projectWorkspaceSaving = false;
    }
  }

  function projectMemoryEntries(state: "active" | "superseded") {
    const search = projectMemorySearch.trim().toLocaleLowerCase();
    return [...(chats.find((project) => project.id === projectContextProjectId)?.memory ?? [])]
      .filter((entry) => (entry.state ?? "active") === state)
      .filter((entry) => !search || entry.text.toLocaleLowerCase().includes(search))
      .sort((left, right) => {
        if (state === "active" && Boolean(left.pinned) !== Boolean(right.pinned)) return left.pinned ? -1 : 1;
        return new Date(right.updated_at ?? right.created_at).getTime() - new Date(left.updated_at ?? left.created_at).getTime();
      });
  }

  function applyProjectMemoryUpdate(updated: ProjectRecord) {
    chats = chats.map((project) => project.id === updated.id
      ? { ...updated, resources: updated.resources ?? [], memory: updated.memory ?? [], telegram_chats: updated.telegram_chats ?? [], open: project.open }
      : project);
    projectContextVersion = updated.version;
  }

  function beginAddProjectMemory() {
    projectMemoryEditorId = "new";
    projectMemoryEditorMode = "edit";
    projectMemoryDraft = "";
    projectMemoryPinned = false;
    projectMemoryError = "";
    projectMemoryDeleteConfirmId = "";
  }

  function beginEditProjectMemory(entry: ProjectMemoryEntry, mode: "edit" | "supersede" = "edit") {
    projectMemoryEditorId = entry.id;
    projectMemoryEditorMode = mode;
    projectMemoryDraft = entry.text;
    projectMemoryPinned = Boolean(entry.pinned);
    projectMemoryError = "";
    projectMemoryDeleteConfirmId = "";
  }

  async function saveProjectMemory() {
    const text = projectMemoryDraft.trim();
    if (!text || !projectContextProjectId || !inTauri() || projectMemorySaving) return;
    projectMemorySaving = true;
    projectMemoryError = "";
    try {
      let updated: ProjectRecord;
      if (projectMemoryEditorId === "new") {
        updated = await invoke<ProjectRecord>("add_project_memory", {
          projectId: projectContextProjectId,
          text,
          pinned: projectMemoryPinned,
          expectedVersion: projectContextVersion,
          requestId: crypto.randomUUID()
        });
      } else if (projectMemoryEditorMode === "supersede") {
        updated = await invoke<ProjectRecord>("supersede_project_memory", {
          projectId: projectContextProjectId,
          memoryId: projectMemoryEditorId,
          replacementText: text,
          pinned: projectMemoryPinned,
          expectedVersion: projectContextVersion,
          requestId: crypto.randomUUID()
        });
      } else {
        updated = await invoke<ProjectRecord>("update_project_memory", {
          projectId: projectContextProjectId,
          memoryId: projectMemoryEditorId,
          text,
          pinned: projectMemoryPinned,
          expectedVersion: projectContextVersion
        });
      }
      applyProjectMemoryUpdate(updated);
      resetProjectMemoryEditor(false);
    } catch (error) {
      projectMemoryError = String(error);
    } finally {
      projectMemorySaving = false;
    }
  }

  async function toggleProjectMemoryPin(entry: ProjectMemoryEntry) {
    if (!inTauri() || projectMemorySaving) return;
    projectMemorySaving = true;
    projectMemoryError = "";
    try {
      const updated = await invoke<ProjectRecord>("update_project_memory", {
        projectId: projectContextProjectId,
        memoryId: entry.id,
        text: entry.text,
        pinned: !entry.pinned,
        expectedVersion: projectContextVersion
      });
      applyProjectMemoryUpdate(updated);
    } catch (error) {
      projectMemoryError = String(error);
    } finally {
      projectMemorySaving = false;
    }
  }

  async function deleteProjectMemory(entry: ProjectMemoryEntry) {
    if (projectMemoryDeleteConfirmId !== entry.id) {
      projectMemoryDeleteConfirmId = entry.id;
      return;
    }
    if (!inTauri() || projectMemorySaving) return;
    projectMemorySaving = true;
    projectMemoryError = "";
    try {
      const updated = await invoke<ProjectRecord>("delete_project_memory", {
        projectId: projectContextProjectId,
        memoryId: entry.id,
        expectedVersion: projectContextVersion
      });
      applyProjectMemoryUpdate(updated);
      resetProjectMemoryEditor(false);
    } catch (error) {
      projectMemoryError = String(error);
    } finally {
      projectMemorySaving = false;
    }
  }

  async function refreshProjectContextConflict() {
    try {
      const projects = await invoke<ProjectRecord[]>("list_projects");
      projectContextConflictRemote = projects.find((project) => project.id === projectContextProjectId) ?? null;
    } catch {
      // Keep the local draft and the original error if rereading also fails.
    }
  }

  async function saveProjectContextAgainst(expectedVersion: string) {
    const submittedAutoRun = projectAutoRunDraft;
    try {
      const updated = await invoke<ProjectRecord>("update_project_details", {
        id: projectContextProjectId,
        context: projectContextDraft,
        resources: projectContextResources,
        expectedVersion
      });
      chats = chats.map((chat) => chat.id === updated.id
        ? { ...updated, resources: updated.resources ?? [], telegram_chats: updated.telegram_chats ?? [], open: chat.open }
        : chat);
      projectContextVersion = updated.version;
      projectContextSavedDraft = updated.context ?? "";
      projectContextSavedResources = JSON.stringify(updated.resources ?? []);
      projectContextConflictRemote = null;
      projectContextError = "";
      if (submittedAutoRun !== projectAutoRunSaved) {
        const policy = await invoke<ProjectAutomationPolicy>("set_project_auto_run", {
          projectId: projectContextProjectId,
          enabled: submittedAutoRun
        });
        projectAutoRunSaved = policy.auto_run_created_tasks;
      }
      return true;
    } catch (error) {
      projectContextError = commandErrorMessage(error);
      if (isConflictError(error)) await refreshProjectContextConflict();
      return false;
    }
  }

  async function saveProjectContext(event: SubmitEvent) {
    event.preventDefault();
    if (!projectContextProjectId || !inTauri() || projectContextSaving) return;
    projectContextSaving = true;
    projectContextError = "";
    if (projectContextResources.some((resource) => !resource.label.trim() || !resource.location.trim())) {
      projectContextError = t("projectResourceRequired");
      projectContextSaving = false;
      return;
    }
    const saved = await saveProjectContextAgainst(projectContextVersion);
    projectContextSaving = false;
    if (saved && !projectContextIsDirty()) closeProjectContext(true, true);
  }

  function useDiskProjectContextVersion() {
    const remote = projectContextConflictRemote;
    if (!remote) return;
    chats = chats.map((chat) => chat.id === remote.id
      ? { ...remote, resources: remote.resources ?? [], telegram_chats: remote.telegram_chats ?? [], open: chat.open }
      : chat);
    projectContextProjectTitle = remote.title;
    projectContextVersion = remote.version;
    projectContextDraft = remote.context ?? "";
    projectContextResources = (remote.resources ?? []).map((resource) => ({ ...resource }));
    projectContextSavedDraft = projectContextDraft;
    projectContextSavedResources = JSON.stringify(projectContextResources);
    projectContextConflictRemote = null;
    projectContextError = "";
    projectResourceAddOpen = false;
    expandedProjectResourceId = "";
  }

  async function keepLocalProjectContextVersion() {
    const remote = projectContextConflictRemote;
    if (!remote || projectContextSaving) return;
    projectContextSaving = true;
    projectContextError = "";
    const saved = await saveProjectContextAgainst(remote.version);
    projectContextSaving = false;
    if (saved && !projectContextIsDirty()) closeProjectContext(true, true);
  }

  function projectResourceKindLabel(kind: ProjectResourceKind) {
    const labels: Record<ProjectResourceKind, MessageKey> = {
      repository: "projectResourceRepository",
      directory: "projectResourceDirectory",
      skill: "projectResourceSkill",
      figma: "projectResourceFigma",
      documentation: "projectResourceDocumentation",
      website: "projectResourceWebsite",
      other: "projectResourceOther"
    };
    return t(labels[kind]);
  }

  async function addProjectResource(kind: ProjectResourceKind) {
    if (projectContextResources.length >= 20) {
      projectContextError = t("projectResourceLimit");
      return;
    }
    const stem = `${kind}-${Date.now().toString(36)}`;
    let id = stem;
    let suffix = 2;
    while (projectContextResources.some((resource) => resource.id === id)) id = `${stem}-${suffix++}`;
    projectContextResources = [
      { id, kind, label: projectResourceKindLabel(kind), location: "", agent_access: false },
      ...projectContextResources
    ];
    projectResourceAddOpen = false;
    expandedProjectResourceId = id;
    projectContextError = "";
    await tick();
    const row = projectContextDialog?.querySelector<HTMLElement>(`[data-project-resource-id="${id}"]`);
    row?.scrollIntoView({ block: "nearest" });
    row?.querySelector<HTMLInputElement>("input")?.focus();
  }

  function updateProjectResource(id: string, patch: Partial<ProjectResource>) {
    projectContextResources = projectContextResources.map((resource) => resource.id === id ? { ...resource, ...patch } : resource);
  }

  function removeProjectResource(id: string) {
    projectContextResources = projectContextResources.filter((resource) => resource.id !== id);
    if (expandedProjectResourceId === id) expandedProjectResourceId = "";
    projectContextError = "";
  }

  function insertProjectContextSection(title: string) {
    const heading = `## ${title}`;
    projectContextEditorMode = "edit";
    if (!projectContextDraft.includes(heading)) {
      projectContextDraft = `${projectContextDraft.trimEnd()}${projectContextDraft.trim() ? "\n\n" : ""}${heading}\n\n`;
    }
    void tick().then(() => {
      projectContextTextarea?.focus();
      const position = projectContextDraft.indexOf(heading) + heading.length + 2;
      projectContextTextarea?.setSelectionRange(position, position);
    });
  }

  function parseProjectContextPreview(markdown: string): ProjectContextPreviewBlock[] {
    const lines = markdown.replace(/\r/g, "").split("\n");
    const blocks: ProjectContextPreviewBlock[] = [];
    let index = 0;
    while (index < lines.length) {
      const line = lines[index];
      if (!line.trim()) { index += 1; continue; }
      if (line.trimStart().startsWith("```")) {
        const content: string[] = [];
        index += 1;
        while (index < lines.length && !lines[index].trimStart().startsWith("```")) content.push(lines[index++]);
        if (index < lines.length) index += 1;
        blocks.push({ kind: "code", text: content.join("\n") });
        continue;
      }
      const heading = line.match(/^(#{1,3})\s+(.+)$/);
      if (heading) {
        blocks.push({ kind: "heading", level: heading[1].length, text: heading[2] });
        index += 1;
        continue;
      }
      if (/^\s*[-*+]\s+/.test(line)) {
        const items: string[] = [];
        while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) items.push(lines[index++].replace(/^\s*[-*+]\s+/, ""));
        blocks.push({ kind: "bullets", items });
        continue;
      }
      if (/^\s*\d+[.)]\s+/.test(line)) {
        const items: string[] = [];
        while (index < lines.length && /^\s*\d+[.)]\s+/.test(lines[index])) items.push(lines[index++].replace(/^\s*\d+[.)]\s+/, ""));
        blocks.push({ kind: "numbers", items });
        continue;
      }
      if (/^\s*>\s?/.test(line)) {
        const content: string[] = [];
        while (index < lines.length && /^\s*>\s?/.test(lines[index])) content.push(lines[index++].replace(/^\s*>\s?/, ""));
        blocks.push({ kind: "quote", text: content.join(" ") });
        continue;
      }
      const content = [line.trim()];
      index += 1;
      while (index < lines.length && lines[index].trim() && !/^(#{1,3})\s+|^\s*([-*+]|\d+[.)]|>)\s+|^\s*```/.test(lines[index])) content.push(lines[index++].trim());
      blocks.push({ kind: "paragraph", text: content.join(" ") });
    }
    return blocks;
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
      selectedChatId = chats[1]?.id ?? "all";
      if (selectedChatId === "all") localStorage.removeItem("flood.selected-project");
      else localStorage.setItem("flood.selected-project", selectedChatId);
      selectedTaskId = "";
      selectedTaskNavigationScope = "";
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
    void tick().then(() => document.querySelector<HTMLTextAreaElement>(".source-popover textarea")?.focus());
  }

  function closeSourceEditor() {
    sourceEditorOpen = false;
    datePickerOpen = false;
    void tick().then(() => document.querySelector<HTMLButtonElement>(".task-actions-trigger")?.focus());
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
      if (selectedTaskNavigationScope !== "all" && selectedTaskNavigationScope !== "search") selectedTaskNavigationScope = chat.id;
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
      selectedTaskNavigationScope = "";
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

  async function setListedTaskCompleted(task: TaskItem, completed: boolean) {
    if (!inTauri() || projectTaskPendingIds.includes(task.id)) return;
    const previousFocus = focusedElement();
    const row = previousFocus?.closest(".ui-task-row");
    const list = row?.parentElement;
    const rowIndex = list && row ? Array.from(list.children).indexOf(row) : -1;
    const projectId = selectedChatId;
    projectTaskPendingIds = [...projectTaskPendingIds, task.id];
    projectTaskError = "";
    try {
      const saved = await invoke<TaskRecord>("update_task", {
        id: task.id, patch: { status: completed ? "completed" : "open" }, expectedVersion: task.version
      });
      tasks = tasks.map((item) => item.id === saved.id ? toTaskItem(saved) : item);
      await tick();
      // Completing a row removes it from this list. Keep keyboard progress local,
      // without stealing focus if the user navigated while the write was pending.
      if (rowIndex >= 0 && !previousFocus?.isConnected && document.activeElement === document.body && workspaceView === "project" && selectedChatId === projectId) {
        const nextRow = list?.isConnected ? list.children[Math.min(rowIndex, list.children.length - 1)] : null;
        const nextControl = nextRow?.querySelector<HTMLElement>('input, button') ?? document.querySelector<HTMLElement>(".completed-toggle, .project-create-task");
        nextControl?.focus();
      }
    } catch (error) {
      if (selectedChatId === projectId) projectTaskError = isConflictError(error) ? t("taskListConflict") : commandErrorMessage(error);
      if (isConflictError(error)) {
        // Refresh only this row: another task may have been opened and edited
        // while this write was pending. A whole-store refresh would lose its draft.
        try {
          const remote = await invoke<TaskRecord>("get_task", { id: task.id });
          tasks = tasks.map((item) => item.id === remote.id ? toTaskItem(remote) : item);
        } catch { /* Keep the failed row and the visible error until the next read. */ }
      }
    } finally {
      projectTaskPendingIds = projectTaskPendingIds.filter((id) => id !== task.id);
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
    closeProjectActions();
    projectPickerOpen = false;
    createChatOpen = false;
    createChatTitle = "";
    newTaskMenuAnchor = null;
    const leavingProjectContext = projectContextOpen;
    if (leavingProjectContext) {
      if (!closeProjectContext(false)) return;
    } else {
      if (activeSection === section) return;
      if (!await persistCurrentTask()) return;
    }
    discardLocalDraft();
    selectedTaskId = "";
    selectedTaskNavigationScope = "";
    workspaceView = "project";
    markdown = "";
    lastSavedMarkdown = "";
    saveState = "idle";
    activeSection = section;
    deleteChatConfirmOpen = false;
    emptyTrashConfirmOpen = false;
    purgeTaskId = "";
    editorHint = null;
    closeSelectionToolbar();
    if (section === "tasks") { await tick(); renderMarkdown(markdown); await focusEditor(); }
  }

  async function copyMcpConfig() {
    if (mcpCopyPending) return;
    const client = mcpClient;
    mcpCopyPending = true;
    mcpCopyError = "";
    copied = false;
    try {
      await navigator.clipboard.writeText(mcpConfiguration(client));
      if (mcpClient === client) {
        copied = true;
        window.setTimeout(() => (copied = false), 1400);
      }
    } catch {
      mcpCopyError = "Не удалось скопировать. Выделите конфигурацию и нажмите Ctrl+C.";
    } finally {
      mcpCopyPending = false;
    }
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
    if (!inTauri()) return t("mcpDesktopOnly");
    if (!mcpRuntime?.available) return t("mcpMissing");
    if (!mcpRuntime.compatible) return t("mcpVersionMismatch");
    if (mcpCheckState === "success") return t("mcpReady");
    return t("mcpAvailable");
  }

  async function chooseCreateTask() {
    createHubOpen = false;
    await requestNewTask("sidebar");
  }

  async function chooseCreateProject() {
    createHubOpen = false;
    await changeSection("tasks");
    projectPickerOpen = true;
    createChatOpen = true;
    await tick();
    document.querySelector<HTMLInputElement>("#prototype-project-name")?.focus();
  }

  async function loadAgentAdapters(workspaceRoot = agentAdapterRoot) {
    if (!inTauri()) return;
    agentAdaptersState = "loading";
    agentAdapterError = "";
    try {
      agentAdapters = await invoke<AgentAdapterStatus[]>("list_agent_adapters", {
        workspaceRoot: workspaceRoot || null
      });
      agentAdaptersState = "ready";
    } catch (error) {
      agentAdaptersState = "error";
      agentAdapterError = commandErrorMessage(error);
    }
  }

  function revealSettingsSection() {
    if (!settingsNavElement) return;
    const button = settingsNavElement.querySelector<HTMLButtonElement>(`button[data-settings-section="${settingsSection}"]`);
    if (!button) return;
    const container = settingsNavElement.getBoundingClientRect();
    const item = button.getBoundingClientRect();
    const delta = item.left < container.left ? item.left - container.left : item.right > container.right ? item.right - container.right : 0;
    if (delta) settingsNavElement.scrollBy({ left: delta, behavior: "instant" });
  }

  function agentAdapterStatus(client: AgentAdapterClient) {
    return agentAdapters.find((adapter) => adapter.client === client);
  }

  function agentAdapterStatusLabel(adapter: AgentAdapterStatus | undefined) {
    if (!inTauri()) return "Доступно в desktop-приложении";
    if (agentAdaptersState === "loading" || agentAdaptersState === "idle") return t("agentAdapterChecking");
    if (agentAdaptersState === "error") return "Не удалось проверить подключение";
    if (!adapter?.installed) return t("agentAdapterNotInstalled");
    if (adapter.connected && adapter.project_adapter_current) return t("agentAdapterReady");
    if (adapter.connected) return t("agentAdapterMcpReady");
    return t("agentAdapterAvailable");
  }

  async function connectAgentAdapter(client: AgentAdapterClient) {
    if (!inTauri() || agentAdapterPending) return;
    const selected = await openDialog({
      directory: true,
      multiple: false,
      title: t("agentAdapterChooseProject")
    });
    if (typeof selected !== "string") return;

    agentAdapterPending = client;
    agentAdapterRoot = selected;
    agentAdapterMessage = "";
    agentAdapterError = "";
    try {
      const result = await invoke<AgentAdapterResult>("connect_agent_adapter", {
        client,
        workspaceRoot: selected
      });
      agentAdapters = agentAdapters.map((adapter) => adapter.client === client ? result.status : adapter);
      if (!agentAdapters.some((adapter) => adapter.client === client)) agentAdapters = [...agentAdapters, result.status];
      agentAdaptersState = "ready";
      agentAdapterMessage = result.restart_required ? t("agentAdapterConnectedRestart") : t("agentAdapterConnected");
    } catch (error) {
      const message = commandErrorMessage(error);
      await loadAgentAdapters(selected);
      agentAdaptersState = "error";
      agentAdapterError = message;
    } finally {
      agentAdapterPending = "";
    }
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

  function githubStatusLabel() {
    if (githubStatus.connected) return t("connected");
    if (githubStatus.needs_reauthorization) return t("githubReconnect");
    if (githubStatus.error || !githubStatus.credential_store_available) return t("needsAttention");
    return t("notConnected");
  }

  function githubStatusTone(): ConnectorTone {
    if (githubStatus.connected) return "connected";
    if (githubStatus.error || !githubStatus.credential_store_available) return "error";
    if (githubStatus.needs_reauthorization || githubDeviceCode) return "attention";
    return "idle";
  }

  function connectedGithubResources() {
    return chats.slice(1).reduce((count, project) => count + (project.resources ?? []).filter((resource) => resource.kind === "repository" && resource.location.startsWith("https://github.com/")).length, 0);
  }

  function connectedIntegrationCount() {
    return Number(telegramStatus.step === "ready") + Number(githubStatus.connected);
  }

  function connectorCardState(connector: ConnectorUiDefinition): {
    status: string;
    detail: string;
    tone: ConnectorTone;
    actionLabel: string;
  } {
    if (connector.id === "telegram") {
      const ready = telegramStatus.step === "ready";
      return {
        status: telegramStatusLabel(),
        detail: ready
          ? t("telegramConnectorDetail", {
              account: telegramStatus.account_name || "Telegram",
              projects: chats.slice(1).filter((project) => project.telegram_chats.length).length
            })
          : t(connector.idleKey),
        tone: ["database_error", "error"].includes(telegramStatus.step)
          ? "error"
          : ready
            ? "connected"
            : telegramStatus.step === "unconfigured"
              ? "idle"
              : "attention",
        actionLabel: telegramStatus.step === "unconfigured" ? t("connect") : t("manageConnector")
      };
    }
    return {
      status: githubStatusLabel(),
      detail: githubStatus.connected
        ? t("githubConnectorDetail", {
            account: githubStatus.account?.login || "GitHub",
            projects: connectedGithubResources()
          })
        : t(connector.idleKey),
      tone: githubStatusTone(),
      actionLabel: githubStatus.connected ? t("manageConnector") : t("connect")
    };
  }

  function integrationNeedsAttention() {
    return ["database_error", "error"].includes(telegramStatus.step)
      || ["partial", "error"].includes(telegramSyncState)
      || Boolean(githubStatus.error)
      || !githubStatus.credential_store_available;
  }

  async function openIntegrationModal(provider: ConnectorProvider) {
    // A project reload can invalidate the derived picker project while leaving its id set.
    // Always clear that stale overlay state before opening a connector workspace again.
    telegramPickerProjectId = "";
    telegramChatSearch = "";
    telegramSearchResults = [];
    telegramSearchLoading = false;
    telegramError = "";
    telegramConnectionsOpenedFromIntegration = false;
    integrationModalReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    integrationModal = provider;
    githubError = "";
    await tick();
    document.querySelector<HTMLElement>(".integration-modal")?.focus();
    if (provider === "github" && githubStatus.connected && !githubRepositories.length) void loadGithubRepositories();
  }

  function closeIntegrationModal() {
    const returnFocus = integrationModalReturnFocus;
    integrationModalReturnFocus = null;
    integrationModal = null;
    githubAuthorizationCompleted = null;
    githubCodeCopied = false;
    restoreModalFocus(returnFocus);
  }

  async function configureGithub(event: SubmitEvent) {
    event.preventDefault();
    if (githubBusy) return;
    githubBusy = true;
    githubError = "";
    try {
      githubStatus = await invoke<GitHubStatus>("github_configure", { clientId: githubClientId.trim(), appSlug: githubAppSlug.trim() });
      githubClientId = "";
      githubAppSlug = "";
    } catch (error) { githubError = String(error); }
    finally { githubBusy = false; }
  }

  async function beginGithubAuthorization() {
    if (githubBusy) return;
    githubBusy = true;
    githubError = "";
    githubAuthorizationCompleted = null;
    githubCodeCopied = false;
    window.clearTimeout(githubAuthTimer);
    try {
      githubDeviceCode = await invoke<GitHubDeviceCode>("github_begin_authorization");
      try {
        await navigator.clipboard.writeText(githubDeviceCode.user_code);
        githubCodeCopied = true;
      } catch { githubCodeCopied = false; }
      await openUrl(githubDeviceCode.verification_uri);
      githubAuthTimer = window.setTimeout(pollGithubAuthorization, githubDeviceCode.interval_seconds * 1000);
    } catch (error) { githubError = String(error); }
    finally { githubBusy = false; }
  }

  async function pollGithubAuthorization() {
    if (!githubDeviceCode || githubBusy) return;
    if (new Date(githubDeviceCode.expires_at).getTime() <= Date.now()) {
      githubError = t("githubCodeExpired");
      githubDeviceCode = null;
      return;
    }
    githubBusy = true;
    try {
      const result = await invoke<GitHubAuthorizationResult>("github_poll_authorization");
      if (result.state === "authorized") {
        githubDeviceCode = null;
        githubAuthorizationCompleted = result.account;
        githubStatus = await invoke<GitHubStatus>("github_status");
        const catalog = await invoke<GitHubRepositoryCatalog>("github_list_repositories");
        githubRepositories = catalog.repositories;
        githubInstallations = catalog.installations;
      } else {
        githubAuthTimer = window.setTimeout(pollGithubAuthorization, result.retry_after_seconds * 1000);
      }
    } catch (error) {
      githubError = String(error);
      githubDeviceCode = null;
    } finally { githubBusy = false; }
  }

  async function copyGithubDeviceCode() {
    if (!githubDeviceCode) return;
    try {
      await navigator.clipboard.writeText(githubDeviceCode.user_code);
      githubCodeCopied = true;
    } catch {
      githubCodeCopied = false;
    }
  }

  async function loadGithubRepositories() {
    if (!githubStatus.connected || githubBusy) return;
    githubBusy = true;
    githubError = "";
    try {
      const catalog = await invoke<GitHubRepositoryCatalog>("github_list_repositories");
      githubRepositories = catalog.repositories;
      githubInstallations = catalog.installations;
    } catch (error) { githubError = String(error); }
    finally { githubBusy = false; }
  }

  async function installGithubApp() {
    try { await openUrl(await invoke<string>("github_installation_url")); }
    catch (error) { githubError = String(error); }
  }

  function projectHasGithubRepository(repository: GitHubRepository) {
    return projectContextResources.some((resource) => resource.kind === "repository" && resource.location === repository.html_url);
  }

  function toggleProjectGithubRepository(repository: GitHubRepository) {
    const existingIndex = projectContextResources.findIndex((resource) => resource.kind === "repository" && resource.location === repository.html_url);
    if (existingIndex >= 0) {
      projectContextResources = projectContextResources.filter((_, index) => index !== existingIndex);
      return;
    }
    if (projectContextResources.length >= 20) {
      projectContextError = t("projectResourceLimit");
      return;
    }
    projectContextResources = [
      {
        id: `github-${repository.id}`,
        kind: "repository",
        label: repository.full_name,
        location: repository.html_url,
        notes: `GitHub · ${repository.default_branch}`,
        agent_access: true
      },
      ...projectContextResources
    ];
    projectContextError = "";
  }

  async function disconnectGithub() {
    if (githubBusy) return;
    githubBusy = true;
    githubError = "";
    try {
      githubStatus = await invoke<GitHubStatus>("github_disconnect");
      githubRepositories = [];
      githubInstallations = [];
      githubDeviceCode = null;
    } catch (error) { githubError = String(error); }
    finally { githubBusy = false; }
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
    // Sync status files created by older releases do not contain `errors`.
    // Normalize them at the boundary so opening the connector cannot crash.
    telegramSyncErrors = status.errors ?? [];
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

  async function processTelegramAgentMediaRequests() {
    if (!inTauri() || telegramStatus.step !== "ready") return;
    await invoke("telegram_process_agent_media_requests").catch(() => undefined);
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
    if (!inTauri()) {
      mcpCheckState = "idle";
      mcpSelfCheck = null;
      return;
    }
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
    } catch {
      mcpSelfCheck = { passed: false, duration_ms: 0, checks: [{ name: t("mcpSelfCheckFailed"), passed: false, detail: t("mcpSelfCheckRetry") }] };
      mcpCheckState = "error";
    }
  }

  async function toggleBackgroundAiTriage() {
    if (!inTauri() || automationSettingsState === "saving") return;
    const enabled = !automationSettings.background_ai_triage;
    automationSettingsState = "saving";
    automationSettingsError = "";
    try {
      automationSettings = await invoke<AutomationSettings>("set_background_ai_triage", { enabled });
      automationSettingsState = "idle";
      void loadAutomationStatus();
      if (enabled && telegramStatus.step === "ready") void syncTelegram();
    } catch (error) {
      automationSettingsState = "error";
      automationSettingsError = String(error);
    }
  }

  async function loadLocalAgentProviders() {
    if (!inTauri() || localAgentProvidersState === "loading") return;
    localAgentProvidersState = "loading";
    try {
      localAgentProviders = await invoke<LocalAgentProviderStatus[]>("local_agent_providers");
      localAgentProvidersState = "ready";
    } catch {
      localAgentProvidersState = "error";
    }
  }

  async function chooseAutomationProvider(provider: AutomationProvider) {
    if (!inTauri() || automationSettingsState === "saving" || automationSettings.provider === provider) return;
    automationSettingsState = "saving";
    automationSettingsError = "";
    try {
      automationSettings = await invoke<AutomationSettings>("set_automation_provider", { provider });
      automationSettingsState = "idle";
    } catch (error) {
      automationSettingsState = "error";
      automationSettingsError = String(error);
    }
  }

  async function saveJevApiKey() {
    if (!inTauri() || jevKeyState === "saving" || !jevApiKey.trim()) return;
    jevKeyState = "saving";
    jevKeyError = "";
    try {
      jevStatus = await invoke<JevStatus>("set_jev_api_key", { apiKey: jevApiKey.trim() });
      jevApiKey = "";
      jevKeyState = "idle";
    } catch (error) {
      jevKeyState = "error";
      jevKeyError = String(error);
    }
  }

  async function removeJevApiKey() {
    if (!inTauri() || jevKeyState === "saving") return;
    jevKeyState = "saving";
    jevKeyError = "";
    try {
      jevStatus = await invoke<JevStatus>("set_jev_api_key", { apiKey: null });
      if (automationSettings.provider === "jev" && automationSettings.background_ai_triage) {
        automationSettings = await invoke<AutomationSettings>("set_background_ai_triage", { enabled: false });
      }
      jevKeyState = "idle";
    } catch (error) {
      jevKeyState = "error";
      jevKeyError = String(error);
    }
  }

  function automationProviderName(provider = automationSettings.provider) {
    if (provider === "auto") {
      return localAgentProviders.find((item) => item.available)?.name ?? t("agentAuto");
    }
    if (provider === "jev") return "Jev";
    return localAgentProviders.find((item) => item.id === provider)?.name
      ?? (provider === "codex" ? "Codex" : provider === "claude" ? "Claude Code" : "Gemini CLI");
  }

  function automationProviderDescription(provider: AutomationProvider) {
    if (provider === "auto") return t("agentAutoDescription");
    if (provider === "jev") return jevStatus.configured ? t("jevReadyDescription", { model: jevStatus.model }) : t("jevUnavailableDescription");
    const status = localAgentProviders.find((item) => item.id === provider);
    if (localAgentProvidersState === "loading") return t("agentChecking");
    if (!status?.available) return t("agentUnavailable");
    return status.supports_images ? t("agentReadyWithImages") : t("agentReadyTextOnly");
  }

  async function loadAutomationStatus() {
    if (!inTauri() || automationStatusState === "retrying") return;
    automationStatusState = "loading";
    try {
      automationStatus = await invoke<AutomationStatusSummary>("automation_status");
      automationStatusState = "idle";
    } catch {
      automationStatusState = "error";
    }
  }

  async function retryFailedAutomation() {
    if (!inTauri() || automationStatusState === "retrying") return;
    automationStatusState = "retrying";
    try {
      automationStatus = await invoke<AutomationStatusSummary>("retry_failed_automation");
      automationStatusState = "idle";
    } catch {
      automationStatusState = "error";
    }
  }

  function automationStatusLabel() {
    if (!automationSettings.background_ai_triage) return t("automationStatusOff");
    if (automationStatusState === "loading" && !automationStatus) return t("automationStatusLoading");
    if (automationStatusState === "error") return t("automationStatusUnavailable");
    return automationSummaryLabel(automationStatus);
  }

  function automationSummaryLabel(status: AutomationStatusSummary | null) {
    if (!status) return t("automationStatusWaiting");
    if (status.processing > 0) return t("automationStatusProcessing", { count: status.processing, provider: automationProviderName() });
    if (status.failed > 0) return t("automationStatusFailed", { count: status.failed });
    if (status.pending > 0) return t("automationStatusPending", { count: status.pending });
    if (status.last_activity_at) return t("automationStatusQuiet", { action: automationOutcomeLabel(status.last_outcome), date: relativeDate(status.last_activity_at) });
    return t("automationStatusWaiting");
  }

  function automationOutcomeLabel(outcome?: AutomationOutcome) {
    if (!outcome) return t("automationOutcomeChecked");
    const labels: Record<AutomationOutcome, MessageKey> = {
      task_created_or_linked: "automationOutcomeTaskCreated",
      task_updated: "automationOutcomeTaskUpdated",
      duplicate: "automationOutcomeDuplicate",
      no_action: "automationOutcomeNoAction",
      needs_data: "automationOutcomeNeedsData",
      agent_queued: "automationOutcomeAgentQueued",
      skipped_while_off: "automationOutcomeSkippedWhileOff"
    };
    return t(labels[outcome]);
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
    telegram_sync_requested: "activityTelegramSyncRequested",
    mutation_applied: "activityMutationApplied"
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

  function activityProvenanceLabel(event: ActivityEvent) {
    const provenance = event.provenance;
    if (!provenance) return "";
    const provider = provenance.initiator.provider || provenance.initiator.kind;
    const recovery = provenance.recovery === "available"
      ? t("activityRecoveryAvailable")
      : provenance.recovery === "best_effort"
        ? t("activityRecoveryBestEffort")
        : t("activityRecoveryUnavailable");
    return `${provider} · ${t("activityPlanDigest", { digest: provenance.approved_plan_digest.slice(0, 8) })} · ${t("activityOperationCount", { count: provenance.operations.length })} · ${recovery}`;
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
    } catch {
      mcpActivityState = "error";
      mcpActivityError = t("mcpActivityRetry");
    }
  }

  function telegramModeLabel(mode: TelegramInboxMode) {
    return t(mode === "manual" ? "telegramModeManual" : mode === "all" ? "telegramModeAll" : "telegramModeMentions");
  }

  function telegramChatTypeLabel(kind?: TelegramChat["kind"]) {
    if (kind === "private") return t("telegramChatPrivate");
    if (kind === "secret") return t("telegramChatSecret");
    if (kind === "direct") return t("telegramChatDirect");
    if (kind === "channel") return t("telegramChatChannel");
    if (kind === "group") return t("telegramChatGroup");
    return t("telegramChatUnknown");
  }

  function telegramChatMeta(chat: TelegramChat) {
    const type = telegramChatTypeLabel(chat.kind);
    return chat.username ? `${type} · @${chat.username}` : `${type} · ID ${chat.id}`;
  }

  function telegramChatDetails(chatId: number) {
    return telegramChats.find((chat) => chat.id === chatId)
      ?? telegramSearchResults.find((chat) => chat.id === chatId);
  }

  function openTelegramConnections(projectId: string, fromIntegration = false) {
    if (!telegramPickerProjectId) telegramConnectionsReturnFocus = focusedElement();
    telegramConnectionsOpenedFromIntegration = fromIntegration;
    if (fromIntegration) integrationModal = null;
    telegramPickerProjectId = projectId;
    telegramChatSearch = "";
    telegramSearchResults = [];
    telegramSearchLoading = false;
    void tick().then(() => telegramConnectionsDialog?.focus());
  }

  function closeTelegramConnections() {
    const returnFocus = telegramConnectionsReturnFocus;
    const returnToIntegration = telegramConnectionsOpenedFromIntegration;
    telegramConnectionsReturnFocus = null;
    telegramConnectionsOpenedFromIntegration = false;
    window.clearTimeout(telegramSearchTimer);
    telegramPickerProjectId = "";
    telegramChatSearch = "";
    telegramSearchResults = [];
    telegramSearchLoading = false;
    if (returnToIntegration) {
      integrationModal = "telegram";
      void tick().then(() => document.querySelector<HTMLElement>(".integration-modal")?.focus());
    } else {
      restoreModalFocus(returnFocus);
    }
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
    if (telegramConnectionsSaving) return;
    telegramConnectionsSaving = true;
    try {
      if (!inTauri()) {
        chats = chats.map((chat) => chat.id === project.id ? { ...chat, telegram_chats: links } : chat);
        telegramError = "";
        return;
      }
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
    } finally {
      telegramConnectionsSaving = false;
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
      selectedTaskNavigationScope = "";
      selectedChatId = "all";
      workspaceView = "project";
      await loadData(false);
      await loadAgentQueue();
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

  function devPreviewActive() {
    return import.meta.env.DEV && !inTauri() && new URLSearchParams(window.location.search).has("preview");
  }

  function applyDevPreviewPreferences() {
    if (!import.meta.env.DEV || inTauri()) return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has("preview")) return;
    const previewLocale = params.get("locale");
    if (previewLocale === "ru" || previewLocale === "en") locale = previewLocale;
    document.documentElement.lang = locale;
    t = translator(locale);
    chats = chats.map((chat) => chat.id === "all" ? { ...chat, title: t("allTasks") } : chat);
    applyTheme();
  }

  function applySettingsDevPreview() {
    if (!import.meta.env.DEV || inTauri()) return;
    if (new URLSearchParams(window.location.search).get("preview") !== "mcp-readiness") return;
    activeSection = "settings";
    settingsSection = "mcp";
    appVersion = "0.1.6";
    mcpExecutable = "C:\\Program Files\\flood.md\\flood-mcp.exe";
    mcpRuntime = { executable_path: mcpExecutable, launch_command: mcpExecutable, launch_args: [], available: true, version: "0.1.6", app_version: "0.1.6", compatible: true, source: "bundled" };
    automationSettings = { background_ai_triage: false, provider: "auto", updated_at: new Date().toISOString() };
    localAgentProviders = [{ id: "codex", name: "Codex", available: true, version: "codex-cli", supports_images: true }, { id: "claude", name: "Claude Code", available: false, supports_images: false }, { id: "gemini", name: "Gemini CLI", available: false, supports_images: false }];
    localAgentProvidersState = "ready";
    automationStatus = { pending: 3, processing: 0, processed: 14, failed: 0, last_outcome: "task_created_or_linked", last_activity_at: new Date(Date.now() - 4 * 60_000).toISOString() };
    storeDiagnostics = { healthy: true, root: "preview", format_version: 1, project_count: 4, linked_chat_count: 2, open_task_count: 12, completed_task_count: 8, trashed_task_count: 1, pending_inbox_count: 5, pending_automation_event_count: 3, failed_automation_event_count: 0, issues: [] };
    mcpSelfCheck = { passed: true, duration_ms: 34, checks: (locale === "en" ? [
      "Isolated storage",
      "Creation, updates, and conflicts",
      "Telegram inbox and duplicate protection",
      "MCP contracts and safety annotations"
    ] : [
      "Изолированное хранилище",
      "Создание, изменение и конфликты",
      "Telegram-входящие и защита от дублей",
      "MCP-контракты и аннотации безопасности"
    ]).map((name) => ({ name, passed: true })) };
    mcpCheckState = "success";
    mcpActivity = [
      { id: "01JOURNAL04", occurred_at: "2026-09-11T00:05:00Z", source: "mcp", action: "mutation_applied", entity_kind: "workspace", reversible: true, provenance: { initiator: { kind: "agent", provider: "codex" }, run_id: "run-preview", guidance: [{ kind: "rule", id: "human-agent-interaction", version: "1" }], sources: [{ kind: "telegram_message", id: "-100100:42" }], approved_plan_id: "plan-preview", approved_plan_digest: "9f3a17c6c85d4b22", operations: [{ operation_id: "op-create", kind: "create_task", target_id: "01PREVIEWTASK", changed: true }], result: "applied", recovery: "available" } },
      { id: "01JOURNAL03", occurred_at: "2026-09-11T00:04:00Z", source: "mcp", action: "telegram_task_created", entity_kind: "task", entity_id: "01PREVIEWTASK", project_id: "01PREVIEWPROJECT", reversible: true },
      { id: "01JOURNAL02", occurred_at: "2026-09-11T00:03:00Z", source: "mcp", action: "task_completed", entity_kind: "task", entity_id: "01COMPLETEDTASK", project_id: "01PREVIEWPROJECT", reversible: true },
      { id: "01JOURNAL01", occurred_at: "2026-09-11T00:02:00Z", source: "mcp", action: "telegram_sync_requested", entity_kind: "workspace", reversible: false }
    ];
    mcpActivityTotal = mcpActivity.length;
    mcpActivityRemaining = 0;
    attachmentCleanupReport = { total_files: 42, total_bytes: 8_800_000, orphaned_files: 3, orphaned_bytes: 640_000 };
    telegramStatus = { step: "ready", configured: true, managed_credentials: true, account_name: locale === "en" ? "Alex" : "Олег" };
    telegramSyncState = "partial";
  }

  function applyIntegrationsDevPreview() {
    if (!import.meta.env.DEV || inTauri()) return;
    const preview = new URLSearchParams(window.location.search).get("preview");
    if (preview !== "integrations" && preview !== "github-connector") return;
    const now = new Date().toISOString();
    const project: ChatItem = { id: "preview-project", title: "flood.md", context: "", resources: [], created_at: now, updated_at: now, telegram_chats: [], version: "preview", open: 6 };
    chats = [allChat(6), project];
    activeSection = "settings";
    settingsSection = "integrations";
    loading = false;
    telegramStatus = { step: "ready", configured: true, managed_credentials: true, account_name: "Олег" };
    telegramChats = [
      { id: -1001, title: "Tenebra", kind: "channel", username: "tenebra_app" },
      { id: 1002, title: "Tenebra", kind: "direct", username: "tenebra_direct" },
      { id: -1003, title: "Команда продукта", kind: "group" }
    ];
    githubStatus = { configured: true, managed_app: true, connected: true, needs_reauthorization: false, credential_store_available: true, app_slug: "flood-md", account: { id: 1, login: "tillwithered", name: "Oleg", avatar_url: "", html_url: "https://github.com/tillwithered" } };
    githubInstallations = [{ id: 1, account_login: "tillwithered", account_type: "User", repository_selection: "selected", html_url: "https://github.com/settings/installations/1" }];
    githubRepositories = [
      { id: 1, installation_id: 1, name: "flood.md", full_name: "tillwithered/flood.md", private: false, html_url: "https://github.com/tillwithered/flood.md", description: "Локальные задачи без лишнего шума", default_branch: "main", archived: false, pushed_at: now, owner_avatar_url: "" },
      { id: 2, installation_id: 1, name: "zakup", full_name: "tillwithered/zakup", private: true, html_url: "https://github.com/tillwithered/zakup", description: "Рабочий продукт", default_branch: "main", archived: false, pushed_at: now, owner_avatar_url: "" }
    ];
    if (preview === "github-connector") void openIntegrationModal("github");
  }

  function applyTrashDevPreview() {
    if (!import.meta.env.DEV || inTauri()) return;
    const preview = new URLSearchParams(window.location.search).get("preview");
    if (preview !== "trash" && preview !== "trash-confirm") return;
    const now = new Date().toISOString();
    activeSection = "trash";
    loading = false;
    trashedTasks = [
      { id: "trash-preview-1", title: "Сверить устаревший макет настроек", chat: "flood.md", chatId: "preview-project", updated: t("now"), createdAt: now, updatedAt: now, urgency: "normal", completed: false, relations: [], checkpoints: [], checkpointCount: 0, markdown: "", hasSource: false, trashedAt: new Date(Date.now() - 18 * 60_000).toISOString(), version: "preview" },
      { id: "trash-preview-2", title: "Удалить дублирующий экран входящих", chat: "flood.md", chatId: "preview-project", updated: t("now"), createdAt: now, updatedAt: now, urgency: "important", completed: false, relations: [], checkpoints: [], checkpointCount: 0, markdown: "", hasSource: false, trashedAt: new Date(Date.now() - 2 * 3_600_000).toISOString(), version: "preview" }
    ];
    emptyTrashConfirmOpen = preview === "trash-confirm";
  }

  function applyTelegramDevPreview() {
    if (!import.meta.env.DEV || inTauri()) return;
    const preview = new URLSearchParams(window.location.search).get("preview");
    if (!preview?.startsWith("telegram-")) return;
    telegramInboxOpen = true;
    void tick().then(() => telegramInboxDialog?.focus());
    telegramInboxLoading = preview === "telegram-loading";
    telegramInboxError = preview === "telegram-error" ? t("telegramPreviewError") : "";
    if (preview !== "telegram-inbox" && preview !== "telegram-context" && preview !== "telegram-undo" && preview !== "telegram-history") return;
    const english = locale === "en";
    const productChat = english ? "Product team" : "Команда продукта";
    telegramInbox = [
      {
        id: "preview-1", project_id: "preview", chat_id: -1001, chat_title: productChat, message_id: 101,
        text: english ? "@tillwithered please wrap up the integration screen changes and check the empty states." : "@tillwithered собери, пожалуйста, итоговые правки по экрану интеграций и проверь пустые состояния.",
        author: english ? "Anna" : "Анна", sent_at: "2026-09-10T17:42:00Z", reason: "mention", status: "pending", media: [],
        context: [
          { message_id: 98, author: english ? "Ilya" : "Илья", sent_at: "2026-09-10T17:37:00Z", text: english ? "The chat list still touches the edge in a narrow window." : "На узком окне список чатов снова упирается в край.", is_target: false, media: [] },
          { message_id: 99, author: english ? "Oleg" : "Олег", sent_at: "2026-09-10T17:39:00Z", text: english ? "Yes, and the empty state still feels too system-like." : "Да, и пустое состояние выглядит слишком системно.", is_target: false, media: [{ kind: "photo", file_name: "integrations-empty.png" }] },
          { message_id: 101, author: english ? "Anna" : "Анна", sent_at: "2026-09-10T17:42:00Z", text: english ? "@tillwithered please wrap up the integration screen changes and check the empty states." : "@tillwithered собери, пожалуйста, итоговые правки по экрану интеграций и проверь пустые состояния.", reply_to_message_id: 99, is_target: true, media: [] },
          { message_id: 102, author: english ? "Ilya" : "Илья", sent_at: "2026-09-10T17:43:00Z", text: english ? "And check the dark theme after the changes." : "И проверь тёмную тему после изменений.", is_target: false, media: [] }
        ],
        discovered_at: "2026-09-10T17:42:10Z"
      },
      {
        id: "preview-2", project_id: "preview", chat_id: -1001, chat_title: productChat, message_id: 102,
        text: english ? "Compare the album with the references and select images for the first release." : "Нужно сверить альбом с референсами и выбрать изображения для первой версии.",
        author: english ? "Ilya" : "Илья", sent_at: "2026-09-10T17:31:00Z", reason: "reply", status: "pending",
        media: [{ kind: "photo", file_name: "reference-1.jpg" }, { kind: "photo", file_name: "reference-2.jpg" }], discovered_at: "2026-09-10T17:31:10Z"
      },
      {
        id: "preview-3", project_id: "preview", chat_id: -1002, chat_title: english ? "Direct messages" : "Личное", message_id: 103,
        text: english ? "Capture the call results and assign the next actions to projects." : "Зафиксировать результаты созвона и разнести следующие действия по проектам.",
        author: english ? "Oleg" : "Олег", sent_at: "2026-09-10T16:58:00Z", reason: "manual", status: "pending", media: [], discovered_at: "2026-09-10T16:58:10Z"
      }
    ];
    telegramInboxTotal = telegramInbox.length;
    telegramInboxNextCursor = "";
    telegramInboxRemaining = 0;
    if (preview === "telegram-context") {
      void beginTaskFromCandidate(telegramInbox[0]);
    } else if (preview === "telegram-undo") {
      telegramDismissUndo = { ...telegramInbox[0], status: "dismissed", processed_at: new Date().toISOString() };
      telegramInbox = telegramInbox.slice(1);
      telegramInboxTotal = telegramInbox.length;
    } else if (preview === "telegram-history") {
      telegramInboxView = "history";
      telegramInbox = [
        { ...telegramInbox[0], status: "dismissed", processed_at: "2026-09-10T17:49:00Z" },
        {
          ...telegramInbox[1], status: "imported", processed_at: "2026-09-10T17:36:00Z", task_id: "preview-task",
          linked_task: { id: "preview-task", title: english ? "Compare the album with references" : "Сверить альбом с референсами", urgency: "important", status: "open", trashed: false }
        }
      ];
      telegramInboxTotal = telegramInbox.length;
    }
  }

  function applyProjectContextDevPreview() {
    if (!import.meta.env.DEV || inTauri()) return;
    const preview = new URLSearchParams(window.location.search).get("preview");
    if (preview !== "project-context" && preview !== "artifact-conflict" && preview !== "knowledge-review") return;
    const now = new Date().toISOString();
    const english = locale === "en";
    const project: ChatItem = {
      id: "preview-project",
      title: english ? "flood.md desktop app" : "Рабочее приложение flood.md",
      context: english ? "## Goal\n\nTurn work discussions into clear tasks without losing source context.\n\n## Repositories\n\n`C:/work/flood.md`\n\n## Designs\n\nThe primary interface file is in Figma." : "## Цель\n\nСобирать понятные задачи из рабочих обсуждений без потери исходного контекста.\n\n## Репозитории\n\n`C:/work/flood.md`\n\n## Макеты\n\nОсновной файл интерфейса в Figma.",
      resources: [
        { id: "main-repository", kind: "repository", label: english ? "Main repository" : "Основной репозиторий", location: "C:/work/flood.md", notes: english ? "Desktop application working copy" : "Рабочая копия desktop-приложения", agent_access: true },
        { id: "interface-design", kind: "figma", label: english ? "Interface designs" : "Макеты интерфейса", location: "https://figma.com/design/example", agent_access: false },
        { id: "flood-ui", kind: "skill", label: "flood-ui", location: "C:/Users/name/.codex/skills/flood-ui", notes: english ? "Use for interface work" : "Использовать для работы с интерфейсом", agent_access: true }
      ],
      memory: [
        { id: "memory-layout", text: english ? "Keep primary workspace pages within a 720 px content column." : "Основные страницы используют рабочую колонку шириной 720 px.", created_at: now, source_task_id: "preview-task" },
        { id: "memory-type", text: english ? "Visible interface text must not be smaller than 12 px." : "Видимый текст интерфейса не должен быть меньше 12 px.", created_at: now, source_task_id: "preview-task" }
      ],
      created_at: now,
      updated_at: now,
      telegram_chats: [{ chat_id: -1001, title: english ? "Product team" : "Команда продукта", inbox_mode: "mentions_and_replies" }],
      version: "preview-version",
      open: 4
    };
    const otherProject: ChatItem = {
      id: "preview-other-project",
      title: "tenebra app",
      context: "",
      resources: [],
      created_at: now,
      updated_at: now,
      telegram_chats: [],
      version: "preview-other-version",
      open: 0
    };
    chats = [allChat(4), project, otherProject];
    selectedChatId = project.id;
    loading = false;
    projectContextProjectId = project.id;
    projectContextProjectTitle = project.title;
    projectContextVersion = project.version;
    projectContextDraft = project.context ?? "";
    projectContextResources = (project.resources ?? []).map((resource) => ({ ...resource }));
    projectContextSavedDraft = projectContextDraft;
    projectContextSavedResources = JSON.stringify(projectContextResources);
    projectWorkspaceItems = [
      { id: "preview-document", project_id: project.id, kind: "document", title: english ? "Product direction" : "Направление продукта", summary: english ? "What flood.md is building and why" : "Что и зачем строит flood.md", content: project.context ?? "", agent_access: true, created_at: now, updated_at: now, revisions: [
        { title: english ? "Product direction" : "Направление продукта", summary: english ? "Initial direction" : "Первая версия направления", content: "# Product direction v1", agent_access: true, changed_at: "2026-09-20T10:36:00Z" },
        { title: english ? "Product direction" : "Направление продукта", summary: english ? "Refined agent context" : "Уточнён контекст для агентов", content: "# Product direction v2", agent_access: true, changed_at: "2026-09-20T14:05:00Z" }
      ], version: "preview-document" },
      { id: "preview-rule", project_id: project.id, kind: "rule", title: "Visual foundations v1", summary: english ? "Required quality floor for every surface" : "Обязательная база качества для каждой поверхности", content: "# Visual foundations v1", agent_access: true, created_at: now, updated_at: now, revisions: [
        { title: "Visual foundations v1", summary: english ? "Initial visual rules" : "Первая версия визуальных правил", content: "# Visual foundations", agent_access: true, changed_at: "2026-09-20T13:36:00Z" }
      ], version: "preview-rule" },
      { id: "preview-skill-design", project_id: project.id, kind: "skill", title: english ? "flood.md design system" : "Дизайн-система flood.md", summary: english ? "System direction, tokens and contracts" : "Системное направление, токены и контракты", content: "# Design system", agent_access: true, created_at: now, updated_at: now, revisions: [], version: "preview-skill-design" },
      { id: "preview-skill-ui", project_id: project.id, kind: "skill", title: english ? "flood.md UI implementation" : "Реализация UI flood.md", summary: english ? "Implementation and visual verification" : "Реализация и визуальная приёмка", content: "# UI implementation", agent_access: true, created_at: now, updated_at: now, revisions: [], version: "preview-skill-ui" }
    ];
    projectKnowledgeProposals = preview === "knowledge-review" ? [
      {
        id: "preview-proposal",
        project_id: project.id,
        target: { kind: "workspace_item", item_id: "preview-rule", item_kind: "rule" },
        base_version: "preview-rule",
        payload: {
          kind: "workspace_item",
          title: "Visual foundations v2",
          summary: english ? "Adds the bounded companion surface" : "Добавляет границы companion-панели",
          content: "# Visual foundations v2\n\n- The companion is transient.\n- Canonical data changes require review.",
          agent_access: true
        },
        summary: english ? "Clarify the flood buddy trust boundary" : "Уточнить trust boundary flood buddy",
        reason: english ? "The companion must not bypass project knowledge review." : "Companion не должен обходить review знаний проекта.",
        evidence: ["docs/design/buddy.md", "C25 / R14"],
        state: "pending",
        created_at: now,
        updated_at: now
      }
    ] : [];
    if (preview === "knowledge-review") buddyActivityOpen = true;
    projectAttention = [{ kind: "source_question", message: english ? "Which screen should the new Telegram reference apply to?" : "К какому экрану относится новый референс из Telegram?", event_id: "preview-event", occurred_at: now }];
    projectAutoRunDraft = false;
    projectAutoRunSaved = false;
    projectAutoRunLoading = false;
    resetProjectMemoryEditor(true);
    projectContextOpen = true;
    if (preview === "artifact-conflict") {
      const item = projectWorkspaceItems[0];
      editProjectWorkspaceItem(item);
      projectWorkspaceContent = `${item.content}\n\nЛокальное изменение, которое ещё не сохранено.`;
      projectWorkspaceConflictRemote = { ...item, content: `${item.content}\n\nВерсия на диске, изменённая другим процессом.`, updated_at: new Date().toISOString(), version: "preview-remote" };
      projectWorkspaceConflictAction = "save";
    } else {
      void tick().then(() => projectContextDialog?.focus());
    }
  }

  function applyOverlayDevPreview() {
    if (!import.meta.env.DEV || inTauri()) return;
    if (new URLSearchParams(window.location.search).get("preview") !== "command-palette") return;
    loading = false;
    void openCommandPalette();
  }

  function applyTaskSourceDevPreview() {
    if (!import.meta.env.DEV || inTauri()) return;
    const preview = new URLSearchParams(window.location.search).get("preview");
    if (preview !== "task-source" && preview !== "task-conflict" && preview !== "agent-question" && preview !== "agent-queue" && preview !== "agent-review" && preview !== "agent-failed") return;
    const createdAt = "2026-09-12T01:01:07Z";
    const project: ChatItem = { id: "preview-project", title: "тест", context: "", resources: [], created_at: createdAt, updated_at: createdAt, telegram_chats: [], version: "preview", open: 1 };
    const source: MessageSnapshot = {
      provider: "telegram",
      chat_id: 1001,
      chat_title: "Личное",
      message_id: 15,
      author: "vetka",
      sent_at: createdAt,
      text: "@tillwithered поправь отображение длинного названия проекта, пожалуйста",
      media: [{ kind: "photo", file_name: "screenshot-project-title.jpg", size: 84_735 }],
      context: [{ message_id: 15, author: "vetka", sent_at: createdAt, text: "@tillwithered поправь отображение длинного названия проекта, пожалуйста", is_target: true, media: [{ kind: "photo", file_name: "screenshot-project-title.jpg", size: 84_735 }] }]
    };
    const task: TaskItem = {
      id: "preview-task",
      title: "Исправить отображение длинного названия проекта",
      chat: project.title,
      chatId: project.id,
      updated: createdAt,
      createdAt,
      updatedAt: createdAt,
      urgency: "normal",
      completed: false,
      relations: [{ task_id: "preview-completed-task", kind: "related" }],
      checkpoints: [{
        id: "preview-checkpoint",
        created_at: createdAt,
        source: "agent",
        summary: "Композиция заголовка исправлена, рабочая ширина сохранена.",
        verification: ["Проверена ширина 720 px", "Проверена тёмная тема"],
        remaining: ["Проверить светлую тему на установленной сборке"],
        result: "src/App.svelte",
        agent_run_id: "preview-older-run"
      }],
      checkpointCount: 1,
      markdown: "Исправить отображение длинного названия проекта\n\n- Проверить компоновку заголовка на узком окне\n- Сохранить доступность действий проекта",
      source,
      sourceAuthor: source.author,
      hasSource: true,
      version: "preview"
    };
    chats = [allChat(1), project];
    const completedTask: TaskItem = {
      ...task,
      id: "preview-completed-task",
      title: "Уже выполненная задача",
      completed: true,
      markdown: "Уже выполненная задача",
      hasSource: false,
      source: undefined,
      sourceAuthor: undefined
    };
    tasks = [task, completedTask];
    selectedChatId = project.id;
    selectedTaskId = task.id;
    markdown = task.markdown;
    lastSavedMarkdown = task.markdown;
    workspaceView = "task";
    activeSection = "tasks";
    loading = false;
    loadError = "";
    if (preview === "task-conflict") {
      conflictRemote = {
        id: task.id,
        project_id: project.id,
        description: "Исправить отображение длинного названия проекта\n\nВерсия на диске была изменена другим процессом.",
        created_at: createdAt,
        updated_at: new Date().toISOString(),
        urgency: "important",
        status: "open",
        relations: task.relations,
        checkpoints: task.checkpoints,
        checkpoint_count: task.checkpointCount,
        source,
        version: "preview-remote"
      };
    } else if (preview === "agent-question") {
      selectedTaskRuns = [{
        id: "preview-run", task_id: task.id, project_id: project.id, provider: "codex", state: "needs_input",
        created_at: createdAt, updated_at: createdAt, thread_id: "preview-thread", working_directory: "C:/work/flood.md",
        result: "Нашёл два варианта реализации и проверил текущую компоновку.",
        blocker: "На мобильной ширине действия оставить в верхней панели или перенести под заголовок?"
      }];
    } else if (preview === "agent-review") {
      selectedTaskRuns = [{
        id: "preview-run", task_id: task.id, project_id: project.id, provider: "codex", state: "ready_for_review",
        created_at: createdAt, updated_at: createdAt, thread_id: "preview-thread", working_directory: "C:/work/flood.md",
        result: "Заголовок проекта вынесен в отдельную строку и больше не сжимается действиями.\n\nПроверено:\n• длинное название на ширине 720 px\n• светлая и тёмная темы\n• сборка интерфейса",
        memory: ["Основные страницы используют рабочую колонку шириной 720 px."],
        guidance: [
          { kind: "rule", id: "visual-rule", title: "Visual foundations v1", version: "17d85f61a4", reason: "Обязательное правило проекта" },
          { kind: "skill", id: "ui-skill", title: "Реализация UI flood.md", version: "67a0c1b29f", reason: "Совпало с задачей: интерфейс, заголовок" }
        ]
      }];
    } else if (preview === "agent-failed") {
      selectedTaskRuns = [{
        id: "preview-run", task_id: task.id, project_id: project.id, provider: "codex", state: "failed",
        created_at: createdAt, updated_at: createdAt, working_directory: "C:/work/flood.md",
        progress: "Проверка интерфейса остановлена.",
        error: "Не удалось получить доступ к рабочей папке. Проверьте путь и запустите агента снова."
      }];
    } else if (preview === "agent-queue") {
      selectedTaskId = "";
      workspaceView = "project";
      const previewTitles = [
        "Исправить отображение длинного названия проекта",
        "Собрать общий Artifact Modal для документов, правил и skills",
        "Проверить контраст вторичного текста в тёмной теме",
        "Упростить навигацию по контексту проекта",
        "Показать diff результата агента до принятия",
        "Проверить редактор при масштабе текста 200%",
        "Согласовать состояния пустого проекта",
        "Унифицировать focus-visible у быстрых действий",
        "Проверить восстановление после внешнего изменения Markdown",
        "Убрать повторяющиеся пояснения в настройках",
        "Собрать узкое состояние project overview",
        "Проверить reduced motion для flood-глифов",
        "Уточнить provenance для агентского результата",
        "Подготовить заполненный сценарий из 15 задач",
        "Сравнить локальную сборку с опубликованной версией"
      ];
      tasks = previewTitles.map((title, index) => ({
        ...task,
        id: index === 0 ? task.id : `preview-task-${index + 1}`,
        title,
        urgency: index === 4 ? "urgent" : index === 1 || index === 8 ? "important" : "normal",
        relations: index === 0 ? task.relations : [],
        checkpoints: index === 0 ? task.checkpoints : [],
        checkpointCount: index === 0 ? task.checkpointCount : 0,
        markdown: `${title}\n\nРабочая формулировка для проверки заполненного интерфейса.`
      }));
      chats = [allChat(tasks.length), { ...project, open: tasks.length }];
      agentQueueRuns = [
        { id: "preview-run", task_id: task.id, project_id: project.id, provider: "codex", state: "running", created_at: createdAt, updated_at: createdAt, working_directory: "C:/work/flood.md", progress: "Проверяю интерфейс" },
        { id: "preview-queued", task_id: task.id, project_id: project.id, provider: "codex", state: "queued", created_at: createdAt, updated_at: createdAt, working_directory: "C:/work/flood.md" }
      ];
    }
    void tick().then(() => renderMarkdown(markdown));
  }

  function minimizeWindow() {
    if (inTauri()) void getCurrentWindow().minimize();
  }

  function toggleMaximizeWindow() {
    if (inTauri()) void getCurrentWindow().toggleMaximize();
  }

  async function closeWindow() {
    if (!inTauri() || closingWindow) return;
    if (projectContextOpen && !closeProjectContext()) return;
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
    applyDevPreviewPreferences();
    applySettingsDevPreview();
    applyTelegramDevPreview();
    applyProjectContextDevPreview();
    applyTaskSourceDevPreview();
    applyIntegrationsDevPreview();
    applyTrashDevPreview();
    applyOverlayDevPreview();
    void tick().then(revealSettingsSection);
    document.addEventListener("visibilitychange", catchUpTelegramSync);
    window.addEventListener("focus", catchUpTelegramSync);
    window.addEventListener("resize", revealSettingsSection);
    let unlisten: UnlistenFn | undefined;
    let unlistenClose: UnlistenFn | undefined;
    let unlistenTelegram: UnlistenFn | undefined;
    let unlistenAutomation: UnlistenFn | undefined;
    let disposed = false;
    void (async () => {
      if (inTauri()) {
        await loadData(false);
        if (disposed) return;
        appVersion = await getVersion();
        installationRuntime = await invoke<InstallationRuntimeInfo>("installation_runtime_info").catch(() => null);
        reconcilePendingUpdate();
        dataDirectory = await invoke<string>("data_directory");
        mcpRuntime = await invoke<McpRuntimeInfo>("mcp_runtime_info").catch(() => null);
        mcpExecutable = mcpRuntime?.executable_path || await invoke<string>("mcp_executable_path");
        await loadAgentAdapters();
        automationSettings = await invoke<AutomationSettings>("automation_settings").catch(() => automationSettings);
        jevStatus = await invoke<JevStatus>("jev_status").catch(() => jevStatus);
        await loadLocalAgentProviders();
        await loadAutomationStatus();
        if (mcpRuntime && (!mcpRuntime.available || !mcpRuntime.compatible)) mcpCheckState = "error";
        storeDiagnostics = await invoke<StoreDiagnostics>("diagnose_store").catch(() => null);
        githubStatus = await invoke<GitHubStatus>("github_status").catch((error) => ({ ...githubStatus, error: String(error) }));
        applyTelegramSyncStatus(await invoke<TelegramSyncStatus | null>("telegram_sync_status").catch(() => null));
        await refreshTelegramSyncRequest();
        await applyTelegramStatus(await invoke<TelegramStatus>("telegram_status"));
        unlistenTelegram = await listen<TelegramStatus>("telegram-status", (event) => void applyTelegramStatus(event.payload));
        unlistenAutomation = await listen("automation-updated", () => {
          void loadData(true);
          void loadAutomationStatus();
          void invoke<StoreDiagnostics>("diagnose_store").then((value) => (storeDiagnostics = value)).catch(() => undefined);
        });
        unlistenClose = await getCurrentWindow().onCloseRequested(async (event) => {
          if (closingWindow) return;
          event.preventDefault();
          await closeWindow();
        });
      } else {
        await loadData(false);
      }
      if (disposed || !inTauri()) return;
      await invoke<number>("resume_agent_queue").catch(() => 0);
      await loadAgentQueue();
      if (telegramStatus.step === "ready") {
        void syncTelegram();
      }
      telegramScanTimer = window.setInterval(() => {
        if (telegramStatus.step === "ready") void syncTelegram();
      }, 120_000);
      telegramRequestTimer = window.setInterval(() => {
        void processTelegramAgentMediaRequests();
        void refreshTelegramSyncRequest().then((request) => {
          if (request && telegramStatus.step === "ready") void syncTelegram();
        });
      }, 3_000);
      agentRunTimer = window.setInterval(() => {
        void loadAgentQueue();
        if (workspaceView === "task" && selectedTaskId && selectedTaskRuns[0] && ["queued", "running"].includes(selectedTaskRuns[0].state)) {
          void loadTaskAgentRuns();
        }
      }, 2_000);
      unlisten = await listen<string[]>("data-changed", (event) => {
        const changedPaths = event.payload.map((path) => path.toLocaleLowerCase());
        const telegramSyncRequested = changedPaths.some((path) => path.includes("telegram-sync-request"));
        const telegramMediaRequested = changedPaths.some((path) => path.endsWith("telegram-media-requests.json"));
        const agentQueueChanged = changedPaths.some((path) => path.endsWith("agent-runs.json"));
        if (activeSection === "settings" && settingsSection === "mcp" && changedPaths.some((path) => path.endsWith("activity.json"))) void loadMcpActivity();
        if (agentQueueChanged) {
          void invoke<number>("resume_agent_queue")
            .then(() => loadAgentQueue())
            .catch(() => undefined);
        }
        if (telegramSyncRequested) {
          void refreshTelegramSyncRequest();
          if (telegramStatus.step === "ready") void syncTelegram();
        } else if (telegramMediaRequested) {
          void processTelegramAgentMediaRequests();
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
      if (!target?.closest(".selection-toolbar") && !editorRoot?.contains(target)) closeSelectionToolbar();
      if (!target?.closest(".urgency-menu")) urgencyMenuOpen = false;
      if (!target?.closest(".source-popover") && !target?.closest(".source-action-button")) {
        sourceEditorOpen = false;
        datePickerOpen = false;
      }
      if (!target?.closest(".date-picker-wrap")) datePickerOpen = false;
      if (!target?.closest(".new-task-menu") && !target?.closest(".new-task-button") && !target?.closest(".project-create-task")) newTaskMenuAnchor = null;
      if (!target?.closest(".project-actions")) closeProjectActions();
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
      window.clearInterval(agentRunTimer);
      window.clearTimeout(telegramSearchTimer);
      window.clearTimeout(telegramDismissUndoTimer);
      window.clearTimeout(githubAuthTimer);
      window.removeEventListener("blur", flush);
      document.removeEventListener("pointerdown", closeMenus);
      document.removeEventListener("visibilitychange", catchUpTelegramSync);
      window.removeEventListener("focus", catchUpTelegramSync);
      window.removeEventListener("resize", revealSettingsSection);
      for (const url of attachmentObjectUrls) URL.revokeObjectURL(url);
      clearSourceMediaPreviews();
      unlisten?.();
      unlistenClose?.();
      unlistenTelegram?.();
      unlistenAutomation?.();
    };
  });
</script>

<svelte:head><title>flood.md</title></svelte:head>
<svelte:window onkeydown={handleWindowKeydown} onpointerdown={handleWindowPointerDown} />

{#if loading}
  <div class="app-startup" role="status" aria-live="polite" aria-label={t("loading")}>
    <span class="app-startup-mark"><FloodGlyph kind="brand" size={64} motion="breathe" /></span>
  </div>
{/if}

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
              {:else if item.id === "action:all-tasks"}<Home size={16} />
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

<main class="app-shell prototype-shell" style:--dock-clearance={`${dockClearance}px`}>
  <header class="window-bar" data-tauri-drag-region="deep">
    <div class="sidebar-titlebar" data-tauri-drag-region="deep"><FloodGlyph kind="brand" size={22} /><strong>flood.md</strong></div>
    <div class="window-context" data-tauri-drag-region="deep">
      {#if activeSection === "tasks"}
        {#if workspaceView === "task" && selectedTask}
          <button class="window-context-back" aria-label={t("backToProject", { project: selectedTask.chat })} title={`${t("backToProject", { project: selectedTask.chat })} · Alt+←`} onclick={backToProject}><ChevronLeft size={14} /><span>{selectedTask.chat}</span></button>
        {:else if workspaceView === "context"}
          <button class="window-context-back" aria-label={t("backToProject", { project: projectContextProjectTitle })} title={t("backToProject", { project: projectContextProjectTitle })} onclick={() => closeProjectContext()}><ChevronLeft size={14} /><span>{projectContextProjectTitle} · {t("projectSettings")}</span></button>
        {/if}
      {/if}
    </div>
    <div class="window-actions" data-tauri-drag-region="false">
      {#if activeSection !== "settings"}<UiIconButton class="titlebar-settings" label={t("settings")} onclick={() => { settingsSection = "general"; void changeSection("settings"); }}><Settings size={17} /></UiIconButton>{/if}
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
        {#if sourceEditorOpen}
          <form class="source-editor source-popover" onsubmit={saveSource}>
            <div class="source-popover-head"><strong>{selectedTask.hasSource ? t("taskSource") : t("addSource")}</strong><UiIconButton size="sm" label={t("close")} onclick={closeSourceEditor}><X size={14} /></UiIconButton></div>
            <TextArea class="source-message" label={t("message")} bind:value={sourceText} rows={4} placeholder={t("sourcePlaceholder")} />
            <TextField size="sm" label={t("author")} bind:value={sourceAuthor} placeholder={t("notSpecified")} />
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
            <TextField size="sm" label={t("link")} bind:value={sourceUrl} type="url" placeholder={t("notSpecified")} />
            {#if formError}<InlineNotice tone="danger" announce>{formError}</InlineNotice>{/if}
            <div class="form-actions">{#if selectedTask.hasSource}<UiButton variant="danger" size="sm" onclick={clearSource}>{t("delete")}</UiButton>{/if}<span></span><UiButton size="sm" onclick={closeSourceEditor}>{t("cancel")}</UiButton><UiButton type="submit" variant="primary" size="sm">{t("save")}</UiButton></div>
          </form>
        {/if}
        <UiButton size="sm" aria-label={selectedTask.completed ? t("restoreTask") : t("completeTask")} onclick={toggleComplete}>{#if selectedTask.completed}<CheckCircle2 size={16} />{:else}<Circle size={16} />{/if}<span class="action-label">{selectedTask.completed ? t("completed") : t("complete")}</span></UiButton>
        <UiIconButton class="task-actions-trigger" label={t("otherActions")} aria-expanded={taskActionMenuOpen} onclick={() => { taskActionMenuOpen = !taskActionMenuOpen; moveMenuOpen = false; urgencyMenuOpen = false; sourceEditorOpen = false; }}><MoreHorizontal size={18} /></UiIconButton>
        {#if taskActionMenuOpen}
          <div class:move-open={moveMenuOpen} class="task-actions-menu">
            {#if moveMenuOpen}
              <button class="menu-back" onclick={() => (moveMenuOpen = false)}><ChevronRight size={14} />{t("moveTo")}</button>
              {#each chats.slice(1) as chat}
                <button disabled={chat.id === selectedTask.chatId} onclick={() => moveSelectedTask(chat)}><Folder size={15} /><span>{chat.title}</span>{#if chat.id === selectedTask.chatId}<Check size={14} />{/if}</button>
              {/each}
            {:else}
              <button onclick={() => { taskActionMenuOpen = false; attachmentInput.click(); }}><Paperclip size={15} /><span>{t("addAttachment")}</span></button>
              <button onclick={openSourceEditor}><MessageSquareText size={15} /><span>{selectedTask.hasSource ? t("source") : t("addSource")}</span></button>
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
    {#if activeSection === "tasks" && workspaceView === "task" && selectedTask}
      <section class="workspace">
        <div class="editor-page">
          <div class="task-meta" aria-label={t("taskMetadata")}>
            <span title={fullDate(selectedTask.createdAt)}>{t("created", { date: compactDate(selectedTask.createdAt) })}</span>
            {#if selectedTask.source}
              <button class="source-meta" title={taskSourceLabel(selectedTask)} aria-haspopup="dialog" onclick={openSourceViewer}><FloodGlyph kind="info" size={13} /><span class="source-meta-label">{taskSourceMetaLabel(selectedTask)}</span></button>
            {:else}
              <span class="source-meta" title={taskSourceLabel(selectedTask)}><FloodGlyph kind="info" size={13} /><span class="source-meta-label">{taskSourceMetaLabel(selectedTask)}</span></span>
            {/if}
            {#if selectedTask.source?.url}<a href={selectedTask.source.url} target="_blank" rel="noreferrer">{t("openMessage")}</a>{/if}
          </div>
          <label class="task-title-field">
            <span class="sr-only">{t("taskTitle")}</span>
            <textarea rows="1" bind:this={taskTitleInput} bind:value={taskTitleDraft} use:fitTaskTitle={taskTitleDraft} maxlength="160" aria-label={t("taskTitle")} placeholder={t("taskTitlePlaceholder")} oninput={syncTaskTitle} onkeydown={handleTaskTitleKeydown} onblur={() => void saveNow()}></textarea>
          </label>
          {#if selectedTask.relations.length}
            <div class="task-relations" aria-label={t("taskRelations")}>
              <Link size={14} aria-hidden="true" />
              {#each selectedTask.relations as relation (`${relation.kind}:${relation.task_id}`)}
                {@const target = relationTarget(relation)}
                <button class:blocked={relation.kind === "blocked_by" && !target?.completed} class:completed={Boolean(target?.completed)} disabled={!target} title={target ? t("openRelatedTask", { task: target.title }) : relation.task_id} onclick={() => target && openTask(target, target.chatId)}>
                  <small>{taskRelationLabel(relation.kind)}</small>
                  <span>{target?.title ?? relation.task_id}</span>
                  {#if target?.completed}<Check size={13} aria-hidden="true" />{/if}
                </button>
              {/each}
            </div>
          {/if}
          {#if conflictRemote}
            <div class="task-save-notice">
              <InlineNotice tone="attention" title={t("externalChange")} announce>
                {t("chooseVersion")}
                {#snippet actions()}<NoticeAction tone="attention" onclick={useDiskVersion}>{t("diskVersion")}</NoticeAction><NoticeAction tone="attention" onclick={keepLocalVersion}>{t("localVersion")}</NoticeAction>{/snippet}
              </InlineNotice>
            </div>
          {/if}
          <div class:draft-editor={selectedTaskId === draftTaskId} class="editor" bind:this={editorRoot} contenteditable="true" role="textbox" tabindex="0" aria-multiline="true" aria-label={t("taskEditor")} spellcheck="true" oninput={syncEditor} onkeydown={handleEditorKeydown} onpaste={handleEditorPaste} ondrop={handleEditorDrop} ondragover={(event) => event.preventDefault()} onpointerup={updateSelectionToolbar} onkeyup={() => { updateHint(currentBlock()); updateSelectionToolbar(); }} onclick={handleEditorClick} onblur={handleEditorBlur}></div>
          {#if latestCheckpoint && !checkpointIsRepresentedByLatestRun(latestCheckpoint, latestAgentRun)}
            <section class="task-checkpoint" aria-label={t("latestCheckpoint")}>
              <header>
                <span><CheckCircle2 size={17} /><strong>{t("latestCheckpoint")}</strong></span>
                <small>{fullDate(latestCheckpoint.created_at)}</small>
              </header>
              <p>{latestCheckpoint.summary}</p>
              {#if latestCheckpoint.verification?.length || latestCheckpoint.remaining?.length}
                <div class="task-checkpoint-columns">
                  {#if latestCheckpoint.verification?.length}
                    <div><strong>{t("checkpointVerified")}</strong><ul>{#each latestCheckpoint.verification as item}<li>{item}</li>{/each}</ul></div>
                  {/if}
                  {#if latestCheckpoint.remaining?.length}
                    <div><strong>{t("checkpointRemaining")}</strong><ul>{#each latestCheckpoint.remaining as item}<li>{item}</li>{/each}</ul></div>
                  {/if}
                </div>
              {/if}
              {#if latestCheckpoint.result}<p class="task-checkpoint-result"><strong>{t("checkpointResult")}</strong><span>{latestCheckpoint.result}</span></p>{/if}
              {#if latestCheckpoint.blocker}<p class="task-checkpoint-blocker"><strong>{t("checkpointBlocker")}</strong><span>{latestCheckpoint.blocker}</span></p>{/if}
            </section>
          {/if}
          {#if selectedTaskId !== draftTaskId}
            <section class="agent-work" aria-label={t("agentWork")}>
              <header>
                <span class="agent-work-title"><FloodGlyph kind="brand" size={20} /><span><strong>{t("agentWork")}</strong>{#if latestAgentRun}<small>{agentRunLabel(latestAgentRun.state)}</small>{:else}<small>{t("agentWorkDescription")}</small>{/if}</span></span>
                {#if latestAgentRun && ["queued", "running"].includes(latestAgentRun.state)}
                  <UiButton size="sm" busy={agentRunBusy} onclick={() => cancelAgentRun(latestAgentRun)}>{t("stopAgent")}</UiButton>
                {:else if !latestAgentRun || ["failed", "cancelled", "interrupted"].includes(latestAgentRun.state) || (latestAgentRun.state === "accepted" && !selectedTask.completed)}
                  <UiButton size="sm" busy={agentRunBusy} disabled={taskHasOpenBlockers(selectedTask)} onclick={startCodexTask}><Bot size={16} />{latestAgentRun ? t("runAgain") : t("runWithCodex")}</UiButton>
                {/if}
              </header>
              {#if latestAgentRun?.progress}<p class="agent-progress">{latestAgentRun.progress}</p>{/if}
              {#if latestAgentRun?.guidance?.length}
                <details class="agent-guidance">
                  <summary>{t("agentGuidance", { count: latestAgentRun.guidance.length })}</summary>
                  <div>
                    {#each latestAgentRun.guidance as item (`${item.kind}:${item.id}:${item.version}`)}
                      <article>
                        <span><strong>{item.title}</strong><small>{item.kind === "rule" ? t("projectRule") : t("projectSkill")} · {item.version.slice(0, 8)}</small></span>
                        <p>{item.reason}</p>
                      </article>
                    {/each}
                  </div>
                </details>
              {/if}
              {#if latestAgentRun?.result}
                <div class="agent-result">
                  <strong>{t("agentResult")}</strong>
                  <p>{latestAgentRun.result}</p>
                  {#if latestAgentRun.memory?.length}<span class="agent-memory"><Database size={14} />{t("agentMemorySaved", { count: latestAgentRun.memory.length })}</span>{/if}
                  {#if latestAgentRun.state === "ready_for_review" && !selectedTask.completed}
                    <UiButton variant="primary" busy={agentRunBusy} onclick={acceptAgentResult}><Check size={16} />{t("acceptAgentResult")}</UiButton>
                  {:else if latestAgentRun.state === "accepted" || selectedTask.completed}
                    <span class="agent-accepted"><FloodGlyph kind="completed" size={15} />{t("agentResultAccepted")}</span>
                  {/if}
                </div>
              {/if}
              {#if latestAgentRun?.state === "needs_input" && latestAgentRun.blocker}
                <form class="agent-question" onsubmit={(event) => { event.preventDefault(); void continueCodexTask(); }}>
                  <div><strong>{t("agentQuestion")}</strong><p>{latestAgentRun.blocker}</p></div>
                  <TextArea class="agent-answer-field" label={t("yourAnswer")} bind:value={agentResponse} maxlength={4000} rows={2} placeholder={t("agentAnswerPlaceholder")} />
                  <UiButton variant="primary" size="sm" type="submit" busy={agentRunBusy} disabled={!agentResponse.trim()}>{t("continueWork")}</UiButton>
                </form>
              {/if}
              {#if latestAgentRun?.error}<InlineNotice class="agent-inline-notice" tone="danger" announce>{latestAgentRun.error}</InlineNotice>{/if}
              {#if agentRunError}<InlineNotice class="agent-inline-notice" tone="danger" announce>{agentRunError}</InlineNotice>{/if}
            </section>
          {/if}
        </div>
      </section>
    {:else if activeSection === "tasks"}
      <section class="workspace project-workspace" inert={projectContextOpen}>
        <div class="project-page prototype-project">
          {#if loadError && !devPreviewActive()}<div class="data-error"><strong>{t("dataOpenError")}</strong><span>{loadError}</span></div>{/if}
          <div class="prototype-heading">
            <div class="prototype-picker-wrap">
              <button bind:this={projectPickerButton} class="prototype-project-picker" aria-label="Выбрать проект" aria-haspopup="menu" aria-expanded={projectPickerOpen} onclick={() => (projectPickerOpen = !projectPickerOpen)}>
                <h1>{currentChat.title}</h1><ChevronDown size={16} />
              </button>
              {#if projectPickerOpen}
                <div class="prototype-project-menu" role="menu" aria-label="Проекты">
                  {#each chats.slice(1) as chat (chat.id)}
                    <button role="menuitem" class:selected={selectedChatId === chat.id} onclick={() => selectChat(chat)}><span>{chat.title}</span>{#if selectedChatId === chat.id}<Check size={15} />{/if}</button>
                  {/each}
                  <div class="prototype-menu-divider"></div>
                  {#if createChatOpen}
                    <form class="prototype-create-project" onsubmit={submitCreateChat}>
                      <label class="sr-only" for="prototype-project-name">Название проекта</label>
                      <input id="prototype-project-name" bind:value={createChatTitle} placeholder="Название проекта" maxlength="100" required />
                      <button aria-label="Создать проект" type="submit"><Check size={16} /></button>
                    </form>
                  {:else}
                    <button role="menuitem" onclick={() => { createChatOpen = true; void tick().then(() => document.querySelector<HTMLInputElement>("#prototype-project-name")?.focus()); }}><Plus size={15} /><span>Новый проект</span></button>
                  {/if}
                </div>
              {/if}
            </div>
          </div>
          <div class="prototype-controls">
            <div class="prototype-tabs" role="tablist" tabindex="-1" aria-label="Фильтр задач" onkeydown={handleProjectTabsKeydown}>
              <button role="tab" tabindex={projectTab === "all" ? 0 : -1} aria-selected={projectTab === "all"} onclick={() => (projectTab = "all")}>Все ({currentOpenTasks.length})</button>
              <button role="tab" tabindex={projectTab === "urgent" ? 0 : -1} aria-selected={projectTab === "urgent"} onclick={() => (projectTab = "urgent")}>Срочные ({urgentTaskCount})</button>
              <button role="tab" tabindex={projectTab === "closed" ? 0 : -1} aria-selected={projectTab === "closed"} onclick={() => (projectTab = "closed")}>Закрытые ({currentCompletedTasks.length})</button>
            </div>
            <div class="prototype-control-actions">
              <UiIconButton label={t("projectSettings")} onclick={openProjectContext}><Settings size={17} /></UiIconButton>
              <UiButton class="prototype-add-task" onclick={() => requestNewTask("workspace")}><Plus size={16} />Новая задача</UiButton>
            </div>
          </div>
          {#if projectTaskError}<div class="project-task-notice"><InlineNotice tone="attention" announce>{projectTaskError}</InlineNotice></div>{/if}
          {#if currentProjectPrimaryRun}
            {@const agentTask = agentRunTask(currentProjectPrimaryRun)}
            {#if agentTask}
              <button class="prototype-agent-status" onclick={() => openAgentRunTask(currentProjectPrimaryRun)}>
                <FloodGlyph kind="brand" size={18} /><span>Codex · {agentTask.title}</span><small>{agentRunLabel(currentProjectPrimaryRun.state)}</small><ChevronRight size={15} />
              </button>
            {/if}
          {/if}
          <div class="prototype-task-panel" role="tabpanel" aria-label={projectTab === "all" ? "Все задачи" : projectTab === "urgent" ? "Срочные задачи" : "Закрытые задачи"}>
            <div class="prototype-task-list">
              {#each filteredProjectTasks as task (task.id)}
                <TaskRow class="prototype-task-row" title={task.title} urgency={task.urgency} urgencyLabel={urgencyTitle(task.urgency)} completed={task.completed} completeLabel={t("completeTask")} completedLabel={t("completed")} reopenLabel={t("restoreTask")} busy={projectTaskPendingIds.includes(task.id)} oncomplete={(completed) => setListedTaskCompleted(task, completed)} onopen={() => openTask(task, currentChat.id)} />
              {:else}
                <div class="prototype-empty">
                  <p>{projectTab === "all" ? "Открытых задач пока нет" : projectTab === "urgent" ? "Срочных задач нет" : "Закрытых задач пока нет"}</p>
                  {#if projectTab === "all"}<UiButton onclick={() => requestNewTask("workspace")}><Plus size={16} />Новая задача</UiButton>{/if}
                </div>
              {/each}
            </div>
          </div>
        </div>
      </section>
    {:else if activeSection === "trash"}
      <section class="workspace project-workspace">
        <div class="project-page trash-page">
          <button class="prototype-back" onclick={() => openSettingsSection("general")}><ChevronLeft size={16} />К настройкам</button>
          <header class="project-header">
            <div><h1>{t("trash")}</h1><p>{t("trashDescription")}</p></div>
            {#if trashedTasks.length}<UiButton variant="danger" size="sm" onclick={() => (emptyTrashConfirmOpen = true)}><Trash2 size={14} />{t("clear")}</UiButton>{/if}
          </header>
          {#if emptyTrashConfirmOpen}
            <InlineNotice class="trash-confirm-notice" tone="danger" title={t("clearTrashQuestion")} announce>
              {t("clearTrashWarning")}
              {#snippet actions()}<UiButton size="sm" onclick={() => (emptyTrashConfirmOpen = false)}>{t("cancel")}</UiButton><NoticeAction tone="danger" onclick={emptyTrash}>{t("deleteAll")}</NoticeAction>{/snippet}
            </InlineNotice>
          {/if}
          <div class="project-task-list standalone">
            {#each trashedTasks as task}
              <div class="project-task trash-task">
                <Trash2 size={16} />
                <span class="project-task-copy"><strong>{task.title}</strong><small>{task.chat}{task.trashedAt ? ` · ${t("deletedAgo", { date: relativeDate(task.trashedAt) })}` : ""}</small></span>
                <span class="trash-actions">
                  {#if purgeTaskId === task.id}
                    <UiButton size="sm" onclick={() => (purgeTaskId = "")}>{t("cancel")}</UiButton><UiButton variant="danger" size="sm" onclick={() => deleteTrashedTask(task)}>{t("delete")}</UiButton>
                  {:else}
                    <UiButton class="restore-button" size="sm" onclick={() => restoreTask(task)}><RotateCcw size={14} />{t("restore")}</UiButton>
                    <UiIconButton label={t("deleteForever")} variant="danger" size="sm" onclick={() => (purgeTaskId = task.id)}><Trash2 size={14} /></UiIconButton>
                  {/if}
                </span>
              </div>
            {:else}
              <EmptyState title={t("emptyTrash")} />
            {/each}
          </div>
        </div>
      </section>
    {:else}
      <section class="workspace settings-workspace">
        <div class="settings-page">
          <button class="prototype-back" onclick={() => changeSection("tasks")}><ChevronLeft size={16} />К работе</button>
          <header class="settings-header"><h2>{t("settings")}</h2></header>
          <div class="settings-layout">
            <nav bind:this={settingsNavElement} class="settings-nav" aria-label={t("settingsSections")}>
              <button data-settings-section="general" class:active={settingsSection === "general"} aria-current={settingsSection === "general" ? "page" : undefined} onclick={() => openSettingsSection("general")}><Settings size={16} />Приложение</button>

              <button data-settings-section="agents" class:active={settingsSection === "agents"} aria-current={settingsSection === "agents" ? "page" : undefined} onclick={() => openSettingsSection("agents")}><Bot size={16}/>Агенты и MCP</button>
              <button data-settings-section="integrations" class:active={settingsSection === "integrations"} aria-current={settingsSection === "integrations" ? "page" : undefined} onclick={() => openSettingsSection("integrations")}><Link size={16}/>Интеграции</button>
              <button data-settings-section="data" class:active={settingsSection === "data"} aria-current={settingsSection === "data" ? "page" : undefined} onclick={() => openSettingsSection("data")}><Database size={16} />{t("data")}</button>

            </nav>
            <div class="settings-content">
              {#if settingsSection === "general"}
                <section class="settings-section" aria-label="Настройки приложения">
                  <div class="settings-section-title"><h3>Приложение</h3></div>
                  <div class="settings-group"><UiSwitch label={t("reduceMotion")} checked={reduceMotion} onchange={toggleMotionPreference} /></div>
                </section>
                <section class="settings-section">


                  <div class="settings-group about-group">
                    <div class="about-brand"><FloodGlyph kind="brand" size={42} /><span><strong>flood.md</strong><small>Версия {appVersion}</small></span></div>
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
                  </div>
                  <div class="settings-group"><div class:error={updateState === "error"} class:success={updateState === "current" && Boolean(updateMessage)} class="update-row"><span><strong>{t("updates")}</strong>{#if updateMessage || installationRuntime?.kind === "development"}<small>{updateMessage || t("updateDevelopmentDescription")}</small>{/if}{#if updateState === "downloading"}<progress max="100" value={updateProgress}></progress>{/if}</span>{#if updateState === "available"}<button class="primary-small" onclick={installAvailableUpdate}><Download size={15} />{t("installVersion", { version: availableUpdate?.version ?? "" })}</button>{:else}<button onclick={checkForUpdates} disabled={updateState === "checking" || updateState === "downloading" || installationRuntime?.kind === "development"}><span class:spinning={updateState === "checking"} class="update-icon"><RefreshCw size={15} /></span>{updateState === "checking" ? t("checking") : t("check")}</button>{/if}</div></div>
                  <button class="settings-action" onclick={() => openUrl("https://github.com/tillwithered/flood.md")}><ExternalLink size={15} />{t("openGithub")}</button>
                </section>
              {:else if settingsSection === "data"}
                <section class="settings-section">
                  <div class="settings-section-title"><h3>{t("data")}</h3></div>
                  <h4 class="settings-group-label">{t("settingsStorage")}</h4>
                  <div class="settings-group">
                    <div class="data-location"><span><FolderOpen size={17} /><span><strong>{t("tasksFolder")}</strong><code>{dataDirectory || t("availableInApp")}</code></span></span><UiButton size="sm" onclick={openDataDirectory} disabled={!dataDirectory}>{t("open")}</UiButton></div>
                    <div class="data-location attachment-cleanup-row">
                      <span><Paperclip size={17} /><span><strong>{t("unusedAttachments")}</strong><small>{#if attachmentCleanupState === "checking"}{t("checkingAttachments")}{:else if attachmentCleanupReport}{attachmentCleanupReport.orphaned_files ? t("attachmentCleanupSummary", { count: attachmentCleanupReport.orphaned_files, size: formatFileSize(attachmentCleanupReport.orphaned_bytes) }) : t("attachmentsHealthy")}{:else}{t("unusedAttachmentsDescription")}{/if}</small></span></span>
                      {#if attachmentCleanupReport?.orphaned_files}
                        <UiButton size="sm" variant="danger" onclick={() => (attachmentCleanupConfirm = true)} disabled={attachmentCleanupState === "checking" || attachmentCleanupState === "cleaning"}><Trash2 size={14} />{t("cleanAttachments")}</UiButton>
                      {:else}
                        <UiButton size="sm" onclick={loadAttachmentCleanupReport} disabled={attachmentCleanupState === "checking" || attachmentCleanupState === "cleaning"}><RefreshCw class={attachmentCleanupState === "checking" ? "spinning" : ""} size={14} />{t("checkAttachments")}</UiButton>
                      {/if}
                    </div>
                    {#if attachmentCleanupConfirm && attachmentCleanupReport?.orphaned_files}
                      <div class="restore-confirm attachment-cleanup-confirm" role="alert">
                        <FloodGlyph kind="important" size={32} />
                        <span><strong>{t("attachmentCleanupQuestion", { count: attachmentCleanupReport.orphaned_files, size: formatFileSize(attachmentCleanupReport.orphaned_bytes) })}</strong><small>{t("attachmentCleanupWarning")}</small></span>
                        <div><UiButton size="sm" variant="quiet" onclick={() => (attachmentCleanupConfirm = false)} disabled={attachmentCleanupState === "cleaning"}>{t("cancel")}</UiButton><UiButton size="sm" variant="danger" busy={attachmentCleanupState === "cleaning"} onclick={cleanupOrphanedAttachments}>{t("delete")}</UiButton></div>
                      </div>
                    {/if}
                    {#if attachmentCleanupMessage}<p class:error={attachmentCleanupState === "error"} class:success={attachmentCleanupState === "success"} class="data-action-message" role="status">{attachmentCleanupMessage}</p>{/if}
                  </div>
                  <button class="settings-trash-row" onclick={() => changeSection("trash")}><span><Trash2 size={16}/>Корзина</span><span>{trashedTasks.length}<ChevronRight size={15}/></span></button>
                  <h4 class="settings-group-label">{t("settingsBackups")}</h4>
                  <div class="settings-group settings-actions-group">
                    <div class="data-actions">
                      <UiButton size="sm" variant="quiet" busy={dataActionState === "backing-up"} onclick={createDataBackup} disabled={dataActionState === "restoring"}><Download size={15} />{t("createBackup")}</UiButton>
                      <UiButton size="sm" variant="quiet" onclick={chooseBackupToRestore} disabled={dataActionState === "backing-up" || dataActionState === "restoring"}><RotateCcw size={15} />{t("restoreBackup")}</UiButton>
                      <UiButton size="sm" variant="quiet" onclick={() => loadData(true)} disabled={dataActionState === "restoring"}><RefreshCw size={15} />{t("reload")}</UiButton>
                    </div>
                    {#if pendingRestorePath}
                      <div class="restore-confirm" role="alert">
                        <FloodGlyph kind="info" size={32} />
                        <span><strong>{t("restoreBackupQuestion", { file: fileName(pendingRestorePath) })}</strong><small>{t("restoreBackupWarning")}</small></span>
                        <div><UiButton size="sm" variant="quiet" onclick={() => (pendingRestorePath = "")}>{t("cancel")}</UiButton><UiButton size="sm" onclick={restoreDataBackup}>{t("restoreBackup")}</UiButton></div>
                      </div>
                    {/if}
                    {#if dataActionMessage}<p class:error={dataActionState === "error"} class="data-action-message" role="status">{dataActionMessage}</p>{/if}
                  </div>
                </section>
              {:else if settingsSection === "integrations"}
                <section class="settings-section integrations-settings-section">
                  <div class="settings-section-title"><h3>{t("integrations")}</h3></div>
                  <div class="connector-grid">
                    {#each connectorUiRegistry as connector (connector.id)}
                      {@const card = connectorCardState(connector)}
                      <IntegrationCard provider={connector.id} title={connector.title} description={connector.id === "telegram" ? "Чаты и сообщения" : "Репозитории, issues и pull requests"} status={card.status} detail={card.tone === "idle" ? "" : card.detail} tone={card.tone} actionLabel={card.actionLabel} onclick={() => openIntegrationModal(connector.id)} />
                    {/each}
                  </div>
                </section>
              {:else if settingsSection === "agents"}
                <section class="settings-section mcp-settings-section">
                  <div class="settings-section-title settings-title-with-action"><h3>Агенты и MCP</h3><UiButton variant="quiet" size="sm" disabled={!inTauri() || Boolean(agentAdapterPending) || agentAdaptersState === "loading"} busy={agentAdaptersState === "loading"} onclick={() => loadAgentAdapters()}><RefreshCw size={14}/>Обновить</UiButton></div>
                  <div class="mcp-block">
                    <div class="mcp-block-title"><span><strong>Агент</strong></span></div>
                    <div class="agent-adapter-list">
                      {#each agentAdapterClients as client (client)}
                        {@const adapter = agentAdapterStatus(client)}
                        <div class:ready={Boolean(adapter?.connected && adapter?.project_adapter_current)} class="agent-adapter-row">
                          <span class="agent-adapter-mark" aria-hidden="true"><Bot size={19}/></span>
                          <span class="agent-adapter-copy">
                            <strong>{client === "codex" ? "Codex" : "Claude Code"}</strong>
                            <small>{agentAdapterStatusLabel(adapter)}</small>
                            {#if adapter?.version}<small class="agent-adapter-version">{adapter.version}</small>{/if}
                          </span>
                          <UiButton size="sm" disabled={!inTauri() || !adapter?.installed || Boolean(agentAdapterPending) || agentAdaptersState === "loading"} busy={agentAdapterPending === client} onclick={() => connectAgentAdapter(client)}>
                            {adapter?.connected && adapter?.project_adapter_current ? t("agentAdapterUpdate") : t("agentAdapterConnect")}
                          </UiButton>
                        </div>
                      {/each}
                    </div>
                    {#if agentAdapterRoot}<p class="mcp-hint">{t("agentAdapterProject", { path: agentAdapterRoot })}</p>{/if}
                    {#if agentAdapterMessage}<InlineNotice tone="success" announce>{agentAdapterMessage}</InlineNotice>{/if}
                    {#if agentAdapterError}<InlineNotice tone="danger" announce>{agentAdapterError}</InlineNotice>{/if}
                  </div>
                  <div class="settings-link-group">
                    <button class="settings-link-row" onclick={() => { mcpSettingsOpen = true; mcpCopyError = ""; copied = false; }}>
                      <span><strong>Конфигурация MCP</strong><small>Ручное подключение к клиенту</small></span><ChevronRight size={16}/>
                    </button>
                  </div>
                  <details class="settings-advanced"><summary>Журнал MCP<ChevronDown size={14}/></summary>
                  <div class="mcp-block mcp-activity">
                    <div class="mcp-activity-head">
                      <div class="mcp-block-title"><strong>{t("mcpActivity")}</strong></div>
                      <span><small>{t("mcpActivityCount", { count: mcpActivityTotal })}</small><UiIconButton size="sm" label={t("reload")} disabled={mcpActivityState === "loading"} onclick={() => loadMcpActivity()}><RefreshCw class={mcpActivityState === "loading" ? "spinning" : ""} size={14} /></UiIconButton></span>
                    </div>
                    {#if mcpActivityState === "error"}
                      <div class="mcp-activity-empty error" role="status"><FloodGlyph kind="urgent" size={18} /><span><strong>{t("mcpActivityFailed")}</strong><small>{mcpActivityError}</small></span></div>
                    {:else if !mcpActivity.length}
                      <div class="mcp-activity-empty"><FloodGlyph kind="brand" size={18} /><span><strong>{t("mcpActivityEmpty")}</strong></span></div>
                    {:else}
                      <div class="mcp-activity-list">
                        {#each mcpActivity as event (event.id)}
                          <div class="mcp-activity-row">
                            <FloodGlyph kind={activityGlyph(event)} size={16} />
                            <span>
                              <strong>{t(activityActionKeys[event.action])}</strong>
                              <small title={event.entity_id}>{activityEntityLabel(event)}</small>
                              {#if event.provenance}
                                <small class="mcp-activity-provenance">{activityProvenanceLabel(event)}</small>
                              {/if}
                            </span>
                            <time datetime={event.occurred_at} title={fullDate(event.occurred_at)}>{relativeDate(event.occurred_at)}</time>
                          </div>
                        {/each}
                      </div>
                      {#if mcpActivityRemaining > 0}<button class="mcp-activity-more" disabled={mcpActivityState === "loading"} onclick={() => loadMcpActivity(true)}>{t("showMoreMessages", { count: mcpActivityRemaining })}</button>{/if}
                    {/if}
                  </div>

                  </details>
                  <div class="settings-automation">
                    <h4 class="settings-group-label">Автоматизация</h4>
                    <UiSwitch label="Создавать задачи из новых сообщений" description="Экспериментально. Использует лимиты подключённого провайдера." disabled={!inTauri()} checked={automationSettings.background_ai_triage} pending={automationSettingsState === "saving"} onchange={() => void toggleBackgroundAiTriage()} />
                    {#if automationSettings.background_ai_triage}<p class="mcp-hint" aria-live="polite">{automationStatusLabel()}</p>{/if}
                    {#if automationSettingsState === "error"}<p class="automation-settings-error" role="alert">{automationSettingsError || t("backgroundAiTriageFailed")}</p>{/if}
                  </div>
                </section>

              {/if}
            </div>
          </div>
        </div>
      </section>
    {/if}
  </div>
  <Dock bind:this={dock} onheightchange={(height) => dockClearance = height} visible={!projectContextOpen && activeSection === "tasks" && (workspaceView === "project" || workspaceView === "task") && Boolean(dockProject && dockProject.id !== "all")} projectId={dockProject?.id ?? "all"} projectTitle={dockProject?.title ?? ""} viewedTaskId={workspaceView === "task" ? selectedTaskId : undefined} tasks={tasks.filter((task) => !isLocalDraft(task) && task.chatId === dockProject?.id).map((task) => ({ id: task.id, title: task.title, markdown: task.markdown }))} onnewtask={openDockTaskModal} onnewproject={openDockProjectModal} onsettings={() => openSettingsSection("agents")} onconnect={() => (conversationSettingsOpen = true)} />
</main>

<UiModal bind:open={mcpSettingsOpen} title="Конфигурация MCP">
                    <div class="mcp-manual-setup">
                      <div>
                        <div class="mcp-client-tabs" role="group" aria-label={t("mcpClient")}>
                          {#each mcpClients as client}
                            <button class:active={mcpClient === client} aria-pressed={mcpClient === client} onclick={() => { mcpClient = client; copied = false; mcpCopyError = ""; }}>{client === "manual" ? t("manual") : client === "codex" ? "Codex" : client === "claude" ? "Claude" : "Cursor"}</button>
                          {/each}
                        </div>
                        <div class="mcp-code" title={mcpExecutable || "flood-mcp.exe"}><pre>{mcpConfiguration(mcpClient)}</pre><UiIconButton label={copied ? t("copied") : t("copyConfiguration")} busy={mcpCopyPending} onclick={copyMcpConfig}>{#if copied}<Check size={16} />{:else}<Clipboard size={16} />{/if}</UiIconButton></div>
                        {#if mcpCopyError}<p class="dock-modal-error" role="alert">{mcpCopyError}</p>{/if}
                        <p class="mcp-hint">{t("restartMcpClient")}</p>
                        {#if mcpRuntime?.source === "development"}<p class="mcp-hint mcp-dev-hint"><ShieldCheck size={13} />{t("mcpDevLauncherDescription")}</p>{/if}
                      </div>
                    </div>

  {#snippet footer()}<UiButton onclick={() => (mcpSettingsOpen = false)}>Готово</UiButton>{/snippet}
</UiModal>

<UiModal bind:open={conversationSettingsOpen} title="Разговор для проекта">
  <AgentConversationSettings fixedProject active={conversationSettingsOpen} onsaved={() => { conversationSettingsOpen = false; dock?.refreshRouting(); dock?.focus(); }} showTitle={false} projects={chats.filter(chat => chat.id !== "all")} initialProjectId={dockProject?.id === "all" ? undefined : dockProject?.id} />
</UiModal>

<UiModal bind:open={dockTaskModalOpen} title="Новая задача" subtitle="Добавьте задачу в нужный проект.">
  <form id="dock-new-task-form" class="dock-create-form" onsubmit={submitDockTask}>
    <TextField label="Название" bind:value={dockTaskTitle} placeholder="Что нужно сделать?" maxlength={300} required />
    <SelectField label="Проект" bind:value={dockTaskProjectId} options={chats.filter((chat) => chat.id !== "all").map((chat) => ({ value: chat.id, label: chat.title }))} />
    <TextArea label="Описание" bind:value={dockTaskDetails} optional rows={3} placeholder="Подробности задачи" />
    <SelectField label="Срочность" bind:value={dockTaskUrgency} options={[{ value: "normal", label: "Обычная" }, { value: "important", label: "Важная" }, { value: "urgent", label: "Срочная" }]} />
    {#if dockModalError}<p class="dock-modal-error" role="alert">{dockModalError}</p>{/if}
  </form>
  {#snippet footer()}
    <UiButton onclick={() => (dockTaskModalOpen = false)} disabled={dockModalBusy}>Отмена</UiButton>
    <UiButton variant="primary" type="submit" form="dock-new-task-form" busy={dockModalBusy} disabled={!dockTaskTitle.trim() || !dockTaskProjectId}>Создать задачу</UiButton>
  {/snippet}
</UiModal>

<UiModal bind:open={dockProjectModalOpen} title="Новый проект" subtitle="Задачи и контекст будут храниться в этом проекте.">
  <form id="dock-new-project-form" class="dock-create-form" onsubmit={submitDockProject}>
    <TextField label="Название проекта" bind:value={dockProjectTitle} placeholder="Название проекта" maxlength={100} required />
    {#if dockModalError}<p class="dock-modal-error" role="alert">{dockModalError}</p>{/if}
  </form>
  {#snippet footer()}
    <UiButton onclick={() => (dockProjectModalOpen = false)} disabled={dockModalBusy}>Отмена</UiButton>
    <UiButton variant="primary" type="submit" form="dock-new-project-form" busy={dockModalBusy} disabled={!dockProjectTitle.trim()}>Создать проект</UiButton>
  {/snippet}
</UiModal>

<UiModal bind:open={projectContextDiscardOpen} title="Несохранённые изменения" subtitle="Изменения контекста проекта ещё не сохранены.">
  {#snippet footer()}
    <UiButton onclick={() => (projectContextDiscardOpen = false)}>Продолжить редактирование</UiButton>
    <UiButton variant="danger" onclick={() => closeProjectContext(true, true)}>Не сохранять</UiButton>
  {/snippet}
</UiModal>

<UiModal bind:open={createHubOpen} title={t("create")} subtitle={t("chooseWhatToCreate")}>
  <div class="create-hub-options">
    <button type="button" onclick={chooseCreateTask}>
      <span><ListChecks size={19} /></span>
      <span><strong>{t("newTask")}</strong><small>{t("chooseProject")}</small></span>
      <ChevronRight size={16} />
    </button>
    <button type="button" onclick={chooseCreateProject}>
      <span><FolderPlus size={19} /></span>
      <span><strong>{t("newProject")}</strong><small>{t("projectName")}</small></span>
      <ChevronRight size={16} />
    </button>
  </div>
</UiModal>

{#if integrationModal === "telegram"}
  <IntegrationModal provider="telegram" title="Telegram" subtitle={telegramStatus.account_name || t("tdlibClient")} closeLabel={t("close")} onclose={closeIntegrationModal} onkeydown={trapModalFocus}>
    <div class="connector-management">
      <div class="connector-management-status"><FloodGlyph kind={["database_error", "error"].includes(telegramStatus.step) ? "urgent" : telegramStatus.step === "ready" ? "connected" : "info"} size={20} /><span><strong>{telegramStatusLabel()}</strong></span></div>
      {#if telegramSyncRequest && telegramStatus.step !== "ready"}<InlineNotice tone="attention" title={t("telegramSyncWaiting")}>{t("telegramSyncWaitingDescription")}</InlineNotice>{/if}
      {#if telegramStatus.step === "unconfigured"}
        <p>{t("telegramDescription")}</p>
        <form class="telegram-form credentials" onsubmit={configureTelegram}>
          <TextField label="API ID" bind:value={telegramApiId} inputmode="numeric" autocomplete="off" placeholder="12345678" required />
          <TextField label="API Hash" bind:value={telegramApiHash} type="password" autocomplete="off" placeholder="••••••••••••••••" required />
          <UiButton type="submit" variant="primary" disabled={telegramBusy}>{t("connect")}</UiButton>
        </form>
        <UiButton variant="quiet" size="sm" onclick={() => openUrl("https://my.telegram.org/apps")}><ExternalLink size={13} />{t("getTelegramKeys")}</UiButton>
      {:else if telegramStatus.step === "phone"}
        <p>{t("telegramChooseLogin")}</p>
        <div class="telegram-login-options"><UiButton variant="secondary" disabled={telegramBusy} onclick={requestTelegramQr}><QrCode size={15} />{t("loginWithQr")}</UiButton><span>{t("or")}</span></div>
        <form class="telegram-form inline" onsubmit={submitTelegramPhone}><TextField label={t("phoneNumber")} bind:value={telegramPhone} type="tel" autocomplete="tel" placeholder="+7 700 000 00 00" required /><UiButton type="submit" variant="primary" disabled={telegramBusy}>{t("continue")}</UiButton></form>
      {:else if telegramStatus.step === "qr"}
        <div class="telegram-qr">{#if telegramQrDataUrl}<img src={telegramQrDataUrl} alt={t("telegramQrCode")} />{/if}<span><strong>{t("scanQr")}</strong><small>{t("scanQrDescription")}</small></span></div>
        <UiButton variant="quiet" size="sm" onclick={() => openUrl(telegramStatus.qr_link || "tg://login")}><ExternalLink size={13} />{t("openInTelegram")}</UiButton>
      {:else if telegramStatus.step === "code"}
        <form class="telegram-form inline" onsubmit={submitTelegramCode}><TextField label={t("telegramCode")} bind:value={telegramCode} inputmode="numeric" autocomplete="one-time-code" required /><UiButton type="submit" variant="primary" disabled={telegramBusy}>{t("continue")}</UiButton></form>
      {:else if telegramStatus.step === "password"}
        <form class="telegram-form inline" onsubmit={submitTelegramPassword}><TextField label={t("telegramPassword")} bind:value={telegramPassword} type="password" autocomplete="current-password" placeholder={telegramStatus.password_hint || ""} required /><UiButton type="submit" variant="primary" disabled={telegramBusy}>{t("continue")}</UiButton></form>
      {:else if telegramStatus.step === "ready"}
        <InlineNotice tone={telegramSyncState === "error" ? "danger" : telegramSyncState === "partial" ? "attention" : "info"} title={t("telegramSynchronization")} announce>
          {telegramSyncLabel()}{#if telegramSyncErrors[0]} · {telegramSyncErrors[0]}{telegramSyncErrors.length > 1 ? ` · +${telegramSyncErrors.length - 1}` : ""}{/if}
          {#snippet actions()}<NoticeAction tone={telegramSyncState === "error" ? "danger" : telegramSyncState === "partial" ? "attention" : "info"} disabled={telegramSyncState === "syncing"} onclick={() => syncTelegram()}>{t("syncNow")}</NoticeAction>{/snippet}
        </InlineNotice>
        <InlineNotice tone="success" title={t("telegramLocalSession")}>{t("telegramLocalSessionDescription")}</InlineNotice>
        <UiButton variant="danger" size="sm" disabled={telegramBusy} onclick={disconnectTelegram}><LogOut size={13} />{t("disconnect")}</UiButton>
      {:else if telegramStatus.step === "database_error"}
        <InlineNotice tone="danger" title={t("telegramDatabaseError")} announce>{t("telegramDatabaseErrorDescription")}{#snippet actions()}<NoticeAction tone="danger" disabled={telegramBusy} onclick={resetTelegramDatabase}><RotateCcw size={14} />{t("repairConnection")}</NoticeAction>{/snippet}</InlineNotice>
      {:else}
        <div class="telegram-loading"><RefreshCw class="spinning" size={15} />{t("connecting")}</div>
      {/if}
      {#if telegramError && telegramStatus.step !== "database_error"}<InlineNotice tone="danger" announce>{telegramError}</InlineNotice>{/if}
    </div>
  </IntegrationModal>
{:else if integrationModal === "github"}
  <IntegrationModal provider="github" title="GitHub" subtitle={githubStatus.account?.login || t("githubAppConnector")} closeLabel={t("close")} onclose={closeIntegrationModal} onkeydown={trapModalFocus}>
    <div class="connector-management github-management">
      <div class="connector-management-status"><FloodGlyph kind={githubStatusTone() === "error" ? "urgent" : githubStatus.connected ? "connected" : githubDeviceCode ? "important" : "info"} size={20} /><span><strong>{githubStatusLabel()}</strong></span>{#if githubStatus.managed_app}<span class="managed-chip">{t("officialConnector")}</span>{/if}</div>
      {#if !githubStatus.configured}
        <div class="connector-empty"><FloodGlyph kind="info" size={30} /><span><strong>{t("githubAppRequired")}</strong><small>{t("githubAppRequiredDescription")}</small></span></div>
        <form class="github-config-form" onsubmit={configureGithub}>
          <TextField label="Client ID" bind:value={githubClientId} autocomplete="off" placeholder="Iv1…" required />
          <TextField label="App slug" bind:value={githubAppSlug} autocomplete="off" placeholder="flood-md" required />
          <UiButton type="submit" variant="primary" disabled={githubBusy}>{t("saveAndContinue")}</UiButton>
        </form>
        <UiButton variant="quiet" size="sm" onclick={() => openUrl("https://docs.github.com/apps/creating-github-apps/registering-a-github-app/registering-a-github-app")}><ExternalLink size={13} />{t("githubCreateApp")}</UiButton>
      {:else if githubDeviceCode}
        <div class="github-device-flow">
          <span><small>{t("githubDeviceCode")}</small><strong>{githubDeviceCode.user_code}</strong></span>
          <UiButton size="sm" onclick={copyGithubDeviceCode}>{#if githubCodeCopied}<Check size={14} />{t("copied")}{:else}<Clipboard size={14} />{t("copy")}{/if}</UiButton>
        </div>
        <p>{t("githubDeviceInstructions")}</p>
        <div class="github-auth-wait"><RefreshCw class="spinning" size={15} /><span><strong>{t("githubWaiting")}</strong><small>{t("githubWaitingDescription")}</small></span></div>
        <UiButton variant="quiet" size="sm" onclick={() => openUrl(githubDeviceCode!.verification_uri)}><ExternalLink size={13} />{t("openGithub")}</UiButton>
      {:else if githubAuthorizationCompleted}
        <InlineNotice tone="success" title={t("githubConnectedSuccess")} announce>{t("githubConnectedSuccessDescription", { account: githubAuthorizationCompleted.login })}</InlineNotice>
        <UiButton variant="primary" onclick={() => (githubAuthorizationCompleted = null)}>{t("continue")}<ChevronRight size={14} /></UiButton>
      {:else if !githubStatus.connected}
        <div class="connector-empty"><FloodGlyph kind="brand" size={30} /><span><strong>{t("githubConnectTitle")}</strong><small>{t("githubConnectDescription")}</small></span></div>
        <div class="github-permissions"><span><Check size={13} />{t("githubReadContents")}</span><span><Check size={13} />{t("githubReadWork")}</span><span><ShieldCheck size={13} />{t("githubNoWrite")}</span></div>
        <UiButton variant="primary" busy={githubBusy} disabled={!githubStatus.credential_store_available} onclick={beginGithubAuthorization}>{t("continueWithGithub")}</UiButton>
      {:else}
        <div class="github-account-row"><FloodGlyph kind="connected" size={26} /><span><strong>{githubStatus.account?.name || githubStatus.account?.login}</strong><small>@{githubStatus.account?.login} · {t("githubSessionStored")}</small></span><UiButton variant="quiet" size="sm" onclick={() => openUrl(githubStatus.account?.html_url || "https://github.com")}><ExternalLink size={14} />{t("profile")}</UiButton></div>
        <div class="github-installation-row"><span><strong>{t("githubRepositoryAccess")}</strong><small>{t("githubInstallationCount", { count: githubInstallations.length })}</small></span><div><UiButton size="sm" busy={githubBusy} onclick={loadGithubRepositories}>{t("refresh")}</UiButton><UiButton size="sm" onclick={installGithubApp}>{t("changeAccess")}</UiButton></div></div>
        {#if !githubRepositories.length && !githubBusy}
          <div class="connector-empty"><FloodGlyph kind="important" size={28} /><span><strong>{t("githubNoRepositories")}</strong><small>{t("githubNoRepositoriesDescription")}</small></span><UiButton size="sm" onclick={installGithubApp}>{t("installGithubApp")}</UiButton></div>
        {/if}
        <InlineNotice tone="success" title={t("githubSecureStorage")}>{t("githubSecureStorageDescription")}</InlineNotice>
        <UiButton variant="danger" size="sm" disabled={githubBusy} onclick={disconnectGithub}><LogOut size={13} />{t("disconnect")}</UiButton>
      {/if}
      {#if githubError}<InlineNotice tone="danger" announce>{githubError}</InlineNotice>{/if}
    </div>
  </IntegrationModal>
{/if}

{#if projectContextOpen}
  {@const activeMemory = projectMemoryEntries("active")}
  {@const supersededMemory = projectMemoryEntries("superseded")}
  <div class:sidebar-collapsed={sidebarCollapsed} class="project-context-route">
    <section class="project-context-page" bind:this={projectContextDialog} aria-label={t("projectSettings")} tabindex="-1">
      <form class="project-context-form" onsubmit={saveProjectContext}>
        <div class="project-settings-heading">
          <button type="button" class="project-settings-back" disabled={projectContextSaving || projectMemorySaving} onclick={() => closeProjectContext()}><ChevronLeft size={16} />К проекту</button>
          <PageHeader title={t("projectSettings")} description={projectContextProjectTitle}>
            {#snippet actions()}
              {#if projectContextDraft !== projectContextSavedDraft || JSON.stringify(projectContextResources) !== projectContextSavedResources || projectAutoRunDraft !== projectAutoRunSaved || projectContextSaving}
                <UiButton variant="primary" type="submit" busy={projectContextSaving} disabled={projectAutoRunLoading || Boolean(projectContextConflictRemote)}>{projectContextSaving ? t("saving") : t("save")}</UiButton>
              {/if}
            {/snippet}
          </PageHeader>
        </div>
        <div class="project-context-body">
          <div class="context-section-nav">
            <SectionNav class="context-section-tabs" label={t("projectSettingsSections")} activeId={projectWorkspaceSection}
              items={[{ id: "context", label: t("projectSettingsContext") }, { id: "integrations", label: t("projectSettingsIntegrations") }]}
              onselect={(id) => openProjectWorkspaceSection(id as ProjectWorkspaceSection)} />
          </div>
          {#if projectWorkspaceSection === "context"}
            {#each (["document", "rule", "skill"] as ProjectWorkspaceItemKind[]) as workspaceKind}
            {@const ownedItems = projectWorkspaceItems.filter((item) => item.kind === workspaceKind)}
            <section class="project-workspace-owned" aria-label={t(`projectWorkspaceOwned_${workspaceKind}` as MessageKey)}>
              <div class="project-resource-heading">
                <span><strong>{t(`projectWorkspaceOwned_${workspaceKind}` as MessageKey)}</strong></span>
                <UiButton disabled={projectWorkspaceEditorId === "new"} busy={projectWorkspaceSaving} onclick={() => beginCreateProjectWorkspaceItem(workspaceKind)}><Plus size={16} />{t("create")}</UiButton>
              </div>
              {#if projectWorkspaceLoading}
                <p class="context-loading" role="status">{t("loading")}</p>
              {:else if ownedItems.length === 0 && projectWorkspaceEditorId !== "new"}
                <EmptyState title={t("projectWorkspaceEmpty")} />
              {:else}
                <div class="context-material-list">
                  {#each ownedItems as item (item.id)}
                    <MaterialRow title={item.title} description={item.summary || undefined} meta={`v${(item.revisions?.length ?? 0) + 1} · ${item.agent_access ? t("agentAccessEnabled") : t("agentAccessDisabled")}`} selected={projectWorkspaceEditorId === item.id} onclick={() => editProjectWorkspaceItem(item)}>
                      {#snippet icon()}<FileText size={20} />{/snippet}
                    </MaterialRow>
                  {/each}
                </div>
              {/if}
              {#if projectWorkspaceError}<InlineNotice tone="danger" announce>{projectWorkspaceError}</InlineNotice>{/if}
            </section>
            {/each}
          {/if}
          {#if projectWorkspaceSection === "integrations"}
          <section class="project-resource-section" aria-label={t("connectedEnvironments")}>
            <div class="project-resource-heading">
              <span><strong>{t("connectedEnvironments")}</strong></span>
            </div>
            <div class="project-settings-group">
              <div class="project-context-connector-row">
                <span><Send size={16} /><span><strong>Telegram</strong><small>{currentChat.telegram_chats.length ? t("linkedChats", { count: currentChat.telegram_chats.length }) : telegramStatus.step === "ready" ? t("notLinked") : t("notConnected")}</small></span></span>
                {#if telegramStatus.step === "ready"}<UiButton variant="quiet" size="sm" disabled={projectContextSaving} onclick={() => openTelegramConnections(projectContextProjectId)}>{t("configure")}</UiButton>{:else}<UiButton variant="quiet" size="sm" onclick={() => { if (closeProjectContext()) void openSettingsSection("integrations"); }}>{t("connect")}</UiButton>{/if}
              </div>
              <div class="project-context-connector-row">
                <span><FolderOpen size={16} /><span><strong>GitHub</strong><small>{projectContextResources.filter((resource) => resource.kind === "repository" && resource.location.startsWith("https://github.com/")).length ? t("linkedRepositories", { count: projectContextResources.filter((resource) => resource.kind === "repository" && resource.location.startsWith("https://github.com/")).length }) : githubStatus.connected ? t("notLinked") : t("notConnected")}</small></span></span>
                {#if githubStatus.connected}<UiButton variant="quiet" size="sm" aria-expanded={projectGithubOpen} disabled={projectContextSaving} onclick={() => { projectGithubOpen = !projectGithubOpen; if (projectGithubOpen && !githubRepositories.length) void loadGithubRepositories(); }}>{t("configure")}</UiButton>{:else}<UiButton variant="quiet" size="sm" onclick={() => { if (closeProjectContext()) void openSettingsSection("integrations"); }}>{t("connect")}</UiButton>{/if}
              </div>
            </div>
            {#if projectGithubOpen && githubStatus.connected}
              <div class="project-github-picker">
                <div class="project-github-picker-heading"><span><strong>{t("projectGithubRepositories")}</strong></span><UiButton size="sm" busy={githubBusy} onclick={loadGithubRepositories}>{t("refresh")}</UiButton></div>
                <label class="github-repository-search"><Search size={15} /><input bind:value={githubSearch} placeholder={t("searchRepositories")} /></label>
                {#if githubRepositories.length}
                  <div class="project-github-list">
                    {#each githubRepositories.filter((repository) => repository.full_name.toLocaleLowerCase().includes(githubSearch.trim().toLocaleLowerCase())) as repository (repository.id)}
                      {@const linked = projectHasGithubRepository(repository)}
                      <button class:checked={linked} type="button" role="checkbox" aria-checked={linked} onclick={() => toggleProjectGithubRepository(repository)}>
                        <span class="picker-check">{#if linked}<Check size={12} />{/if}</span>
                        <span><strong>{repository.full_name}</strong><small>{repository.private ? t("privateRepository") : t("publicRepository")} · {repository.default_branch}</small></span>
                      </button>
                    {/each}
                  </div>
                {:else if !githubBusy}
                  <div class="project-resource-empty"><FolderOpen size={17} /><span><strong>{t("githubNoRepositories")}</strong><small>{t("githubNoRepositoriesDescription")}</small></span></div>
                {/if}
                {#if githubError}<InlineNotice tone="danger" announce>{githubError}</InlineNotice>{/if}
              </div>
            {/if}
          </section>
          {/if}
          {#if projectWorkspaceSection === "context"}
          <section class="project-memory-section" aria-label={t("projectMemory") }>
            <div class="project-memory-heading">
              <span><strong>{t("projectMemory")}</strong><small>{t("projectMemoryDescription")}</small></span>
              <UiButton size="sm" disabled={projectMemorySaving || projectMemoryEditorId === "new"} onclick={beginAddProjectMemory}><Plus size={14} />{t("addMemory")}</UiButton>
            </div>
            <label class="project-memory-search"><Search size={14} /><span class="sr-only">{t("searchMemory")}</span><input bind:value={projectMemorySearch} placeholder={t("searchMemory")} /></label>
            {#if projectMemoryEditorId === "new"}
              <div class="project-memory-editor">
                <TextArea label={t("memoryText")} bind:value={projectMemoryDraft} maxlength={600} placeholder={t("memoryTextPlaceholder")} />
                <UiButton size="sm" variant={projectMemoryPinned ? "secondary" : "quiet"} aria-pressed={projectMemoryPinned} onclick={() => (projectMemoryPinned = !projectMemoryPinned)}><Pin size={14} />{projectMemoryPinned ? t("memoryPinned") : t("pinMemory")}</UiButton>
                <div class="project-memory-editor-actions"><UiButton size="sm" onclick={() => resetProjectMemoryEditor(false)}>{t("cancel")}</UiButton><UiButton size="sm" variant="primary" disabled={!projectMemoryDraft.trim() || projectMemorySaving} onclick={saveProjectMemory}>{t("addMemory")}</UiButton></div>
              </div>
            {/if}
            {#if activeMemory.length === 0 && projectMemoryEditorId !== "new"}
              <div class="project-memory-empty"><Database size={18} /><span><strong>{projectMemorySearch ? t("memorySearchEmpty") : t("noProjectMemory")}</strong><small>{projectMemorySearch ? t("memorySearchEmptyDescription") : t("noProjectMemoryDescription")}</small></span></div>
            {:else if activeMemory.length}
              <div class="project-memory-list">
                {#each activeMemory as entry (entry.id)}
                  <article class:pinned={entry.pinned} class:expanded={projectMemoryEditorId === entry.id} class="project-memory-row">
                    <div class="project-memory-summary">
                      <span class="project-memory-mark">{#if entry.pinned}<Pin size={14} />{:else}<Database size={14} />{/if}</span>
                      <span><strong>{entry.text}</strong><small>{entry.updated_at ? t("memoryUpdated", { date: compactDate(entry.updated_at) }) : t("memoryCreated", { date: compactDate(entry.created_at) })}{entry.source_task_id ? ` · ${t("memoryFromTask")}` : ""}</small></span>
                      <div><UiIconButton class={entry.pinned ? "active" : undefined} size="sm" label={entry.pinned ? t("unpinMemory") : t("pinMemory")} disabled={projectMemorySaving} onclick={() => toggleProjectMemoryPin(entry)}><Pin size={14} /></UiIconButton><UiIconButton size="sm" label={t("editMemory")} onclick={() => beginEditProjectMemory(entry)}><Pencil size={14} /></UiIconButton></div>
                    </div>
                    {#if projectMemoryEditorId === entry.id}
                      <div class="project-memory-editor">
                        <SegmentedControl size="sm" label={t("memoryChangeMode")} value={projectMemoryEditorMode} options={[{ value: "edit", label: t("correctMemory") }, { value: "supersede", label: t("replaceMemory") }]} onchange={(value) => beginEditProjectMemory(entry, value as "edit" | "supersede")} />
                        <p>{projectMemoryEditorMode === "edit" ? t("correctMemoryDescription") : t("replaceMemoryDescription")}</p>
                        <TextArea label={projectMemoryEditorMode === "edit" ? t("memoryText") : t("replacementMemoryText")} bind:value={projectMemoryDraft} maxlength={600} />
                        <UiButton size="sm" variant={projectMemoryPinned ? "secondary" : "quiet"} aria-pressed={projectMemoryPinned} onclick={() => (projectMemoryPinned = !projectMemoryPinned)}><Pin size={14} />{projectMemoryPinned ? t("memoryPinned") : t("pinMemory")}</UiButton>
                        {#if entry.revisions?.length}<details class="project-memory-revisions"><summary>{t("memoryPreviousVersions", { count: entry.revisions.length })}</summary>{#each [...entry.revisions].reverse() as revision}<div><span>{revision.text}</span><small>{fullDate(revision.changed_at)}</small></div>{/each}</details>{/if}
                        {#if projectMemoryError}<p class="project-memory-error" role="alert">{projectMemoryError}</p>{/if}
                        <div class="project-memory-editor-actions danger-separated">
                          <UiButton size="sm" variant="danger" disabled={projectMemorySaving} onclick={() => deleteProjectMemory(entry)}><Trash2 size={14} />{projectMemoryDeleteConfirmId === entry.id ? t("confirmDeleteMemory") : t("deleteMemory")}</UiButton>
                          <span><UiButton size="sm" onclick={() => resetProjectMemoryEditor(false)}>{t("cancel")}</UiButton><UiButton size="sm" variant="primary" disabled={!projectMemoryDraft.trim() || projectMemorySaving || (projectMemoryEditorMode === "supersede" && projectMemoryDraft.trim() === entry.text)} onclick={saveProjectMemory}>{projectMemoryEditorMode === "supersede" ? t("replaceMemory") : t("save")}</UiButton></span>
                        </div>
                      </div>
                    {/if}
                  </article>
                {/each}
              </div>
            {/if}
            {#if supersededMemory.length || projectMemoryShowSuperseded}
              <button class="project-memory-history-toggle" type="button" aria-expanded={projectMemoryShowSuperseded} onclick={() => (projectMemoryShowSuperseded = !projectMemoryShowSuperseded)}><RotateCcw size={14} />{projectMemoryShowSuperseded ? t("hideSupersededMemory") : t("showSupersededMemory", { count: supersededMemory.length })}<ChevronDown size={14} /></button>
              {#if projectMemoryShowSuperseded}
                <div class="project-memory-superseded">{#each supersededMemory as entry (entry.id)}<article><span><strong>{entry.text}</strong><small>{t("memorySuperseded")} · {compactDate(entry.updated_at ?? entry.created_at)}</small></span><UiIconButton size="sm" variant="danger" label={t("deleteMemory")} onclick={() => deleteProjectMemory(entry)}><Trash2 size={14} /></UiIconButton>{#if projectMemoryDeleteConfirmId === entry.id}<UiButton variant="danger" size="sm" onclick={() => deleteProjectMemory(entry)}>{t("confirmDeleteMemory")}</UiButton>{/if}</article>{/each}</div>
              {/if}
            {/if}
            {#if projectMemoryError && !projectMemoryEditorId}<p class="project-memory-error" role="alert">{projectMemoryError}</p>{/if}
          </section>
          {/if}
          {#if projectWorkspaceSection === "context"}
          <section class="project-context-section project-context-markdown" aria-label={t("projectContextMarkdown")}>
            <div class="project-context-section-heading">
              <span><strong>{t("projectContextMarkdown")}</strong></span>
              <SegmentedControl size="sm" label={t("projectContextViewMode")} value={projectContextEditorMode} options={[{ value: "edit", label: t("projectContextEdit") }, { value: "preview", label: t("projectContextPreview") }]} onchange={(value) => (projectContextEditorMode = value as "edit" | "preview")} />
            </div>
            {#if projectContextEditorMode === "edit"}
              <textarea class="project-context-editor" bind:this={projectContextTextarea} bind:value={projectContextDraft} maxlength="200000" spellcheck="true" placeholder={t("projectContextPlaceholder")}></textarea>
            {:else}
              {@const previewBlocks = parseProjectContextPreview(projectContextDraft)}
              <div class="project-context-preview">
                {#if previewBlocks.length === 0}
                  <div class="project-context-preview-empty"><FileText size={18} /><span>{t("projectContextPreviewEmpty")}</span></div>
                {:else}
                  {#each previewBlocks as block}
                    {#if block.kind === "heading" && block.level === 1}<h1><MarkdownInline text={block.text} /></h1>
                    {:else if block.kind === "heading" && block.level === 2}<h2><MarkdownInline text={block.text} /></h2>
                    {:else if block.kind === "heading"}<h3><MarkdownInline text={block.text} /></h3>
                    {:else if block.kind === "bullets"}<ul>{#each block.items ?? [] as item}<li><MarkdownInline text={item} /></li>{/each}</ul>
                    {:else if block.kind === "numbers"}<ol>{#each block.items ?? [] as item}<li><MarkdownInline text={item} /></li>{/each}</ol>
                    {:else if block.kind === "quote"}<blockquote><MarkdownInline text={block.text} /></blockquote>
                    {:else if block.kind === "code"}<pre><code>{block.text}</code></pre>
                    {:else}<p><MarkdownInline text={block.text} /></p>{/if}
                  {/each}
                {/if}
              </div>
            {/if}
            <div class="project-context-hints" aria-label={t("projectContextHints")}>
              <button type="button" onclick={() => insertProjectContextSection(t("projectContextGoal"))}>## {t("projectContextGoal")}</button>
              <button type="button" onclick={() => insertProjectContextSection(t("projectContextRepositories"))}>## {t("projectContextRepositories")}</button>
              <button type="button" onclick={() => insertProjectContextSection(t("projectContextDesign"))}>## {t("projectContextDesign")}</button>
              <button type="button" onclick={() => insertProjectContextSection(t("projectContextConstraints"))}>## {t("projectContextConstraints")}</button>
            </div>
            <small class="project-context-privacy"><ShieldCheck size={14} />{t("projectContextPrivacy")}</small>
          </section>
          {/if}
          {#if projectWorkspaceSection === "integrations"}
          <section class="project-resource-section" aria-label={t("projectResources")}>
            <div class="project-resource-heading">
              <span><strong>{t("projectResources")}</strong></span>
              <UiButton size="sm" disabled={projectContextSaving || projectContextResources.length >= 20} aria-expanded={projectResourceAddOpen} onclick={() => (projectResourceAddOpen = !projectResourceAddOpen)}><Plus size={14} />{t("addResource")}</UiButton>
            </div>
            {#if projectResourceAddOpen}
              <div class="project-resource-kind-menu" aria-label={t("chooseResourceType")}>
                {#each projectResourceKinds as kind}
                  <button type="button" onclick={() => addProjectResource(kind)}>
                    {#if kind === "repository"}<FolderOpen size={15} />{:else if kind === "directory"}<Folder size={15} />{:else if kind === "figma"}<Palette size={15} />{:else if kind === "documentation"}<FileText size={15} />{:else}<Link size={15} />{/if}
                    {projectResourceKindLabel(kind)}
                  </button>
                {/each}
              </div>
            {/if}
            {#if projectContextResources.filter((resource) => resource.kind !== "skill").length === 0}
              <div class="project-resource-empty"><Link size={17} /><span><strong>{t("noProjectResources")}</strong></span></div>
            {:else}
              <div class="project-resource-list">
                {#each projectContextResources.filter((resource) => resource.kind !== "skill") as resource (resource.id)}
                  <article class:expanded={expandedProjectResourceId === resource.id} class="project-resource-row" data-project-resource-id={resource.id}>
                    <div class="project-resource-row-heading">
                      <button class="project-resource-summary" type="button" aria-expanded={expandedProjectResourceId === resource.id} onclick={() => (expandedProjectResourceId = expandedProjectResourceId === resource.id ? "" : resource.id)}>
                        <span class="project-resource-kind-icon">{#if resource.kind === "repository"}<FolderOpen size={15} />{:else if resource.kind === "directory"}<Folder size={15} />{:else if resource.kind === "figma"}<Palette size={15} />{:else if resource.kind === "documentation"}<FileText size={15} />{:else}<Link size={15} />{/if}</span>
                        <span><strong>{resource.label || projectResourceKindLabel(resource.kind)}</strong><small>{resource.location || t("resourceLocationMissing")} · {resource.agent_access ? t("agentAccessEnabled") : t("agentAccessDisabled")}</small></span>
                        <ChevronDown size={15} />
                      </button>
                      <UiIconButton class="resource-remove-button" size="sm" label={t("removeResource")} onclick={() => removeProjectResource(resource.id)}><Trash2 size={14} /></UiIconButton>
                    </div>
                    {#if expandedProjectResourceId === resource.id}
                      <div class="project-resource-details">
                        <div class="project-resource-fields">
                          <TextField label={t("resourceName")} value={resource.label} maxlength={120} placeholder={t("resourceNamePlaceholder")} oninput={(event) => updateProjectResource(resource.id, { label: event.currentTarget.value })} />
                          <TextField class="resource-location" label={t("resourceLocation")} value={resource.location} maxlength={2048} placeholder={t("resourceLocationPlaceholder")} spellcheck="false" oninput={(event) => updateProjectResource(resource.id, { location: event.currentTarget.value })} />
                          <TextField class="resource-notes" label={t("resourceNotes")} value={resource.notes ?? ""} maxlength={4000} placeholder={t("resourceNotesPlaceholder")} oninput={(event) => updateProjectResource(resource.id, { notes: event.currentTarget.value || undefined })} />
                        </div>
                        <UiSwitch label={t("agentResourceAccess")} description={resource.agent_access ? t("agentResourceAccessOn") : t("agentResourceAccessOff")} checked={resource.agent_access} onchange={(checked) => updateProjectResource(resource.id, { agent_access: checked })} />
                      </div>
                    {/if}
                  </article>
                {/each}
              </div>
            {/if}
          </section>
          {/if}
          {#if projectWorkspaceSection === "integrations"}
          <section class="project-resource-section" aria-label={t("projectSkills")}>
            <div class="project-resource-heading">
              <span><strong>{t("projectSkills")}</strong></span>
              <UiButton size="sm" disabled={projectContextSaving || projectContextResources.length >= 20} onclick={() => addProjectResource("skill")}><Plus size={14} />{t("addSkill")}</UiButton>
            </div>
            {#if projectContextResources.filter((resource) => resource.kind === "skill").length === 0}
              <div class="project-resource-empty"><Bot size={17} /><span><strong>{t("noProjectSkills")}</strong></span></div>
            {:else}
              <div class="project-resource-list">
                {#each projectContextResources.filter((resource) => resource.kind === "skill") as resource (resource.id)}
                  <article class:expanded={expandedProjectResourceId === resource.id} class="project-resource-row" data-project-resource-id={resource.id}>
                    <div class="project-resource-row-heading">
                      <button class="project-resource-summary" type="button" aria-expanded={expandedProjectResourceId === resource.id} onclick={() => (expandedProjectResourceId = expandedProjectResourceId === resource.id ? "" : resource.id)}>
                        <span class="project-resource-kind-icon"><Bot size={15} /></span>
                        <span><strong>{resource.label || t("projectResourceSkill")}</strong><small>{resource.location || t("skillLocationMissing")} · {resource.agent_access ? t("agentAccessEnabled") : t("agentAccessDisabled")}</small></span>
                        <ChevronDown size={15} />
                      </button>
                      <UiIconButton class="resource-remove-button" size="sm" label={t("removeSkill")} onclick={() => removeProjectResource(resource.id)}><Trash2 size={14} /></UiIconButton>
                    </div>
                    {#if expandedProjectResourceId === resource.id}
                      <div class="project-resource-details">
                        <div class="project-resource-fields">
                          <TextField label={t("skillName")} value={resource.label} maxlength={120} placeholder={t("skillNamePlaceholder")} oninput={(event) => updateProjectResource(resource.id, { label: event.currentTarget.value })} />
                          <TextField class="resource-location" label={t("skillLocation")} value={resource.location} maxlength={2048} placeholder={t("skillLocationPlaceholder")} spellcheck="false" oninput={(event) => updateProjectResource(resource.id, { location: event.currentTarget.value })} />
                          <TextField class="resource-notes" label={t("resourceNotes")} value={resource.notes ?? ""} maxlength={4000} placeholder={t("skillNotesPlaceholder")} oninput={(event) => updateProjectResource(resource.id, { notes: event.currentTarget.value || undefined })} />
                        </div>
                        <UiSwitch label={t("agentSkillAccess")} description={resource.agent_access ? t("agentSkillAccessOn") : t("agentSkillAccessOff")} checked={resource.agent_access} onchange={(checked) => updateProjectResource(resource.id, { agent_access: checked })} />
                      </div>
                    {/if}
                  </article>
                {/each}
              </div>
            {/if}
          </section>
          {/if}
          {#if projectWorkspaceSection === "integrations" && (projectAutoRunSaved || projectAutoRunDraft)}
          <section class="project-automation-section" aria-label={t("projectAutomation")}>
            <div class="project-automation-heading"><span><strong>{t("projectAutomation")}</strong></span></div>
            <div class="project-settings-group">
              <UiSwitch class="project-auto-run" label={t("projectAutoRun")} description={projectAutoRunLoading ? t("projectAutomationLoading") : projectAutoRunDraft ? (automationSettings.background_ai_triage ? t("projectAutoRunOn") : t("projectAutoRunWaiting")) : t("projectAutoRunOff")} bind:checked={projectAutoRunDraft} pending={projectAutoRunLoading || projectContextSaving} />
            </div>
          </section>
          {/if}
          {#if projectContextConflictRemote}
            <InlineNotice tone="attention" title={t("externalChange")} announce>
              {t("chooseVersion")}
              {#snippet actions()}<NoticeAction tone="attention" onclick={useDiskProjectContextVersion}>{t("diskVersion")}</NoticeAction><NoticeAction tone="attention" onclick={keepLocalProjectContextVersion}>{t("localVersion")}</NoticeAction>{/snippet}
            </InlineNotice>
          {:else if projectContextError}
            <InlineNotice tone="danger" announce>{projectContextError}{#snippet actions()}<NoticeAction tone="danger" onclick={reloadProjectContext}>{t("reload")}</NoticeAction>{/snippet}</InlineNotice>
          {/if}
        </div>
      </form>
    </section>
  </div>
{/if}

{#if projectWorkspaceEditorId}
  {@const artifactItem = projectWorkspaceItems.find((item) => item.id === projectWorkspaceEditorId)}
  <div class="artifact-modal-backdrop" role="presentation">
    <div class="artifact-modal" bind:this={projectWorkspaceDialog} role="dialog" aria-modal="true" aria-labelledby="artifact-modal-title" tabindex="-1" onkeydown={handleProjectWorkspaceModalKeydown}>
      <header>
        <span class="artifact-modal-icon" aria-hidden="true">
          {#if projectWorkspaceEditorKind === "document"}<FileText size={19} />{:else if projectWorkspaceEditorKind === "rule"}<ShieldCheck size={19} />{:else}<Bot size={19} />{/if}
        </span>
        <span><strong id="artifact-modal-title">{projectWorkspaceModalTitle()}</strong><small>{t(`projectWorkspaceOwned_${projectWorkspaceEditorKind}` as MessageKey)} · {projectContextProjectTitle}</small></span>
        <UiIconButton label={t("close")} onclick={() => closeProjectWorkspaceEditor()}><X size={16} /></UiIconButton>
      </header>

      <div class="artifact-modal-body">
        <div class="artifact-modal-fields">
          <TextField label={t("resourceName")} bind:value={projectWorkspaceTitle} maxlength={120} placeholder={t("projectWorkspaceTitlePlaceholder")} />
          <TextField label={t("projectWorkspaceSummary")} bind:value={projectWorkspaceSummary} maxlength={300} placeholder={t("projectWorkspaceSummaryPlaceholder")} />
          <TextArea class="artifact-content-field" label={t("projectWorkspaceContent")} bind:value={projectWorkspaceContent} rows={18} maxlength={80000} spellcheck="true" placeholder={t("projectWorkspaceContentPlaceholder")} />
        </div>

        <UiSwitch class="artifact-agent-access" label={t("projectWorkspaceAgentAccess")} description={projectWorkspaceAgentAccess ? t("projectWorkspaceAgentAccessOn") : t("projectWorkspaceAgentAccessOff")} bind:checked={projectWorkspaceAgentAccess} />

        {#if artifactItem?.revisions?.length}
          <small class="project-workspace-history"><RotateCcw size={13} />{t("projectWorkspaceHistory", { count: artifactItem.revisions.length })}</small>
        {/if}
        {#if projectWorkspaceConflictRemote}
          <InlineNotice tone="attention" title={t("externalChange")} announce>
            {t("chooseVersion")}
            {#snippet actions()}<NoticeAction tone="attention" onclick={useDiskProjectWorkspaceVersion}>{projectWorkspaceConflictAction === "delete" ? t("keepLatestVersion") : t("diskVersion")}</NoticeAction><NoticeAction tone={projectWorkspaceConflictAction === "delete" ? "danger" : "attention"} onclick={keepLocalProjectWorkspaceVersion}>{projectWorkspaceConflictAction === "delete" ? t("deleteLatestVersion") : t("localVersion")}</NoticeAction>{/snippet}
          </InlineNotice>
        {:else if projectWorkspaceError}<InlineNotice tone="danger" announce>{projectWorkspaceError}</InlineNotice>{/if}
        {#if projectWorkspaceCloseConfirm}
          <InlineNotice tone="attention" title={t("unsavedChanges")} announce>
            {t("unsavedChangesDescription")}
            {#snippet actions()}<NoticeAction tone="attention" onclick={keepEditingProjectWorkspaceItem}>{t("continueEditing")}</NoticeAction><NoticeAction tone="danger" onclick={() => closeProjectWorkspaceEditor(true)}>{t("discardChanges")}</NoticeAction>{/snippet}
          </InlineNotice>
        {/if}
      </div>

      <footer>
        <span>{#if projectWorkspaceEditorId !== "new"}<UiButton variant="danger" size="sm" type="button" disabled={projectWorkspaceSaving || Boolean(projectWorkspaceConflictRemote)} onclick={deleteProjectWorkspaceItem}><Trash2 size={14} />{projectWorkspaceDeleteConfirm ? t("confirmDelete") : t("delete")}</UiButton>{/if}</span>
        <span><UiButton size="sm" type="button" disabled={projectWorkspaceSaving} onclick={() => closeProjectWorkspaceEditor()}>{t("cancel")}</UiButton><UiButton variant="primary" size="sm" type="button" busy={projectWorkspaceSaving} disabled={!projectWorkspaceTitle.trim() || !projectWorkspaceContent.trim() || Boolean(projectWorkspaceConflictRemote)} onclick={saveProjectWorkspaceItem}>{projectWorkspaceSaving ? t("saving") : t("save")}</UiButton></span>
      </footer>
    </div>
  </div>
{/if}

{#if telegramConnectionsProject}
  <div class="telegram-import-backdrop" role="presentation">
    <div class="telegram-import-panel telegram-connections-panel" bind:this={telegramConnectionsDialog} role="dialog" aria-modal="true" aria-label={t("telegramConnectionsTitle")} tabindex="-1" onkeydown={trapModalFocus}>
      <header><span><Send size={17} /><span><strong>{t("telegramConnectionsTitle")}</strong><small title={telegramConnectionsProject.title}>{telegramConnectionsProject.title}</small></span></span><UiIconButton label={t("close")} onclick={closeTelegramConnections}><X size={16} /></UiIconButton></header>
      <div class="telegram-connections-body">
        <p>{t("telegramConnectionsDescription")}</p>
        {#if telegramError}<div class="telegram-connections-error" role="alert">{telegramError}</div>{/if}
        <label class="telegram-chat-search telegram-connections-search"><Search size={15} /><input value={telegramChatSearch} placeholder={t("searchChats")} oninput={(event) => searchTelegramChats(event.currentTarget.value)} />{#if telegramSearchLoading}<RefreshCw class="spinning" size={14} />{/if}</label>

        {#if telegramConnectionsProject.telegram_chats.length}
          <section class="telegram-connections-section">
            <h4>{t("linkedTelegramChats")}</h4>
            <div class="telegram-selected-chats">
              {#each telegramConnectionsProject.telegram_chats as link (link.chat_id)}
                {@const details = telegramChatDetails(link.chat_id)}
                <article class="telegram-selected-chat">
                  <div><TelegramChatIdentity title={link.title} kind={details?.kind} meta={details ? telegramChatMeta(details) : `${t("telegramChatUnknown")} · ID ${link.chat_id}`} avatarDataUrl={details?.avatar_data_url} avatarFileId={details?.avatar_file_id} /><UiIconButton size="sm" variant="danger" disabled={telegramConnectionsSaving} label={t("removeConnection")} onclick={() => toggleProjectTelegramChat(telegramConnectionsProject, { id: link.chat_id, title: link.title })}><X size={14} /></UiIconButton></div>
                  <div class="telegram-mode-picker" aria-label={t("collectionMode")}>{#each telegramModes as mode}<button class:active={link.inbox_mode === mode} disabled={telegramConnectionsSaving} onclick={() => setProjectTelegramMode(telegramConnectionsProject, link, mode)}>{telegramModeLabel(mode)}</button>{/each}</div>
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
              <button class:active={linked} disabled={telegramConnectionsSaving} onclick={() => toggleProjectTelegramChat(telegramConnectionsProject, telegramChat)}><span class="picker-check">{#if linked}<Check size={13} />{/if}</span><TelegramChatIdentity title={telegramChat.title} kind={telegramChat.kind} meta={telegramChatMeta(telegramChat)} avatarDataUrl={telegramChat.avatar_data_url} avatarFileId={telegramChat.avatar_file_id} /><small>{linked ? t("linked") : t("add")}</small></button>
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
      <header><span><Send size={17} /><span><strong>Telegram</strong><small>{t("chooseMessageForInbox")}</small></span></span><UiIconButton label={t("close")} onclick={closeTelegramImporter}><X size={16} /></UiIconButton></header>
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
      <header><span>{#if telegramTaskDraftCandidate}<UiIconButton label={t("back")} onclick={closeTelegramTaskDraft}><ChevronLeft size={16} /></UiIconButton>{:else}<MessageSquareText size={17} />{/if}<span><strong>{telegramTaskDraftCandidate ? t("telegramTaskDraft") : t("inbox")}</strong><small>{telegramTaskDraftCandidate && telegramTriageTotal ? t("triageProgress", { current: telegramTriageTotal - telegramTriageQueue.length + 1, total: telegramTriageTotal }) : telegramTaskDraftCandidate ? t("telegramTaskDraftDescription") : t("inboxDescription")}</small></span></span><div>{#if !telegramTaskDraftCandidate && telegramInboxView === "pending"}<UiIconButton label={t("scanMessages")} disabled={telegramInboxLoading || currentChat.id === "all"} onclick={() => openTelegramInbox(true)}><RefreshCw class={telegramInboxLoading ? "spinning" : ""} size={16} /></UiIconButton>{/if}<UiIconButton label={t("close")} onclick={closeTelegramInbox}><X size={16} /></UiIconButton></div></header>
      {#if telegramTaskDraftCandidate}
        <form class="telegram-task-composer" onsubmit={(event) => { event.preventDefault(); createTaskFromCandidate(); }}>
          <div class="telegram-task-scroll">
            <div class="telegram-task-fields">
              {#if telegramTaskDraftRestored}<div class="telegram-draft-restored" role="status"><Check size={13} />{t("telegramDraftRestored")}</div>{/if}
              <label><span>{t("taskTitle")}</span><input bind:this={telegramTaskTitleInput} bind:value={telegramTaskDraftTitle} maxlength="120" placeholder={t("taskTitlePlaceholder")} oninput={() => (telegramTaskDraftRestored = false)} /></label>
              <label><span>{t("taskNotes")}</span><textarea bind:value={telegramTaskDraftNotes} rows="4" placeholder={t("taskNotesPlaceholder")} oninput={() => (telegramTaskDraftRestored = false)}></textarea></label>
              <fieldset><legend>{t("urgencyLabel")}</legend><div class="telegram-task-urgency">{#each (["normal", "important", "urgent"] as Urgency[]) as urgency}<button type="button" class:active={telegramTaskDraftUrgency === urgency} onclick={() => { telegramTaskDraftUrgency = urgency; telegramTaskDraftRestored = false; }}><FloodGlyph kind={urgency} size={14} />{urgencyTitle(urgency)}</button>{/each}</div></fieldset>
            </div>
            {#if telegramTaskDraftCandidate.context?.length}
              <section class="telegram-context-block telegram-task-context">
                <header><span><FloodGlyph kind="info" size={16} /><strong>{t("conversationContext")}</strong></span><small>{t("contextMessages", { count: telegramTaskDraftCandidate.context.length })}</small></header>
                <div class="telegram-context-list">
                  {#each telegramTaskDraftCandidate.context as message (message.message_id)}
                    <article class:target={message.is_target} class="telegram-context-message">
                      <div><strong>{message.author || "Telegram"}</strong><span>{#if message.is_target}{t("targetMessage")} · {/if}{fullDate(message.sent_at)}</span></div>
                      {#if message.text}<p>{message.text}</p>{/if}
                      {#if message.media?.length}<small><Paperclip size={12} />{t("contextMediaCount", { count: message.media.length })}</small>{/if}
                    </article>
                  {/each}
                </div>
                {#if telegramTaskDraftCandidate.media?.length}<span class="telegram-auto-media"><Paperclip size={13} />{t("mediaWillBeAdded", { count: telegramTaskDraftCandidate.media.length })}</span>{/if}
              </section>
            {:else}
              <section class="telegram-task-source-preview"><div><Send size={14} /><span><strong>{telegramTaskDraftCandidate.author}</strong><small>{telegramTaskDraftCandidate.chat_title} · {fullDate(telegramTaskDraftCandidate.sent_at)}</small></span></div>{#if telegramTaskDraftCandidate.text}<p>{telegramTaskDraftCandidate.text}</p>{/if}{#if telegramTaskDraftCandidate.media?.length}<span class="telegram-auto-media"><Paperclip size={13} />{t("mediaWillBeAdded", { count: telegramTaskDraftCandidate.media.length })}</span>{/if}</section>
            {/if}
            {#if telegramInboxError}<p class="telegram-composer-error">{telegramInboxError}</p>{/if}
          </div>
          <footer>{#if telegramTriageQueue.length}<UiButton onclick={skipTelegramTriageCandidate} disabled={Boolean(telegramInboxProcessingId)}>{t("keepInInbox")}</UiButton>{:else}<UiButton onclick={closeTelegramTaskDraft} disabled={Boolean(telegramInboxProcessingId)}>{t("cancel")}</UiButton>{/if}<UiButton type="submit" variant="primary" disabled={!telegramTaskDraftTitle.trim() || Boolean(telegramInboxProcessingId)}>{#if telegramInboxProcessingId}<RefreshCw class="spinning" size={14} />{:else}<Plus size={14} />{/if}{telegramTriageQueue.length > 1 ? t("createAndContinue") : t("createTask")}</UiButton></footer>
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
                <div class="inbox-candidate-content"><div class="inbox-candidate-meta"><strong>{candidate.author}</strong><span title={candidate.chat_title}>{candidate.chat_title}</span><small>{telegramInboxView === "history" ? (candidate.status === "imported" ? t("telegramStatusImported") : t("telegramStatusDismissed")) : telegramReasonLabel(candidate.reason)} · {fullDate(candidate.processed_at ?? candidate.sent_at)}</small></div>{#if candidate.text}<p>{candidate.text}</p>{/if}<div class="inbox-candidate-notes">{#if candidate.context && candidate.context.length > 1}<small><MessageSquareText size={12} />{t("contextMessages", { count: candidate.context.length })}</small>{/if}{#if candidate.media?.length}<small class="telegram-media-note"><Paperclip size={12} />{t("mediaCount", { count: candidate.media.length })}</small>{/if}</div></div>
                <div class="inbox-candidate-actions">{#if candidate.linked_task}<button class="inbox-linked-task" disabled={candidate.linked_task.trashed} title={candidate.linked_task.title} onclick={() => openTelegramLinkedTask(candidate.linked_task!)}><FloodGlyph kind={candidate.linked_task.status === "completed" ? "completed" : candidate.linked_task.urgency} size={13} /><span>{candidate.linked_task.title}</span><small>{telegramLinkedTaskState(candidate.linked_task)}</small><ChevronRight size={13} /></button>{:else if telegramInboxView === "history" && candidate.status === "dismissed"}<UiButton size="sm" disabled={Boolean(telegramInboxProcessingId)} onclick={() => restoreTelegramCandidate(candidate)}><RotateCcw size={13} />{t("restoreToInbox")}</UiButton>{:else if telegramInboxView === "history"}<span class="inbox-missing-task">{t("linkedTaskUnavailable")}</span>{:else}<UiButton size="sm" variant="quiet" disabled={Boolean(telegramInboxProcessingId)} onclick={() => dismissTelegramCandidate(candidate)}>{t("dismiss")}</UiButton><UiButton size="sm" variant="primary" disabled={Boolean(telegramInboxProcessingId)} aria-label={t("prepareTask")} title={t("prepareTask")} onclick={() => beginTaskFromCandidate(candidate)}><Plus size={14} />{t("prepareTaskShort")}</UiButton>{/if}</div>
              </article>
            {:else}<div class="telegram-import-state">{telegramInboxView === "history" ? t("telegramHistoryEmpty") : t("inboxEmpty")}</div>{/each}
            {#if telegramInboxRemaining > 0}<button class="telegram-load-more" disabled={telegramInboxLoadingMore} onclick={loadMoreTelegramInbox}>{#if telegramInboxLoadingMore}<RefreshCw class="spinning" size={13} />{/if}{t("showMoreMessages", { count: telegramInboxRemaining })}</button>{/if}
          {/if}
        </div>
        {#if telegramInboxView === "pending" && telegramInboxSelection.length}<div class="telegram-triage-island" aria-label={t("selectedMessages", { count: telegramInboxSelection.length })}><span><ListChecks size={15} />{t("selectedMessages", { count: telegramInboxSelection.length })}</span><UiButton variant="primary" onclick={beginSelectedTelegramTriage}><span>{t("reviewSelected")}</span><ArrowRight size={14} /></UiButton></div>{/if}
      </div>{/if}
    </div>
  </div>
{/if}

{#if sourceViewerOpen && selectedTask?.source}
  <div class="telegram-import-backdrop source-viewer-backdrop" role="presentation" onclick={(event) => { if (event.target === event.currentTarget) closeSourceViewer(); }}>
    <div class="telegram-import-panel source-viewer-panel" bind:this={sourceViewerDialog} role="dialog" aria-modal="true" aria-label={t("taskSource")} tabindex="-1" onkeydown={trapModalFocus}>
      <header><span><FloodGlyph kind="info" size={22} /><span><strong>{selectedTask.source.provider === "telegram" ? taskSourceMetaLabel(selectedTask) : t("taskSource")}</strong><small>{selectedTask.source.chat_title || t("sourceMessage")}{selectedTask.source.sent_at ? ` · ${fullDate(selectedTask.source.sent_at)}` : ""}</small></span></span><UiIconButton label={t("close")} onclick={closeSourceViewer}><X size={16} /></UiIconButton></header>
      <div class="source-viewer-body">
        {#if selectedTask.source.context?.length === 1}
          {@const message = selectedTask.source.context[0]}
          <section class="source-message-card source-message-primary">
            <div class="source-message-meta"><span><strong>{message.author || "Telegram"}</strong><small>{selectedTask.source.chat_title || "Telegram"}</small></span><time datetime={message.sent_at}>{fullDate(message.sent_at)}</time></div>
            {#if message.text}<p>{message.text}</p>{:else}<p class="source-empty-text">{t("noSourceText")}</p>{/if}
            {#if message.media?.length}<small class="source-message-media"><Paperclip size={12} />{t("contextMediaCount", { count: message.media.length })}</small>{/if}
          </section>
        {:else if selectedTask.source.context?.length}
          <section class="telegram-context-block source-context-block">
            <header><span><strong>{t("conversationContext")}</strong></span><small>{t("contextMessages", { count: selectedTask.source.context.length })}</small></header>
            <div class="telegram-context-list">
              {#each selectedTask.source.context as message (message.message_id)}
                <article class:target={message.is_target} class="telegram-context-message">
                  <div><strong>{message.author || "Telegram"}</strong><span>{#if message.is_target}{t("targetMessage")} · {/if}{fullDate(message.sent_at)}</span></div>
                  {#if message.text}<p>{message.text}</p>{:else}<p class="source-empty-text">{t("noSourceText")}</p>{/if}
                  {#if message.media?.length}<small><Paperclip size={12} />{t("contextMediaCount", { count: message.media.length })}</small>{/if}
                </article>
              {/each}
            </div>
          </section>
        {:else}
          <section class="source-message-card">
            <div class="source-message-meta"><span><strong>{selectedTask.source.author || t("notSpecified")}</strong><small>{selectedTask.source.provider === "telegram" ? "Telegram" : t("sourceMessage")}</small></span>{#if selectedTask.source.sent_at}<time datetime={selectedTask.source.sent_at}>{fullDate(selectedTask.source.sent_at)}</time>{/if}</div>
            {#if selectedTask.source.text}<p>{selectedTask.source.text}</p>{:else}<p class="source-empty-text">{t("noSourceText")}</p>{/if}
          </section>
        {/if}
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
