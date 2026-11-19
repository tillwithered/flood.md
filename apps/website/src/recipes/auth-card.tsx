"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  Alert, Button, Card, Checkbox, Divider, Field, Heading, IconSlot, Inline, Input, Link,
  PasswordInput, PinInput, Stack, Text,
} from "@flood-md/react";

export type AuthEntryMode = "sign-in" | "register";
export interface AuthChallenge {
  /** Opaque ID issued by the host for this challenge. */
  id: string;
  /** Display-safe destination, for example a masked email address. */
  destination: string;
}
export type AuthRequest =
  | { type: "sign-in"; email: string; password: string; remember: boolean }
  | { type: "register"; email: string; password: string }
  | { type: "verify"; challenge: AuthChallenge; code: string }
  | { type: "provider"; providerId: string; mode: AuthEntryMode };
export type AuthResult =
  | { status: "verified" }
  | { status: "verify"; challenge: AuthChallenge }
  | { status: "error"; message: string };
export interface AuthProviderAction {
  id: string;
  label: string;
  icon?: ReactNode;
}
export interface AuthCardRecipeProps {
  onSubmit: (request: AuthRequest, signal: AbortSignal) => Promise<AuthResult>;
  onResend?: (challenge: AuthChallenge, signal: AbortSignal) => Promise<AuthResult>;
  onVerified?: () => void;
  providers?: readonly AuthProviderAction[];
  initialMode?: AuthEntryMode;
  forgotPasswordHref?: string;
  showRemember?: boolean;
  verificationHint?: ReactNode;
  successTitle?: string;
}

export function AuthCardRecipe({
  onSubmit, onResend, onVerified, providers = [], initialMode = "sign-in",
  forgotPasswordHref, showRemember = false, verificationHint, successTitle = "You're signed in",
}: AuthCardRecipeProps) {
  const titleId = useId();
  const [mode, setMode] = useState(initialMode);
  const [challenge, setChallenge] = useState<AuthChallenge>();
  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState<string>();
  const [error, setError] = useState<{ action: string; message: string }>();
  const [notice, setNotice] = useState<string>();
  const operation = useRef<AbortController | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const verificationCode = useRef<HTMLInputElement>(null);
  const codeErrorId = useId();
  const step = verified ? "complete" : challenge ? "verify" : mode;
  const previousStep = useRef(step);

  useEffect(() => () => {
    operation.current?.abort();
    operation.current = null;
  }, []);
  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    heading.current?.focus({ preventScroll: true });
  }, [step]);

  async function perform(
    action: string,
    request: (signal: AbortSignal) => Promise<AuthResult>,
  ) {
    if (operation.current) return;
    const controller = new AbortController();
    operation.current = controller;
    setPending(action);
    setError(undefined);
    setNotice(undefined);
    let result: AuthResult;
    try {
      result = await request(controller.signal);
    } catch {
      result = { status: "error", message: "Something went wrong. Try again." };
    }
    if (operation.current !== controller || controller.signal.aborted) return;
    operation.current = null;
    setPending(undefined);
    if (result.status === "error") {
      setError({ action, message: result.message });
      if (challenge && action === "form") verificationCode.current?.focus();
      return;
    }
    if (result.status === "verify") {
      setChallenge(result.challenge);
      if (action === "resend") setNotice("A new code was sent.");
      return;
    }
    setVerified(true);
    onVerified?.();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (operation.current) return;
    const data = new FormData(event.currentTarget);
    let request: AuthRequest;
    if (challenge) {
      request = { type: "verify", challenge, code: String(data.get("code") ?? "") };
    } else {
      const submittedEmail = String(data.get("email") ?? "").trim();
      const password = String(data.get("password") ?? "");
      request = mode === "sign-in"
        ? { type: mode, email: submittedEmail, password, remember: data.has("remember") }
        : { type: mode, email: submittedEmail, password };
    }
    void perform("form", signal => onSubmit(request, signal));
  }

  function switchEntry() {
    setError(undefined);
    setNotice(undefined);
    if (challenge) {
      setChallenge(undefined);
      return;
    }
    setMode(current => current === "sign-in" ? "register" : "sign-in");
  }

  const title = verified ? successTitle : challenge ? "Verify your email" : mode === "sign-in" ? "Sign in" : "Create an account";
  const hasCodeError = Boolean(challenge && error?.action === "form");
  return <Card style={{ inlineSize: "100%", maxInlineSize: "27rem", marginInline: "auto", boxSizing: "border-box" }}>
    <Stack gap="4">
      <Heading ref={heading} id={titleId} tabIndex={-1} size="section">{title}</Heading>
      {!verified && <>
        {challenge && <Text as="p" size="compact" tone="subtle" style={{ overflowWrap: "anywhere" }}>
          Enter the code sent to <bdi>{challenge.destination}</bdi>.
        </Text>}
        <form key={step} aria-labelledby={titleId} onSubmit={submit}>
          <Stack gap="3">
            {error && <Alert id={hasCodeError ? codeErrorId : undefined} tone="error" announcement="polite">{error.message}</Alert>}
            {challenge ? <>
              <PinInput key={challenge.id} ref={verificationCode} label="Verification code" name="code" required
                aria-describedby={hasCodeError ? codeErrorId : undefined} invalid={hasCodeError} readOnly={Boolean(pending)} />
              {verificationHint && <Text as="div" size="helper" tone="subtle">{verificationHint}</Text>}
            </> : <>
              <Field label="Email" required>{control => <Input {...control} type="email" name="email"
                autoComplete="email" inputMode="email" value={email} onChange={event => setEmail(event.currentTarget.value)}
                readOnly={Boolean(pending)} />}</Field>
              <Field label="Password" required labelAside={mode === "sign-in" && forgotPasswordHref
                ? <Link href={forgotPasswordHref}>Forgot password?</Link> : undefined}>
                {control => <PasswordInput {...control} name="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                  readOnly={Boolean(pending)} />}
              </Field>
              {showRemember && mode === "sign-in" && <Checkbox label="Keep me signed in" name="remember" disabled={Boolean(pending)} />}
            </>}
            <Button type="submit" style={{ inlineSize: "100%" }} disabled={Boolean(pending && pending !== "form")} loading={pending === "form" ? "retain-focus" : false}>
              {challenge ? "Verify code" : title}
            </Button>
          </Stack>
        </form>
        {notice && <Text role="status" size="compact">{notice}</Text>}
        {!challenge && providers.length > 0 && <>
          <Divider />
          <Stack gap="2" role="group" aria-label="Other ways to continue">
            {providers.map(({ id, label, icon }) => {
              const action = `provider:${id}`;
              return <Button key={id} type="button" variant="outline" style={{ inlineSize: "100%" }} disabled={Boolean(pending && pending !== action)}
                loading={pending === action ? "retain-focus" : false} onClick={() => void perform(action, signal => onSubmit({ type: "provider", providerId: id, mode }, signal))}>
                {icon && <IconSlot>{icon}</IconSlot>}
                {label}
              </Button>;
            })}
          </Stack>
        </>}
        <Inline gap="2" style={{ flexWrap: "wrap" }}>
          {challenge && onResend && <Button type="button" size="sm" variant="outline" disabled={Boolean(pending && pending !== "resend")}
            loading={pending === "resend" ? "retain-focus" : false} onClick={() => void perform("resend", signal => onResend(challenge, signal))}>
            Send another code
          </Button>}
          <Button type="button" size="sm" variant="ghost" disabled={Boolean(pending)} onClick={switchEntry}>
            {challenge ? "Use another email" : mode === "sign-in" ? "Create an account" : "Back to sign in"}
          </Button>
        </Inline>
      </>}
    </Stack>
  </Card>;
}

export function AuthCardExample() {
  return <AuthCardRecipe
    successTitle="Demo complete"
    verificationHint="Use 123456 in this local example."
    onSubmit={async request => {
      if (request.type === "verify") return request.code === "123456"
        ? { status: "verified" } : { status: "error", message: "That code did not work. Try again." };
      if (request.type === "register") return {
        status: "verify", challenge: { id: "example-challenge", destination: request.email },
      };
      return { status: "verified" };
    }}
    onResend={async challenge => ({ status: "verify", challenge })}
    providers={[{ id: "sample", label: "Continue with example SSO" }]} />;
}
