import { z } from "zod";
import { targetingRulesSchema } from "./targeting.schema";

// Matches RemoteConfigValueType in apps/backend/prisma/schema.prisma.
export const remoteConfigValueTypeSchema = z.enum(["BOOLEAN", "NUMBER", "STRING", "JSON"]);

export const createRemoteConfigEntrySchema = z.object({
  key: z.string().min(1).max(150),
  valueType: remoteConfigValueTypeSchema,
  value: z.unknown(),
  regionId: z.string().min(1).optional(),
  targetingRules: targetingRulesSchema.optional(),
  description: z.string().max(500).optional(),
});

export type CreateRemoteConfigEntryPayload = z.infer<typeof createRemoteConfigEntrySchema>;

export const updateRemoteConfigEntrySchema = z.object({
  valueType: remoteConfigValueTypeSchema.optional(),
  value: z.unknown().optional(),
  targetingRules: targetingRulesSchema.optional(),
  description: z.string().max(500).optional(),
});

export type UpdateRemoteConfigEntryPayload = z.infer<typeof updateRemoteConfigEntrySchema>;
