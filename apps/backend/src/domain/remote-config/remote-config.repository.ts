import type { RemoteConfigEntry, RemoteConfigValueType } from "./remote-config.entity";

export interface CreateRemoteConfigEntryInput {
  key: string;
  valueType: RemoteConfigValueType;
  value: unknown;
  regionId?: string;
  targetingRules?: Record<string, unknown>;
  description?: string;
  updatedById: string;
}

export interface UpdateRemoteConfigEntryInput {
  valueType?: RemoteConfigValueType;
  value?: unknown;
  targetingRules?: Record<string, unknown> | null;
  description?: string | null;
  updatedById: string;
}

export interface SearchRemoteConfigEntriesFilter {
  key?: string;
  includeDeleted?: boolean;
  limit?: number;
}

// Interface only — implemented in infrastructure/remote-config/prisma-remote-config.repository.ts.
export interface RemoteConfigRepository {
  create(input: CreateRemoteConfigEntryInput): Promise<RemoteConfigEntry>;
  findById(id: string): Promise<RemoteConfigEntry | null>;
  update(id: string, input: UpdateRemoteConfigEntryInput): Promise<RemoteConfigEntry>;
  softDelete(id: string): Promise<void>;
  search(filter: SearchRemoteConfigEntriesFilter): Promise<RemoteConfigEntry[]>;
  // Public, app-facing resolution: a region-scoped row for `regionId`
  // overrides the global (regionId: null) row for the same key. Soft-deleted
  // rows are never returned.
  resolveForRegion(regionId: string | null): Promise<RemoteConfigEntry[]>;
}
