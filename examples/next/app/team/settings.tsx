"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  Button, Checkbox, Divider, Field, FloodRoot, Heading, Inline, Input,
  Link, Radio, Stack, Surface, Switch, Text, Textarea,
} from "@flood-md/react";

type Member = { email: string; name: string; role: "Владелец" | "Редактор" | "Наблюдатель" };
const initialMembers: Member[] = [
  { name: "Александр", email: "alex@example.com", role: "Владелец" },
  { name: "Мария", email: "maria@example.com", role: "Редактор" },
];

/** A local example of composing Flood APIs; no invitation or save requests are sent. */
export function TeamSettings({ layout = "grouped" }: { layout?: "grouped" | "split" } = {}) {
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [members, setMembers] = useState(initialMembers);
  const [inviteError, setInviteError] = useState("");
  const [inviteStatus, setInviteStatus] = useState("");
  const projectInput = useRef<HTMLInputElement>(null);
  const emailInput = useRef<HTMLInputElement>(null);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    if (!name) {
      setError("Укажите название команды");
      setStatus("");
      projectInput.current?.focus();
      return;
    }
    setError("");
    setSubmitted(JSON.stringify(Object.fromEntries(data)));
    setStatus(`Настройки «${name}» сохранены в демо`);
  }

  function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const invalid = !email || !emailInput.current?.validity.valid;
    const duplicate = members.some((member) => member.email.toLowerCase() === email);
    if (invalid || duplicate) {
      setInviteError(duplicate ? "Этот участник уже в команде" : "Укажите корректный email");
      setInviteStatus("");
      emailInput.current?.focus();
      return;
    }
    const role = data.get("role") === "viewer" ? "Наблюдатель" : "Редактор";
    setMembers((previous) => [...previous, { email, name: email.split("@")[0], role }]);
    setInviteError("");
    setInviteStatus(`${email} добавлен в демо. Письмо не отправлено.`);
    form.reset();
    emailInput.current?.focus();
  }

  return (
    <FloodRoot lang="ru" id="team-root" data-layout={layout} style={{ minHeight: "100vh" }}>
      <style>{`
        #team-root .team-shell { max-inline-size: 72rem; margin-inline: auto; padding: var(--flood-sys-space-6); }
        #team-root .team-header, #team-root .team-member { justify-content: space-between; }
        #team-root .team-grid { display: grid; grid-template-columns: minmax(0, 1fr); max-inline-size: 48rem; gap: var(--flood-sys-space-6); align-items: start; }
        #team-root[data-layout="split"] .team-grid { grid-template-columns: minmax(0, 1.25fr) minmax(18rem, 1fr); max-inline-size: none; }
        #team-root .team-main { padding-block: var(--flood-sys-space-8); }
        #team-root .team-caption { max-inline-size: 42rem; }
        #team-root .team-member-copy { flex: 1 1 10rem; min-inline-size: 0; }
        #team-root .team-member-email { overflow-wrap: anywhere; }
        #team-root .team-form { margin: 0; }
        #team-root .team-roles { margin: 0; padding: 0; border: 0; min-inline-size: 0; }
        #team-root .team-roles legend { margin-block-end: var(--flood-sys-space-2); }
        #team-root .team-status { min-block-size: 1.5rem; overflow-wrap: anywhere; }
        #team-root .team-switch { display: flex; inline-size: 100%; }
        @media (max-width: 54rem) { #team-root[data-layout="split"] .team-grid { grid-template-columns: minmax(0, 1fr); } }
        @media (max-width: 28rem) { #team-root .team-shell { padding: var(--flood-sys-space-4); } }
      `}</style>
      <div className="team-shell">
        <Stack gap="6">
          <header>
          <Inline className="team-header" gap="4">
            <Text size="compact" style={{ fontWeight: 500 }}>flood.md / workspace</Text>
            <Text size="helper" tone="subtle">Демонстрация компонентов</Text>
          </Inline>
          </header>
          <Divider />
          <main className="team-main">
            <Stack gap="8">
              <Stack gap="3">
                <Text size="helper" tone="subtle">Рабочее пространство</Text>
                <Heading level={1} size="large">Настройки команды</Heading>
                <Text as="p" size="compact" tone="subtle" className="team-caption">
                  Люди, доступ и немного порядка. Изменения работают только на этой странице
                  и исчезнут после перезагрузки; письма не отправляются.
                </Text>
                <nav aria-label="Разделы настроек">
                  <Inline gap="6">
                    <Link href="#general">Общие</Link>
                    <Link href="#members">Участники</Link>
                  </Inline>
                </nav>
              </Stack>
              <div className="team-grid">
                <section id="general" aria-labelledby="general-title">
                  <Surface padding="6">
                    <Stack gap="6">
                      <Stack gap="2">
                        <Heading level={2} size="section" id="general-title">Общие настройки</Heading>
                        <Text as="p" size="compact" tone="subtle">Как команда выглядит для её участников.</Text>
                      </Stack>
                      <form className="team-form" noValidate onSubmit={save} onReset={() => { setError(""); setStatus(""); setSubmitted(""); }}>
                        <Stack gap="6">
                          <Field id="team-name" label="Название команды" required hint="Будет видно всем участникам" error={error}>
                            {(props) => <Input {...props} ref={projectInput} name="name" defaultValue="Flood studio" autoComplete="organization" />}
                          </Field>
                          <Field id="team-description" label="Описание команды" hint="Коротко о том, что вы создаёте вместе">
                            {(props) => <Textarea {...props} name="description" defaultValue="Делаем чистые интерфейсы и необычные детали." rows={3} />}
                          </Field>
                          <Divider />
                          <Stack gap="3">
                            <Switch label="Публичный профиль команды" name="public" value="yes" className="team-switch" />
                            <Text as="p" size="helper" tone="subtle">Участники смогут поделиться ссылкой на команду.</Text>
                            <Checkbox label="Получать новости проекта на почту" name="updates" value="yes" defaultChecked />
                          </Stack>
                          <Inline gap="2">
                            <Button type="submit">Сохранить изменения</Button>
                            <Button type="reset" variant="subtle">Сбросить</Button>
                          </Inline>
                          <Text as="p" size="compact" className="team-status" role="status">{status}</Text>
                          <output data-testid="team-form-data" hidden>{submitted}</output>
                        </Stack>
                      </form>
                    </Stack>
                  </Surface>
                </section>
                <section id="members" aria-labelledby="members-title">
                  <Surface padding="6">
                    <Stack gap="6">
                      <Stack gap="2">
                        <Inline className="team-header" gap="2">
                          <Heading level={2} size="section" id="members-title">Участники</Heading>
                          <Text size="helper" tone="subtle">Всего: {members.length}</Text>
                        </Inline>
                        <Text as="p" size="compact" tone="subtle">У каждого — своё место в команде.</Text>
                      </Stack>
                      <Stack gap="4" role="list" aria-label="Участники команды">
                        {members.map((member) => (
                          <Inline key={member.email} role="listitem" gap="3" className="team-member">
                            <Stack gap="1" className="team-member-copy">
                              <Text size="compact">{member.name}</Text>
                              <Text size="helper" tone="subtle" className="team-member-email">{member.email}</Text>
                              <Text size="helper" tone="subtle">{member.role}</Text>
                            </Stack>
                            <Button size="sm" variant="subtle" disabled={member.role === "Владелец"}
                              aria-label={`Удалить ${member.email}`} onClick={() => {
                                setMembers((previous) => previous.filter((item) => item.email !== member.email));
                                setInviteStatus(`${member.email} удалён из демо`);
                              }}>Удалить</Button>
                          </Inline>
                        ))}
                      </Stack>
                      <Divider />
                      <form className="team-form" noValidate onSubmit={invite} aria-label="Добавить участника">
                        <Stack gap="4">
                          <Field id="member-email" label="Email нового участника" required error={inviteError}>
                            {(props) => <Input {...props} ref={emailInput} type="email" name="email" autoComplete="email" placeholder="name@example.com" />}
                          </Field>
                          <fieldset className="team-roles">
                            <legend><Text size="label">Роль в команде</Text></legend>
                            <Inline gap="4">
                              <Radio label="Редактор" name="role" value="editor" defaultChecked />
                              <Radio label="Наблюдатель" name="role" value="viewer" />
                            </Inline>
                          </fieldset>
                          <Button type="submit" variant="subtle">Добавить в демо</Button>
                          <Text as="p" size="helper" tone="subtle" className="team-status" role="status">{inviteStatus}</Text>
                        </Stack>
                      </form>
                    </Stack>
                  </Surface>
                </section>
              </div>
            </Stack>
          </main>
        </Stack>
      </div>
    </FloodRoot>
  );
}
