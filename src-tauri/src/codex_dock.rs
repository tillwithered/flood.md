use serde::Serialize;
use std::{io::Read, process::{Command, Stdio}, thread, time::{Duration, Instant}};

#[derive(Serialize)]
pub struct CodexQueueStatus {
    available: bool,
    version: Option<String>,
}

#[derive(Serialize)]
pub struct CodexQueueReceipt {
    state: &'static str,
    queue_id: Option<String>,
    message: String,
}

fn codex_command() -> Command {
    let mut command = crate::local_agent_command(crate::LocalAgentProvider::Codex);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x0800_0000);
    }
    command
}

pub(super) fn is_uuid(value: &str) -> bool {
    value.len() == 36 && value.char_indices().all(|(index, ch)| {
        if [8, 13, 18, 23].contains(&index) { ch == '-' } else { ch.is_ascii_hexdigit() }
    })
}

#[tauri::command]
pub fn codex_queue_status() -> CodexQueueStatus {
    let status = crate::inspect_local_agent(crate::LocalAgentProvider::Codex);
    CodexQueueStatus { available: status.available, version: status.version }
}

#[tauri::command]
pub fn queue_codex_message(thread_id: String, message: String) -> CodexQueueReceipt {
    let thread_id = thread_id.trim();
    if !is_uuid(thread_id) {
        return CodexQueueReceipt { state: "rejected", queue_id: None, message: "Укажите ID разговора Codex".into() };
    }
    if message.trim().is_empty() || message.len() > 32_000 {
        return CodexQueueReceipt { state: "rejected", queue_id: None, message: "Сообщение должно содержать от 1 до 32 000 символов".into() };
    }

    let mut command = codex_command();
    command.args(["queue", "--thread", thread_id, "--message", &message])
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    let mut child = match command.spawn() {
        Ok(child) => child,
        Err(_) => return CodexQueueReceipt { state: "rejected", queue_id: None, message: "Codex недоступен. Сообщение сохранено в черновике".into() },
    };
    let stdout = child.stdout.take().map(|mut pipe| thread::spawn(move || { let mut bytes = Vec::new(); let _ = pipe.read_to_end(&mut bytes); bytes }));
    let stderr = child.stderr.take().map(|mut pipe| thread::spawn(move || { let mut bytes = Vec::new(); let _ = pipe.read_to_end(&mut bytes); bytes }));
    let started = Instant::now();
    let status = loop {
        match child.try_wait() {
            Ok(Some(status)) => break Some(status),
            Ok(None) if started.elapsed() < Duration::from_secs(20) => thread::sleep(Duration::from_millis(50)),
            _ => break None,
        }
    };
    if status.is_none() {
        let _ = child.kill();
        let _ = child.wait();
    }
    let out = stdout.and_then(|handle| handle.join().ok()).unwrap_or_default();
    let err = stderr.and_then(|handle| handle.join().ok()).unwrap_or_default();
    match status {
        None => CodexQueueReceipt { state: "unknown", queue_id: None, message: "Доставка не подтверждена. Проверьте разговор в Codex перед повтором".into() },
        Some(status) if status.success() => {
            let output = String::from_utf8_lossy(&out);
            let queue_id = output.split_whitespace().find(|part| is_uuid(part) && !part.eq_ignore_ascii_case(thread_id)).map(str::to_string);
            CodexQueueReceipt { state: "queued", queue_id, message: "Отправлено в Codex".into() }
        }
        Some(_) => {
            let detail = String::from_utf8_lossy(&err);
            let detail = detail.trim().chars().take(180).collect::<String>();
            CodexQueueReceipt { state: "rejected", queue_id: None, message: if detail.is_empty() { "Codex отклонил сообщение".into() } else { format!("Codex отклонил сообщение: {detail}") } }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{is_uuid, queue_codex_message};

    #[test]
    fn rejects_invalid_destination_before_starting_codex() {
        assert!(is_uuid("123e4567-e89b-12d3-a456-426614174000"));
        assert!(!is_uuid("not-a-thread"));
        let receipt = queue_codex_message("not-a-thread".into(), "Do something".into());
        assert_eq!(receipt.state, "rejected");
        assert!(receipt.queue_id.is_none());
    }
}
