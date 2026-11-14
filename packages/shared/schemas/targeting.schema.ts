import { z } from "zod";

// One shared targeting shape, reused by every targetable admin-panel
// entity (HomeLayoutBlock, Advertisement, NotificationBroadcast,
// PopupCampaign, RemoteConfigEntry) — see ADR-007 in docs/02-architecture.md
// §11. All fields optional; an entity with no targetingRules (or an empty
// object) matches everyone. Every array is an OR within itself and an AND
// across fields — e.g. countryCodes: ["SD"], userRoles: ["PROVIDER"] means
// "providers in Sudan," not "providers OR Sudan."
export const targetingRulesSchema = z
  .object({
    countryCodes: z.array(z.string()),
    cityNames: z.array(z.string()),
    languages: z.array(z.string()),
    userRoles: z.array(z.enum(["CUSTOMER", "PROVIDER"])),
    serviceCategoryIds: z.array(z.string()),
    providerType: z.enum(["INDIVIDUAL", "COMPANY"]),
    userIds: z.array(z.string()),
    segmentId: z.string(),
  })
  .partial();

export type TargetingRules = z.infer<typeof targetingRulesSchema>;
