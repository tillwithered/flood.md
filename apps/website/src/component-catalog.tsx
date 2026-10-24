import content from "./generated/content.json";

export interface ComponentPage {
  slug: string;
  name: string;
  group: string;
  description: string;
  code: string;
  imports: string[];
  notes: string[];
  api: Array<[string, string, string]>;
  contract?: { props: Array<{ name: string; options?: Array<string | number | boolean>; defaultLiteral?: string | number | boolean }> };
}

export const componentPages: ComponentPage[] = content.components.map(page => ({
  ...page,
  api: page.api.map(([name, type, fallback]) => [name, type, fallback] as [string, string, string]),
}));
