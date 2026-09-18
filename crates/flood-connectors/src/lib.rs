//! Provider-neutral contracts shared by flood.md integrations.
//!
//! This crate deliberately contains no network clients and no task storage. A
//! connector translates one external service into these bounded structures;
//! the rest of flood.md can then reason about project context without knowing
//! the provider API.

use chrono::{DateTime, Utc};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use std::{collections::BTreeMap, future::Future, pin::Pin};
use thiserror::Error;

pub const CONNECTOR_CONTRACT_VERSION: u16 = 1;
pub const TELEGRAM_CONNECTOR_ID: &str = "telegram";
pub const GITHUB_CONNECTOR_ID: &str = "github";

pub fn telegram_connector_descriptor() -> ConnectorDescriptor {
    ConnectorDescriptor::new(
        TELEGRAM_CONNECTOR_ID,
        "Telegram",
        "Сообщения, обсуждения и медиа из связанных чатов",
        ConnectorCategory::Communication,
        ConnectorAuthKind::LocalSession,
        [
            ConnectorCapability::SourceCatalog,
            ConnectorCapability::Timeline,
            ConnectorCapability::Threads,
            ConnectorCapability::Actors,
            ConnectorCapability::Media,
        ],
    )
}

pub fn github_connector_descriptor() -> ConnectorDescriptor {
    ConnectorDescriptor::new(
        GITHUB_CONNECTOR_ID,
        "GitHub",
        "Репозитории, код, issues и pull requests",
        ConnectorCategory::Code,
        ConnectorAuthKind::DeviceFlow,
        [
            ConnectorCapability::SourceCatalog,
            ConnectorCapability::Search,
            ConnectorCapability::Read,
        ],
    )
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum ConnectorCapability {
    SourceCatalog,
    Timeline,
    Threads,
    Actors,
    Search,
    Read,
    Media,
    Changes,
    Write,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ConnectorCategory {
    Communication,
    Code,
    Design,
    Documents,
    Local,
    Other,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ConnectorAuthKind {
    None,
    LocalSession,
    DeviceFlow,
    OAuth,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct ConnectorDescriptor {
    pub contract_version: u16,
    pub id: String,
    pub display_name: String,
    pub description: String,
    pub category: ConnectorCategory,
    pub auth_kind: ConnectorAuthKind,
    pub capabilities: Vec<ConnectorCapability>,
    pub supports_project_binding: bool,
}

impl ConnectorDescriptor {
    pub fn new(
        id: impl Into<String>,
        display_name: impl Into<String>,
        description: impl Into<String>,
        category: ConnectorCategory,
        auth_kind: ConnectorAuthKind,
        capabilities: impl IntoIterator<Item = ConnectorCapability>,
    ) -> Self {
        let mut unique_capabilities = Vec::new();
        for capability in capabilities {
            if !unique_capabilities.contains(&capability) {
                unique_capabilities.push(capability);
            }
        }
        Self {
            contract_version: CONNECTOR_CONTRACT_VERSION,
            id: id.into(),
            display_name: display_name.into(),
            description: description.into(),
            category,
            auth_kind,
            capabilities: unique_capabilities,
            supports_project_binding: true,
        }
    }

    pub fn validate(&self) -> Result<(), ConnectorContractError> {
        validate_identifier(&self.id, "connector id")?;
        validate_text(&self.display_name, "connector name", 80)?;
        validate_text(&self.description, "connector description", 300)?;
        if self.contract_version != CONNECTOR_CONTRACT_VERSION {
            return Err(ConnectorContractError::UnsupportedVersion(
                self.contract_version,
            ));
        }
        let mut unique = self.capabilities.clone();
        unique.sort_by_key(|capability| *capability as u8);
        unique.dedup();
        if unique.len() != self.capabilities.len() {
            return Err(ConnectorContractError::Invalid(
                "connector capabilities contain duplicates".into(),
            ));
        }
        Ok(())
    }

    pub fn supports(&self, capability: ConnectorCapability) -> bool {
        self.capabilities.contains(&capability)
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ConnectorHealth {
    Disconnected,
    Connecting,
    Ready,
    Attention,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct ConnectorRuntimeStatus {
    pub connector_id: String,
    pub health: ConnectorHealth,
    pub configured: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub account_label: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
    pub observed_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ConnectorSourceKind {
    Conversation,
    Repository,
    Directory,
    Document,
    Design,
    Website,
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct ConnectorSource {
    pub connector_id: String,
    /// Stable within one connector account; never a display name.
    pub source_id: String,
    pub kind: ConnectorSourceKind,
    pub label: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    #[serde(default)]
    pub agent_access: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct ExternalActor {
    /// Stable within the provider, e.g. `user:123`; never derived from a name.
    pub actor_id: String,
    pub display_name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,
    #[serde(default)]
    pub is_current_user: bool,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ContextSignalKind {
    Message,
    Comment,
    Commit,
    Issue,
    PullRequest,
    DocumentUpdate,
    DesignUpdate,
    Other,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ContextAssetKind {
    Image,
    Video,
    Audio,
    Document,
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct ContextAssetReference {
    pub asset_id: String,
    pub kind: ContextAssetKind,
    pub file_name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub mime_type: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub size: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct ContextSignal {
    pub contract_version: u16,
    pub connector_id: String,
    pub source_id: String,
    /// Stable provider identity used for deduplication and cursors.
    pub external_id: String,
    pub kind: ContextSignalKind,
    pub occurred_at: DateTime<Utc>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub actor: Option<ExternalActor>,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub text: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reply_to_external_id: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub assets: Vec<ContextAssetReference>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    /// Small provider facts such as branch/state. Secrets and full raw payloads
    /// are intentionally not supported by the shared contract.
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub attributes: BTreeMap<String, String>,
}

impl ContextSignal {
    pub fn validate(&self) -> Result<(), ConnectorContractError> {
        if self.contract_version != CONNECTOR_CONTRACT_VERSION {
            return Err(ConnectorContractError::UnsupportedVersion(
                self.contract_version,
            ));
        }
        validate_identifier(&self.connector_id, "connector id")?;
        validate_text(&self.source_id, "source id", 300)?;
        validate_text(&self.external_id, "external id", 300)?;
        if self.text.len() > 20_000 {
            return Err(ConnectorContractError::Invalid(
                "context signal text exceeds 20000 bytes".into(),
            ));
        }
        if self.assets.len() > 20 || self.attributes.len() > 24 {
            return Err(ConnectorContractError::Invalid(
                "context signal exceeds bounded metadata limits".into(),
            ));
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct ContextBatch {
    pub connector_id: String,
    pub source_id: String,
    pub synced_at: DateTime<Utc>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub next_cursor: Option<String>,
    #[serde(default)]
    pub has_more: bool,
    pub signals: Vec<ContextSignal>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct SourcePage {
    pub sources: Vec<ConnectorSource>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub next_cursor: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct SourceCatalogRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub query: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cursor: Option<String>,
    pub limit: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct TimelineRequest {
    pub source_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cursor: Option<String>,
    pub limit: usize,
}

pub type ConnectorFuture<'a, T> =
    Pin<Box<dyn Future<Output = Result<T, ConnectorOperationError>> + Send + 'a>>;

/// Common identity/status surface used by the desktop and MCP registries.
pub trait ConnectorIdentity: Send + Sync {
    fn descriptor(&self) -> ConnectorDescriptor;
    fn status(&self) -> ConnectorRuntimeStatus;
}

/// Runtime boundary for a built-in connector. Optional capabilities return
/// `Unsupported`; consumers must inspect the descriptor before calling them.
pub trait ConnectorAdapter: ConnectorIdentity {
    fn list_sources(&self, _request: SourceCatalogRequest) -> ConnectorFuture<'_, SourcePage> {
        Box::pin(async { Err(ConnectorOperationError::Unsupported("source_catalog")) })
    }

    fn read_timeline(&self, _request: TimelineRequest) -> ConnectorFuture<'_, ContextBatch> {
        Box::pin(async { Err(ConnectorOperationError::Unsupported("timeline")) })
    }
}

#[derive(Debug, Error)]
pub enum ConnectorOperationError {
    #[error("connector capability is not supported: {0}")]
    Unsupported(&'static str),
    #[error("connector is not ready: {0}")]
    NotReady(String),
    #[error("connector operation failed: {0}")]
    Failed(String),
}

#[derive(Debug, Error, PartialEq, Eq)]
pub enum ConnectorContractError {
    #[error("unsupported connector contract version: {0}")]
    UnsupportedVersion(u16),
    #[error("invalid connector data: {0}")]
    Invalid(String),
}

fn validate_identifier(value: &str, label: &str) -> Result<(), ConnectorContractError> {
    if value.is_empty()
        || value.len() > 80
        || !value
            .bytes()
            .all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'-')
    {
        return Err(ConnectorContractError::Invalid(format!(
            "{label} must use lowercase ASCII, digits and hyphens"
        )));
    }
    Ok(())
}

fn validate_text(value: &str, label: &str, max: usize) -> Result<(), ConnectorContractError> {
    if value.trim().is_empty() || value.len() > max || value.chars().any(char::is_control) {
        return Err(ConnectorContractError::Invalid(format!(
            "{label} is empty, too long or contains control characters"
        )));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn descriptor_is_capability_driven_and_validated() {
        let descriptor = ConnectorDescriptor::new(
            "telegram",
            "Telegram",
            "Messages and media",
            ConnectorCategory::Communication,
            ConnectorAuthKind::LocalSession,
            [
                ConnectorCapability::SourceCatalog,
                ConnectorCapability::Timeline,
                ConnectorCapability::Threads,
                ConnectorCapability::Timeline,
                ConnectorCapability::Actors,
                ConnectorCapability::Media,
            ],
        );
        assert!(descriptor.validate().is_ok());
        assert_eq!(
            descriptor
                .capabilities
                .iter()
                .filter(|capability| **capability == ConnectorCapability::Timeline)
                .count(),
            1
        );
        assert!(descriptor.supports(ConnectorCapability::Threads));
        assert!(!descriptor.supports(ConnectorCapability::Write));
    }

    #[test]
    fn signal_rejects_unbounded_provider_metadata() {
        let signal = ContextSignal {
            contract_version: CONNECTOR_CONTRACT_VERSION,
            connector_id: "telegram".into(),
            source_id: "chat:-10042".into(),
            external_id: "message:77".into(),
            kind: ContextSignalKind::Message,
            occurred_at: Utc::now(),
            actor: None,
            text: "x".repeat(20_001),
            reply_to_external_id: None,
            assets: Vec::new(),
            url: None,
            attributes: BTreeMap::new(),
        };
        assert!(signal.validate().is_err());
    }
}
