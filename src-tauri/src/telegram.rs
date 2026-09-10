use base64::{Engine as _, engine::general_purpose::STANDARD};
use chrono::{DateTime, Utc};
use flood_core::{
    InboxCandidateReason, InboxCandidateStatus, Project, SourceMedia, SourceMediaKind,
    TelegramInboxCandidate, TelegramInboxMode, TelegramProjectLink,
};
use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::{Path, PathBuf},
    sync::{Arc, Mutex},
};
use tauri::{AppHandle, Emitter};
use tdlib::{enums, functions};

include!(concat!(env!("OUT_DIR"), "/telegram_credentials.rs"));

#[derive(Clone, Debug)]
struct TelegramConfig {
    api_id: i32,
    api_hash: String,
    database_key: String,
}

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
struct StoredTelegramConfig {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    api_id: Option<i32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    api_hash: Option<String>,
    database_key: String,
}

#[derive(Clone, Debug, Default, Serialize)]
pub struct TelegramStatus {
    pub step: String,
    pub configured: bool,
    pub managed_credentials: bool,
    pub account_name: Option<String>,
    pub account_username: Option<String>,
    pub qr_link: Option<String>,
    pub password_hint: Option<String>,
    pub error: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
pub struct TelegramChat {
    pub id: i64,
    pub title: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct TelegramMessage {
    pub id: i64,
    pub chat_id: i64,
    pub text: String,
    pub author: String,
    pub sent_at: i32,
    pub url: Option<String>,
    pub chat_title: String,
    pub media: Vec<SourceMedia>,
    pub is_mention: bool,
    pub is_reply_to_me: bool,
}

struct TelegramInner {
    app: AppHandle,
    root: PathBuf,
    config: Mutex<Option<TelegramConfig>>,
    client_id: Mutex<Option<i32>>,
    status: Mutex<TelegramStatus>,
    parameters_sent: Mutex<bool>,
    receiver_started: Mutex<bool>,
}

#[derive(Clone)]
pub struct TelegramManager(Arc<TelegramInner>);

impl TelegramManager {
    pub fn new(app: AppHandle, root: PathBuf) -> Self {
        let stored = read_config(&root).ok();
        let bundled = bundled_credentials();
        let credentials = bundled.clone().or_else(|| {
            stored
                .as_ref()
                .and_then(|value| Some((value.api_id?, value.api_hash.clone()?)))
        });
        let database_key = stored
            .as_ref()
            .and_then(|value| normalize_database_key(&value.database_key))
            .unwrap_or_else(generate_database_key);
        let config = credentials
            .clone()
            .map(|(api_id, api_hash)| TelegramConfig {
                api_id,
                api_hash,
                database_key: database_key.clone(),
            });
        if bundled.is_some() {
            let _ = write_config(
                &root,
                &StoredTelegramConfig {
                    api_id: None,
                    api_hash: None,
                    database_key,
                },
            );
        } else if let Some((api_id, api_hash)) = credentials {
            let _ = write_config(
                &root,
                &StoredTelegramConfig {
                    api_id: Some(api_id),
                    api_hash: Some(api_hash),
                    database_key,
                },
            );
        }
        let status = TelegramStatus {
            step: if config.is_some() {
                "starting"
            } else {
                "unconfigured"
            }
            .into(),
            configured: config.is_some(),
            managed_credentials: bundled.is_some(),
            ..TelegramStatus::default()
        };
        let manager = Self(Arc::new(TelegramInner {
            app,
            root,
            config: Mutex::new(config),
            client_id: Mutex::new(None),
            status: Mutex::new(status),
            parameters_sent: Mutex::new(false),
            receiver_started: Mutex::new(false),
        }));
        if manager.config().is_some() {
            manager.start();
        }
        manager
    }

    pub fn status(&self) -> TelegramStatus {
        self.0.status.lock().expect("telegram status lock").clone()
    }

    pub fn configure(&self, api_id: i32, api_hash: String) -> Result<TelegramStatus, String> {
        if BUNDLED_TG_API_ID.is_some() {
            return Err("В официальной сборке Telegram API уже настроен".into());
        }
        let api_hash = api_hash.trim().to_owned();
        if api_id <= 0 || !valid_api_hash(&api_hash) {
            return Err("Проверьте API ID и API Hash".into());
        }
        let database_key = self
            .config()
            .map(|value| value.database_key)
            .or_else(|| {
                read_config(&self.0.root)
                    .ok()
                    .map(|value| value.database_key)
                    .filter(|value| valid_database_key(value))
            })
            .unwrap_or_else(generate_database_key);
        let config = TelegramConfig {
            api_id,
            api_hash,
            database_key,
        };
        write_config(
            &self.0.root,
            &StoredTelegramConfig {
                api_id: Some(config.api_id),
                api_hash: Some(config.api_hash.clone()),
                database_key: config.database_key.clone(),
            },
        )?;
        *self.0.config.lock().expect("telegram config lock") = Some(config);
        self.set_status(TelegramStatus {
            step: "starting".into(),
            configured: true,
            managed_credentials: false,
            ..TelegramStatus::default()
        });
        self.start();
        Ok(self.status())
    }

    pub async fn request_qr(&self) -> Result<(), String> {
        functions::request_qr_code_authentication(Vec::new(), self.client_id()?)
            .await
            .map_err(td_error)
    }

    pub async fn submit_phone(&self, phone: String) -> Result<(), String> {
        let phone = phone.trim().to_owned();
        if phone.is_empty() {
            return Err("Введите номер телефона".into());
        }
        functions::set_authentication_phone_number(phone, None, self.client_id()?)
            .await
            .map_err(td_error)
    }

    pub async fn submit_code(&self, code: String) -> Result<(), String> {
        functions::check_authentication_code(code.trim().to_owned(), self.client_id()?)
            .await
            .map_err(td_error)
    }

    pub async fn submit_password(&self, password: String) -> Result<(), String> {
        functions::check_authentication_password(password, self.client_id()?)
            .await
            .map_err(td_error)
    }

    pub async fn chats(&self) -> Result<Vec<TelegramChat>, String> {
        if self.status().step != "ready" {
            return Err("Сначала подключите Telegram".into());
        }
        let client_id = self.client_id()?;
        let _ = functions::load_chats(None, 100, client_id).await;
        let enums::Chats::Chats(chats) = functions::get_chats(None, 100, client_id)
            .await
            .map_err(td_error)?;
        let mut result = Vec::with_capacity(chats.chat_ids.len());
        for id in chats.chat_ids {
            if let Ok(enums::Chat::Chat(chat)) = functions::get_chat(id, client_id).await {
                result.push(TelegramChat {
                    id: chat.id,
                    title: chat.title,
                });
            }
        }
        Ok(result)
    }

    pub async fn search_chats(
        &self,
        query: String,
        limit: i32,
    ) -> Result<Vec<TelegramChat>, String> {
        if self.status().step != "ready" {
            return Err("Сначала подключите Telegram".into());
        }
        let query = query.trim().to_owned();
        if query.is_empty() {
            return self.chats().await;
        }
        let client_id = self.client_id()?;
        let limit = limit.clamp(1, 100);
        let mut ids = Vec::new();
        let normalized_query = query.to_lowercase();
        if let Ok(enums::Chats::Chats(chats)) =
            functions::search_chats(query.clone(), limit, client_id).await
        {
            ids.extend(chats.chat_ids);
        }
        if let Ok(enums::Chats::Chats(chats)) =
            functions::search_chats_on_server(query, limit, client_id).await
        {
            ids.extend(chats.chat_ids);
        }
        let mut seen = std::collections::HashSet::new();
        let mut result = Vec::new();
        for id in ids {
            if !seen.insert(id) {
                continue;
            }
            if let Ok(enums::Chat::Chat(chat)) = functions::get_chat(id, client_id).await
                && chat.title.to_lowercase().contains(&normalized_query)
            {
                result.push(TelegramChat {
                    id: chat.id,
                    title: chat.title,
                });
            }
        }
        Ok(result)
    }

    pub async fn messages(&self, chat_id: i64, limit: i32) -> Result<Vec<TelegramMessage>, String> {
        if self.status().step != "ready" {
            return Err("Сначала подключите Telegram".into());
        }
        let client_id = self.client_id()?;
        let limit = limit.clamp(1, 50);
        let enums::Messages::Messages(history) =
            functions::get_chat_history(chat_id, 0, 0, limit, false, client_id)
                .await
                .map_err(td_error)?;
        let chat_title = match functions::get_chat(chat_id, client_id).await {
            Ok(enums::Chat::Chat(chat)) => chat.title,
            Err(_) => "Telegram".into(),
        };
        let mut result = Vec::new();
        for message in history.messages.into_iter().flatten() {
            let text = message_text(&message.content);
            let media = message_media(&message.content, message.id);
            if text.trim().is_empty() && media.is_empty() {
                continue;
            }
            let author = self.sender_name(&message.sender_id, client_id).await;
            let is_reply_to_me = reply_is_to_me(&message, client_id).await;
            let url =
                match functions::get_message_link(chat_id, message.id, 0, false, false, client_id)
                    .await
                {
                    Ok(enums::MessageLink::MessageLink(link)) => Some(link.link),
                    Err(_) => None,
                };
            result.push(TelegramMessage {
                id: message.id,
                chat_id,
                text,
                author,
                sent_at: message.date,
                url,
                chat_title: chat_title.clone(),
                media,
                is_mention: message.contains_unread_mention,
                is_reply_to_me,
            });
        }
        Ok(result)
    }

    pub async fn manual_candidate(
        &self,
        project_id: &str,
        link: &TelegramProjectLink,
        message_id: i64,
    ) -> Result<TelegramInboxCandidate, String> {
        let client_id = self.client_id()?;
        let enums::Message::Message(message) =
            functions::get_message(link.chat_id, message_id, client_id)
                .await
                .map_err(td_error)?;
        self.candidate_from_message(project_id, link, message, InboxCandidateReason::Manual)
            .await
    }

    pub async fn refresh_candidates(
        &self,
        project: &Project,
        limit_per_chat: i32,
    ) -> Result<Vec<TelegramInboxCandidate>, String> {
        let client_id = self.client_id()?;
        let limit = limit_per_chat.clamp(1, 100);
        let mut candidates = Vec::new();
        for link in &project.telegram_chats {
            if link.inbox_mode == TelegramInboxMode::Manual {
                continue;
            }
            let enums::Messages::Messages(history) =
                functions::get_chat_history(link.chat_id, 0, 0, limit, false, client_id)
                    .await
                    .map_err(td_error)?;
            for message in history.messages.into_iter().flatten() {
                if message.is_outgoing {
                    continue;
                }
                let text = message_text(&message.content);
                let media = message_media(&message.content, message.id);
                if text.trim().is_empty() && media.is_empty() {
                    continue;
                }
                let username_mention = self
                    .status()
                    .account_username
                    .as_ref()
                    .is_some_and(|username| contains_username_mention(&text, username));
                let reason = if message.contains_unread_mention || username_mention {
                    Some(InboxCandidateReason::Mention)
                } else if reply_is_to_me(&message, client_id).await {
                    Some(InboxCandidateReason::Reply)
                } else if link.inbox_mode == TelegramInboxMode::All {
                    Some(InboxCandidateReason::LinkedChat)
                } else {
                    None
                };
                if let Some(reason) = reason {
                    candidates.push(
                        self.candidate_from_message_with_content(
                            &project.id,
                            link,
                            message,
                            reason,
                            text,
                            media,
                        )
                        .await?,
                    );
                }
            }
        }
        Ok(candidates)
    }

    pub async fn download_file(&self, file_id: i32) -> Result<PathBuf, String> {
        let enums::File::File(file) =
            functions::download_file(file_id, 20, 0, 0, true, self.client_id()?)
                .await
                .map_err(td_error)?;
        if !file.local.is_downloading_completed || file.local.path.is_empty() {
            return Err("Telegram не завершил загрузку файла".into());
        }
        Ok(PathBuf::from(file.local.path))
    }

    pub async fn release_downloaded_file(&self, file_id: i32) {
        if let Ok(client_id) = self.client_id() {
            let _ = functions::delete_file(file_id, client_id).await;
        }
    }

    async fn candidate_from_message(
        &self,
        project_id: &str,
        link: &TelegramProjectLink,
        message: tdlib::types::Message,
        reason: InboxCandidateReason,
    ) -> Result<TelegramInboxCandidate, String> {
        let text = message_text(&message.content);
        let media = message_media(&message.content, message.id);
        if text.trim().is_empty() && media.is_empty() {
            return Err("В сообщении нет текста или поддерживаемого медиа".into());
        }
        self.candidate_from_message_with_content(project_id, link, message, reason, text, media)
            .await
    }

    async fn candidate_from_message_with_content(
        &self,
        project_id: &str,
        link: &TelegramProjectLink,
        message: tdlib::types::Message,
        reason: InboxCandidateReason,
        text: String,
        media: Vec<flood_core::SourceMedia>,
    ) -> Result<TelegramInboxCandidate, String> {
        let client_id = self.client_id()?;
        let author = self.sender_name(&message.sender_id, client_id).await;
        let url =
            match functions::get_message_link(link.chat_id, message.id, 0, false, false, client_id)
                .await
            {
                Ok(enums::MessageLink::MessageLink(link)) => Some(link.link),
                Err(_) => None,
            };
        let sent_at = DateTime::from_timestamp(message.date.into(), 0)
            .ok_or_else(|| "Telegram вернул некорректную дату сообщения".to_string())?;
        Ok(TelegramInboxCandidate {
            id: format!("telegram:{project_id}:{}:{}", link.chat_id, message.id),
            project_id: project_id.to_owned(),
            chat_id: link.chat_id,
            chat_title: link.title.clone(),
            message_id: message.id,
            text,
            author,
            sent_at,
            url,
            reason,
            status: InboxCandidateStatus::Pending,
            media,
            discovered_at: Utc::now(),
            processed_at: None,
            task_id: None,
        })
    }

    pub async fn disconnect(&self) -> Result<(), String> {
        let client_id = self.client_id()?;
        functions::log_out(client_id).await.map_err(td_error)?;
        Ok(())
    }

    fn config(&self) -> Option<TelegramConfig> {
        self.0.config.lock().expect("telegram config lock").clone()
    }

    async fn sender_name(&self, sender: &enums::MessageSender, client_id: i32) -> String {
        match sender {
            enums::MessageSender::User(sender) => {
                match functions::get_user(sender.user_id, client_id).await {
                    Ok(enums::User::User(user)) => {
                        format!("{} {}", user.first_name, user.last_name)
                            .trim()
                            .to_owned()
                    }
                    Err(_) => "Telegram".into(),
                }
            }
            enums::MessageSender::Chat(sender) => {
                match functions::get_chat(sender.chat_id, client_id).await {
                    Ok(enums::Chat::Chat(chat)) => chat.title,
                    Err(_) => "Telegram".into(),
                }
            }
        }
    }

    fn client_id(&self) -> Result<i32, String> {
        self.0
            .client_id
            .lock()
            .expect("telegram client lock")
            .ok_or_else(|| "Telegram ещё запускается".into())
    }

    fn start(&self) {
        if self
            .0
            .client_id
            .lock()
            .expect("telegram client lock")
            .is_some()
        {
            return;
        }
        let client_id = tdlib::create_client();
        *self.0.client_id.lock().expect("telegram client lock") = Some(client_id);

        let mut receiver_started = self
            .0
            .receiver_started
            .lock()
            .expect("telegram receiver lock");
        if !*receiver_started {
            *receiver_started = true;
            let receiver = self.clone();
            std::thread::Builder::new()
                .name("flood-tdlib".into())
                .spawn(move || {
                    loop {
                        if let Some((update, update_client_id)) = tdlib::receive()
                            && receiver.client_id().ok() == Some(update_client_id)
                        {
                            receiver.handle_update(update);
                        }
                    }
                })
                .expect("failed to start TDLib receiver");
        }
        drop(receiver_started);

        let manager = self.clone();
        tauri::async_runtime::spawn(async move {
            let _ = functions::set_log_verbosity_level(1, client_id).await;
            if let Ok(state) = functions::get_authorization_state(client_id).await {
                manager.handle_authorization_state(state);
            }
        });
    }

    fn handle_update(&self, update: enums::Update) {
        let enums::Update::AuthorizationState(update) = update else {
            return;
        };
        self.handle_authorization_state(update.authorization_state);
    }

    fn handle_authorization_state(&self, authorization_state: enums::AuthorizationState) {
        match authorization_state {
            enums::AuthorizationState::WaitTdlibParameters => {
                let mut sent = self.0.parameters_sent.lock().expect("telegram parameters lock");
                if *sent { return; }
                *sent = true;
                drop(sent);
                let Some(config) = self.config() else { return };
                let manager = self.clone();
                let database_dir = self.0.root.join("database").to_string_lossy().into_owned();
                let files_dir = self.0.root.join("files").to_string_lossy().into_owned();
                let client_id = match self.client_id() { Ok(value) => value, Err(_) => return };
                tauri::async_runtime::spawn(async move {
                    if let Err(error) = functions::set_tdlib_parameters(
                        false,
                        database_dir,
                        files_dir,
                        config.database_key,
                        true,
                        true,
                        true,
                        false,
                        config.api_id,
                        config.api_hash,
                        "ru".into(),
                        "Desktop".into(),
                        std::env::consts::OS.into(),
                        env!("CARGO_PKG_VERSION").into(),
                        client_id,
                    ).await {
                        manager.set_error(td_error(error));
                    }
                });
            }
            enums::AuthorizationState::WaitPhoneNumber => self.set_step("phone"),
            enums::AuthorizationState::WaitCode(_) => self.set_step("code"),
            enums::AuthorizationState::WaitOtherDeviceConfirmation(value) => {
                let mut status = self.status();
                status.step = "qr".into();
                status.qr_link = Some(value.link);
                status.error = None;
                self.set_status(status);
            }
            enums::AuthorizationState::WaitPassword(value) => {
                let mut status = self.status();
                status.step = "password".into();
                status.password_hint = Some(value.password_hint);
                status.error = None;
                self.set_status(status);
            }
            enums::AuthorizationState::Ready => {
                self.set_step("ready");
                let manager = self.clone();
                let client_id = match self.client_id() { Ok(value) => value, Err(_) => return };
                tauri::async_runtime::spawn(async move {
                    if let Ok(enums::User::User(user)) = functions::get_me(client_id).await {
                        let mut status = manager.status();
                        status.account_name = Some(format!("{} {}", user.first_name, user.last_name).trim().to_owned());
                        status.account_username = user
                            .usernames
                            .and_then(|usernames| usernames.active_usernames.into_iter().next());
                        manager.set_status(status);
                    }
                });
            }
            enums::AuthorizationState::LoggingOut | enums::AuthorizationState::Closing => self.set_step("disconnecting"),
            enums::AuthorizationState::Closed => {
                *self.0.client_id.lock().expect("telegram client lock") = None;
                *self.0.parameters_sent.lock().expect("telegram parameters lock") = false;
                if self.config().is_some() {
                    self.set_step("starting");
                    self.start();
                } else {
                    self.set_status(TelegramStatus { step: "unconfigured".into(), configured: false, ..TelegramStatus::default() });
                }
            }
            enums::AuthorizationState::WaitRegistration(_) => self.set_error("Регистрацию нового аккаунта завершите в официальном приложении Telegram".into()),
            enums::AuthorizationState::WaitEmailAddress(_)
            | enums::AuthorizationState::WaitEmailCode(_)
            | enums::AuthorizationState::WaitPremiumPurchase(_) => self.set_error("Telegram запросил дополнительное подтверждение. Завершите вход в официальном приложении и повторите попытку".into()),
        }
    }

    fn set_step(&self, step: &str) {
        let mut status = self.status();
        status.step = step.into();
        status.error = None;
        status.qr_link = None;
        self.set_status(status);
    }

    fn set_error(&self, error: String) {
        let mut status = self.status();
        status.error = Some(error);
        self.set_status(status);
    }

    fn set_status(&self, status: TelegramStatus) {
        *self.0.status.lock().expect("telegram status lock") = status.clone();
        let _ = self.0.app.emit("telegram-status", status);
    }
}

fn config_path(root: &Path) -> PathBuf {
    root.join("config.json")
}

fn generate_database_key() -> String {
    let first = ulid::Ulid::new().to_bytes();
    let second = ulid::Ulid::new().to_bytes();
    let mut bytes = [0_u8; 32];
    bytes[..16].copy_from_slice(&first);
    bytes[16..].copy_from_slice(&second);
    STANDARD.encode(bytes)
}

fn valid_database_key(value: &str) -> bool {
    STANDARD.decode(value).is_ok_and(|bytes| !bytes.is_empty())
}

fn normalize_database_key(value: &str) -> Option<String> {
    if value.is_empty() {
        None
    } else if valid_database_key(value) {
        Some(value.to_owned())
    } else {
        Some(STANDARD.encode(value.as_bytes()))
    }
}

fn valid_api_hash(value: &str) -> bool {
    value.len() == 32 && value.bytes().all(|byte| byte.is_ascii_hexdigit())
}

fn read_config(root: &Path) -> Result<StoredTelegramConfig, String> {
    let bytes = fs::read(config_path(root)).map_err(|error| error.to_string())?;
    serde_json::from_slice(&bytes).map_err(|error| error.to_string())
}

fn write_config(root: &Path, config: &StoredTelegramConfig) -> Result<(), String> {
    fs::create_dir_all(root).map_err(|error| error.to_string())?;
    let path = config_path(root);
    let temporary = root.join("config.json.tmp");
    let bytes = serde_json::to_vec(config).map_err(|error| error.to_string())?;
    fs::write(&temporary, bytes).map_err(|error| error.to_string())?;
    if path.exists() {
        fs::remove_file(&path).map_err(|error| error.to_string())?;
    }
    fs::rename(temporary, path).map_err(|error| error.to_string())
}

fn td_error(error: tdlib::types::Error) -> String {
    error.message
}

fn message_text(content: &enums::MessageContent) -> String {
    match content {
        enums::MessageContent::MessageText(message) => message.text.text.clone(),
        enums::MessageContent::MessageAnimation(message) => message.caption.text.clone(),
        enums::MessageContent::MessageAudio(message) => message.caption.text.clone(),
        enums::MessageContent::MessageDocument(message) => message.caption.text.clone(),
        enums::MessageContent::MessagePaidMedia(message) => message.caption.text.clone(),
        enums::MessageContent::MessagePhoto(message) => message.caption.text.clone(),
        enums::MessageContent::MessageVideo(message) => message.caption.text.clone(),
        enums::MessageContent::MessageVoiceNote(message) => message.caption.text.clone(),
        _ => String::new(),
    }
}

fn contains_username_mention(text: &str, username: &str) -> bool {
    let needle = format!("@{}", username.trim_start_matches('@')).to_lowercase();
    text.to_lowercase().split_whitespace().any(|word| {
        word.trim_matches(|character: char| !character.is_alphanumeric() && character != '@')
            == needle
    })
}

async fn reply_is_to_me(message: &tdlib::types::Message, client_id: i32) -> bool {
    let Some(enums::MessageReplyTo::Message(reply)) = message.reply_to.as_ref() else {
        return false;
    };
    let chat_id = if reply.chat_id == 0 {
        message.chat_id
    } else {
        reply.chat_id
    };
    matches!(
        functions::get_message(chat_id, reply.message_id, client_id).await,
        Ok(enums::Message::Message(original)) if original.is_outgoing
    )
}

fn message_media(content: &enums::MessageContent, message_id: i64) -> Vec<SourceMedia> {
    let media = match content {
        enums::MessageContent::MessageAnimation(message) => Some(media_item(
            SourceMediaKind::Animation,
            &message.animation.animation,
            &message.animation.file_name,
            &message.animation.mime_type,
            format!("animation-{message_id}.mp4"),
        )),
        enums::MessageContent::MessageAudio(message) => Some(media_item(
            SourceMediaKind::Audio,
            &message.audio.audio,
            &message.audio.file_name,
            &message.audio.mime_type,
            format!("audio-{message_id}.mp3"),
        )),
        enums::MessageContent::MessageDocument(message) => Some(media_item(
            SourceMediaKind::Document,
            &message.document.document,
            &message.document.file_name,
            &message.document.mime_type,
            format!("document-{message_id}"),
        )),
        enums::MessageContent::MessagePhoto(message) => message
            .photo
            .sizes
            .iter()
            .max_by_key(|size| i64::from(size.width) * i64::from(size.height))
            .map(|size| {
                media_item(
                    SourceMediaKind::Photo,
                    &size.photo,
                    "",
                    "image/jpeg",
                    format!("photo-{message_id}.jpg"),
                )
            }),
        enums::MessageContent::MessageVideo(message) => Some(media_item(
            SourceMediaKind::Video,
            &message.video.video,
            &message.video.file_name,
            &message.video.mime_type,
            format!("video-{message_id}.mp4"),
        )),
        enums::MessageContent::MessageVoiceNote(message) => Some(media_item(
            SourceMediaKind::Voice,
            &message.voice_note.voice,
            "",
            &message.voice_note.mime_type,
            format!("voice-{message_id}.ogg"),
        )),
        _ => None,
    };
    media.into_iter().collect()
}

fn media_item(
    kind: SourceMediaKind,
    file: &tdlib::types::File,
    file_name: &str,
    mime_type: &str,
    fallback_name: String,
) -> SourceMedia {
    SourceMedia {
        kind,
        file_name: if file_name.trim().is_empty() {
            fallback_name
        } else {
            file_name.to_owned()
        },
        provider_file_id: Some(file.id),
        mime_type: (!mime_type.trim().is_empty()).then(|| mime_type.to_owned()),
        size: (file.size.max(file.expected_size) > 0)
            .then_some(file.size.max(file.expected_size) as u64),
        relative_path: None,
    }
}

fn bundled_credentials() -> Option<(i32, String)> {
    let api_id = BUNDLED_TG_API_ID?;
    let mut state = BUNDLED_TG_HASH_SEED.max(1);
    let decoded = BUNDLED_TG_HASH
        .iter()
        .map(|byte| byte ^ next_mask(&mut state))
        .collect::<Vec<_>>();
    String::from_utf8(decoded)
        .ok()
        .map(|api_hash| (api_id, api_hash))
}

fn next_mask(state: &mut u64) -> u8 {
    *state ^= *state << 13;
    *state ^= *state >> 7;
    *state ^= *state << 17;
    (*state >> 24) as u8
}

#[cfg(test)]
mod tests {
    use super::{
        contains_username_mention, generate_database_key, message_media, normalize_database_key,
        valid_api_hash, valid_database_key,
    };
    use base64::{Engine as _, engine::general_purpose::STANDARD};

    #[test]
    fn generated_database_key_is_valid_32_byte_base64() {
        let key = generate_database_key();
        assert!(valid_database_key(&key));
        assert_eq!(STANDARD.decode(key).unwrap().len(), 32);
    }

    #[test]
    fn legacy_ulid_database_key_preserves_its_original_bytes() {
        let legacy = ulid::Ulid::new().to_string();
        let migrated = normalize_database_key(&legacy).unwrap();
        assert!(valid_database_key(&migrated));
        assert_eq!(STANDARD.decode(migrated).unwrap(), legacy.as_bytes());
    }

    #[test]
    fn api_hash_requires_32_hexadecimal_characters() {
        assert!(valid_api_hash("0123456789abcdef0123456789abcdef"));
        assert!(!valid_api_hash("0123456789abcdef"));
        assert!(!valid_api_hash("0123456789abcdef0123456789abcdeg"));
    }

    #[test]
    fn username_mentions_are_detected_after_the_chat_was_read() {
        assert!(contains_username_mention(
            "И это для @TillWithered, проверь",
            "tillwithered"
        ));
        assert!(!contains_username_mention(
            "@another проверь",
            "tillwithered"
        ));
    }

    #[test]
    fn photo_metadata_uses_largest_available_variant() {
        let small = tdlib::types::PhotoSize {
            width: 100,
            height: 100,
            photo: tdlib::types::File {
                id: 1,
                size: 100,
                ..Default::default()
            },
            ..Default::default()
        };
        let large = tdlib::types::PhotoSize {
            width: 1200,
            height: 800,
            photo: tdlib::types::File {
                id: 2,
                size: 2048,
                ..Default::default()
            },
            ..Default::default()
        };
        let content = tdlib::enums::MessageContent::MessagePhoto(tdlib::types::MessagePhoto {
            photo: tdlib::types::Photo {
                sizes: vec![small, large],
                ..Default::default()
            },
            caption: Default::default(),
            show_caption_above_media: false,
            has_spoiler: false,
            is_secret: false,
        });
        let media = message_media(&content, 77);
        assert_eq!(media.len(), 1);
        assert_eq!(media[0].provider_file_id, Some(2));
        assert_eq!(media[0].file_name, "photo-77.jpg");
        assert_eq!(media[0].size, Some(2048));
    }
}
