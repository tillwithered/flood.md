export type KnowledgeKind = 'guide' | 'workflow' | 'reference' | 'component' | 'recipe' | 'token';
export interface KnowledgeGroup { id: string; name: string; description: string; }
export interface KnowledgeCapability { id: string; status: 'available' | 'not-provided'; description: string; materials: string[]; }
export interface KnowledgeMaterial {
  id: string; kind: KnowledgeKind; name: string; description: string; groups: string[];
  status: 'available'; file: string; bytes: number; sha256: string; links: string[];
  requires: string[]; installedTarget?: string;
}
export interface KnowledgeCatalog { schemaVersion: 1; version: string; groups: KnowledgeGroup[]; capabilities: KnowledgeCapability[]; materials: KnowledgeMaterial[]; }
export type KnowledgeSummary = Omit<KnowledgeMaterial, 'file' | 'bytes' | 'sha256' | 'links' | 'installedTarget'> & {relatedCount: number};
export interface KnowledgePage {
  schemaVersion: 1; version: string; fingerprint: string;
  query: {kind: KnowledgeKind | null; group: string | null; search: string};
  total: number; items: KnowledgeSummary[]; truncated: boolean; nextCursor: string | null;
}
export interface KnowledgeRead extends KnowledgeSummary {
  schemaVersion: 1; version: string; fingerprint: string; source: 'package'; sha256: string;
  installedTarget: string | null; links: string[]; linksOffset: number; nextLinksOffset: number | null; text: string; offset: number;
  totalCharacters: number; truncated: boolean; nextOffset: number | null;
}
export interface KnowledgeInfo {
  schemaVersion: 1; version: string; fingerprint: string; materialCount: number;
  groups: (KnowledgeGroup & {count:number})[]; kinds: {kind:KnowledgeKind; count:number}[];
  capabilities: KnowledgeCapability[];
}
export interface KnowledgeReader {
  info(): Promise<KnowledgeInfo>;
  list(query?: {kind?: KnowledgeKind; group?: string; search?: string; limit?: number; cursor?: string}): Promise<KnowledgePage>;
  /** Offsets and lengths count Unicode code points, not UTF-8 bytes. */
  read(id: string, range?: {offset?: number; length?: number; linksOffset?: number}): Promise<KnowledgeRead>;
}
export function validateKnowledgeCatalog(catalog: unknown): KnowledgeCatalog;
export function createKnowledgeReader(options?: {root?: string}): KnowledgeReader;
