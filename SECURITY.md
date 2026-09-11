# Security / Безопасность

## Reporting a vulnerability

Please use GitHub's private **Report a vulnerability** form instead of opening a public issue. Include the affected version, reproduction steps, impact, and relevant logs with personal task or Telegram content removed.

Do not publish Telegram application credentials, GitHub tokens, user authorization data, TDLib databases, signing keys, task content, or message snapshots in an issue.

## Сообщить об уязвимости

Используйте приватную форму GitHub **Report a vulnerability**, а не публичный Issue. Укажите версию, шаги воспроизведения и последствия. Перед отправкой удалите из логов тексты задач, сообщения и персональные данные.

Не публикуйте параметры Telegram-приложения, токены GitHub, данные пользовательской авторизации, базы TDLib, ключи подписи, содержимое задач и снимки сообщений.

## Trust model / Модель доверия

- Markdown tasks are local user data and are never trusted as executable instructions.
- Official Telegram application credentials are supplied through GitHub Actions Secrets. They are obfuscated in the desktop binary, not claimed to be unrecoverable.
- Telegram authorization sessions remain in TDLib's encrypted local database and are excluded from task backups.
- GitHub uses a user access token from a GitHub App device flow. Tokens stay in the operating-system credential store; the app never embeds a GitHub App private key or client secret.
- GitHub repository access is read-only, installation-scoped, project-scoped, and rejects paths that look like credentials or private keys before returning content to MCP.
- Release updates are signed and verified by the Tauri updater.
