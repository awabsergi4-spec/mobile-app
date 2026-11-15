import type { MessageKey } from "@/presentation/i18n/en";

const ERROR_KEYS: Record<string, MessageKey> = {
  invalid_credentials: "login.error.invalidCredentials",
  account_not_active: "login.error.accountNotActive",
  pending_approval: "login.error.pendingApproval",
  api_unreachable: "login.error.apiUnreachable",
  not_staff: "login.error.notStaff",
  unknown: "login.error.unknown",
};

export function adminLoginErrorKey(code: string | undefined): MessageKey | null {
  if (!code) return null;
  return ERROR_KEYS[code] ?? ERROR_KEYS.unknown ?? null;
}
