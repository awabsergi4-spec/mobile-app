import type { TargetingRules } from "@sahl/shared/schemas/targeting.schema";

export interface TargetingSubject {
  id: string;
  country: string | null;
  city: string | null;
  preferredLanguage: string;
  provider: { companyId: string | null; categoryIds: string[] } | null;
}

// Single-subject counterpart to infrastructure/notification/notification-target-resolver.ts's
// resolveUserIds — that one asks "which users match," this asks "does this
// one user match" (used to filter HomeLayoutBlock rows for the requesting
// user). Same AND-across-fields, OR-within-a-field contract as the shared
// targetingRulesSchema. An entity with no targetingRules matches everyone.
export function matchesTargetingRules(subject: TargetingSubject, rules: Record<string, unknown> | null | undefined): boolean {
  if (!rules || Object.keys(rules).length === 0) {
    return true;
  }
  const r = rules as TargetingRules;

  // No Segment model exists yet (see notification-target-resolver.ts) —
  // excluding rather than guessing keeps an unresolvable-segment block from
  // ever rendering to the wrong audience.
  if (r.segmentId) {
    return false;
  }

  if (r.userIds?.length && !r.userIds.includes(subject.id)) {
    return false;
  }
  if (r.countryCodes?.length && (!subject.country || !r.countryCodes.includes(subject.country))) {
    return false;
  }
  if (r.cityNames?.length && (!subject.city || !r.cityNames.includes(subject.city))) {
    return false;
  }
  if (r.languages?.length && !r.languages.includes(subject.preferredLanguage)) {
    return false;
  }

  const isProvider = subject.provider !== null;
  if (r.userRoles?.length) {
    const rolesMatch = (isProvider && r.userRoles.includes("PROVIDER")) || (!isProvider && r.userRoles.includes("CUSTOMER"));
    if (!rolesMatch) return false;
  }

  if (r.providerType || r.serviceCategoryIds?.length) {
    if (!subject.provider) return false;
    if (r.providerType === "COMPANY" && !subject.provider.companyId) return false;
    if (r.providerType === "INDIVIDUAL" && subject.provider.companyId) return false;
    if (r.serviceCategoryIds?.length && !r.serviceCategoryIds.some((id) => subject.provider!.categoryIds.includes(id))) {
      return false;
    }
  }

  return true;
}
