//! Read-only App Server discovery. Execution remains owned by Codex via `codex queue`.
use serde::Serialize;
use serde_json::{json, Value};
use std::{
    io::{BufRead, BufReader, Write},
    process::{Child, ChildStdin, Stdio},
    sync::{mpsc, Mutex},
    thread,
    time::{Duration, Instant},
};
use tauri::AppHandle;

static LOGIN: Mutex<Option<(Child, Instant)>> = Mutex::new(None);

fn executable_config() -> std::path::PathBuf {
    super::default_data_dir().join("integrations").join("codex-executable.json")
}

pub(super) fn manual_executable() -> Option<std::path::PathBuf> {
    serde_json::from_slice::<Option<std::path::PathBuf>>(&std::fs::read(executable_config()).ok()?).ok().flatten()
}

#[tauri::command]
pub async fn set_codex_executable(app: AppHandle, path: Option<String>) -> Result<ConnectionStatus, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let selected = if let Some(value) = path {
            let candidate = std::path::PathBuf::from(value);
            if !candidate.is_absolute() || !candidate.is_file() || candidate.extension().and_then(|v| v.to_str()).is_none_or(|v| !v.eq_ignore_ascii_case("exe")) {
                return Err("Выберите исполняемый файл Codex (.exe).".to_string());
            }
            let candidate = candidate.canonicalize().map_err(|_| "Не удалось открыть выбранный файл.".to_string())?;
            let detected = super::inspect_local_agent_command(super::LocalAgentProvider::Codex, std::process::Command::new(&candidate));
            if !detected.available || !detected.version.as_deref().is_some_and(|version| version.to_ascii_lowercase().contains("codex")) {
                return Err("Выбранный файл не отвечает как Codex CLI. Выберите codex.exe.".to_string());
            }
            Some(candidate)
        } else { None };
        let config = executable_config();
        std::fs::create_dir_all(config.parent().unwrap()).map_err(|_| "Не удалось сохранить путь Codex.".to_string())?;
        let mut file = atomic_write_file::AtomicWriteFile::open(&config).map_err(|_| "Не удалось сохранить путь Codex.".to_string())?;
        file.write_all(&serde_json::to_vec(&selected).map_err(|e| e.to_string())?).map_err(|_| "Не удалось сохранить путь Codex.".to_string())?;
        file.commit().map_err(|_| "Не удалось сохранить путь Codex.".to_string())?;
        Ok(status(&app))
    }).await.map_err(|_| "Не удалось изменить путь Codex.".to_string())?
}

struct Client {
    child: Child,
    input: ChildStdin,
    messages: mpsc::Receiver<Value>,
    id: u64,
}
impl Drop for Client {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}
impl Client {
    fn open() -> Result<Self, String> {
        let mut command = super::local_agent_command(super::LocalAgentProvider::Codex);
        super::hide_background_console(&mut command);
        let mut child = command
            .arg("app-server")
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|_| "Codex не найден. Установите его и повторите подключение.".to_string())?;
        let input = child
            .stdin
            .take()
            .ok_or("Не удалось подключиться к Codex.")?;
        let output = child
            .stdout
            .take()
            .ok_or("Не удалось прочитать ответ Codex.")?;
        let (sender, messages) = mpsc::sync_channel(32);
        thread::spawn(move || {
            for line in BufReader::new(output).lines() {
                let Ok(line) = line else { break };
                if line.len() > 2_000_000 {
                    break;
                }
                if let Ok(value) = serde_json::from_str(&line) {
                    if sender.send(value).is_err() {
                        break;
                    }
                }
            }
        });
        let mut client = Self {
            child,
            input,
            messages,
            id: 0,
        };
        client.request(
            "initialize",
            json!({"clientInfo":{"name":"flood_md","version":env!("CARGO_PKG_VERSION")}}),
        )?;
        writeln!(client.input, "{}", json!({"method":"initialized"}))
            .map_err(|_| "Codex отключился.")?;
        client.input.flush().map_err(|_| "Codex отключился.")?;
        Ok(client)
    }
    fn request(&mut self, method: &str, params: Value) -> Result<Value, String> {
        self.id += 1;
        writeln!(
            self.input,
            "{}",
            json!({"id":self.id,"method":method,"params":params})
        )
        .map_err(|_| "Codex отключился.")?;
        self.input.flush().map_err(|_| "Codex отключился.")?;
        let deadline = Instant::now() + Duration::from_secs(15);
        loop {
            let remaining = deadline
                .checked_duration_since(Instant::now())
                .ok_or("Codex не ответил. Повторите проверку.")?;
            let response = self
                .messages
                .recv_timeout(remaining)
                .map_err(|_| "Codex не ответил. Повторите проверку.")?;
            if response.get("id").and_then(Value::as_u64) == Some(self.id) {
                if response.get("error").is_some() {
                    return Err(
                        "Codex не смог выполнить запрос. Обновите Codex и повторите.".into(),
                    );
                }
                return response
                    .get("result")
                    .cloned()
                    .ok_or("Некорректный ответ Codex.".into());
            }
        }
    }
}

#[derive(Serialize)]
pub struct ConnectionStatus {
    manual_path: Option<String>,
    installed: bool,
    authenticated: bool,
    connected: bool,
    signing_in: bool,
    message: Option<String>,
}

fn status(app: &AppHandle) -> ConnectionStatus {
    let signing_in = LOGIN
        .lock()
        .map(|mut login| {
            if let Some((child, start)) = login.as_mut() {
                if child.try_wait().ok().flatten().is_some() {
                    *login = None;
                } else if start.elapsed() > Duration::from_secs(180) {
                    let _ = child.kill();
                    let _ = child.wait();
                    *login = None;
                }
            }
            login.is_some()
        })
        .unwrap_or(false);
    let installed = super::inspect_local_agent(super::LocalAgentProvider::Codex).available;
    let mut result = ConnectionStatus {
        manual_path: manual_executable().map(|path| path.to_string_lossy().into_owned()),
        installed,
        authenticated: false,
        connected: false,
        signing_in,
        message: None,
    };
    if !installed {
        return result;
    }
    match Client::open()
        .and_then(|mut client| client.request("account/read", json!({"refreshToken":false})))
    {
        Ok(account) => {
            result.authenticated = account["account"]["type"].as_str() == Some("chatgpt");
            if !result.authenticated && !account["account"].is_null() {
                result.message =
                    Some("Для этого подключения войдите в Codex через ChatGPT.".into());
            }
        }
        Err(error) => {
            result.message = Some(error);
            return result;
        }
    }
    match super::agent_adapters::codex_connected(app) {
        Ok(connected) => result.connected = connected,
        Err(error) => result.message = Some(error),
    }
    result
}

#[tauri::command]
pub async fn codex_connection_status(app: AppHandle) -> Result<ConnectionStatus, String> {
    tauri::async_runtime::spawn_blocking(move || status(&app))
        .await
        .map_err(|_| "Не удалось проверить подключение.".into())
}

#[tauri::command]
pub async fn connect_codex_integration(app: AppHandle) -> Result<ConnectionStatus, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let current = status(&app);
        if !current.authenticated {
            return Err("Сначала войдите в Codex через ChatGPT.".into());
        }
        super::agent_adapters::connect_codex_globally(&app)?;
        Ok(status(&app))
    })
    .await
    .map_err(|_| "Не удалось подключить Codex.".to_string())?
}

#[tauri::command]
pub fn begin_codex_login() -> Result<(), String> {
    let mut login = LOGIN.lock().map_err(|_| "Не удалось начать вход.")?;
    if let Some((child, _)) = login.as_mut() {
        if child
            .try_wait()
            .map_err(|_| "Не удалось проверить вход.")?
            .is_none()
        {
            return Ok(());
        }
    }
    let mut command = super::local_agent_command(super::LocalAgentProvider::Codex);
    super::hide_background_console(&mut command);
    let child = command
        .arg("login")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|_| "Не удалось открыть вход в ChatGPT.")?;
    *login = Some((child, Instant::now()));
    Ok(())
}

#[tauri::command]
pub fn cancel_codex_login() -> Result<(), String> {
    let mut login = LOGIN.lock().map_err(|_| "Не удалось отменить вход.")?;
    if let Some((mut child, _)) = login.take() {
        let _ = child.kill();
        let _ = child.wait();
    }
    Ok(())
}

#[derive(Serialize)]
pub struct Conversation {
    id: String,
    title: String,
    updated_at: i64,
}
#[derive(Serialize)]
pub struct ConversationPage {
    conversations: Vec<Conversation>,
    next_cursor: Option<String>,
}
fn conversation(value: &Value) -> Option<Conversation> {
    let id = value["id"].as_str()?;
    if !super::codex_dock::is_uuid(id) {
        return None;
    }
    // Empty sessions have no persisted history and cannot be resumed by the queue.
    let preview = value["preview"].as_str().unwrap_or_default();
    if preview.is_empty() {
        return None;
    }
    let title = value["name"]
        .as_str()
        .filter(|name| !name.trim().is_empty())
        .unwrap_or(preview);
    Some(Conversation {
        id: id.into(),
        title: title.chars().take(160).collect(),
        updated_at: value["updatedAt"].as_i64().unwrap_or_default(),
    })
}
#[tauri::command]
pub async fn list_codex_conversations(cursor: Option<String>) -> Result<ConversationPage, String> {
    if cursor.as_ref().is_some_and(|value| value.len() > 4096) {
        return Err("Некорректная страница разговоров.".into());
    }
    tauri::async_runtime::spawn_blocking(move || {
        let mut client = Client::open()?;
        let result = client.request("thread/list", json!({"cursor":cursor,"limit":50,"sortKey":"updated_at","archived":false,"sourceKinds":["cli","vscode","appServer"]}))?;
        let rows = result["data"].as_array().ok_or("Не удалось прочитать разговоры Codex.")?;
        Ok(ConversationPage { conversations: rows.iter().filter_map(conversation).collect(), next_cursor: result["nextCursor"].as_str().map(str::to_owned) })
    }).await.map_err(|_| "Не удалось загрузить разговоры.".to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn excludes_empty_sessions_and_uses_readable_names() {
        let id = "123e4567-e89b-12d3-a456-426614174000";
        assert!(conversation(&json!({"id":id,"name":"empty","preview":""})).is_none());
        assert!(conversation(&json!({"id":"bad","preview":"hello"})).is_none());
        let result = conversation(
            &json!({"id":id,"name":"Project chat","preview":"message","updatedAt":42}),
        )
        .unwrap();
        assert_eq!(result.title, "Project chat");
        assert_eq!(result.updated_at, 42);
    }

    #[test]
    #[ignore = "Reads the installed Codex account and conversation metadata; never starts a turn"]
    fn live_app_server_discovery() {
        let mut client = Client::open().unwrap();
        let account = client
            .request("account/read", json!({"refreshToken":false}))
            .unwrap();
        assert!(account.get("account").is_some());
        let page = client
            .request(
                "thread/list",
                json!({"limit":5,"archived":false,"sourceKinds":["cli","vscode","appServer"]}),
            )
            .unwrap();
        assert!(page["data"].is_array());
        let conversations: Vec<_> = page["data"]
            .as_array()
            .unwrap()
            .iter()
            .filter_map(conversation)
            .collect();
        assert!(
            !conversations.is_empty(),
            "Expected at least one existing conversation in this local acceptance environment"
        );
        let read = client
            .request(
                "thread/read",
                json!({"threadId":conversations[0].id,"includeTurns":false}),
            )
            .unwrap();
        assert_eq!(read["thread"]["id"], conversations[0].id);
    }
}
