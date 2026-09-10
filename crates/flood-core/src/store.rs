use crate::{
    CreateTask, InboxCandidateReason, InboxCandidateStatus, Project, SourceMedia, SourceMediaKind,
    Task, TaskPatch, TaskStatus, TaskSummary, TelegramInboxCandidate, TelegramLinkedTask,
    TelegramProjectLink, TelegramSyncRequest, TelegramSyncStatus, Urgency,
};
use atomic_write_file::AtomicWriteFile;
use chrono::Utc;
use fs2::FileExt;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize, de::DeserializeOwned};
use sha2::{Digest, Sha256};
use std::{
    cmp::Reverse,
    env,
    fs::{self, File, OpenOptions},
    io::{Read, Write},
    path::{Path, PathBuf},
    time::Instant,
};
use thiserror::Error;
use ulid::Ulid;
use zip::{ZipArchive, ZipWriter, write::SimpleFileOptions};

const FORMAT_VERSION: u8 = 1;
const MAX_ATTACHMENT_BYTES: u64 = 25 * 1024 * 1024;
const MAX_MARKDOWN_FILE_BYTES: u64 = 1024 * 1024;
const MAX_TELEGRAM_INBOX_BYTES: u64 = 64 * 1024 * 1024;
const MAX_INTEGRATION_STATE_BYTES: u64 = 64 * 1024;

#[derive(Debug, Error)]
pub enum StoreError {
    #[error("объект не найден: {0}")]
    NotFound(String),
    #[error("данные изменились в другом процессе; обновите список и повторите")]
    Conflict,
    #[error("некорректные данные: {0}")]
    Validation(String),
    #[error("повреждён Markdown-файл {path}: {message}")]
    InvalidFile { path: String, message: String },
    #[error("ошибка файловой системы: {0}")]
    Io(#[from] std::io::Error),
    #[error("ошибка YAML: {0}")]
    Yaml(#[from] serde_yaml::Error),
    #[error("ошибка JSON: {0}")]
    Json(#[from] serde_json::Error),
    #[error("ошибка резервной копии: {0}")]
    Backup(String),
}

#[derive(Clone, Debug)]
pub struct Store {
    root: PathBuf,
}

#[derive(Clone, Debug, Serialize, JsonSchema)]
pub struct StoreDiagnostics {
    pub healthy: bool,
    pub root: String,
    pub format_version: u8,
    pub project_count: usize,
    pub linked_chat_count: usize,
    pub open_task_count: usize,
    pub completed_task_count: usize,
    pub trashed_task_count: usize,
    pub pending_inbox_count: usize,
    pub issues: Vec<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct SelfCheckItem {
    pub name: String,
    pub passed: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct SelfCheckResult {
    pub passed: bool,
    pub duration_ms: u128,
    pub checks: Vec<SelfCheckItem>,
}

#[derive(Serialize, Deserialize)]
struct ProjectDocument {
    format_version: u8,
    id: String,
    title: String,
    created_at: chrono::DateTime<Utc>,
    updated_at: chrono::DateTime<Utc>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    telegram: Option<TelegramProjectLink>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    telegram_chats: Vec<TelegramProjectLink>,
}

#[derive(Default, Serialize, Deserialize)]
struct TelegramInboxDocument {
    #[serde(default = "inbox_format_version")]
    format_version: u8,
    #[serde(default)]
    candidates: Vec<TelegramInboxCandidate>,
}

fn inbox_format_version() -> u8 {
    1
}

#[derive(Serialize, Deserialize)]
struct TaskDocument {
    format_version: u8,
    id: String,
    #[serde(alias = "chat_id")]
    project_id: String,
    created_at: chrono::DateTime<Utc>,
    updated_at: chrono::DateTime<Utc>,
    urgency: crate::Urgency,
    status: TaskStatus,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    source: Option<crate::MessageSnapshot>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    trashed_at: Option<chrono::DateTime<Utc>>,
}

struct StoreLock(File);

impl Drop for StoreLock {
    fn drop(&mut self) {
        let _ = self.0.unlock();
    }
}

pub fn default_data_dir() -> PathBuf {
    if let Some(path) = env::var_os("FLOOD_DATA_DIR").filter(|value| !value.is_empty()) {
        return PathBuf::from(path);
    }
    if cfg!(target_os = "windows")
        && let Some(path) = env::var_os("APPDATA")
    {
        return PathBuf::from(path).join("io.flood.desktop");
    }
    if let Some(path) = env::var_os("XDG_DATA_HOME") {
        return PathBuf::from(path).join("flood.md");
    }
    env::current_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("flood-data")
}

impl Store {
    pub fn new(root: impl Into<PathBuf>) -> Result<Self, StoreError> {
        let store = Self { root: root.into() };
        fs::create_dir_all(&store.root)?;
        let lock_path = store.root.join(".flood.lock");
        OpenOptions::new()
            .create(true)
            .truncate(false)
            .read(true)
            .write(true)
            .open(lock_path)?;
        let migration_lock = store.lock_exclusive()?;
        store.migrate_legacy_layout()?;
        drop(migration_lock);
        Ok(store)
    }

    pub fn root(&self) -> &Path {
        &self.root
    }

    pub fn diagnostics(&self) -> StoreDiagnostics {
        let mut diagnostics = StoreDiagnostics {
            healthy: true,
            root: self.root.to_string_lossy().into_owned(),
            format_version: FORMAT_VERSION,
            project_count: 0,
            linked_chat_count: 0,
            open_task_count: 0,
            completed_task_count: 0,
            trashed_task_count: 0,
            pending_inbox_count: 0,
            issues: Vec::new(),
        };

        match self.list_projects() {
            Ok(projects) => {
                diagnostics.project_count = projects.len();
                diagnostics.linked_chat_count = projects
                    .iter()
                    .map(|project| project.telegram_chats.len())
                    .sum();
            }
            Err(error) => diagnostics
                .issues
                .push(format!("Не удалось прочитать проекты: {error}")),
        }
        match self.list_tasks(None, true) {
            Ok(tasks) => {
                diagnostics.open_task_count = tasks
                    .iter()
                    .filter(|task| task.status == TaskStatus::Open)
                    .count();
                diagnostics.completed_task_count = tasks
                    .iter()
                    .filter(|task| task.status == TaskStatus::Completed)
                    .count();
            }
            Err(error) => diagnostics
                .issues
                .push(format!("Не удалось прочитать задачи: {error}")),
        }
        match self.list_trashed_tasks() {
            Ok(tasks) => diagnostics.trashed_task_count = tasks.len(),
            Err(error) => diagnostics
                .issues
                .push(format!("Не удалось прочитать корзину: {error}")),
        }
        match self.list_telegram_inbox(None, false) {
            Ok(candidates) => diagnostics.pending_inbox_count = candidates.len(),
            Err(error) => diagnostics
                .issues
                .push(format!("Не удалось прочитать входящие Telegram: {error}")),
        }
        diagnostics.healthy = diagnostics.issues.is_empty();
        diagnostics
    }

    fn migrate_legacy_layout(&self) -> Result<(), StoreError> {
        let legacy_root = self.root.join("chats");
        let projects_root = self.projects_dir();
        if legacy_root.is_dir() && !projects_root.exists() {
            fs::rename(&legacy_root, &projects_root)?;
        } else if legacy_root.is_dir() {
            for entry in fs::read_dir(&legacy_root)? {
                let entry = entry?;
                let destination = projects_root.join(entry.file_name());
                if destination.exists() {
                    return Err(StoreError::Validation(format!(
                        "найдены одновременно старые и новые данные проекта {}",
                        entry.file_name().to_string_lossy()
                    )));
                }
                fs::rename(entry.path(), destination)?;
            }
            fs::remove_dir(&legacy_root)?;
        }
        fs::create_dir_all(&projects_root)?;

        for entry in fs::read_dir(&projects_root)? {
            let project_dir = entry?.path();
            if !project_dir.is_dir() {
                continue;
            }
            let old_document = project_dir.join("chat.md");
            let new_document = project_dir.join("project.md");
            if old_document.is_file() && !new_document.exists() {
                fs::rename(old_document, new_document)?;
            }
            let tasks_dir = project_dir.join("tasks");
            if !tasks_dir.is_dir() {
                continue;
            }
            for task_entry in fs::read_dir(tasks_dir)? {
                let task_path = task_entry?.path();
                if task_path.extension().and_then(|value| value.to_str()) != Some("md") {
                    continue;
                }
                let content = read_limited_utf8(&task_path, MAX_MARKDOWN_FILE_BYTES)?;
                if !content.contains("\nproject_id:") && content.contains("\nchat_id:") {
                    atomic_write(
                        &task_path,
                        &content.replacen("\nchat_id:", "\nproject_id:", 1),
                    )?;
                }
            }
        }
        Ok(())
    }

    pub fn list_projects(&self) -> Result<Vec<Project>, StoreError> {
        let _lock = self.lock_shared()?;
        let mut projects = Vec::new();
        for entry in fs::read_dir(self.projects_dir())? {
            let entry = entry?;
            if entry.file_type()?.is_dir() {
                let path = entry.path().join("project.md");
                if path.exists() {
                    projects.push(read_project(&path)?);
                }
            }
        }
        projects.sort_by_key(|project| project.title.to_lowercase());
        Ok(projects)
    }

    pub fn get_project(&self, id: &str) -> Result<Project, StoreError> {
        validate_id(id)?;
        let _lock = self.lock_shared()?;
        let path = self.project_path(id);
        if !path.exists() {
            return Err(StoreError::NotFound(id.to_owned()));
        }
        read_project(&path)
    }

    pub fn create_project(&self, title: &str) -> Result<Project, StoreError> {
        let title = clean_required(title, "название проекта", 120)?;
        let _lock = self.lock_exclusive()?;
        let id = Ulid::new().to_string();
        let now = Utc::now();
        let project = Project {
            id,
            title,
            created_at: now,
            updated_at: now,
            telegram_chats: Vec::new(),
            version: String::new(),
        };
        fs::create_dir_all(self.task_dir(&project.id))?;
        self.write_project(&project)?;
        read_project(&self.project_path(&project.id))
    }

    pub fn update_project(
        &self,
        id: &str,
        title: &str,
        expected_version: &str,
    ) -> Result<Project, StoreError> {
        validate_id(id)?;
        let title = clean_required(title, "название проекта", 120)?;
        let _lock = self.lock_exclusive()?;
        let mut project =
            read_project(&self.project_path(id)).map_err(|error| map_missing(error, id))?;
        ensure_version(&project.version, expected_version)?;
        project.title = title;
        project.updated_at = Utc::now();
        self.write_project(&project)?;
        read_project(&self.project_path(id))
    }

    pub fn set_project_telegram_chats(
        &self,
        id: &str,
        telegram_chats: Vec<TelegramProjectLink>,
        expected_version: &str,
    ) -> Result<Project, StoreError> {
        validate_id(id)?;
        if telegram_chats.len() > 20 {
            return Err(StoreError::Validation(
                "к одному проекту можно привязать не более 20 Telegram-чатов".into(),
            ));
        }
        let mut seen = std::collections::HashSet::new();
        for link in &telegram_chats {
            clean_required(&link.title, "название Telegram-чата", 240)?;
            if !seen.insert(link.chat_id) {
                return Err(StoreError::Validation(
                    "Telegram-чат нельзя привязать к проекту дважды".into(),
                ));
            }
        }
        let _lock = self.lock_exclusive()?;
        let mut project =
            read_project(&self.project_path(id)).map_err(|error| map_missing(error, id))?;
        ensure_version(&project.version, expected_version)?;
        project.telegram_chats = telegram_chats;
        project.updated_at = Utc::now();
        self.write_project(&project)?;
        read_project(&self.project_path(id))
    }

    pub fn list_telegram_inbox(
        &self,
        project_id: Option<&str>,
        include_processed: bool,
    ) -> Result<Vec<TelegramInboxCandidate>, StoreError> {
        if let Some(project_id) = project_id {
            validate_id(project_id)?;
        }
        let _lock = self.lock_shared()?;
        let mut candidates = self.read_telegram_inbox()?.candidates;
        candidates.retain(|candidate| {
            project_id.is_none_or(|project_id| candidate.project_id == project_id)
                && (include_processed || candidate.status == InboxCandidateStatus::Pending)
        });
        for candidate in &mut candidates {
            candidate.linked_task = self
                .find_task_by_telegram_source(candidate.chat_id, &candidate_message_ids(candidate))?
                .as_ref()
                .map(TelegramLinkedTask::from);
        }
        candidates.sort_by_key(|candidate| Reverse(candidate.sent_at));
        Ok(candidates)
    }

    pub fn telegram_sync_status(&self) -> Result<Option<TelegramSyncStatus>, StoreError> {
        let _lock = self.lock_shared()?;
        let path = self.telegram_sync_status_path();
        if !path.exists() {
            return Ok(None);
        }
        Ok(Some(serde_json::from_slice(&read_limited_bytes(
            &path,
            MAX_INTEGRATION_STATE_BYTES,
        )?)?))
    }

    pub fn record_telegram_sync_status(
        &self,
        status: &TelegramSyncStatus,
    ) -> Result<(), StoreError> {
        if let Some(request_id) = &status.request_id {
            validate_id(request_id)?;
        }
        if status.errors.len() > 8 || status.errors.iter().any(|error| error.len() > 1_000) {
            return Err(StoreError::Validation(
                "некорректный отчёт синхронизации Telegram".into(),
            ));
        }
        let _lock = self.lock_exclusive()?;
        let mut bytes = serde_json::to_vec_pretty(status)?;
        bytes.push(b'\n');
        atomic_write_bytes(&self.telegram_sync_status_path(), &bytes)
    }

    pub fn request_telegram_sync(&self) -> Result<TelegramSyncRequest, StoreError> {
        let _lock = self.lock_exclusive()?;
        let request = TelegramSyncRequest {
            id: Ulid::new().to_string(),
            requested_at: Utc::now(),
        };
        let mut bytes = serde_json::to_vec_pretty(&request)?;
        bytes.push(b'\n');
        atomic_write_bytes(&self.telegram_sync_request_path(), &bytes)?;
        Ok(request)
    }

    pub fn telegram_sync_request(&self) -> Result<Option<TelegramSyncRequest>, StoreError> {
        let _lock = self.lock_shared()?;
        let path = self.telegram_sync_request_path();
        if !path.exists() {
            return Ok(None);
        }
        Ok(Some(serde_json::from_slice(&read_limited_bytes(
            &path,
            MAX_INTEGRATION_STATE_BYTES,
        )?)?))
    }

    pub fn acknowledge_telegram_sync_request(&self, id: &str) -> Result<bool, StoreError> {
        validate_id(id)?;
        let _lock = self.lock_exclusive()?;
        let path = self.telegram_sync_request_path();
        if !path.exists() {
            return Ok(false);
        }
        let request: TelegramSyncRequest =
            serde_json::from_slice(&read_limited_bytes(&path, MAX_INTEGRATION_STATE_BYTES)?)?;
        if request.id != id {
            return Ok(false);
        }
        fs::remove_file(path)?;
        Ok(true)
    }

    pub fn get_telegram_candidate(
        &self,
        candidate_id: &str,
    ) -> Result<TelegramInboxCandidate, StoreError> {
        let _lock = self.lock_shared()?;
        let mut candidate = self
            .read_telegram_inbox()?
            .candidates
            .into_iter()
            .find(|candidate| candidate.id == candidate_id)
            .ok_or_else(|| StoreError::NotFound(candidate_id.to_owned()))?;
        candidate.linked_task = self
            .find_task_by_telegram_source(candidate.chat_id, &candidate_message_ids(&candidate))?
            .as_ref()
            .map(TelegramLinkedTask::from);
        Ok(candidate)
    }

    pub fn upsert_telegram_candidates(
        &self,
        incoming: Vec<TelegramInboxCandidate>,
    ) -> Result<usize, StoreError> {
        let _lock = self.lock_exclusive()?;
        let mut document = self.read_telegram_inbox()?;
        let mut added = 0;
        let mut changed = false;
        for mut candidate in incoming {
            candidate.linked_task = None;
            if let Some(task) = self.find_task_by_telegram_source(
                candidate.chat_id,
                &candidate_message_ids(&candidate),
            )? {
                candidate.status = InboxCandidateStatus::Imported;
                candidate.processed_at = Some(Utc::now());
                candidate.task_id = Some(task.id);
            }
            validate_candidate(&candidate)?;
            if let Some(existing) = document
                .candidates
                .iter_mut()
                .find(|existing| existing.id == candidate.id)
            {
                if existing.status == InboxCandidateStatus::Pending {
                    let discovered_at = existing.discovered_at;
                    let mut updated = candidate;
                    updated.discovered_at = discovered_at;
                    if *existing != updated {
                        *existing = updated;
                        changed = true;
                    }
                }
            } else {
                document.candidates.push(candidate);
                added += 1;
                changed = true;
            }
        }
        let before_compaction = document.candidates.len();
        compact_telegram_inbox(&mut document);
        changed |= document.candidates.len() != before_compaction;
        if changed {
            self.write_telegram_inbox(&document)?;
        }
        Ok(added)
    }

    pub fn set_telegram_candidate_status(
        &self,
        candidate_id: &str,
        status: InboxCandidateStatus,
    ) -> Result<TelegramInboxCandidate, StoreError> {
        let _lock = self.lock_exclusive()?;
        let mut document = self.read_telegram_inbox()?;
        let candidate = document
            .candidates
            .iter_mut()
            .find(|candidate| candidate.id == candidate_id)
            .ok_or_else(|| StoreError::NotFound(candidate_id.to_owned()))?;
        if candidate.status == InboxCandidateStatus::Imported
            && status != InboxCandidateStatus::Imported
        {
            return Err(StoreError::Validation(
                "импортированный Telegram-кандидат нельзя вернуть или отклонить; связанная задача уже существует".into(),
            ));
        }
        if candidate.status == status {
            return Ok(candidate.clone());
        }
        candidate.status = status;
        candidate.processed_at = (candidate.status != InboxCandidateStatus::Pending).then(Utc::now);
        if candidate.status != InboxCandidateStatus::Imported {
            candidate.task_id = None;
        }
        let result = candidate.clone();
        self.write_telegram_inbox(&document)?;
        Ok(result)
    }

    pub fn create_task_from_telegram_candidate(
        &self,
        candidate_id: &str,
        description: Option<&str>,
        urgency: Urgency,
    ) -> Result<Task, StoreError> {
        let _lock = self.lock_exclusive()?;
        let mut document = self.read_telegram_inbox()?;
        let candidate_index = document
            .candidates
            .iter()
            .position(|candidate| candidate.id == candidate_id)
            .ok_or_else(|| StoreError::NotFound(candidate_id.to_owned()))?;
        let candidate = document.candidates[candidate_index].clone();
        if candidate.status == InboxCandidateStatus::Imported
            && let Some(task_id) = candidate.task_id.as_deref()
        {
            return self.find_task(task_id);
        }
        if candidate.status != InboxCandidateStatus::Pending {
            return Err(StoreError::Validation(
                "кандидат уже обработан; верните его во входящие перед созданием задачи".into(),
            ));
        }
        if !self.project_path(&candidate.project_id).exists() {
            return Err(StoreError::NotFound(candidate.project_id.clone()));
        }
        if let Some(existing) = self
            .find_task_by_telegram_source(candidate.chat_id, &candidate_message_ids(&candidate))?
        {
            let stored = &mut document.candidates[candidate_index];
            stored.status = InboxCandidateStatus::Imported;
            stored.processed_at = Some(Utc::now());
            stored.task_id = Some(existing.id.clone());
            stored.linked_task = None;
            self.write_telegram_inbox(&document)?;
            return Ok(existing);
        }
        let fallback_description = default_telegram_task_title(&candidate);
        let description = clean_required(
            description.unwrap_or(&fallback_description),
            "описание задачи",
            20_000,
        )?;
        let now = Utc::now();
        let task = Task {
            id: Ulid::new().to_string(),
            project_id: candidate.project_id.clone(),
            description,
            created_at: now,
            updated_at: now,
            urgency,
            status: TaskStatus::Open,
            source: Some(candidate.snapshot()),
            trashed_at: None,
            version: String::new(),
        };
        self.write_task(&task)?;
        let candidate = &mut document.candidates[candidate_index];
        candidate.status = InboxCandidateStatus::Imported;
        candidate.processed_at = Some(now);
        candidate.task_id = Some(task.id.clone());
        candidate.linked_task = None;
        if let Err(error) = self.write_telegram_inbox(&document) {
            let _ = fs::remove_file(self.task_path(&task.project_id, &task.id));
            return Err(error);
        }
        read_task(&self.task_path(&task.project_id, &task.id))
    }

    pub fn telegram_tasks_for_messages(
        &self,
        project_id: &str,
        chat_id: i64,
        message_groups: &[Vec<i64>],
    ) -> Result<Vec<Option<TelegramLinkedTask>>, StoreError> {
        validate_id(project_id)?;
        let _lock = self.lock_shared()?;
        let mut sources = Vec::<(Vec<i64>, TelegramLinkedTask)>::new();
        for project in fs::read_dir(self.projects_dir())? {
            let directory = project?.path().join("tasks");
            if directory.exists() {
                for entry in fs::read_dir(directory)? {
                    let path = entry?.path();
                    if path.extension().and_then(|value| value.to_str()) != Some("md") {
                        continue;
                    }
                    let task = read_task(&path)?;
                    let Some(source) = task.source.as_ref().filter(|source| {
                        source.provider.as_deref() == Some("telegram")
                            && source.chat_id == Some(chat_id)
                    }) else {
                        continue;
                    };
                    sources.push((source_message_ids(source), TelegramLinkedTask::from(&task)));
                }
            }
        }
        Ok(message_groups
            .iter()
            .map(|message_ids| {
                sources
                    .iter()
                    .find(|(source_ids, _)| source_ids.iter().any(|id| message_ids.contains(id)))
                    .map(|(_, task)| task.clone())
            })
            .collect())
    }

    pub fn delete_project(&self, id: &str, expected_version: &str) -> Result<(), StoreError> {
        validate_id(id)?;
        let _lock = self.lock_exclusive()?;
        let project =
            read_project(&self.project_path(id)).map_err(|error| map_missing(error, id))?;
        ensure_version(&project.version, expected_version)?;
        fs::remove_dir_all(self.projects_dir().join(id))?;
        if let Ok(mut inbox) = self.read_telegram_inbox() {
            inbox
                .candidates
                .retain(|candidate| candidate.project_id != id);
            let _ = self.write_telegram_inbox(&inbox);
        }
        Ok(())
    }

    pub fn list_tasks(
        &self,
        project_id: Option<&str>,
        include_completed: bool,
    ) -> Result<Vec<TaskSummary>, StoreError> {
        let _lock = self.lock_shared()?;
        let mut tasks = Vec::new();
        let projects = if let Some(id) = project_id {
            validate_id(id)?;
            vec![self.root.join("projects").join(id)]
        } else {
            fs::read_dir(self.projects_dir())?
                .filter_map(Result::ok)
                .filter_map(|entry| {
                    entry
                        .file_type()
                        .ok()
                        .filter(|kind| kind.is_dir())
                        .map(|_| entry.path())
                })
                .collect()
        };
        for project in projects {
            let dir = project.join("tasks");
            if !dir.exists() {
                continue;
            }
            for entry in fs::read_dir(dir)? {
                let path = entry?.path();
                if path.extension().and_then(|value| value.to_str()) == Some("md") {
                    let task = read_task(&path)?;
                    if task.trashed_at.is_none()
                        && (include_completed || task.status == TaskStatus::Open)
                    {
                        tasks.push(task);
                    }
                }
            }
        }
        tasks.sort_by(|a, b| {
            let status = status_rank(&a.status).cmp(&status_rank(&b.status));
            let urgency = urgency_rank(&b.urgency).cmp(&urgency_rank(&a.urgency));
            status
                .then(urgency)
                .then_with(|| b.created_at.cmp(&a.created_at))
        });
        Ok(tasks.into_iter().map(TaskSummary::from).collect())
    }

    pub fn get_task(&self, id: &str) -> Result<Task, StoreError> {
        validate_id(id)?;
        let _lock = self.lock_shared()?;
        self.find_task(id)
    }

    pub fn list_trashed_tasks(&self) -> Result<Vec<TaskSummary>, StoreError> {
        let _lock = self.lock_shared()?;
        let mut tasks = Vec::new();
        for entry in fs::read_dir(self.projects_dir())? {
            let dir = entry?.path().join("tasks");
            if !dir.exists() {
                continue;
            }
            for entry in fs::read_dir(dir)? {
                let path = entry?.path();
                if path.extension().and_then(|value| value.to_str()) == Some("md") {
                    let task = read_task(&path)?;
                    if task.trashed_at.is_some() {
                        tasks.push(task);
                    }
                }
            }
        }
        tasks.sort_by_key(|task| Reverse(task.trashed_at));
        Ok(tasks.into_iter().map(TaskSummary::from).collect())
    }

    pub fn create_task(&self, input: CreateTask) -> Result<Task, StoreError> {
        validate_id(&input.project_id)?;
        let description = clean_required(&input.description, "описание задачи", 20_000)?;
        validate_source(&input.source)?;
        let _lock = self.lock_exclusive()?;
        if !self.project_path(&input.project_id).exists() {
            return Err(StoreError::NotFound(input.project_id));
        }
        let now = Utc::now();
        let task = Task {
            id: Ulid::new().to_string(),
            project_id: input.project_id,
            description,
            created_at: now,
            updated_at: now,
            urgency: input.urgency,
            status: TaskStatus::Open,
            source: input.source,
            trashed_at: None,
            version: String::new(),
        };
        self.write_task(&task)?;
        read_task(&self.task_path(&task.project_id, &task.id))
    }

    pub fn update_task(
        &self,
        id: &str,
        patch: TaskPatch,
        expected_version: &str,
    ) -> Result<Task, StoreError> {
        validate_id(id)?;
        let _lock = self.lock_exclusive()?;
        let mut task = self.find_task(id)?;
        ensure_version(&task.version, expected_version)?;
        if let Some(description) = patch.description {
            task.description = clean_required(&description, "описание задачи", 20_000)?;
        }
        if let Some(urgency) = patch.urgency {
            task.urgency = urgency;
        }
        if let Some(status) = patch.status {
            task.status = status;
        }
        if let Some(source) = patch.source {
            validate_source(&source)?;
            task.source = source;
        }
        task.updated_at = Utc::now();
        self.write_task(&task)?;
        read_task(&self.task_path(&task.project_id, id))
    }

    pub fn complete_task(&self, id: &str, expected_version: &str) -> Result<Task, StoreError> {
        self.update_task(
            id,
            TaskPatch {
                status: Some(TaskStatus::Completed),
                ..TaskPatch::default()
            },
            expected_version,
        )
    }

    pub fn clear_task_source(&self, id: &str, expected_version: &str) -> Result<Task, StoreError> {
        self.update_task(
            id,
            TaskPatch {
                source: Some(None),
                ..TaskPatch::default()
            },
            expected_version,
        )
    }

    pub fn move_task(
        &self,
        id: &str,
        project_id: &str,
        expected_version: &str,
    ) -> Result<Task, StoreError> {
        validate_id(id)?;
        validate_id(project_id)?;
        let _lock = self.lock_exclusive()?;
        if !self.project_path(project_id).exists() {
            return Err(StoreError::NotFound(project_id.to_owned()));
        }
        let mut task = self.find_task(id)?;
        ensure_version(&task.version, expected_version)?;
        if task.project_id == project_id {
            return Ok(task);
        }
        let old_path = self.task_path(&task.project_id, id);
        let new_path = self.task_path(project_id, id);
        let old_attachments = self.attachment_dir(&task.project_id, id);
        let new_attachments = self.attachment_dir(project_id, id);
        fs::create_dir_all(self.task_dir(project_id))?;
        fs::rename(&old_path, &new_path)?;
        if old_attachments.exists() {
            if let Some(parent) = new_attachments.parent() {
                fs::create_dir_all(parent)?;
            }
            if let Err(error) = fs::rename(&old_attachments, &new_attachments) {
                let _ = fs::rename(&new_path, &old_path);
                return Err(error.into());
            }
        }
        let old_project_id = std::mem::replace(&mut task.project_id, project_id.to_owned());
        task.updated_at = Utc::now();
        if let Err(error) = self.write_task(&task) {
            let _ = fs::rename(&new_path, self.task_path(&old_project_id, id));
            if new_attachments.exists() {
                let _ = fs::rename(&new_attachments, self.attachment_dir(&old_project_id, id));
            }
            return Err(error);
        }
        read_task(&new_path)
    }

    pub fn trash_task(&self, id: &str, expected_version: &str) -> Result<Task, StoreError> {
        self.set_trashed(id, expected_version, true)
    }

    pub fn restore_task(&self, id: &str, expected_version: &str) -> Result<Task, StoreError> {
        self.set_trashed(id, expected_version, false)
    }

    pub fn delete_trashed_task(&self, id: &str, expected_version: &str) -> Result<(), StoreError> {
        validate_id(id)?;
        let _lock = self.lock_exclusive()?;
        let task = self.find_task(id)?;
        ensure_version(&task.version, expected_version)?;
        if task.trashed_at.is_none() {
            return Err(StoreError::Validation(
                "окончательно удалить можно только задачу из корзины".into(),
            ));
        }
        fs::remove_file(self.task_path(&task.project_id, id))?;
        let attachments = self.attachment_dir(&task.project_id, id);
        if attachments.exists() {
            fs::remove_dir_all(attachments)?;
        }
        Ok(())
    }

    pub fn empty_trash(&self) -> Result<usize, StoreError> {
        let _lock = self.lock_exclusive()?;
        let mut paths = Vec::new();
        for entry in fs::read_dir(self.projects_dir())? {
            let dir = entry?.path().join("tasks");
            if !dir.exists() {
                continue;
            }
            for entry in fs::read_dir(dir)? {
                let path = entry?.path();
                if path.extension().and_then(|value| value.to_str()) == Some("md")
                    && read_task(&path)?.trashed_at.is_some()
                {
                    let attachments = task_attachment_dir(&path);
                    paths.push((path, attachments));
                }
            }
        }
        for (path, attachments) in &paths {
            fs::remove_file(path)?;
            if attachments.exists() {
                fs::remove_dir_all(attachments)?;
            }
        }
        Ok(paths.len())
    }

    pub fn save_task_attachment(
        &self,
        id: &str,
        file_name: &str,
        bytes: &[u8],
    ) -> Result<String, StoreError> {
        validate_id(id)?;
        if bytes.is_empty() || bytes.len() as u64 > MAX_ATTACHMENT_BYTES {
            return Err(StoreError::Validation(
                "вложение должно быть размером от 1 байта до 25 МБ".into(),
            ));
        }
        let clean_name = clean_file_name(file_name)?;
        let _lock = self.lock_exclusive()?;
        let task = self.find_task(id)?;
        let stored_name = format!("{}-{clean_name}", Ulid::new());
        let path = self.attachment_dir(&task.project_id, id).join(&stored_name);
        atomic_write_bytes(&path, bytes)?;
        Ok(format!("attachments/{id}/{stored_name}"))
    }

    pub fn resolve_task_attachment(
        &self,
        id: &str,
        relative_path: &str,
    ) -> Result<PathBuf, StoreError> {
        validate_id(id)?;
        let _lock = self.lock_shared()?;
        let task = self.find_task(id)?;
        let prefix = format!("attachments/{id}/");
        let file_name = relative_path
            .strip_prefix(&prefix)
            .filter(|value| !value.is_empty() && !value.contains(['/', '\\']))
            .ok_or_else(|| StoreError::Validation("некорректный путь вложения".into()))?;
        let attachment_directory = self.attachment_dir(&task.project_id, id);
        let path = attachment_directory.join(file_name);
        if !path.is_file() {
            return Err(StoreError::NotFound(relative_path.to_owned()));
        }
        let canonical_directory = fs::canonicalize(attachment_directory)?;
        let canonical_path = fs::canonicalize(path)?;
        if !canonical_path.starts_with(canonical_directory) {
            return Err(StoreError::Validation(
                "путь вложения выходит за папку задачи".into(),
            ));
        }
        Ok(canonical_path)
    }

    pub fn read_task_attachment(
        &self,
        id: &str,
        relative_path: &str,
    ) -> Result<Vec<u8>, StoreError> {
        let path = self.resolve_task_attachment(id, relative_path)?;
        let size = fs::metadata(&path)?.len();
        if size == 0 || size > MAX_ATTACHMENT_BYTES {
            return Err(StoreError::Validation(
                "вложение должно быть размером от 1 байта до 25 МБ".into(),
            ));
        }
        Ok(fs::read(path)?)
    }

    pub fn create_backup(&self, destination: &Path) -> Result<(), StoreError> {
        let parent = destination
            .parent()
            .ok_or_else(|| StoreError::Backup("некорректный путь сохранения".into()))?;
        fs::create_dir_all(parent)?;
        let root = fs::canonicalize(&self.root)?;
        let destination_parent = fs::canonicalize(parent)?;
        if destination_parent.starts_with(&root) {
            return Err(StoreError::Backup(
                "резервную копию нельзя сохранить внутри папки данных".into(),
            ));
        }

        let _lock = self.lock_shared()?;
        let mut files = Vec::new();
        collect_backup_files(&self.projects_dir(), &mut files)?;
        let integrations = self.root.join("integrations");
        if integrations.exists() {
            collect_backup_files(&integrations, &mut files)?;
            files.retain(|path| path != &self.telegram_sync_request_path());
        }
        let temporary = parent.join(format!(".flood-backup-{}.tmp", Ulid::new()));
        let result = (|| {
            let file = File::create(&temporary)?;
            let mut archive = ZipWriter::new(file);
            let options = SimpleFileOptions::default()
                .compression_method(zip::CompressionMethod::Deflated)
                .unix_permissions(0o600);
            let mut buffer = [0_u8; 64 * 1024];
            for path in files {
                let relative = path
                    .strip_prefix(&self.root)
                    .map_err(|_| StoreError::Backup("некорректный путь данных".into()))?;
                let name = relative.to_string_lossy().replace('\\', "/");
                archive
                    .start_file(name, options)
                    .map_err(|error| StoreError::Backup(error.to_string()))?;
                let mut source = File::open(path)?;
                loop {
                    let read = source.read(&mut buffer)?;
                    if read == 0 {
                        break;
                    }
                    archive
                        .write_all(&buffer[..read])
                        .map_err(|error| StoreError::Backup(error.to_string()))?;
                }
            }
            archive
                .finish()
                .map_err(|error| StoreError::Backup(error.to_string()))?
                .sync_all()?;
            if destination.exists() {
                fs::remove_file(destination)?;
            }
            fs::rename(&temporary, destination)?;
            Ok(())
        })();
        if result.is_err() {
            let _ = fs::remove_file(&temporary);
        }
        result
    }

    pub fn restore_backup(&self, source: &Path) -> Result<(), StoreError> {
        if !source.is_file() {
            return Err(StoreError::Backup("файл резервной копии не найден".into()));
        }
        let parent = self
            .root
            .parent()
            .ok_or_else(|| StoreError::Backup("некорректная папка данных".into()))?;
        let restore_root = parent.join(format!(".flood-restore-{}", Ulid::new()));
        let previous_projects = self
            .root
            .join(format!(".projects-before-restore-{}", Ulid::new()));
        let previous_integrations = self
            .root
            .join(format!(".integrations-before-restore-{}", Ulid::new()));
        let result = (|| {
            fs::create_dir_all(&restore_root)?;
            let mut archive = ZipArchive::new(File::open(source)?)
                .map_err(|error| StoreError::Backup(error.to_string()))?;
            if archive.len() > 20_000 {
                return Err(StoreError::Backup("в архиве слишком много файлов".into()));
            }
            let mut total_size = 0_u64;
            let mut has_projects = false;
            for index in 0..archive.len() {
                let mut entry = archive
                    .by_index(index)
                    .map_err(|error| StoreError::Backup(error.to_string()))?;
                let relative = entry
                    .enclosed_name()
                    .ok_or_else(|| StoreError::Backup("архив содержит небезопасный путь".into()))?
                    .to_path_buf();
                let root_name = relative
                    .components()
                    .next()
                    .and_then(|part| part.as_os_str().to_str());
                if !matches!(root_name, Some("projects" | "chats" | "integrations")) {
                    return Err(StoreError::Backup(
                        "архив не является резервной копией flood.md".into(),
                    ));
                }
                if matches!(root_name, Some("projects" | "chats")) {
                    has_projects = true;
                }
                total_size = total_size.saturating_add(entry.size());
                if total_size > 1024 * 1024 * 1024 {
                    return Err(StoreError::Backup("архив превышает 1 ГБ".into()));
                }
                if entry
                    .unix_mode()
                    .is_some_and(|mode| mode & 0o170000 == 0o120000)
                {
                    return Err(StoreError::Backup(
                        "символические ссылки не поддерживаются".into(),
                    ));
                }
                let mut migrated_relative = if matches!(root_name, Some("projects" | "chats")) {
                    let mut path = PathBuf::from("projects");
                    path.extend(relative.components().skip(1));
                    path
                } else {
                    relative.clone()
                };
                if migrated_relative
                    .file_name()
                    .and_then(|value| value.to_str())
                    == Some("chat.md")
                {
                    migrated_relative.set_file_name("project.md");
                }
                let output = restore_root.join(migrated_relative);
                if entry.is_dir() {
                    fs::create_dir_all(output)?;
                    continue;
                }
                if let Some(parent) = output.parent() {
                    fs::create_dir_all(parent)?;
                }
                let mut target = File::create(output)?;
                std::io::copy(&mut entry, &mut target)?;
                target.sync_all()?;
            }
            if !has_projects || !restore_root.join("projects").is_dir() {
                return Err(StoreError::Backup(
                    "в архиве отсутствует папка с проектами".into(),
                ));
            }

            let candidate = Store::new(&restore_root)?;
            candidate.list_projects()?;
            candidate.list_tasks(None, true)?;
            candidate.list_trashed_tasks()?;

            let _lock = self.lock_exclusive()?;
            let current_projects = self.projects_dir();
            fs::rename(&current_projects, &previous_projects)?;
            if let Err(error) = fs::rename(restore_root.join("projects"), &current_projects) {
                let _ = fs::rename(&previous_projects, &current_projects);
                return Err(error.into());
            }
            let current_integrations = self.root.join("integrations");
            let restored_integrations = restore_root.join("integrations");
            if current_integrations.exists()
                && let Err(error) = fs::rename(&current_integrations, &previous_integrations)
            {
                let _ = fs::remove_dir_all(&current_projects);
                let _ = fs::rename(&previous_projects, &current_projects);
                return Err(error.into());
            }
            if restored_integrations.exists()
                && let Err(error) = fs::rename(&restored_integrations, &current_integrations)
            {
                let _ = fs::remove_dir_all(&current_projects);
                let _ = fs::rename(&previous_projects, &current_projects);
                if previous_integrations.exists() {
                    let _ = fs::rename(&previous_integrations, &current_integrations);
                }
                return Err(error.into());
            }
            let _ = fs::remove_dir_all(&previous_projects);
            let _ = fs::remove_dir_all(&previous_integrations);
            Ok(())
        })();
        let _ = fs::remove_dir_all(&restore_root);
        if result.is_err() && previous_projects.exists() && !self.projects_dir().exists() {
            let _ = fs::rename(&previous_projects, self.projects_dir());
        }
        if result.is_err()
            && previous_integrations.exists()
            && !self.root.join("integrations").exists()
        {
            let _ = fs::rename(&previous_integrations, self.root.join("integrations"));
        }
        result
    }

    fn set_trashed(
        &self,
        id: &str,
        expected_version: &str,
        trashed: bool,
    ) -> Result<Task, StoreError> {
        validate_id(id)?;
        let _lock = self.lock_exclusive()?;
        let mut task = self.find_task(id)?;
        ensure_version(&task.version, expected_version)?;
        task.trashed_at = trashed.then(Utc::now);
        task.updated_at = Utc::now();
        self.write_task(&task)?;
        read_task(&self.task_path(&task.project_id, id))
    }

    fn projects_dir(&self) -> PathBuf {
        self.root.join("projects")
    }
    fn project_path(&self, id: &str) -> PathBuf {
        self.projects_dir().join(id).join("project.md")
    }
    fn task_dir(&self, project_id: &str) -> PathBuf {
        self.projects_dir().join(project_id).join("tasks")
    }
    fn task_path(&self, project_id: &str, id: &str) -> PathBuf {
        self.task_dir(project_id).join(format!("{id}.md"))
    }
    fn attachment_dir(&self, project_id: &str, id: &str) -> PathBuf {
        self.task_dir(project_id).join("attachments").join(id)
    }

    fn find_task(&self, id: &str) -> Result<Task, StoreError> {
        for entry in fs::read_dir(self.projects_dir())? {
            let path = entry?.path().join("tasks").join(format!("{id}.md"));
            if path.exists() {
                return read_task(&path);
            }
        }
        Err(StoreError::NotFound(id.to_owned()))
    }

    fn find_task_by_telegram_source(
        &self,
        chat_id: i64,
        message_ids: &[i64],
    ) -> Result<Option<Task>, StoreError> {
        if message_ids.is_empty() {
            return Ok(None);
        }
        for project in fs::read_dir(self.projects_dir())? {
            let directory = project?.path().join("tasks");
            if !directory.exists() {
                continue;
            }
            for entry in fs::read_dir(directory)? {
                let path = entry?.path();
                if path.extension().and_then(|value| value.to_str()) != Some("md") {
                    continue;
                }
                let task = read_task(&path)?;
                let Some(source) = task.source.as_ref().filter(|source| {
                    source.provider.as_deref() == Some("telegram")
                        && source.chat_id == Some(chat_id)
                }) else {
                    continue;
                };
                let source_ids = source_message_ids(source);
                if source_ids.iter().any(|id| message_ids.contains(id)) {
                    return Ok(Some(task));
                }
            }
        }
        Ok(None)
    }

    fn write_project(&self, project: &Project) -> Result<(), StoreError> {
        let doc = ProjectDocument {
            format_version: FORMAT_VERSION,
            id: project.id.clone(),
            title: project.title.clone(),
            created_at: project.created_at,
            updated_at: project.updated_at,
            telegram: None,
            telegram_chats: project.telegram_chats.clone(),
        };
        let body = format!("# {}\n", project.title);
        atomic_write(&self.project_path(&project.id), &encode(&doc, &body)?)
    }

    fn telegram_inbox_path(&self) -> PathBuf {
        self.root.join("integrations").join("telegram-inbox.json")
    }

    fn telegram_sync_status_path(&self) -> PathBuf {
        self.root.join("integrations").join("telegram-sync.json")
    }

    fn telegram_sync_request_path(&self) -> PathBuf {
        self.root
            .join("integrations")
            .join("telegram-sync-request.json")
    }

    fn read_telegram_inbox(&self) -> Result<TelegramInboxDocument, StoreError> {
        let path = self.telegram_inbox_path();
        if !path.exists() {
            return Ok(TelegramInboxDocument {
                format_version: inbox_format_version(),
                candidates: Vec::new(),
            });
        }
        let document: TelegramInboxDocument =
            serde_json::from_slice(&read_limited_bytes(&path, MAX_TELEGRAM_INBOX_BYTES)?)?;
        if document.format_version != inbox_format_version() {
            return Err(StoreError::Validation(
                "неподдерживаемая версия очереди Telegram".into(),
            ));
        }
        Ok(document)
    }

    fn write_telegram_inbox(&self, document: &TelegramInboxDocument) -> Result<(), StoreError> {
        let mut bytes = serde_json::to_vec_pretty(document)?;
        bytes.push(b'\n');
        if bytes.len() as u64 > MAX_TELEGRAM_INBOX_BYTES {
            return Err(StoreError::Validation(
                "очередь Telegram превышает безопасный размер 64 МБ".into(),
            ));
        }
        atomic_write_bytes(&self.telegram_inbox_path(), &bytes)
    }

    fn write_task(&self, task: &Task) -> Result<(), StoreError> {
        let doc = TaskDocument {
            format_version: FORMAT_VERSION,
            id: task.id.clone(),
            project_id: task.project_id.clone(),
            created_at: task.created_at,
            updated_at: task.updated_at,
            urgency: task.urgency.clone(),
            status: task.status.clone(),
            source: task.source.clone(),
            trashed_at: task.trashed_at,
        };
        atomic_write(
            &self.task_path(&task.project_id, &task.id),
            &encode(&doc, &task.description)?,
        )
    }

    fn lock_shared(&self) -> Result<StoreLock, StoreError> {
        let file = OpenOptions::new()
            .read(true)
            .write(true)
            .open(self.root.join(".flood.lock"))?;
        file.lock_shared()?;
        Ok(StoreLock(file))
    }

    fn lock_exclusive(&self) -> Result<StoreLock, StoreError> {
        let file = OpenOptions::new()
            .read(true)
            .write(true)
            .open(self.root.join(".flood.lock"))?;
        file.lock_exclusive()?;
        Ok(StoreLock(file))
    }
}

pub fn run_self_check() -> SelfCheckResult {
    let started = Instant::now();
    let root = env::temp_dir().join(format!("flood-self-check-{}", Ulid::new()));
    let mut checks = Vec::new();
    let result = run_isolated_self_check(&root, &mut checks);
    if let Err(error) = result {
        checks.push(SelfCheckItem {
            name: "Завершение проверки".into(),
            passed: false,
            detail: Some(error),
        });
    }
    let cleanup_error = fs::remove_dir_all(&root).err().filter(|_| root.exists());
    checks.push(SelfCheckItem {
        name: "Очистка временных данных".into(),
        passed: cleanup_error.is_none(),
        detail: cleanup_error.map(|error| error.to_string()),
    });
    SelfCheckResult {
        passed: checks.iter().all(|check| check.passed),
        duration_ms: started.elapsed().as_millis(),
        checks,
    }
}

fn run_isolated_self_check(root: &Path, checks: &mut Vec<SelfCheckItem>) -> Result<(), String> {
    let store = Store::new(root).map_err(|error| error.to_string())?;
    checks.push(SelfCheckItem {
        name: "Изолированное хранилище".into(),
        passed: true,
        detail: None,
    });

    let project = store
        .create_project("Проверка flood.md")
        .map_err(|error| error.to_string())?;
    let task = store
        .create_task(CreateTask {
            project_id: project.id.clone(),
            description: "Проверить полный цикл задачи".into(),
            urgency: Urgency::Important,
            source: None,
        })
        .map_err(|error| error.to_string())?;
    checks.push(SelfCheckItem {
        name: "Создание проекта и задачи".into(),
        passed: true,
        detail: None,
    });

    let projects = store.list_projects().map_err(|error| error.to_string())?;
    let tasks = store
        .list_tasks(Some(&project.id), false)
        .map_err(|error| error.to_string())?;
    let read_task = store
        .get_task(&task.id)
        .map_err(|error| error.to_string())?;
    let reading_ok = projects.len() == 1
        && projects[0].id == project.id
        && tasks.len() == 1
        && tasks[0].id == task.id
        && read_task.description == task.description;
    checks.push(SelfCheckItem {
        name: "Списки проектов, задач и чтение карточки".into(),
        passed: reading_ok,
        detail: (!reading_ok)
            .then(|| "Созданные данные не найдены через публичные операции чтения".into()),
    });
    if !reading_ok {
        return Err("Проверка операций чтения не пройдена".into());
    }

    let updated = store
        .update_task(
            &task.id,
            TaskPatch {
                description: Some("Проверить полный цикл задачи и конфликт".into()),
                urgency: Some(Urgency::Urgent),
                ..TaskPatch::default()
            },
            &task.version,
        )
        .map_err(|error| error.to_string())?;
    let update_ok = updated.description == "Проверить полный цикл задачи и конфликт"
        && updated.urgency == Urgency::Urgent;
    checks.push(SelfCheckItem {
        name: "Изменение описания и срочности".into(),
        passed: update_ok,
        detail: (!update_ok).then(|| "Изменения задачи не сохранились".into()),
    });
    if !update_ok {
        return Err("Проверка изменения задачи не пройдена".into());
    }

    let conflict_detected = matches!(
        store.complete_task(&task.id, &task.version),
        Err(StoreError::Conflict)
    );
    checks.push(SelfCheckItem {
        name: "Защита от перезаписи внешних изменений".into(),
        passed: conflict_detected,
        detail: (!conflict_detected).then(|| "Устаревшая версия не вызвала конфликт".into()),
    });
    if !conflict_detected {
        return Err("Проверка конфликтов не пройдена".into());
    }

    let attachment_path = store
        .save_task_attachment(&updated.id, "self-check.txt", b"flood-self-check")
        .map_err(|error| error.to_string())?;
    let attachment = store
        .read_task_attachment(&updated.id, &attachment_path)
        .map_err(|error| error.to_string())?;
    let attachment_ok = attachment == b"flood-self-check";
    checks.push(SelfCheckItem {
        name: "Запись и чтение вложений".into(),
        passed: attachment_ok,
        detail: (!attachment_ok).then(|| "Содержимое вложения изменилось".into()),
    });
    if !attachment_ok {
        return Err("Проверка вложений не пройдена".into());
    }

    let attachment_path_guarded = matches!(
        store.resolve_task_attachment(
            &updated.id,
            &format!("attachments/{}/../project.md", updated.id),
        ),
        Err(StoreError::Validation(_))
    );
    checks.push(SelfCheckItem {
        name: "Защита путей вложений".into(),
        passed: attachment_path_guarded,
        detail: (!attachment_path_guarded)
            .then(|| "Выход за папку вложений не был заблокирован".into()),
    });
    if !attachment_path_guarded {
        return Err("Проверка безопасных путей вложений не пройдена".into());
    }

    let oversized_path = root.join("oversized-self-check.md");
    File::create(&oversized_path)
        .and_then(|file| file.set_len(MAX_MARKDOWN_FILE_BYTES + 1))
        .map_err(|error| error.to_string())?;
    let oversized_file_guarded = matches!(
        read_limited_utf8(&oversized_path, MAX_MARKDOWN_FILE_BYTES),
        Err(StoreError::InvalidFile { .. })
    );
    let _ = fs::remove_file(&oversized_path);
    checks.push(SelfCheckItem {
        name: "Ограниченное чтение локальных файлов".into(),
        passed: oversized_file_guarded,
        detail: (!oversized_file_guarded)
            .then(|| "Файл сверх безопасного лимита был прочитан в память".into()),
    });
    if !oversized_file_guarded {
        return Err("Проверка ограниченного чтения не пройдена".into());
    }

    let completed = store
        .complete_task(&updated.id, &updated.version)
        .map_err(|error| error.to_string())?;
    let trashed = store
        .trash_task(&completed.id, &completed.version)
        .map_err(|error| error.to_string())?;
    let restored = store
        .restore_task(&trashed.id, &trashed.version)
        .map_err(|error| error.to_string())?;
    let reopened = Store::new(root)
        .and_then(|store| store.get_task(&restored.id))
        .map_err(|error| error.to_string())?;
    let lifecycle_ok = reopened.status == TaskStatus::Completed && reopened.trashed_at.is_none();
    checks.push(SelfCheckItem {
        name: "Завершение, корзина и восстановление".into(),
        passed: lifecycle_ok,
        detail: (!lifecycle_ok).then(|| "Состояние задачи не сохранилось после перезапуска".into()),
    });
    if !lifecycle_ok {
        return Err("Проверка жизненного цикла задачи не пройдена".into());
    }

    let now = Utc::now();
    let candidate = TelegramInboxCandidate {
        id: Ulid::new().to_string(),
        project_id: project.id.clone(),
        chat_id: -100_000_000_001,
        chat_title: "Проверка Telegram".into(),
        message_id: 42,
        message_ids: vec![42, 43],
        text: "@flood преврати это сообщение в задачу".into(),
        author: "Self-check".into(),
        sent_at: now,
        url: Some("https://t.me/c/100000000001/42".into()),
        reason: InboxCandidateReason::Mention,
        status: InboxCandidateStatus::Pending,
        media: vec![SourceMedia {
            kind: SourceMediaKind::Photo,
            file_name: "self-check.jpg".into(),
            provider_file_id: Some(42),
            mime_type: Some("image/jpeg".into()),
            size: Some(1024),
            relative_path: None,
        }],
        discovered_at: now,
        processed_at: None,
        task_id: None,
        linked_task: None,
    };
    let candidate_id = candidate.id.clone();
    let added = store
        .upsert_telegram_candidates(vec![candidate])
        .map_err(|error| error.to_string())?;
    let pending = store
        .list_telegram_inbox(Some(&project.id), false)
        .map_err(|error| error.to_string())?;
    let telegram_task = store
        .create_task_from_telegram_candidate(
            &candidate_id,
            Some("Разобрать сообщение из Telegram"),
            Urgency::Important,
        )
        .map_err(|error| error.to_string())?;
    let repeated = store
        .create_task_from_telegram_candidate(&candidate_id, None, Urgency::Normal)
        .map_err(|error| error.to_string())?;
    let imported = store
        .get_telegram_candidate(&candidate_id)
        .map_err(|error| error.to_string())?;
    let telegram_ok = added == 1
        && pending.len() == 1
        && telegram_task.id == repeated.id
        && telegram_task.source.as_ref().is_some_and(|source| {
            source.provider.as_deref() == Some("telegram")
                && source.message_ids == vec![42, 43]
                && source.media.len() == 1
        })
        && imported.status == InboxCandidateStatus::Imported
        && imported.task_id.as_deref() == Some(telegram_task.id.as_str())
        && imported
            .linked_task
            .as_ref()
            .is_some_and(|task| task.id == telegram_task.id);
    checks.push(SelfCheckItem {
        name: "Входящие Telegram, источник и защита от дублей".into(),
        passed: telegram_ok,
        detail: (!telegram_ok).then(|| "Кандидат Telegram не прошёл полный цикл импорта".into()),
    });
    if !telegram_ok {
        return Err("Проверка входящих Telegram не пройдена".into());
    }

    let sync_request = store
        .request_telegram_sync()
        .map_err(|error| error.to_string())?;
    let sync_request_ok = store
        .telegram_sync_request()
        .map_err(|error| error.to_string())?
        .as_ref()
        == Some(&sync_request)
        && store
            .acknowledge_telegram_sync_request(&sync_request.id)
            .map_err(|error| error.to_string())?
        && store
            .telegram_sync_request()
            .map_err(|error| error.to_string())?
            .is_none();
    checks.push(SelfCheckItem {
        name: "Запрос синхронизации Telegram между MCP и приложением".into(),
        passed: sync_request_ok,
        detail: (!sync_request_ok)
            .then(|| "Запрос не сохранился или не подтвердился по идентификатору".into()),
    });
    if !sync_request_ok {
        return Err("Проверка запроса синхронизации Telegram не пройдена".into());
    }

    let diagnostics = store.diagnostics();
    checks.push(SelfCheckItem {
        name: "Диагностика Markdown-хранилища".into(),
        passed: diagnostics.healthy
            && diagnostics.project_count == 1
            && diagnostics.open_task_count == 1
            && diagnostics.completed_task_count == 1,
        detail: (!diagnostics.healthy).then(|| diagnostics.issues.join("; ")),
    });
    Ok(())
}

fn encode<T: Serialize>(metadata: &T, body: &str) -> Result<String, StoreError> {
    let yaml = serde_yaml::to_string(metadata)?;
    Ok(format!("---\n{yaml}---\n\n{}\n", body.trim()))
}

fn decode<T: DeserializeOwned>(path: &Path) -> Result<(T, String, String), StoreError> {
    let content = read_limited_utf8(path, MAX_MARKDOWN_FILE_BYTES)?;
    let version = digest(content.as_bytes());
    let rest = content
        .strip_prefix("---\n")
        .ok_or_else(|| invalid(path, "нет начала YAML front matter"))?;
    let (yaml, body) = rest
        .split_once("\n---\n")
        .ok_or_else(|| invalid(path, "нет конца YAML front matter"))?;
    let metadata = serde_yaml::from_str(yaml).map_err(|error| invalid(path, error.to_string()))?;
    Ok((metadata, body.trim().to_owned(), version))
}

fn read_project(path: &Path) -> Result<Project, StoreError> {
    let (doc, _, version): (ProjectDocument, _, _) = decode(path)?;
    if doc.format_version != FORMAT_VERSION {
        return Err(invalid(path, "неподдерживаемая версия формата"));
    }
    validate_id(&doc.id)?;
    let mut telegram_chats = doc.telegram_chats;
    if telegram_chats.is_empty()
        && let Some(legacy) = doc.telegram
    {
        telegram_chats.push(legacy);
    }
    Ok(Project {
        id: doc.id,
        title: doc.title,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        telegram_chats,
        version,
    })
}

fn read_task(path: &Path) -> Result<Task, StoreError> {
    let (doc, description, version): (TaskDocument, _, _) = decode(path)?;
    if doc.format_version != FORMAT_VERSION {
        return Err(invalid(path, "неподдерживаемая версия формата"));
    }
    validate_id(&doc.id)?;
    validate_id(&doc.project_id)?;
    Ok(Task {
        id: doc.id,
        project_id: doc.project_id,
        description,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        urgency: doc.urgency,
        status: doc.status,
        source: doc.source,
        trashed_at: doc.trashed_at,
        version,
    })
}

fn atomic_write(path: &Path, content: &str) -> Result<(), StoreError> {
    if content.len() as u64 > MAX_MARKDOWN_FILE_BYTES {
        return Err(StoreError::Validation(
            "Markdown-файл превышает безопасный размер 1 МБ".into(),
        ));
    }
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let mut file = AtomicWriteFile::options().open(path)?;
    file.write_all(content.as_bytes())?;
    file.commit()?;
    Ok(())
}

fn read_limited_utf8(path: &Path, max_bytes: u64) -> Result<String, StoreError> {
    String::from_utf8(read_limited_bytes(path, max_bytes)?)
        .map_err(|_| invalid(path, "файл должен быть в кодировке UTF-8"))
}

fn read_limited_bytes(path: &Path, max_bytes: u64) -> Result<Vec<u8>, StoreError> {
    let metadata = fs::metadata(path)?;
    if metadata.len() > max_bytes {
        return Err(invalid(
            path,
            format!("размер файла превышает безопасный предел {max_bytes} байт"),
        ));
    }
    let mut bytes = Vec::with_capacity(metadata.len().min(max_bytes) as usize);
    File::open(path)?
        .take(max_bytes + 1)
        .read_to_end(&mut bytes)?;
    if bytes.len() as u64 > max_bytes {
        return Err(invalid(
            path,
            format!("размер файла превышает безопасный предел {max_bytes} байт"),
        ));
    }
    Ok(bytes)
}

fn atomic_write_bytes(path: &Path, content: &[u8]) -> Result<(), StoreError> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let mut file = AtomicWriteFile::options().open(path)?;
    file.write_all(content)?;
    file.commit()?;
    Ok(())
}

fn collect_backup_files(directory: &Path, output: &mut Vec<PathBuf>) -> Result<(), StoreError> {
    if !directory.exists() {
        return Ok(());
    }
    for entry in fs::read_dir(directory)? {
        let entry = entry?;
        let path = entry.path();
        let kind = entry.file_type()?;
        if kind.is_dir() {
            collect_backup_files(&path, output)?;
        } else if kind.is_file() {
            output.push(path);
        }
    }
    output.sort();
    Ok(())
}

fn clean_file_name(value: &str) -> Result<String, StoreError> {
    let name = Path::new(value)
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("")
        .trim();
    if name.is_empty() || name.len() > 180 {
        return Err(StoreError::Validation("некорректное имя вложения".into()));
    }
    Ok(name
        .chars()
        .map(|char| {
            if char.is_whitespace()
                || matches!(
                    char,
                    '<' | '>'
                        | ':'
                        | '"'
                        | '/'
                        | '\\'
                        | '|'
                        | '?'
                        | '*'
                        | '('
                        | ')'
                        | '['
                        | ']'
                        | '`'
                )
            {
                '_'
            } else {
                char
            }
        })
        .collect())
}

fn task_attachment_dir(task_path: &Path) -> PathBuf {
    let id = task_path
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or("");
    task_path
        .parent()
        .unwrap_or_else(|| Path::new("."))
        .join("attachments")
        .join(id)
}

fn digest(content: &[u8]) -> String {
    hex::encode(Sha256::digest(content))
}
fn ensure_version(actual: &str, expected: &str) -> Result<(), StoreError> {
    if actual == expected {
        Ok(())
    } else {
        Err(StoreError::Conflict)
    }
}
fn status_rank(value: &TaskStatus) -> u8 {
    match value {
        TaskStatus::Open => 0,
        TaskStatus::Completed => 1,
    }
}
fn urgency_rank(value: &crate::Urgency) -> u8 {
    match value {
        crate::Urgency::Normal => 0,
        crate::Urgency::Important => 1,
        crate::Urgency::Urgent => 2,
    }
}
fn invalid(path: &Path, message: impl Into<String>) -> StoreError {
    StoreError::InvalidFile {
        path: path.display().to_string(),
        message: message.into(),
    }
}
fn map_missing(error: StoreError, id: &str) -> StoreError {
    match error {
        StoreError::Io(ref inner) if inner.kind() == std::io::ErrorKind::NotFound => {
            StoreError::NotFound(id.to_owned())
        }
        other => other,
    }
}
fn validate_id(id: &str) -> Result<(), StoreError> {
    Ulid::from_string(id)
        .map(|_| ())
        .map_err(|_| StoreError::Validation("некорректный идентификатор".into()))
}
fn clean_required(value: &str, field: &str, max: usize) -> Result<String, StoreError> {
    let value = value.trim();
    if value.is_empty() {
        return Err(StoreError::Validation(format!(
            "{field} не может быть пустым"
        )));
    }
    if value.chars().count() > max {
        return Err(StoreError::Validation(format!(
            "{field}: превышено ограничение {max} символов"
        )));
    }
    Ok(value.to_owned())
}
fn validate_source(source: &Option<crate::MessageSnapshot>) -> Result<(), StoreError> {
    if let Some(source) = source {
        if source.text.trim().is_empty() && source.media.is_empty() {
            return Err(StoreError::Validation(
                "источник должен содержать текст или медиа".into(),
            ));
        }
        if source.text.chars().count() > 50_000 {
            return Err(StoreError::Validation(
                "текст исходного сообщения: превышено ограничение 50000 символов".into(),
            ));
        }
        if source.url.as_ref().is_some_and(|url| url.len() > 2_000) {
            return Err(StoreError::Validation(
                "ссылка исходного сообщения слишком длинная".into(),
            ));
        }
        if source.media.len() > 20 {
            return Err(StoreError::Validation(
                "у источника может быть не более 20 медиафайлов".into(),
            ));
        }
        for media in &source.media {
            clean_required(&media.file_name, "имя медиафайла", 240)?;
            if media
                .relative_path
                .as_ref()
                .is_some_and(|path| path.contains("..") || Path::new(path).is_absolute())
            {
                return Err(StoreError::Validation(
                    "некорректный относительный путь медиафайла".into(),
                ));
            }
        }
    }
    Ok(())
}

fn validate_candidate(candidate: &TelegramInboxCandidate) -> Result<(), StoreError> {
    validate_id(&candidate.project_id)?;
    clean_required(&candidate.id, "идентификатор кандидата", 160)?;
    clean_required(&candidate.chat_title, "название Telegram-чата", 240)?;
    clean_required(&candidate.author, "автор сообщения", 240)?;
    if candidate.text.trim().is_empty() && candidate.media.is_empty() {
        return Err(StoreError::Validation(
            "сообщение-кандидат должно содержать текст или медиа".into(),
        ));
    }
    validate_source(&Some(candidate.snapshot()))
}

fn candidate_message_ids(candidate: &TelegramInboxCandidate) -> Vec<i64> {
    if candidate.message_ids.is_empty() {
        vec![candidate.message_id]
    } else {
        candidate.message_ids.clone()
    }
}

fn default_telegram_task_title(candidate: &TelegramInboxCandidate) -> String {
    let without_leading_mentions = candidate
        .text
        .split_whitespace()
        .skip_while(|word| word.starts_with('@'))
        .collect::<Vec<_>>()
        .join(" ");
    let normalized = without_leading_mentions.trim();
    if normalized.is_empty() {
        return candidate
            .media
            .first()
            .map(|_| {
                if candidate.media.len() == 1 {
                    "Разобрать медиа из Telegram".to_owned()
                } else {
                    format!("Разобрать медиа из Telegram ({})", candidate.media.len())
                }
            })
            .unwrap_or_else(|| "Разобрать сообщение из Telegram".into());
    }
    let sentence = normalized
        .split(['\n', '\r'])
        .find(|line| !line.trim().is_empty())
        .unwrap_or(normalized)
        .trim();
    let mut characters = sentence.chars();
    let capitalized = characters
        .next()
        .map(|first| first.to_uppercase().collect::<String>() + characters.as_str())
        .unwrap_or_default();
    let mut title = capitalized.chars().take(88).collect::<String>();
    if sentence.chars().count() > 88 {
        title = format!("{}…", title.trim_end());
    }
    title
}

fn source_message_ids(source: &crate::MessageSnapshot) -> Vec<i64> {
    if source.message_ids.is_empty() {
        source.message_id.into_iter().collect()
    } else {
        source.message_ids.clone()
    }
}

fn compact_telegram_inbox(document: &mut TelegramInboxDocument) {
    let processed_cutoff = Utc::now() - chrono::Duration::days(30);
    document.candidates.retain(|candidate| {
        candidate.status == InboxCandidateStatus::Pending
            || candidate
                .processed_at
                .is_none_or(|date| date >= processed_cutoff)
    });
    document
        .candidates
        .sort_by_key(|candidate| Reverse(candidate.sent_at));
    let mut pending_per_project = std::collections::HashMap::<String, usize>::new();
    let mut processed_per_project = std::collections::HashMap::<String, usize>::new();
    document.candidates.retain(|candidate| {
        let counts = if candidate.status == InboxCandidateStatus::Pending {
            &mut pending_per_project
        } else {
            &mut processed_per_project
        };
        let count = counts.entry(candidate.project_id.clone()).or_default();
        *count += 1;
        *count <= 500
    });
    document.candidates.truncate(10_000);
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_store() -> Store {
        let root = env::temp_dir().join(format!("flood-test-{}", Ulid::new()));
        Store::new(root).unwrap()
    }

    #[test]
    fn legacy_chat_layout_is_migrated_to_projects() {
        let store = temp_store();
        let root = store.root().to_path_buf();
        let project = store.create_project("Старый проект").unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: project.id.clone(),
                description: "Сохранить задачу".into(),
                urgency: crate::Urgency::Normal,
                source: None,
            })
            .unwrap();
        drop(store);

        let current_root = root.join("projects");
        let legacy_root = root.join("chats");
        fs::rename(&current_root, &legacy_root).unwrap();
        let project_dir = legacy_root.join(&project.id);
        fs::rename(project_dir.join("project.md"), project_dir.join("chat.md")).unwrap();
        let task_path = project_dir.join("tasks").join(format!("{}.md", task.id));
        let content = fs::read_to_string(&task_path)
            .unwrap()
            .replace("project_id:", "chat_id:");
        fs::write(&task_path, content).unwrap();

        let migrated = Store::new(&root).unwrap();
        assert!(!legacy_root.exists());
        assert!(
            root.join("projects")
                .join(&project.id)
                .join("project.md")
                .is_file()
        );
        assert_eq!(migrated.get_task(&task.id).unwrap().project_id, project.id);
        assert!(fs::read_to_string(task_path.with_file_name(format!("{}.md", task.id))).is_err());
        let migrated_task = root
            .join("projects")
            .join(&project.id)
            .join("tasks")
            .join(format!("{}.md", task.id));
        assert!(
            fs::read_to_string(migrated_task)
                .unwrap()
                .contains("project_id:")
        );
    }

    #[test]
    fn full_task_flow_and_conflict_detection() {
        let store = temp_store();
        let project = store.create_project("Рабочий чат").unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: project.id,
                description: "Подготовить отчёт".into(),
                urgency: crate::Urgency::Important,
                source: None,
            })
            .unwrap();
        let updated = store
            .update_task(
                &task.id,
                TaskPatch {
                    description: Some("Подготовить отчёт за август".into()),
                    ..Default::default()
                },
                &task.version,
            )
            .unwrap();
        assert_eq!(updated.description, "Подготовить отчёт за август");
        assert!(matches!(
            store.complete_task(&task.id, &task.version),
            Err(StoreError::Conflict)
        ));
        let completed = store.complete_task(&task.id, &updated.version).unwrap();
        assert_eq!(completed.status, TaskStatus::Completed);
    }

    #[test]
    fn markdown_is_readable_and_external_edits_change_version() {
        let store = temp_store();
        let project = store.create_project("Флудилка").unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: project.id,
                description: "Позвонить заказчику".into(),
                urgency: crate::Urgency::Normal,
                source: None,
            })
            .unwrap();
        let path = store.task_path(&task.project_id, &task.id);
        let original = fs::read_to_string(&path).unwrap();
        assert!(original.contains("Позвонить заказчику"));
        fs::write(&path, original.replace("Позвонить", "Написать")).unwrap();
        assert!(matches!(
            store.complete_task(&task.id, &task.version),
            Err(StoreError::Conflict)
        ));
    }

    #[test]
    fn task_metadata_and_source_round_trip_through_markdown() {
        let store = temp_store();
        let project = store.create_project("Проект из чата").unwrap();
        let renamed = store
            .update_project(&project.id, "Переименованный проект", &project.version)
            .unwrap();
        assert_eq!(renamed.title, "Переименованный проект");
        let source = crate::MessageSnapshot {
            text: "Проверь сборку к вечеру".into(),
            author: Some("Анна".into()),
            sent_at: Some(Utc::now()),
            url: Some("https://example.com/message/42".into()),
            provider: Some("telegram".into()),
            chat_id: Some(-1001234567890),
            chat_title: Some("Команда".into()),
            message_id: Some(42),
            message_ids: vec![42],
            media: Vec::new(),
        };
        let task = store
            .create_task(CreateTask {
                project_id: project.id,
                description: "# Проверить сборку\n\nПройти основной сценарий".into(),
                urgency: crate::Urgency::Urgent,
                source: Some(source.clone()),
            })
            .unwrap();

        let content = fs::read_to_string(store.task_path(&task.project_id, &task.id)).unwrap();
        assert!(content.contains("created_at:"));
        assert!(content.contains("updated_at:"));
        assert!(content.contains("project_id:"));
        assert!(content.contains("urgency: urgent"));
        assert!(content.contains("status: open"));
        assert!(content.contains("author: Анна"));

        let restored = store.get_task(&task.id).unwrap();
        assert_eq!(restored.source, Some(source));
        assert_eq!(
            restored.description,
            "# Проверить сборку\n\nПройти основной сценарий"
        );

        let cleared = store
            .clear_task_source(&restored.id, &restored.version)
            .unwrap();
        assert!(cleared.source.is_none());
    }

    #[test]
    fn telegram_chat_link_round_trips_through_project_markdown() {
        let store = temp_store();
        let project = store.create_project("Поддержка").unwrap();
        let linked = store
            .set_project_telegram_chats(
                &project.id,
                vec![crate::TelegramProjectLink {
                    chat_id: -1001234567890,
                    title: "Команда поддержки".into(),
                    inbox_mode: crate::TelegramInboxMode::MentionsAndReplies,
                }],
                &project.version,
            )
            .unwrap();
        assert_eq!(linked.telegram_chats[0].chat_id, -1001234567890);
        let content = fs::read_to_string(store.project_path(&project.id)).unwrap();
        assert!(content.contains("telegram_chats:"));
        assert!(content.contains("chat_id: -1001234567890"));

        let unlinked = store
            .set_project_telegram_chats(&linked.id, Vec::new(), &linked.version)
            .unwrap();
        assert!(unlinked.telegram_chats.is_empty());
    }

    #[test]
    fn telegram_inbox_candidate_can_be_imported_once() {
        let store = temp_store();
        let project = store.create_project("Интеграция").unwrap();
        let now = Utc::now();
        let candidate = TelegramInboxCandidate {
            id: "telegram:-100123:77".into(),
            project_id: project.id.clone(),
            chat_id: -100123,
            chat_title: "Рабочий чат".into(),
            message_id: 77,
            message_ids: vec![77],
            text: "@tillwithered подготовь макет".into(),
            author: "Ирина".into(),
            sent_at: now,
            url: Some("https://t.me/c/123/77".into()),
            reason: crate::InboxCandidateReason::Mention,
            status: InboxCandidateStatus::Pending,
            media: vec![crate::SourceMedia {
                kind: crate::SourceMediaKind::Document,
                file_name: "brief.pdf".into(),
                provider_file_id: Some(901),
                mime_type: Some("application/pdf".into()),
                size: Some(1024),
                relative_path: None,
            }],
            discovered_at: now,
            processed_at: None,
            task_id: None,
            linked_task: None,
        };
        assert_eq!(
            store
                .upsert_telegram_candidates(vec![candidate.clone()])
                .unwrap(),
            1
        );
        assert_eq!(store.list_telegram_inbox(None, false).unwrap().len(), 1);

        let task = store
            .create_task_from_telegram_candidate(
                &candidate.id,
                Some("Подготовить макет"),
                crate::Urgency::Important,
            )
            .unwrap();
        assert_eq!(task.source.as_ref().unwrap().message_id, Some(77));
        assert_eq!(task.source.as_ref().unwrap().media.len(), 1);
        assert!(store.list_telegram_inbox(None, false).unwrap().is_empty());

        let repeated = store
            .create_task_from_telegram_candidate(&candidate.id, None, crate::Urgency::Normal)
            .unwrap();
        assert_eq!(repeated.id, task.id);
        assert!(matches!(
            store.set_telegram_candidate_status(&candidate.id, InboxCandidateStatus::Dismissed),
            Err(StoreError::Validation(_))
        ));

        let archive = store.create_project("Архив").unwrap();
        let moved = store
            .move_task(&task.id, &archive.id, &task.version)
            .unwrap();

        let mut same_album = candidate.clone();
        same_album.id = "telegram:album:900".into();
        same_album.message_id = 78;
        same_album.message_ids = vec![77, 78];
        same_album.status = InboxCandidateStatus::Pending;
        same_album.processed_at = None;
        same_album.task_id = None;
        store
            .upsert_telegram_candidates(vec![same_album.clone()])
            .unwrap();
        assert!(store.list_telegram_inbox(None, false).unwrap().is_empty());
        let linked = store
            .get_telegram_candidate(&same_album.id)
            .unwrap()
            .linked_task
            .unwrap();
        assert_eq!(linked.id, task.id);
        assert_eq!(linked.urgency, crate::Urgency::Important);
        assert_eq!(linked.status, crate::TaskStatus::Open);

        let completed = store
            .update_task(
                &task.id,
                TaskPatch {
                    urgency: Some(crate::Urgency::Urgent),
                    status: Some(crate::TaskStatus::Completed),
                    ..Default::default()
                },
                &moved.version,
            )
            .unwrap();
        let linked = store
            .get_telegram_candidate(&same_album.id)
            .unwrap()
            .linked_task
            .unwrap();
        assert_eq!(linked.status, crate::TaskStatus::Completed);
        assert_eq!(linked.urgency, crate::Urgency::Urgent);
        assert_eq!(linked.title, completed.description);
    }

    #[test]
    fn telegram_sync_status_is_shared_and_bounded() {
        let store = temp_store();
        assert!(store.telegram_sync_status().unwrap().is_none());
        let status = TelegramSyncStatus {
            completed_at: Utc::now(),
            request_id: Some(Ulid::new().to_string()),
            health: crate::TelegramSyncHealth::Partial,
            scanned_projects: 2,
            added_candidates: 3,
            downloaded_media: 1,
            failures: 1,
            errors: vec!["Один чат временно недоступен".into()],
        };
        store.record_telegram_sync_status(&status).unwrap();
        assert_eq!(store.telegram_sync_status().unwrap(), Some(status));

        let invalid = TelegramSyncStatus {
            completed_at: Utc::now(),
            request_id: None,
            health: crate::TelegramSyncHealth::Error,
            scanned_projects: 0,
            added_candidates: 0,
            downloaded_media: 0,
            failures: 9,
            errors: (0..9).map(|index| format!("ошибка {index}")).collect(),
        };
        assert!(matches!(
            store.record_telegram_sync_status(&invalid),
            Err(StoreError::Validation(_))
        ));
    }

    #[test]
    fn telegram_sync_request_is_durable_and_acknowledged_by_id() {
        let store = temp_store();
        assert!(store.telegram_sync_request().unwrap().is_none());
        let request = store.request_telegram_sync().unwrap();
        assert_eq!(
            store.telegram_sync_request().unwrap().as_ref(),
            Some(&request)
        );
        assert!(
            !store
                .acknowledge_telegram_sync_request(&Ulid::new().to_string())
                .unwrap()
        );
        assert_eq!(
            store.telegram_sync_request().unwrap().as_ref(),
            Some(&request)
        );
        assert!(
            store
                .acknowledge_telegram_sync_request(&request.id)
                .unwrap()
        );
        assert!(store.telegram_sync_request().unwrap().is_none());
    }

    #[test]
    fn media_only_telegram_candidate_gets_a_readable_task_title() {
        let store = temp_store();
        let project = store.create_project("Медиа").unwrap();
        let now = Utc::now();
        let candidate = TelegramInboxCandidate {
            id: format!("telegram:{}:-100:78", project.id),
            project_id: project.id,
            chat_id: -100,
            chat_title: "Рабочий чат".into(),
            message_id: 78,
            message_ids: vec![78],
            text: String::new(),
            author: "Ирина".into(),
            sent_at: now,
            url: None,
            reason: crate::InboxCandidateReason::Manual,
            status: InboxCandidateStatus::Pending,
            media: vec![crate::SourceMedia {
                kind: crate::SourceMediaKind::Photo,
                file_name: "photo-78.jpg".into(),
                provider_file_id: Some(902),
                mime_type: Some("image/jpeg".into()),
                size: Some(2048),
                relative_path: None,
            }],
            discovered_at: now,
            processed_at: None,
            task_id: None,
            linked_task: None,
        };
        store
            .upsert_telegram_candidates(vec![candidate.clone()])
            .unwrap();
        let task = store
            .create_task_from_telegram_candidate(&candidate.id, None, crate::Urgency::Normal)
            .unwrap();
        assert_eq!(task.description, "Разобрать медиа из Telegram");
        assert_eq!(task.source.unwrap().media.len(), 1);
    }

    #[test]
    fn task_can_move_to_trash_restore_and_change_project() {
        let store = temp_store();
        let first = store.create_project("Первый чат").unwrap();
        let second = store.create_project("Второй чат").unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: first.id.clone(),
                description: "Перенести задачу".into(),
                urgency: crate::Urgency::Normal,
                source: None,
            })
            .unwrap();

        let moved = store
            .move_task(&task.id, &second.id, &task.version)
            .unwrap();
        assert_eq!(moved.project_id, second.id);
        assert!(!store.task_path(&first.id, &task.id).exists());

        let trashed = store.trash_task(&moved.id, &moved.version).unwrap();
        assert!(trashed.trashed_at.is_some());
        assert!(store.list_tasks(None, true).unwrap().is_empty());
        assert_eq!(store.list_trashed_tasks().unwrap().len(), 1);

        let restored = store.restore_task(&trashed.id, &trashed.version).unwrap();
        assert!(restored.trashed_at.is_none());
        assert_eq!(store.list_tasks(None, true).unwrap().len(), 1);
        assert!(store.list_trashed_tasks().unwrap().is_empty());
    }

    #[test]
    fn trashed_tasks_can_be_deleted_individually_or_together() {
        let store = temp_store();
        let project = store.create_project("Корзина").unwrap();
        let create = |description: &str| {
            store
                .create_task(CreateTask {
                    project_id: project.id.clone(),
                    description: description.into(),
                    urgency: crate::Urgency::Normal,
                    source: None,
                })
                .unwrap()
        };
        let first = create("Первая");
        let second = create("Вторая");
        let first = store.trash_task(&first.id, &first.version).unwrap();
        store.trash_task(&second.id, &second.version).unwrap();

        store
            .delete_trashed_task(&first.id, &first.version)
            .unwrap();
        assert!(matches!(
            store.get_task(&first.id),
            Err(StoreError::NotFound(_))
        ));
        assert_eq!(store.empty_trash().unwrap(), 1);
        assert!(store.list_trashed_tasks().unwrap().is_empty());
    }

    #[test]
    fn project_deletion_checks_version_and_removes_its_tasks() {
        let store = temp_store();
        let project = store.create_project("На удаление").unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: project.id.clone(),
                description: "Задача вместе с чатом".into(),
                urgency: crate::Urgency::Normal,
                source: None,
            })
            .unwrap();

        assert!(matches!(
            store.delete_project(&project.id, "stale"),
            Err(StoreError::Conflict)
        ));
        store.delete_project(&project.id, &project.version).unwrap();
        assert!(matches!(
            store.get_project(&project.id),
            Err(StoreError::NotFound(_))
        ));
        assert!(matches!(
            store.get_task(&task.id),
            Err(StoreError::NotFound(_))
        ));
    }

    #[test]
    fn attachments_follow_a_task_and_are_removed_with_it() {
        let store = temp_store();
        let first = store.create_project("Первый").unwrap();
        let second = store.create_project("Второй").unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: first.id.clone(),
                description: "Задача с файлом".into(),
                urgency: crate::Urgency::Normal,
                source: None,
            })
            .unwrap();
        let relative = store
            .save_task_attachment(&task.id, "макет.png", b"image-bytes")
            .unwrap();
        assert!(
            store
                .resolve_task_attachment(&task.id, &relative)
                .unwrap()
                .is_file()
        );
        assert_eq!(
            store.read_task_attachment(&task.id, &relative).unwrap(),
            b"image-bytes"
        );
        assert!(matches!(
            store.resolve_task_attachment(
                &task.id,
                &format!("attachments/{}/../project.md", task.id)
            ),
            Err(StoreError::Validation(_))
        ));

        let oversized = store.resolve_task_attachment(&task.id, &relative).unwrap();
        OpenOptions::new()
            .write(true)
            .open(&oversized)
            .unwrap()
            .set_len(MAX_ATTACHMENT_BYTES + 1)
            .unwrap();
        assert!(matches!(
            store.read_task_attachment(&task.id, &relative),
            Err(StoreError::Validation(_))
        ));
        std::fs::write(&oversized, b"image-bytes").unwrap();

        let moved = store
            .move_task(&task.id, &second.id, &task.version)
            .unwrap();
        assert!(
            store
                .resolve_task_attachment(&task.id, &relative)
                .unwrap()
                .is_file()
        );
        let trashed = store.trash_task(&moved.id, &moved.version).unwrap();
        store
            .delete_trashed_task(&trashed.id, &trashed.version)
            .unwrap();
        assert!(matches!(
            store.resolve_task_attachment(&task.id, &relative),
            Err(StoreError::NotFound(_))
        ));
    }

    #[test]
    fn oversized_local_state_is_rejected_before_loading() {
        let store = temp_store();
        let project = store.create_project("Лимиты").unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: project.id.clone(),
                description: "Проверить ограничение Markdown".into(),
                urgency: Urgency::Normal,
                source: None,
            })
            .unwrap();
        File::options()
            .write(true)
            .open(store.task_path(&project.id, &task.id))
            .unwrap()
            .set_len(MAX_MARKDOWN_FILE_BYTES + 1)
            .unwrap();
        assert!(matches!(
            store.get_task(&task.id),
            Err(StoreError::InvalidFile { .. })
        ));
        let diagnostics = store.diagnostics();
        assert!(!diagnostics.healthy);
        assert!(!diagnostics.issues.is_empty());

        let inbox_path = store.telegram_inbox_path();
        fs::create_dir_all(inbox_path.parent().unwrap()).unwrap();
        File::create(&inbox_path)
            .unwrap()
            .set_len(MAX_TELEGRAM_INBOX_BYTES + 1)
            .unwrap();
        assert!(matches!(
            store.list_telegram_inbox(None, false),
            Err(StoreError::InvalidFile { .. })
        ));
    }

    #[test]
    fn backup_restores_markdown_and_attachments() {
        let store = temp_store();
        let project = store.create_project("Резервная копия").unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: project.id.clone(),
                description: "# Исходная задача".into(),
                urgency: crate::Urgency::Important,
                source: None,
            })
            .unwrap();
        let attachment = store
            .save_task_attachment(&task.id, "пример.png", b"backup-image")
            .unwrap();
        let now = Utc::now();
        let candidate = TelegramInboxCandidate {
            id: format!("telegram:{}:-100:88", project.id),
            project_id: project.id,
            chat_id: -100,
            chat_title: "Рабочий чат".into(),
            message_id: 88,
            message_ids: vec![88],
            text: "Сообщение во входящих".into(),
            author: "Анна".into(),
            sent_at: now,
            url: None,
            reason: crate::InboxCandidateReason::Manual,
            status: InboxCandidateStatus::Pending,
            media: Vec::new(),
            discovered_at: now,
            processed_at: None,
            task_id: None,
            linked_task: None,
        };
        store
            .upsert_telegram_candidates(vec![candidate.clone()])
            .unwrap();
        let transient_sync_request = store.request_telegram_sync().unwrap();
        let archive = env::temp_dir().join(format!("flood-backup-test-{}.zip", Ulid::new()));
        store.create_backup(&archive).unwrap();
        assert!(
            store
                .acknowledge_telegram_sync_request(&transient_sync_request.id)
                .unwrap()
        );

        let changed = store
            .update_task(
                &task.id,
                TaskPatch {
                    description: Some("# Изменённая задача".into()),
                    ..Default::default()
                },
                &task.version,
            )
            .unwrap();
        assert_eq!(changed.description, "# Изменённая задача");
        store
            .set_telegram_candidate_status(&candidate.id, InboxCandidateStatus::Dismissed)
            .unwrap();

        store.restore_backup(&archive).unwrap();
        assert_eq!(
            store.get_task(&task.id).unwrap().description,
            "# Исходная задача"
        );
        assert_eq!(
            store.read_task_attachment(&task.id, &attachment).unwrap(),
            b"backup-image"
        );
        assert_eq!(store.list_telegram_inbox(None, false).unwrap().len(), 1);
        assert!(store.telegram_sync_request().unwrap().is_none());
        let _ = fs::remove_file(archive);
    }
}
