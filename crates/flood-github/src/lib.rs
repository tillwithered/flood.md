use atomic_write_file::AtomicWriteFile;
use base64::{Engine as _, engine::general_purpose::STANDARD};
use chrono::{DateTime, Duration, Utc};
use keyring::Entry;
use reqwest::{
    Url,
    blocking::{Client, RequestBuilder},
};
use serde::{Deserialize, Serialize, de::DeserializeOwned};
use std::{fs, io::Write, ops::Deref, path::PathBuf, sync::Arc, time::Duration as StdDuration};

const CONFIG_VERSION: u8 = 1;
const KEYRING_SERVICE: &str = "io.flood.desktop.github";
const ACCESS_TOKEN_ACCOUNT: &str = "access-token";
const REFRESH_TOKEN_ACCOUNT: &str = "refresh-token";
const API_VERSION: &str = "2026-03-10";
const USER_AGENT: &str = "flood.md";

#[derive(Debug, thiserror::Error)]
pub enum GitHubError {
    #[error("GitHub-коннектор не настроен: укажите Client ID и slug GitHub App")]
    Unconfigured,
    #[error("GitHub не подключён")]
    NotConnected,
    #[error("GitHub App не установлено ни в одном доступном аккаунте")]
    NoInstallation,
    #[error("GitHub вернул ошибку {status}: {message}")]
    Api { status: u16, message: String },
    #[error("не удалось сохранить секрет GitHub в системном хранилище: {0}")]
    Keyring(String),
    #[error("не удалось прочитать настройки GitHub: {0}")]
    Config(String),
    #[error("ответ GitHub имеет неподдерживаемый формат: {0}")]
    Response(String),
    #[error("сетевая ошибка GitHub: {0}")]
    Network(String),
    #[error("путь GitHub содержит потенциально секретные данные")]
    SensitivePath,
}

pub type Result<T> = std::result::Result<T, GitHubError>;

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
struct GitHubConfig {
    #[serde(default = "config_version")]
    format_version: u8,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    client_id: String,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    app_slug: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    account: Option<GitHubAccount>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    access_token_expires_at: Option<DateTime<Utc>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    refresh_token_expires_at: Option<DateTime<Utc>>,
}

fn config_version() -> u8 {
    CONFIG_VERSION
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct GitHubAccount {
    pub id: u64,
    pub login: String,
    pub name: Option<String>,
    pub avatar_url: String,
    pub html_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct GitHubStatus {
    pub configured: bool,
    pub managed_app: bool,
    pub connected: bool,
    pub app_slug: Option<String>,
    pub account: Option<GitHubAccount>,
    pub token_expires_at: Option<DateTime<Utc>>,
    pub needs_reauthorization: bool,
    pub credential_store_available: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct GitHubDeviceCode {
    #[serde(skip)]
    pub device_code: String,
    pub user_code: String,
    pub verification_uri: String,
    pub expires_at: DateTime<Utc>,
    pub interval_seconds: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "state", rename_all = "snake_case")]
pub enum GitHubAuthorizationResult {
    Pending { retry_after_seconds: u64 },
    Authorized { account: GitHubAccount },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct GitHubInstallation {
    pub id: u64,
    pub account_login: String,
    pub account_type: String,
    pub repository_selection: String,
    pub html_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, schemars::JsonSchema, PartialEq, Eq)]
pub struct GitHubRepository {
    pub id: u64,
    pub installation_id: u64,
    pub name: String,
    pub full_name: String,
    pub private: bool,
    pub html_url: String,
    pub description: Option<String>,
    pub default_branch: String,
    pub archived: bool,
    pub pushed_at: Option<DateTime<Utc>>,
    pub owner_avatar_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct GitHubRepositoryCatalog {
    pub installations: Vec<GitHubInstallation>,
    pub repositories: Vec<GitHubRepository>,
}

#[derive(Debug, Clone, Serialize, Deserialize, schemars::JsonSchema, PartialEq, Eq)]
pub struct GitHubTreeEntry {
    pub path: String,
    pub kind: String,
    pub size: Option<u64>,
    pub sha: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, schemars::JsonSchema, PartialEq, Eq)]
pub struct GitHubTree {
    pub entries: Vec<GitHubTreeEntry>,
    pub truncated: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, schemars::JsonSchema, PartialEq, Eq)]
pub struct GitHubFile {
    pub path: String,
    pub content: String,
    pub size: u64,
    pub sha: String,
    pub html_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, schemars::JsonSchema, PartialEq, Eq)]
pub struct GitHubSearchHit {
    pub path: String,
    pub html_url: String,
    pub fragments: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, schemars::JsonSchema, PartialEq, Eq)]
pub struct GitHubIssue {
    pub number: u64,
    pub title: String,
    pub state: String,
    pub html_url: String,
    pub author: String,
    pub labels: Vec<String>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, schemars::JsonSchema, PartialEq, Eq)]
pub struct GitHubPullRequest {
    pub number: u64,
    pub title: String,
    pub state: String,
    pub draft: bool,
    pub html_url: String,
    pub author: String,
    pub head: String,
    pub base: String,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, schemars::JsonSchema, PartialEq, Eq)]
pub struct GitHubRepositoryContext {
    pub repository: GitHubRepository,
    pub readme: Option<GitHubFile>,
    pub issues: Vec<GitHubIssue>,
    pub pull_requests: Vec<GitHubPullRequest>,
}

#[derive(Clone)]
pub struct GitHubConnector {
    root: PathBuf,
    client: SafeBlockingClient,
}

#[derive(Clone)]
struct SafeBlockingClient(Arc<SafeBlockingClientInner>);

struct SafeBlockingClientInner(Option<Client>);

impl SafeBlockingClient {
    fn new(client: Client) -> Self {
        Self(Arc::new(SafeBlockingClientInner(Some(client))))
    }
}

impl Deref for SafeBlockingClient {
    type Target = Client;

    fn deref(&self) -> &Self::Target {
        self.0.0.as_ref().expect("GitHub HTTP client доступен")
    }
}

impl Drop for SafeBlockingClientInner {
    fn drop(&mut self) {
        if let Some(client) = self.0.take() {
            let _ = std::thread::spawn(move || drop(client)).join();
        }
    }
}

impl GitHubConnector {
    pub fn new(root: impl Into<PathBuf>) -> Result<Self> {
        let root = root.into();
        fs::create_dir_all(root.join("integrations"))
            .map_err(|error| GitHubError::Config(error.to_string()))?;
        let client = Client::builder()
            .connect_timeout(StdDuration::from_secs(10))
            .timeout(StdDuration::from_secs(30))
            .build()
            .map_err(|error| GitHubError::Network(error.to_string()))?;
        let connector = Self {
            root,
            client: SafeBlockingClient::new(client),
        };
        connector.persist_managed_identity()?;
        Ok(connector)
    }

    pub fn status(&self) -> GitHubStatus {
        let config = match self.read_config() {
            Ok(config) => config,
            Err(error) => {
                return GitHubStatus {
                    configured: self.credentials().is_some(),
                    managed_app: managed_credentials().is_some(),
                    connected: false,
                    app_slug: None,
                    account: None,
                    token_expires_at: None,
                    needs_reauthorization: false,
                    credential_store_available: false,
                    error: Some(error.to_string()),
                };
            }
        };
        let (client_id, app_slug, managed_app) = self.resolved_credentials(&config);
        let token = read_connector_secret(ACCESS_TOKEN_ACCOUNT, &client_id);
        let credential_store_available = !matches!(&token, Err(GitHubError::Keyring(_)));
        let has_token = token.ok().flatten().is_some();
        let expired = config
            .access_token_expires_at
            .is_some_and(|expiry| expiry <= Utc::now() + Duration::seconds(30));
        let has_refresh = read_connector_secret(REFRESH_TOKEN_ACCOUNT, &client_id)
            .ok()
            .flatten()
            .is_some();
        GitHubStatus {
            configured: !client_id.is_empty() && !app_slug.is_empty(),
            managed_app,
            connected: has_token && (!expired || has_refresh) && config.account.is_some(),
            app_slug: (!app_slug.is_empty()).then_some(app_slug),
            account: config.account,
            token_expires_at: config.access_token_expires_at,
            needs_reauthorization: expired && !has_refresh,
            credential_store_available,
            error: None,
        }
    }

    pub fn configure(&self, client_id: &str, app_slug: &str) -> Result<GitHubStatus> {
        if managed_credentials().is_some() {
            return Ok(self.status());
        }
        let client_id = client_id.trim();
        let app_slug = app_slug.trim().trim_matches('/');
        if client_id.len() < 8
            || client_id.len() > 128
            || !client_id.chars().all(|c| c.is_ascii_alphanumeric())
        {
            return Err(GitHubError::Config(
                "Client ID GitHub App имеет неверный формат".into(),
            ));
        }
        if app_slug.is_empty()
            || app_slug.len() > 100
            || !app_slug
                .chars()
                .all(|c| c.is_ascii_alphanumeric() || c == '-')
        {
            return Err(GitHubError::Config(
                "slug GitHub App имеет неверный формат".into(),
            ));
        }
        let mut config = self.read_config()?;
        if !config.client_id.is_empty() && config.client_id != client_id {
            delete_connector_secret(ACCESS_TOKEN_ACCOUNT, &config.client_id)?;
            delete_connector_secret(REFRESH_TOKEN_ACCOUNT, &config.client_id)?;
            config.account = None;
            config.access_token_expires_at = None;
            config.refresh_token_expires_at = None;
        }
        config.client_id = client_id.to_owned();
        config.app_slug = app_slug.to_owned();
        self.write_config(&config)?;
        Ok(self.status())
    }

    pub fn begin_authorization(&self) -> Result<GitHubDeviceCode> {
        let config = self.read_config()?;
        let (client_id, _, _) = self.resolved_credentials(&config);
        if client_id.is_empty() {
            return Err(GitHubError::Unconfigured);
        }
        #[derive(Deserialize)]
        struct DeviceResponse {
            device_code: String,
            user_code: String,
            verification_uri: String,
            expires_in: i64,
            interval: Option<u64>,
        }
        let response: DeviceResponse = self
            .client
            .post("https://github.com/login/device/code")
            .header("Accept", "application/json")
            .form(&[("client_id", client_id.as_str())])
            .send()
            .map_err(network_error)
            .and_then(parse_response)?;
        Ok(GitHubDeviceCode {
            device_code: response.device_code,
            user_code: response.user_code,
            verification_uri: response.verification_uri,
            expires_at: Utc::now() + Duration::seconds(response.expires_in),
            interval_seconds: response.interval.unwrap_or(5).max(5),
        })
    }

    pub fn poll_authorization(&self, device_code: &str) -> Result<GitHubAuthorizationResult> {
        let config = self.read_config()?;
        let (client_id, _, _) = self.resolved_credentials(&config);
        if client_id.is_empty() {
            return Err(GitHubError::Unconfigured);
        }
        let token: TokenResponse = self
            .client
            .post("https://github.com/login/oauth/access_token")
            .header("Accept", "application/json")
            .form(&[
                ("client_id", client_id.as_str()),
                ("device_code", device_code),
                ("grant_type", "urn:ietf:params:oauth:grant-type:device_code"),
            ])
            .send()
            .map_err(network_error)
            .and_then(parse_response)?;
        if let Some(error) = token.error.as_deref() {
            return match error {
                "authorization_pending" => Ok(GitHubAuthorizationResult::Pending {
                    retry_after_seconds: 5,
                }),
                "slow_down" => Ok(GitHubAuthorizationResult::Pending {
                    retry_after_seconds: 10,
                }),
                _ => Err(GitHubError::Api {
                    status: 400,
                    message: token.error_description.unwrap_or_else(|| error.to_owned()),
                }),
            };
        }
        let access_token = token
            .access_token
            .ok_or_else(|| GitHubError::Response("GitHub не вернул access token".into()))?;
        let account: GitHubAccount = self.api_with_token(
            &access_token,
            self.client.get("https://api.github.com/user"),
        )?;
        write_connector_secret(ACCESS_TOKEN_ACCOUNT, &client_id, &access_token)?;
        if let Some(refresh_token) = token.refresh_token.as_deref() {
            write_connector_secret(REFRESH_TOKEN_ACCOUNT, &client_id, refresh_token)?;
        }
        let mut config = config;
        config.account = Some(account.clone());
        config.access_token_expires_at = token
            .expires_in
            .map(|seconds| Utc::now() + Duration::seconds(seconds));
        config.refresh_token_expires_at = token
            .refresh_token_expires_in
            .map(|seconds| Utc::now() + Duration::seconds(seconds));
        self.write_config(&config)?;
        Ok(GitHubAuthorizationResult::Authorized { account })
    }

    pub fn repositories(&self) -> Result<GitHubRepositoryCatalog> {
        let token = self.active_token()?;
        #[derive(Deserialize)]
        struct InstallationsResponse {
            installations: Vec<InstallationResponse>,
        }
        let mut installation_pages = Vec::new();
        for page_number in 1..=20 {
            let response: InstallationsResponse = self.api_with_token(
                &token,
                self.client
                    .get("https://api.github.com/user/installations")
                    .query(&[("per_page", 100), ("page", page_number)]),
            )?;
            let page_size = response.installations.len();
            installation_pages.extend(response.installations);
            if page_size < 100 {
                break;
            }
        }
        let mut installations = Vec::new();
        let mut repositories = Vec::new();
        for installation in installation_pages {
            installations.push(GitHubInstallation {
                id: installation.id,
                account_login: installation.account.login,
                account_type: installation.account.kind,
                repository_selection: installation.repository_selection,
                html_url: installation.html_url,
            });
            #[derive(Deserialize)]
            struct RepositoriesResponse {
                repositories: Vec<RepositoryResponse>,
            }
            let installation_id = installation.id.to_string();
            let url = github_api_url(&["user", "installations", &installation_id, "repositories"]);
            for page_number in 1..=100 {
                let page: RepositoriesResponse = self.api_with_token(
                    &token,
                    self.client
                        .get(url.clone())
                        .query(&[("per_page", 100), ("page", page_number)]),
                )?;
                let page_size = page.repositories.len();
                repositories.extend(
                    page.repositories
                        .into_iter()
                        .map(|repo| repo.into_public(installation.id)),
                );
                if page_size < 100 {
                    break;
                }
            }
        }
        repositories.sort_by(|left, right| {
            left.full_name
                .to_lowercase()
                .cmp(&right.full_name.to_lowercase())
        });
        Ok(GitHubRepositoryCatalog {
            installations,
            repositories,
        })
    }

    pub fn tree(&self, full_name: &str, branch: Option<&str>) -> Result<GitHubTree> {
        let repository = self.repository(full_name)?;
        let branch = branch
            .filter(|value| !value.trim().is_empty())
            .unwrap_or(&repository.default_branch);
        #[derive(Deserialize)]
        struct TreeResponse {
            tree: Vec<TreeEntryResponse>,
            #[serde(default)]
            truncated: bool,
        }
        let (owner, repository_name) = repository_parts(full_name)?;
        let url = github_api_url(&["repos", owner, repository_name, "git", "trees", branch]);
        let response: TreeResponse = self.api(self.client.get(url).query(&[("recursive", "1")]))?;
        let mut entries = response
            .tree
            .into_iter()
            .filter_map(|entry| {
                if entry.kind != "blob" && entry.kind != "tree" {
                    return None;
                }
                if path_looks_sensitive(&entry.path) {
                    return None;
                }
                Some(GitHubTreeEntry {
                    path: entry.path,
                    kind: if entry.kind == "tree" {
                        "directory".into()
                    } else {
                        "file".into()
                    },
                    size: entry.size,
                    sha: entry.sha,
                })
            })
            .collect::<Vec<_>>();
        entries.sort_by(|left, right| left.path.cmp(&right.path));
        Ok(GitHubTree {
            entries,
            truncated: response.truncated,
        })
    }

    pub fn file(&self, full_name: &str, path: &str, reference: Option<&str>) -> Result<GitHubFile> {
        let path = clean_remote_path(path)?;
        if path_looks_sensitive(&path) {
            return Err(GitHubError::SensitivePath);
        }
        let (owner, repository_name) = repository_parts(full_name)?;
        let mut url_parts = vec!["repos", owner, repository_name, "contents"];
        url_parts.extend(path.split('/'));
        let url = github_api_url(&url_parts);
        let mut request = self.client.get(url);
        if let Some(reference) = reference.filter(|value| !value.trim().is_empty()) {
            request = request.query(&[("ref", reference)]);
        }
        let response: FileResponse = self.api(request)?;
        decode_file(response)
    }

    pub fn search(
        &self,
        full_name: &str,
        query: &str,
        limit: usize,
    ) -> Result<Vec<GitHubSearchHit>> {
        #[derive(Deserialize)]
        struct SearchResponse {
            items: Vec<SearchItemResponse>,
        }
        let query = query.trim();
        if !(2..=200).contains(&query.chars().count()) {
            return Err(GitHubError::Config(
                "поисковый запрос должен содержать от 2 до 200 символов".into(),
            ));
        }
        let response: SearchResponse = self.api(
            self.client
                .get("https://api.github.com/search/code")
                .header("Accept", "application/vnd.github.text-match+json")
                .query(&[
                    ("q", format!("{query} repo:{full_name}")),
                    ("per_page", limit.clamp(1, 50).to_string()),
                ]),
        )?;
        Ok(response
            .items
            .into_iter()
            .filter(|item| !path_looks_sensitive(&item.path))
            .map(|item| GitHubSearchHit {
                path: item.path,
                html_url: item.html_url,
                fragments: item
                    .text_matches
                    .into_iter()
                    .map(|value| value.fragment)
                    .take(3)
                    .collect(),
            })
            .collect())
    }

    pub fn repository_context(
        &self,
        full_name: &str,
        limit: usize,
    ) -> Result<GitHubRepositoryContext> {
        let repository = self.repository(full_name)?;
        let readme = self.readme(full_name).ok();
        let (owner, repository_name) = repository_parts(full_name)?;
        let issue_url = github_api_url(&["repos", owner, repository_name, "issues"]);
        let issues: Vec<IssueResponse> = self.api(self.client.get(issue_url).query(&[
            ("state", "open"),
            ("per_page", &limit.clamp(1, 30).to_string()),
        ]))?;
        let pull_url = github_api_url(&["repos", owner, repository_name, "pulls"]);
        let pulls: Vec<PullResponse> = self.api(self.client.get(pull_url).query(&[
            ("state", "open"),
            ("per_page", &limit.clamp(1, 30).to_string()),
        ]))?;
        Ok(GitHubRepositoryContext {
            repository,
            readme,
            issues: issues
                .into_iter()
                .filter(|issue| issue.pull_request.is_none())
                .map(Into::into)
                .collect(),
            pull_requests: pulls.into_iter().map(Into::into).collect(),
        })
    }

    pub fn disconnect(&self) -> Result<()> {
        let mut config = self.read_config()?;
        let (client_id, _, _) = self.resolved_credentials(&config);
        delete_connector_secret(ACCESS_TOKEN_ACCOUNT, &client_id)?;
        delete_connector_secret(REFRESH_TOKEN_ACCOUNT, &client_id)?;
        config.account = None;
        config.access_token_expires_at = None;
        config.refresh_token_expires_at = None;
        self.write_config(&config)
    }

    pub fn installation_url(&self) -> Result<String> {
        let config = self.read_config()?;
        let (_, slug, _) = self.resolved_credentials(&config);
        if slug.is_empty() {
            return Err(GitHubError::Unconfigured);
        }
        Ok(format!("https://github.com/apps/{slug}/installations/new"))
    }

    fn repository(&self, full_name: &str) -> Result<GitHubRepository> {
        let (owner, repository_name) = repository_parts(full_name)?;
        let response: RepositoryResponse =
            self.api(
                self.client
                    .get(github_api_url(&["repos", owner, repository_name])),
            )?;
        Ok(response.into_public(0))
    }

    fn readme(&self, full_name: &str) -> Result<GitHubFile> {
        let (owner, repository_name) = repository_parts(full_name)?;
        let response: FileResponse = self.api(self.client.get(github_api_url(&[
            "repos",
            owner,
            repository_name,
            "readme",
        ])))?;
        decode_file(response)
    }

    fn active_token(&self) -> Result<String> {
        let mut config = self.read_config()?;
        let (client_id, _, _) = self.resolved_credentials(&config);
        if client_id.is_empty() {
            return Err(GitHubError::Unconfigured);
        }
        if config
            .access_token_expires_at
            .is_some_and(|expiry| expiry <= Utc::now() + Duration::minutes(2))
        {
            self.refresh_token(&mut config)?;
        }
        read_connector_secret(ACCESS_TOKEN_ACCOUNT, &client_id)?.ok_or(GitHubError::NotConnected)
    }

    fn refresh_token(&self, config: &mut GitHubConfig) -> Result<()> {
        let (client_id, _, _) = self.resolved_credentials(config);
        if client_id.is_empty() {
            return Err(GitHubError::Unconfigured);
        }
        let refresh_token = read_connector_secret(REFRESH_TOKEN_ACCOUNT, &client_id)?
            .ok_or(GitHubError::NotConnected)?;
        if config
            .refresh_token_expires_at
            .is_some_and(|expiry| expiry <= Utc::now())
        {
            return Err(GitHubError::NotConnected);
        }
        let response: TokenResponse = self
            .client
            .post("https://github.com/login/oauth/access_token")
            .header("Accept", "application/json")
            .form(&[
                ("client_id", client_id.as_str()),
                ("grant_type", "refresh_token"),
                ("refresh_token", refresh_token.as_str()),
            ])
            .send()
            .map_err(network_error)
            .and_then(parse_response)?;
        if let Some(error) = response.error {
            return Err(GitHubError::Api {
                status: 400,
                message: response.error_description.unwrap_or(error),
            });
        }
        let access_token = response.access_token.ok_or_else(|| {
            GitHubError::Response("GitHub не вернул обновлённый access token".into())
        })?;
        write_connector_secret(ACCESS_TOKEN_ACCOUNT, &client_id, &access_token)?;
        if let Some(value) = response.refresh_token.as_deref() {
            write_connector_secret(REFRESH_TOKEN_ACCOUNT, &client_id, value)?;
        }
        config.access_token_expires_at = response
            .expires_in
            .map(|seconds| Utc::now() + Duration::seconds(seconds));
        config.refresh_token_expires_at = response
            .refresh_token_expires_in
            .map(|seconds| Utc::now() + Duration::seconds(seconds));
        self.write_config(config)
    }

    fn api<T: DeserializeOwned>(&self, request: RequestBuilder) -> Result<T> {
        let token = self.active_token()?;
        self.api_with_token(&token, request)
    }

    fn api_with_token<T: DeserializeOwned>(
        &self,
        token: &str,
        request: RequestBuilder,
    ) -> Result<T> {
        request
            .header(
                "Accept",
                "application/vnd.github+json, application/vnd.github.text-match+json",
            )
            .header("Authorization", format!("Bearer {token}"))
            .header("X-GitHub-Api-Version", API_VERSION)
            .header("User-Agent", USER_AGENT)
            .send()
            .map_err(network_error)
            .and_then(parse_response)
    }

    fn config_path(&self) -> PathBuf {
        self.root.join("integrations").join("github.json")
    }

    fn read_config(&self) -> Result<GitHubConfig> {
        let path = self.config_path();
        if !path.exists() {
            return Ok(GitHubConfig {
                format_version: CONFIG_VERSION,
                ..Default::default()
            });
        }
        let bytes = fs::read(&path).map_err(|error| GitHubError::Config(error.to_string()))?;
        if bytes.len() > 64 * 1024 {
            return Err(GitHubError::Config("файл настроек превышает 64 КБ".into()));
        }
        let config: GitHubConfig = serde_json::from_slice(&bytes)
            .map_err(|error| GitHubError::Config(error.to_string()))?;
        if config.format_version != CONFIG_VERSION {
            return Err(GitHubError::Config(
                "неподдерживаемая версия настроек".into(),
            ));
        }
        Ok(config)
    }

    fn write_config(&self, config: &GitHubConfig) -> Result<()> {
        let path = self.config_path();
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).map_err(|error| GitHubError::Config(error.to_string()))?;
        }
        let bytes = serde_json::to_vec_pretty(config)
            .map_err(|error| GitHubError::Config(error.to_string()))?;
        let mut file = AtomicWriteFile::options()
            .open(path)
            .map_err(|error| GitHubError::Config(error.to_string()))?;
        file.write_all(&bytes)
            .map_err(|error| GitHubError::Config(error.to_string()))?;
        file.commit()
            .map_err(|error| GitHubError::Config(error.to_string()))
    }

    fn credentials(&self) -> Option<(String, String)> {
        let config = self.read_config().ok()?;
        let (client_id, slug, _) = self.resolved_credentials(&config);
        (!client_id.is_empty() && !slug.is_empty()).then_some((client_id, slug))
    }

    fn resolved_credentials(&self, config: &GitHubConfig) -> (String, String, bool) {
        if let Some((client_id, slug)) = managed_credentials() {
            return (client_id.to_owned(), slug.to_owned(), true);
        }
        (config.client_id.clone(), config.app_slug.clone(), false)
    }

    /// The GitHub App Client ID and slug are public identifiers, not credentials. Persisting
    /// them lets the bundled desktop app hand the same connector identity to a separately
    /// launched local MCP binary, including a later development build compiled without CI vars.
    fn persist_managed_identity(&self) -> Result<()> {
        let Some((client_id, app_slug)) = managed_credentials() else {
            return Ok(());
        };
        let mut config = self.read_config()?;
        if config.client_id == client_id && config.app_slug == app_slug {
            return Ok(());
        }
        config.client_id = client_id.to_owned();
        config.app_slug = app_slug.to_owned();
        self.write_config(&config)
    }
}

#[derive(Deserialize)]
struct TokenResponse {
    access_token: Option<String>,
    expires_in: Option<i64>,
    refresh_token: Option<String>,
    refresh_token_expires_in: Option<i64>,
    error: Option<String>,
    error_description: Option<String>,
}

#[derive(Deserialize)]
struct AccountResponse {
    login: String,
    #[serde(rename = "type")]
    kind: String,
}

#[derive(Deserialize)]
struct InstallationResponse {
    id: u64,
    account: AccountResponse,
    repository_selection: String,
    html_url: String,
}

#[derive(Deserialize)]
struct OwnerResponse {
    avatar_url: String,
}

#[derive(Deserialize)]
struct RepositoryResponse {
    id: u64,
    name: String,
    full_name: String,
    private: bool,
    html_url: String,
    description: Option<String>,
    default_branch: String,
    archived: bool,
    pushed_at: Option<DateTime<Utc>>,
    owner: OwnerResponse,
}

impl RepositoryResponse {
    fn into_public(self, installation_id: u64) -> GitHubRepository {
        GitHubRepository {
            id: self.id,
            installation_id,
            name: self.name,
            full_name: self.full_name,
            private: self.private,
            html_url: self.html_url,
            description: self.description,
            default_branch: self.default_branch,
            archived: self.archived,
            pushed_at: self.pushed_at,
            owner_avatar_url: self.owner.avatar_url,
        }
    }
}

#[derive(Deserialize)]
struct TreeEntryResponse {
    path: String,
    #[serde(rename = "type")]
    kind: String,
    size: Option<u64>,
    sha: String,
}

#[derive(Deserialize)]
struct FileResponse {
    path: String,
    content: String,
    encoding: String,
    size: u64,
    sha: String,
    html_url: Option<String>,
}

fn decode_file(response: FileResponse) -> Result<GitHubFile> {
    if response.encoding != "base64" {
        return Err(GitHubError::Response(
            "GitHub вернул файл не в base64".into(),
        ));
    }
    let compact = response.content.lines().collect::<String>();
    let bytes = STANDARD
        .decode(compact)
        .map_err(|error| GitHubError::Response(error.to_string()))?;
    if bytes.len() > 1_048_576 {
        return Err(GitHubError::Response(
            "файл больше безопасного лимита 1 МБ".into(),
        ));
    }
    if bytes.iter().take(8_192).any(|byte| *byte == 0) {
        return Err(GitHubError::Response(
            "коннектор читает только текстовые файлы".into(),
        ));
    }
    let content = String::from_utf8(bytes).map_err(|_| {
        GitHubError::Response("коннектор читает только UTF-8 текстовые файлы".into())
    })?;
    Ok(GitHubFile {
        path: response.path,
        content,
        size: response.size,
        sha: response.sha,
        html_url: response.html_url,
    })
}

#[derive(Deserialize)]
struct SearchItemResponse {
    path: String,
    html_url: String,
    #[serde(default)]
    text_matches: Vec<TextMatchResponse>,
}
#[derive(Deserialize)]
struct TextMatchResponse {
    fragment: String,
}

#[derive(Deserialize)]
struct UserResponse {
    login: String,
}

#[derive(Deserialize)]
struct LabelResponse {
    name: String,
}

#[derive(Deserialize)]
struct IssueResponse {
    number: u64,
    title: String,
    state: String,
    html_url: String,
    user: UserResponse,
    #[serde(default)]
    labels: Vec<LabelResponse>,
    updated_at: DateTime<Utc>,
    pull_request: Option<serde_json::Value>,
}
impl From<IssueResponse> for GitHubIssue {
    fn from(value: IssueResponse) -> Self {
        Self {
            number: value.number,
            title: value.title,
            state: value.state,
            html_url: value.html_url,
            author: value.user.login,
            labels: value.labels.into_iter().map(|label| label.name).collect(),
            updated_at: value.updated_at,
        }
    }
}

#[derive(Deserialize)]
struct BranchResponse {
    label: String,
}
#[derive(Deserialize)]
struct PullResponse {
    number: u64,
    title: String,
    state: String,
    #[serde(default)]
    draft: bool,
    html_url: String,
    user: UserResponse,
    head: BranchResponse,
    base: BranchResponse,
    updated_at: DateTime<Utc>,
}
impl From<PullResponse> for GitHubPullRequest {
    fn from(value: PullResponse) -> Self {
        Self {
            number: value.number,
            title: value.title,
            state: value.state,
            draft: value.draft,
            html_url: value.html_url,
            author: value.user.login,
            head: value.head.label,
            base: value.base.label,
            updated_at: value.updated_at,
        }
    }
}

fn managed_credentials() -> Option<(&'static str, &'static str)> {
    let client_id = option_env!("FLOOD_GITHUB_CLIENT_ID")?.trim();
    let slug = option_env!("FLOOD_GITHUB_APP_SLUG")?.trim();
    (!client_id.is_empty() && !slug.is_empty()).then_some((client_id, slug))
}

fn credential(account: &str) -> Result<Entry> {
    Entry::new(KEYRING_SERVICE, account).map_err(|error| GitHubError::Keyring(error.to_string()))
}

fn read_secret(account: &str) -> Result<Option<String>> {
    match credential(account)?.get_password() {
        Ok(value) => Ok(Some(value)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(error) => Err(GitHubError::Keyring(error.to_string())),
    }
}

fn write_secret(account: &str, value: &str) -> Result<()> {
    credential(account)?
        .set_password(value)
        .map_err(|error| GitHubError::Keyring(error.to_string()))
}

fn delete_secret(account: &str) -> Result<()> {
    match credential(account)?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(error) => Err(GitHubError::Keyring(error.to_string())),
    }
}

fn connector_account(account: &str, client_id: &str) -> Option<String> {
    let client_id = client_id.trim();
    (!client_id.is_empty()).then(|| format!("{account}:{client_id}"))
}

fn read_connector_secret(account: &str, client_id: &str) -> Result<Option<String>> {
    let Some(scoped_account) = connector_account(account, client_id) else {
        return Ok(None);
    };
    if let Some(value) = read_secret(&scoped_account)? {
        return Ok(Some(value));
    }
    let Some(legacy_value) = read_secret(account)? else {
        return Ok(None);
    };
    write_secret(&scoped_account, &legacy_value)?;
    delete_secret(account)?;
    Ok(Some(legacy_value))
}

fn write_connector_secret(account: &str, client_id: &str, value: &str) -> Result<()> {
    let scoped_account = connector_account(account, client_id).ok_or(GitHubError::Unconfigured)?;
    write_secret(&scoped_account, value)
}

fn delete_connector_secret(account: &str, client_id: &str) -> Result<()> {
    if let Some(scoped_account) = connector_account(account, client_id) {
        delete_secret(&scoped_account)?;
    }
    delete_secret(account)
}

fn network_error(error: reqwest::Error) -> GitHubError {
    GitHubError::Network(error.to_string())
}

fn parse_response<T: DeserializeOwned>(response: reqwest::blocking::Response) -> Result<T> {
    let status = response.status();
    let bytes = response.bytes().map_err(network_error)?;
    if !status.is_success() {
        let message = serde_json::from_slice::<serde_json::Value>(&bytes)
            .ok()
            .and_then(|value| {
                value
                    .get("message")
                    .and_then(|value| value.as_str())
                    .map(ToOwned::to_owned)
            })
            .unwrap_or_else(|| String::from_utf8_lossy(&bytes).chars().take(500).collect());
        return Err(GitHubError::Api {
            status: status.as_u16(),
            message,
        });
    }
    serde_json::from_slice(&bytes).map_err(|error| GitHubError::Response(error.to_string()))
}

pub fn parse_repository_url(value: &str) -> Option<String> {
    let mut path = value
        .trim()
        .strip_prefix("https://github.com/")?
        .trim_matches('/')
        .to_owned();
    if let Some(value) = path.strip_suffix(".git") {
        path = value.to_owned();
    }
    validate_full_name(&path).ok()?;
    Some(path)
}

fn validate_full_name(value: &str) -> Result<()> {
    let mut parts = value.split('/');
    let owner = parts.next().unwrap_or_default();
    let repository = parts.next().unwrap_or_default();
    if owner.is_empty()
        || repository.is_empty()
        || parts.next().is_some()
        || !owner.chars().all(valid_repository_char)
        || !repository.chars().all(valid_repository_char)
    {
        return Err(GitHubError::Config(
            "репозиторий должен иметь формат owner/name".into(),
        ));
    }
    Ok(())
}

fn repository_parts(value: &str) -> Result<(&str, &str)> {
    validate_full_name(value)?;
    value
        .split_once('/')
        .ok_or_else(|| GitHubError::Config("репозиторий должен иметь формат owner/name".into()))
}

fn github_api_url(parts: &[&str]) -> Url {
    let mut url = Url::parse("https://api.github.com").expect("статический GitHub API URL валиден");
    url.path_segments_mut()
        .expect("GitHub API URL поддерживает сегменты")
        .extend(parts.iter().copied());
    url
}

fn valid_repository_char(value: char) -> bool {
    value.is_ascii_alphanumeric() || matches!(value, '-' | '_' | '.')
}

fn clean_remote_path(value: &str) -> Result<String> {
    let value = value.trim().trim_matches('/').replace('\\', "/");
    if value.is_empty()
        || value
            .split('/')
            .any(|part| part.is_empty() || matches!(part, "." | ".."))
    {
        return Err(GitHubError::Config(
            "укажите относительный путь файла внутри репозитория".into(),
        ));
    }
    Ok(value)
}

fn path_looks_sensitive(value: &str) -> bool {
    value.split('/').any(|part| {
        let name = part.to_ascii_lowercase();
        name == ".env"
            || name.starts_with(".env.")
            || matches!(
                name.as_str(),
                "credentials"
                    | "credentials.json"
                    | "secrets"
                    | "secrets.json"
                    | "secrets.yml"
                    | "secrets.yaml"
                    | "id_rsa"
                    | "id_ed25519"
            )
            || [".pem", ".key", ".p12", ".pfx"]
                .iter()
                .any(|extension| name.ends_with(extension))
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn repository_urls_are_strict_and_normalized() {
        assert_eq!(
            parse_repository_url("https://github.com/openai/codex.git"),
            Some("openai/codex".into())
        );
        assert_eq!(
            parse_repository_url("https://example.com/openai/codex"),
            None
        );
        assert_eq!(
            parse_repository_url("https://github.com/openai/codex/issues"),
            None
        );
    }

    #[test]
    fn sensitive_paths_are_filtered() {
        assert!(path_looks_sensitive("config/.env.production"));
        assert!(path_looks_sensitive("keys/client.pem"));
        assert!(!path_looks_sensitive("src/config.ts"));
    }

    #[test]
    fn credential_accounts_are_scoped_to_the_github_app() {
        assert_eq!(
            connector_account("access-token", "Iv23Example"),
            Some("access-token:Iv23Example".into())
        );
        assert_eq!(connector_account("access-token", " "), None);
    }
}
