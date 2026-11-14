export type RemoteConfigValueType = "BOOLEAN" | "NUMBER" | "STRING" | "JSON";

export interface RemoteConfigEntry {
  id: string;
  key: string;
  valueType: RemoteConfigValueType;
  value: unknown;
  regionId: string | null;
  targetingRules: Record<string, unknown> | null;
  description: string | null;
  deletedAt: Date | null;
  updatedAt: Date;
  updatedById: string | null;
}
