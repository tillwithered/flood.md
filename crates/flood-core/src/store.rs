use crate::{Chat, CreateTask, Task, TaskPatch, TaskStatus, TaskSummary};
use atomic_write_file::AtomicWriteFile;
use chrono::Utc;
use fs2::FileExt;
use serde::{Deserialize, Serialize, de::DeserializeOwned};
use sha2::{Digest, Sha256};
use std::{
    env,
    fs::{self, File, OpenOptions},
    io::{Read, Write},
    path::{Path, PathBuf},
};
use thiserror::Error;
use ulid::Ulid;
use zip::{ZipArchive, ZipWriter, write::SimpleFileOptions};

const FORMAT_VERSION: u8 = 1;

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
    #[error("ошибка резервной копии: {0}")]
    Backup(String),
}

#[derive(Clone, Debug)]
pub struct Store {
    root: PathBuf,
}

#[derive(Serialize, Deserialize)]
struct ChatDocument {
    format_version: u8,
    id: String,
    title: String,
    created_at: chrono::DateTime<Utc>,
    updated_at: chrono::DateTime<Utc>,
}

#[derive(Serialize, Deserialize)]
struct TaskDocument {
    format_version: u8,
    id: String,
    chat_id: String,
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
        fs::create_dir_all(store.chats_dir())?;
        let lock_path = store.root.join(".flood.lock");
        OpenOptions::new()
            .create(true)
            .truncate(false)
            .read(true)
            .write(true)
            .open(lock_path)?;
        Ok(store)
    }

    pub fn root(&self) -> &Path {
        &self.root
    }

    pub fn list_chats(&self) -> Result<Vec<Chat>, StoreError> {
        let _lock = self.lock_shared()?;
        let mut chats = Vec::new();
        for entry in fs::read_dir(self.chats_dir())? {
            let entry = entry?;
            if entry.file_type()?.is_dir() {
                let path = entry.path().join("chat.md");
                if path.exists() {
                    chats.push(read_chat(&path)?);
                }
            }
        }
        chats.sort_by_key(|chat| chat.title.to_lowercase());
        Ok(chats)
    }

    pub fn get_chat(&self, id: &str) -> Result<Chat, StoreError> {
        validate_id(id)?;
        let _lock = self.lock_shared()?;
        let path = self.chat_path(id);
        if !path.exists() {
            return Err(StoreError::NotFound(id.to_owned()));
        }
        read_chat(&path)
    }

    pub fn create_chat(&self, title: &str) -> Result<Chat, StoreError> {
        let title = clean_required(title, "название чата", 120)?;
        let _lock = self.lock_exclusive()?;
        let id = Ulid::new().to_string();
        let now = Utc::now();
        let chat = Chat {
            id,
            title,
            created_at: now,
            updated_at: now,
            version: String::new(),
        };
        fs::create_dir_all(self.task_dir(&chat.id))?;
        self.write_chat(&chat)?;
        read_chat(&self.chat_path(&chat.id))
    }

    pub fn update_chat(
        &self,
        id: &str,
        title: &str,
        expected_version: &str,
    ) -> Result<Chat, StoreError> {
        validate_id(id)?;
        let title = clean_required(title, "название чата", 120)?;
        let _lock = self.lock_exclusive()?;
        let mut chat = read_chat(&self.chat_path(id)).map_err(|error| map_missing(error, id))?;
        ensure_version(&chat.version, expected_version)?;
        chat.title = title;
        chat.updated_at = Utc::now();
        self.write_chat(&chat)?;
        read_chat(&self.chat_path(id))
    }

    pub fn delete_chat(&self, id: &str, expected_version: &str) -> Result<(), StoreError> {
        validate_id(id)?;
        let _lock = self.lock_exclusive()?;
        let chat = read_chat(&self.chat_path(id)).map_err(|error| map_missing(error, id))?;
        ensure_version(&chat.version, expected_version)?;
        fs::remove_dir_all(self.chats_dir().join(id))?;
        Ok(())
    }

    pub fn list_tasks(
        &self,
        chat_id: Option<&str>,
        include_completed: bool,
    ) -> Result<Vec<TaskSummary>, StoreError> {
        let _lock = self.lock_shared()?;
        let mut tasks = Vec::new();
        let chats = if let Some(id) = chat_id {
            validate_id(id)?;
            vec![self.root.join("chats").join(id)]
        } else {
            fs::read_dir(self.chats_dir())?
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
        for chat in chats {
            let dir = chat.join("tasks");
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
        for entry in fs::read_dir(self.chats_dir())? {
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
        tasks.sort_by(|left, right| right.trashed_at.cmp(&left.trashed_at));
        Ok(tasks.into_iter().map(TaskSummary::from).collect())
    }

    pub fn create_task(&self, input: CreateTask) -> Result<Task, StoreError> {
        validate_id(&input.chat_id)?;
        let description = clean_required(&input.description, "описание задачи", 20_000)?;
        validate_source(&input.source)?;
        let _lock = self.lock_exclusive()?;
        if !self.chat_path(&input.chat_id).exists() {
            return Err(StoreError::NotFound(input.chat_id));
        }
        let now = Utc::now();
        let task = Task {
            id: Ulid::new().to_string(),
            chat_id: input.chat_id,
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
        read_task(&self.task_path(&task.chat_id, &task.id))
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
        read_task(&self.task_path(&task.chat_id, id))
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
        chat_id: &str,
        expected_version: &str,
    ) -> Result<Task, StoreError> {
        validate_id(id)?;
        validate_id(chat_id)?;
        let _lock = self.lock_exclusive()?;
        if !self.chat_path(chat_id).exists() {
            return Err(StoreError::NotFound(chat_id.to_owned()));
        }
        let mut task = self.find_task(id)?;
        ensure_version(&task.version, expected_version)?;
        if task.chat_id == chat_id {
            return Ok(task);
        }
        let old_path = self.task_path(&task.chat_id, id);
        let new_path = self.task_path(chat_id, id);
        let old_attachments = self.attachment_dir(&task.chat_id, id);
        let new_attachments = self.attachment_dir(chat_id, id);
        fs::create_dir_all(self.task_dir(chat_id))?;
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
        let old_chat_id = std::mem::replace(&mut task.chat_id, chat_id.to_owned());
        task.updated_at = Utc::now();
        if let Err(error) = self.write_task(&task) {
            let _ = fs::rename(&new_path, self.task_path(&old_chat_id, id));
            if new_attachments.exists() {
                let _ = fs::rename(&new_attachments, self.attachment_dir(&old_chat_id, id));
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
        fs::remove_file(self.task_path(&task.chat_id, id))?;
        let attachments = self.attachment_dir(&task.chat_id, id);
        if attachments.exists() {
            fs::remove_dir_all(attachments)?;
        }
        Ok(())
    }

    pub fn empty_trash(&self) -> Result<usize, StoreError> {
        let _lock = self.lock_exclusive()?;
        let mut paths = Vec::new();
        for entry in fs::read_dir(self.chats_dir())? {
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
        if bytes.is_empty() || bytes.len() > 25 * 1024 * 1024 {
            return Err(StoreError::Validation(
                "вложение должно быть размером от 1 байта до 25 МБ".into(),
            ));
        }
        let clean_name = clean_file_name(file_name)?;
        let _lock = self.lock_exclusive()?;
        let task = self.find_task(id)?;
        let stored_name = format!("{}-{clean_name}", Ulid::new());
        let path = self.attachment_dir(&task.chat_id, id).join(&stored_name);
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
        let path = self.attachment_dir(&task.chat_id, id).join(file_name);
        if !path.is_file() {
            return Err(StoreError::NotFound(relative_path.to_owned()));
        }
        Ok(path)
    }

    pub fn read_task_attachment(
        &self,
        id: &str,
        relative_path: &str,
    ) -> Result<Vec<u8>, StoreError> {
        let path = self.resolve_task_attachment(id, relative_path)?;
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
        collect_backup_files(&self.chats_dir(), &mut files)?;
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
        let previous_chats = self
            .root
            .join(format!(".chats-before-restore-{}", Ulid::new()));
        let result = (|| {
            fs::create_dir_all(&restore_root)?;
            let mut archive = ZipArchive::new(File::open(source)?)
                .map_err(|error| StoreError::Backup(error.to_string()))?;
            if archive.len() > 20_000 {
                return Err(StoreError::Backup("в архиве слишком много файлов".into()));
            }
            let mut total_size = 0_u64;
            let mut has_chats = false;
            for index in 0..archive.len() {
                let mut entry = archive
                    .by_index(index)
                    .map_err(|error| StoreError::Backup(error.to_string()))?;
                let relative = entry
                    .enclosed_name()
                    .ok_or_else(|| StoreError::Backup("архив содержит небезопасный путь".into()))?
                    .to_path_buf();
                if relative
                    .components()
                    .next()
                    .and_then(|part| part.as_os_str().to_str())
                    != Some("chats")
                {
                    return Err(StoreError::Backup(
                        "архив не является резервной копией flood.md".into(),
                    ));
                }
                has_chats = true;
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
                let output = restore_root.join(relative);
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
            if !has_chats || !restore_root.join("chats").is_dir() {
                return Err(StoreError::Backup(
                    "в архиве отсутствует папка с проектами".into(),
                ));
            }

            let candidate = Store::new(&restore_root)?;
            candidate.list_chats()?;
            candidate.list_tasks(None, true)?;
            candidate.list_trashed_tasks()?;

            let _lock = self.lock_exclusive()?;
            let current_chats = self.chats_dir();
            fs::rename(&current_chats, &previous_chats)?;
            if let Err(error) = fs::rename(restore_root.join("chats"), &current_chats) {
                let _ = fs::rename(&previous_chats, &current_chats);
                return Err(error.into());
            }
            let _ = fs::remove_dir_all(&previous_chats);
            Ok(())
        })();
        let _ = fs::remove_dir_all(&restore_root);
        if result.is_err() && previous_chats.exists() && !self.chats_dir().exists() {
            let _ = fs::rename(&previous_chats, self.chats_dir());
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
        read_task(&self.task_path(&task.chat_id, id))
    }

    fn chats_dir(&self) -> PathBuf {
        self.root.join("chats")
    }
    fn chat_path(&self, id: &str) -> PathBuf {
        self.chats_dir().join(id).join("chat.md")
    }
    fn task_dir(&self, chat_id: &str) -> PathBuf {
        self.chats_dir().join(chat_id).join("tasks")
    }
    fn task_path(&self, chat_id: &str, id: &str) -> PathBuf {
        self.task_dir(chat_id).join(format!("{id}.md"))
    }
    fn attachment_dir(&self, chat_id: &str, id: &str) -> PathBuf {
        self.task_dir(chat_id).join("attachments").join(id)
    }

    fn find_task(&self, id: &str) -> Result<Task, StoreError> {
        for entry in fs::read_dir(self.chats_dir())? {
            let path = entry?.path().join("tasks").join(format!("{id}.md"));
            if path.exists() {
                return read_task(&path);
            }
        }
        Err(StoreError::NotFound(id.to_owned()))
    }

    fn write_chat(&self, chat: &Chat) -> Result<(), StoreError> {
        let doc = ChatDocument {
            format_version: FORMAT_VERSION,
            id: chat.id.clone(),
            title: chat.title.clone(),
            created_at: chat.created_at,
            updated_at: chat.updated_at,
        };
        let body = format!("# {}\n", chat.title);
        atomic_write(&self.chat_path(&chat.id), &encode(&doc, &body)?)
    }

    fn write_task(&self, task: &Task) -> Result<(), StoreError> {
        let doc = TaskDocument {
            format_version: FORMAT_VERSION,
            id: task.id.clone(),
            chat_id: task.chat_id.clone(),
            created_at: task.created_at,
            updated_at: task.updated_at,
            urgency: task.urgency.clone(),
            status: task.status.clone(),
            source: task.source.clone(),
            trashed_at: task.trashed_at,
        };
        atomic_write(
            &self.task_path(&task.chat_id, &task.id),
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

fn encode<T: Serialize>(metadata: &T, body: &str) -> Result<String, StoreError> {
    let yaml = serde_yaml::to_string(metadata)?;
    Ok(format!("---\n{yaml}---\n\n{}\n", body.trim()))
}

fn decode<T: DeserializeOwned>(path: &Path) -> Result<(T, String, String), StoreError> {
    let content = fs::read_to_string(path)?;
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

fn read_chat(path: &Path) -> Result<Chat, StoreError> {
    let (doc, _, version): (ChatDocument, _, _) = decode(path)?;
    if doc.format_version != FORMAT_VERSION {
        return Err(invalid(path, "неподдерживаемая версия формата"));
    }
    validate_id(&doc.id)?;
    Ok(Chat {
        id: doc.id,
        title: doc.title,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        version,
    })
}

fn read_task(path: &Path) -> Result<Task, StoreError> {
    let (doc, description, version): (TaskDocument, _, _) = decode(path)?;
    if doc.format_version != FORMAT_VERSION {
        return Err(invalid(path, "неподдерживаемая версия формата"));
    }
    validate_id(&doc.id)?;
    validate_id(&doc.chat_id)?;
    Ok(Task {
        id: doc.id,
        chat_id: doc.chat_id,
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
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let mut file = AtomicWriteFile::options().open(path)?;
    file.write_all(content.as_bytes())?;
    file.commit()?;
    Ok(())
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
        clean_required(&source.text, "текст исходного сообщения", 50_000)?;
        if source.url.as_ref().is_some_and(|url| url.len() > 2_000) {
            return Err(StoreError::Validation(
                "ссылка исходного сообщения слишком длинная".into(),
            ));
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_store() -> Store {
        let root = env::temp_dir().join(format!("flood-test-{}", Ulid::new()));
        Store::new(root).unwrap()
    }

    #[test]
    fn full_task_flow_and_conflict_detection() {
        let store = temp_store();
        let chat = store.create_chat("Рабочий чат").unwrap();
        let task = store
            .create_task(CreateTask {
                chat_id: chat.id,
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
        let chat = store.create_chat("Флудилка").unwrap();
        let task = store
            .create_task(CreateTask {
                chat_id: chat.id,
                description: "Позвонить заказчику".into(),
                urgency: crate::Urgency::Normal,
                source: None,
            })
            .unwrap();
        let path = store.task_path(&task.chat_id, &task.id);
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
        let chat = store.create_chat("Проект из чата").unwrap();
        let renamed = store
            .update_chat(&chat.id, "Переименованный проект", &chat.version)
            .unwrap();
        assert_eq!(renamed.title, "Переименованный проект");
        let source = crate::MessageSnapshot {
            text: "Проверь сборку к вечеру".into(),
            author: Some("Анна".into()),
            sent_at: Some(Utc::now()),
            url: Some("https://example.com/message/42".into()),
        };
        let task = store
            .create_task(CreateTask {
                chat_id: chat.id,
                description: "# Проверить сборку\n\nПройти основной сценарий".into(),
                urgency: crate::Urgency::Urgent,
                source: Some(source.clone()),
            })
            .unwrap();

        let content = fs::read_to_string(store.task_path(&task.chat_id, &task.id)).unwrap();
        assert!(content.contains("created_at:"));
        assert!(content.contains("updated_at:"));
        assert!(content.contains("chat_id:"));
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
    fn task_can_move_to_trash_restore_and_change_chat() {
        let store = temp_store();
        let first = store.create_chat("Первый чат").unwrap();
        let second = store.create_chat("Второй чат").unwrap();
        let task = store
            .create_task(CreateTask {
                chat_id: first.id.clone(),
                description: "Перенести задачу".into(),
                urgency: crate::Urgency::Normal,
                source: None,
            })
            .unwrap();

        let moved = store
            .move_task(&task.id, &second.id, &task.version)
            .unwrap();
        assert_eq!(moved.chat_id, second.id);
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
        let chat = store.create_chat("Корзина").unwrap();
        let create = |description: &str| {
            store
                .create_task(CreateTask {
                    chat_id: chat.id.clone(),
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
    fn chat_deletion_checks_version_and_removes_its_tasks() {
        let store = temp_store();
        let chat = store.create_chat("На удаление").unwrap();
        let task = store
            .create_task(CreateTask {
                chat_id: chat.id.clone(),
                description: "Задача вместе с чатом".into(),
                urgency: crate::Urgency::Normal,
                source: None,
            })
            .unwrap();

        assert!(matches!(
            store.delete_chat(&chat.id, "stale"),
            Err(StoreError::Conflict)
        ));
        store.delete_chat(&chat.id, &chat.version).unwrap();
        assert!(matches!(
            store.get_chat(&chat.id),
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
        let first = store.create_chat("Первый").unwrap();
        let second = store.create_chat("Второй").unwrap();
        let task = store
            .create_task(CreateTask {
                chat_id: first.id.clone(),
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
    fn backup_restores_markdown_and_attachments() {
        let store = temp_store();
        let chat = store.create_chat("Резервная копия").unwrap();
        let task = store
            .create_task(CreateTask {
                chat_id: chat.id,
                description: "# Исходная задача".into(),
                urgency: crate::Urgency::Important,
                source: None,
            })
            .unwrap();
        let attachment = store
            .save_task_attachment(&task.id, "пример.png", b"backup-image")
            .unwrap();
        let archive = env::temp_dir().join(format!("flood-backup-test-{}.zip", Ulid::new()));
        store.create_backup(&archive).unwrap();

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

        store.restore_backup(&archive).unwrap();
        assert_eq!(
            store.get_task(&task.id).unwrap().description,
            "# Исходная задача"
        );
        assert_eq!(
            store.read_task_attachment(&task.id, &attachment).unwrap(),
            b"backup-image"
        );
        let _ = fs::remove_file(archive);
    }
}
