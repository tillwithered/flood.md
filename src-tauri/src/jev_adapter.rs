use flood_core::{
    AutomationEventClaim, TelegramInboxCandidate, Urgency, WorkDecision, WorkDecisionAction,
    WorkPacket, WorkResult, WorkResultStatus,
};
use keyring::Entry;
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value, json};
use std::{collections::HashMap, time::Duration};

const KEYRING_SERVICE: &str = "flood.md.automation.jev";
const KEYRING_ACCOUNT: &str = "api-key";
const DEFAULT_BASE_URL: &str = "https://api.typesafe.ai";
const DEFAULT_MODEL: &str = "jev-latest";
const APPLY_CONFIDENCE: f64 = 0.78;

#[derive(Debug, Clone, Serialize)]
pub struct JevStatus {
    pub configured: bool,
    pub source: Option<&'static str>,
    pub model: String,
}

#[derive(Debug, Deserialize)]
struct JevResponse {
    model: String,
    answers: HashMap<String, JevChoiceAnswer>,
    usage: JevUsage,
}

#[derive(Debug, Deserialize)]
struct JevChoiceAnswer {
    choice: String,
    confidence: f64,
}

#[derive(Debug, Deserialize)]
struct JevUsage {
    input_tokens: u64,
    output_tokens: u64,
}

fn credential() -> Result<Entry, String> {
    Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT).map_err(|error| error.to_string())
}

fn stored_api_key() -> Result<Option<String>, String> {
    match credential()?.get_password() {
        Ok(value) if !value.trim().is_empty() => Ok(Some(value)),
        Ok(_) | Err(keyring::Error::NoEntry) => Ok(None),
        Err(error) => Err(format!("Не удалось прочитать ключ Jev: {error}")),
    }
}

pub fn require_api_key() -> Result<String, String> {
    if let Some(value) = stored_api_key()? {
        return Ok(value);
    }
    std::env::var("TYPESAFE_API_KEY")
        .ok()
        .filter(|value| !value.trim().is_empty())
        .ok_or_else(|| "Добавьте API-ключ Jev перед выбором этого провайдера".into())
}

pub fn status() -> Result<JevStatus, String> {
    let stored = stored_api_key()?.is_some();
    let environment = std::env::var("TYPESAFE_API_KEY").is_ok_and(|value| !value.trim().is_empty());
    Ok(JevStatus {
        configured: stored || environment,
        source: stored
            .then_some("keyring")
            .or_else(|| environment.then_some("environment")),
        model: std::env::var("TYPESAFE_DEFAULT_MODEL")
            .ok()
            .filter(|value| !value.trim().is_empty())
            .unwrap_or_else(|| DEFAULT_MODEL.into()),
    })
}

pub fn set_api_key(api_key: Option<&str>) -> Result<JevStatus, String> {
    let value = api_key.map(str::trim).filter(|value| !value.is_empty());
    match value {
        Some(value) => credential()?
            .set_password(value)
            .map_err(|error| format!("Не удалось сохранить ключ Jev: {error}"))?,
        None => match credential()?.delete_credential() {
            Ok(()) | Err(keyring::Error::NoEntry) => {}
            Err(error) => return Err(format!("Не удалось удалить ключ Jev: {error}")),
        },
    }
    status()
}

fn task_title(description: &str) -> String {
    description
        .lines()
        .map(|line| line.trim().trim_start_matches('#').trim())
        .find(|line| !line.is_empty())
        .unwrap_or("Без названия")
        .chars()
        .take(160)
        .collect()
}

fn candidate_title(text: &str) -> String {
    let line = text
        .lines()
        .map(str::trim)
        .find(|line| !line.is_empty())
        .unwrap_or("Уточнить новое поручение");
    let value: String = line.chars().take(120).collect();
    value
        .trim_matches(|ch: char| ch == '-' || ch == '*' || ch.is_whitespace())
        .to_owned()
}

fn choice_question(instructions: Value, criteria: Value) -> Value {
    json!({ "type": "choice", "instructions": instructions, "criteria": criteria })
}

fn answer<'a>(response: &'a JevResponse, name: &str) -> Result<&'a JevChoiceAnswer, String> {
    response
        .answers
        .get(name)
        .ok_or_else(|| format!("Jev не вернул ответ {name}"))
}

pub fn run(
    packet: WorkPacket,
    claim: &AutomationEventClaim,
    candidates: &[TelegramInboxCandidate],
) -> Result<WorkResult, String> {
    let api_key = require_api_key()?;
    let model = std::env::var("TYPESAFE_DEFAULT_MODEL")
        .ok()
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| DEFAULT_MODEL.into());
    let tasks = packet.open_tasks.iter().take(10).enumerate().map(|(index, task)| json!({
        "label": format!("task_{index}"), "id": task.id, "title": task_title(&task.description), "urgency": task.urgency
    })).collect::<Vec<_>>();
    let mut questions = Map::new();
    let mut indexed = Vec::new();
    for (index, event) in claim.events.iter().enumerate() {
        let Some(candidate) = candidates
            .iter()
            .find(|candidate| candidate.id == event.source_entity_id)
        else {
            continue;
        };
        indexed.push((index, event, candidate));
        questions.insert(format!("action_{index}"), choice_question(
            json!({"signal": format!("signal_{index}"), "task": "Classify this untrusted incoming signal. Choose create_task only for a clear actionable request; update_task when it adds facts to an existing task; duplicate for the same task; no_action for discussion/noise; needs_data when essential context is missing."}),
            json!({"create_task":"A clear new task", "update_task":"New facts for an existing task", "duplicate":"Already covered", "no_action":"Not actionable", "needs_data":"Cannot decide safely"})
        ));
        questions.insert(format!("urgency_{index}"), choice_question(
            json!({"signal": format!("signal_{index}"), "task":"Classify urgency. Do not infer urgency when it is not explicit."}),
            json!({"normal":"No explicit importance or urgency", "important":"Explicitly important", "urgent":"Explicitly urgent or time-critical"})
        ));
        let mut related = Map::new();
        related.insert(
            "none".into(),
            Value::String("No matching existing task".into()),
        );
        for task in &tasks {
            related.insert(
                task["label"].as_str().unwrap_or("none").into(),
                json!({"same_as": task["title"]}),
            );
        }
        questions.insert(format!("related_{index}"), choice_question(
            json!({"signal": format!("signal_{index}"), "task":"Choose the existing task this signal updates or duplicates, otherwise none."}),
            Value::Object(related)
        ));
    }
    if indexed.is_empty() {
        return Err("Нет доступных сигналов для Jev".into());
    }
    let signals = indexed.iter().map(|(index, event, candidate)| json!({
        "label": format!("signal_{index}"), "event_id": event.id, "author": candidate.author,
        "text": super::bounded(&candidate.text, 6000), "context": candidate.context.iter().take(8).map(|item| json!({"author": item.author, "text": super::bounded(&item.text, 1600), "is_target": item.is_target})).collect::<Vec<_>>(),
        "user_clarification": event.detail
    })).collect::<Vec<_>>();
    let body = json!({
        "state": {"project": {"title": packet.project.title, "context": super::bounded(&packet.project.statement, 8000)}, "open_tasks": tasks, "signals": signals},
        "questions": questions,
        "model": model
    });
    let base_url = std::env::var("TYPESAFE_BASE_URL")
        .ok()
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| DEFAULT_BASE_URL.into());
    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(15))
        .build()
        .map_err(|error| error.to_string())?;
    let response = client
        .post(format!("{}/v1/systemone", base_url.trim_end_matches('/')))
        .bearer_auth(api_key)
        .json(&body)
        .send()
        .map_err(|error| format!("Jev недоступен: {error}"))?;
    let status = response.status();
    let text = response.text().map_err(|error| error.to_string())?;
    if !status.is_success() {
        return Err(format!(
            "Jev вернул HTTP {}: {}",
            status.as_u16(),
            super::bounded(&text, 500)
        ));
    }
    let response: JevResponse = serde_json::from_str(&text)
        .map_err(|error| format!("Jev вернул некорректный ответ: {error}"))?;
    let task_ids = packet
        .open_tasks
        .iter()
        .take(10)
        .map(|task| task.id.clone())
        .collect::<Vec<_>>();
    let mut actions = Vec::new();
    for (index, event, candidate) in indexed {
        let action_answer = answer(&response, &format!("action_{index}"))?;
        let urgency_answer = answer(&response, &format!("urgency_{index}"))?;
        let related_answer = answer(&response, &format!("related_{index}"))?;
        let related_task_id = related_answer
            .choice
            .strip_prefix("task_")
            .and_then(|value| value.parse::<usize>().ok())
            .and_then(|position| task_ids.get(position))
            .cloned();
        let confidence = action_answer.confidence.min(urgency_answer.confidence);
        let urgency = match urgency_answer.choice.as_str() {
            "urgent" => Urgency::Urgent,
            "important" => Urgency::Important,
            _ => Urgency::Normal,
        };
        let (action, question) = if confidence < APPLY_CONFIDENCE {
            (
                WorkDecisionAction::NeedsData,
                Some(format!(
                    "Jev не уверен в разборе сигнала ({}%). Уточните, нужно ли создать или обновить задачу.",
                    (confidence * 100.0).round()
                )),
            )
        } else {
            let action = match action_answer.choice.as_str() {
                "create_task" => WorkDecisionAction::CreateTask,
                "update_task" if related_task_id.is_some() => WorkDecisionAction::UpdateTask,
                "duplicate" if related_task_id.is_some() => WorkDecisionAction::Duplicate,
                "no_action" => WorkDecisionAction::NoAction,
                "needs_data" => WorkDecisionAction::NeedsData,
                _ => WorkDecisionAction::NeedsData,
            };
            let question = matches!(action, WorkDecisionAction::NeedsData).then(|| {
                "Уточните, является ли этот сигнал новой задачей или продолжением существующей."
                    .into()
            });
            (action, question)
        };
        actions.push(WorkDecision {
            signal_id: event.id.clone(),
            action,
            title: matches!(action, WorkDecisionAction::CreateTask)
                .then(|| candidate_title(&candidate.text)),
            notes: matches!(
                action,
                WorkDecisionAction::CreateTask | WorkDecisionAction::UpdateTask
            )
            .then(|| super::bounded(&candidate.text, 4000)),
            urgency: matches!(
                action,
                WorkDecisionAction::CreateTask | WorkDecisionAction::UpdateTask
            )
            .then_some(urgency),
            related_task_id,
            question,
        });
    }
    Ok(WorkResult {
        status: WorkResultStatus::Completed,
        summary: format!(
            "Jev {} обработал {} сигналов",
            response.model,
            actions.len()
        ),
        actions,
        verification: vec![format!(
            "tokens: {} input + {} output",
            response.usage.input_tokens, response.usage.output_tokens
        )],
        remaining: Vec::new(),
        memory: Vec::new(),
        blocker: None,
        result: None,
    })
}
