use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::{Path, PathBuf},
    sync::{Arc, Mutex},
};
use tauri::{AppHandle, Emitter};
use tdlib::{enums, functions};

#[derive(Clone, Debug, Deserialize, Serialize)]
struct TelegramConfig {
    api_id: i32,
    api_hash: String,
    database_key: String,
}

#[derive(Clone, Debug, Default, Serialize)]
pub struct TelegramStatus {
    pub step: String,
    pub configured: bool,
    pub account_name: Option<String>,
    pub qr_link: Option<String>,
    pub password_hint: Option<String>,
    pub error: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
pub struct TelegramChat {
    pub id: i64,
    pub title: String,
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
        let config = read_config(&root).ok();
        let status = TelegramStatus {
            step: if config.is_some() {
                "starting"
            } else {
                "unconfigured"
            }
            .into(),
            configured: config.is_some(),
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
        let api_hash = api_hash.trim().to_owned();
        if api_id <= 0 || api_hash.len() < 16 {
            return Err("Проверьте API ID и API Hash".into());
        }
        let database_key = self
            .config()
            .map(|value| value.database_key)
            .unwrap_or_else(|| ulid::Ulid::new().to_string());
        let config = TelegramConfig {
            api_id,
            api_hash,
            database_key,
        };
        write_config(&self.0.root, &config)?;
        *self.0.config.lock().expect("telegram config lock") = Some(config);
        self.set_status(TelegramStatus {
            step: "starting".into(),
            configured: true,
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

    pub async fn disconnect(&self) -> Result<(), String> {
        let client_id = self.client_id()?;
        functions::log_out(client_id).await.map_err(td_error)?;
        let _ = fs::remove_file(config_path(&self.0.root));
        *self.0.config.lock().expect("telegram config lock") = None;
        self.set_status(TelegramStatus {
            step: "unconfigured".into(),
            configured: false,
            ..TelegramStatus::default()
        });
        Ok(())
    }

    fn config(&self) -> Option<TelegramConfig> {
        self.0.config.lock().expect("telegram config lock").clone()
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

fn read_config(root: &Path) -> Result<TelegramConfig, String> {
    let bytes = fs::read(config_path(root)).map_err(|error| error.to_string())?;
    serde_json::from_slice(&bytes).map_err(|error| error.to_string())
}

fn write_config(root: &Path, config: &TelegramConfig) -> Result<(), String> {
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
