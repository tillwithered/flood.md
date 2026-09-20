import type { MessageKey } from "../i18n";

export type ConnectorProvider = "telegram" | "github";
export type ConnectorLogoProvider = ConnectorProvider | "mcp";
export type ConnectorTone = "idle" | "connected" | "attention" | "error";

export type ConnectorCapability =
  | "source_catalog"
  | "timeline"
  | "threads"
  | "actors"
  | "search"
  | "read"
  | "media"
  | "changes"
  | "write";

export type ConnectorCatalogEntry = {
  descriptor: {
    contract_version: number;
    id: ConnectorProvider;
    display_name: string;
    description: string;
    category: "communication" | "code" | "design" | "documents" | "local" | "other";
    auth_kind: "none" | "local_session" | "device_flow" | "oauth";
    capabilities: ConnectorCapability[];
    supports_project_binding: boolean;
  };
  status: {
    connector_id: ConnectorProvider;
    health: "disconnected" | "connecting" | "ready" | "attention" | "error";
    configured: boolean;
    account_label?: string;
    detail?: string;
    observed_at: string;
  };
  linked_projects: number;
  linked_sources: number;
};

export type ConnectorUiDefinition = {
  id: ConnectorProvider;
  title: string;
  descriptionKey: MessageKey;
  idleKey: MessageKey;
};

export const connectorUiRegistry: readonly ConnectorUiDefinition[] = [
  {
    id: "telegram",
    title: "Telegram",
    descriptionKey: "telegramConnectorDescription",
    idleKey: "telegramConnectorIdle"
  },
  {
    id: "github",
    title: "GitHub",
    descriptionKey: "githubConnectorDescription",
    idleKey: "githubConnectorIdle"
  }
] as const;

export function isConnectorProvider(value: string): value is ConnectorProvider {
  return connectorUiRegistry.some((connector) => connector.id === value);
}
