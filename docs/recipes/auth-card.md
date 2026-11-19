# Auth card

Compose a native form using Field, Input, PasswordInput, and PinInput. Credentials and codes are submitted to a host callback. The host issues challenges, verifies credentials, starts provider redirects, handles rate limits, and manages the resulting session. For rejected credentials, return a safe message without confirming whether an email address is registered.

<!-- flood:auth-card -->

Use the sign-in form for existing users and registration for new users. Show verification after the host returns a challenge with an opaque ID and a destination safe to display. Allow users to return to the previous form and edit the email. Avoid storing passwords or verification codes in browser storage.

Check sign-in, registration, an invalid code and retry, and an optional provider action. The local example runs without a backend and accepts `123456` for registration verification.
