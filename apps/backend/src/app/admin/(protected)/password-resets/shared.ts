import type { MessageKey } from "@/presentation/i18n/en";

// Shapes returned by the SAHL API's /admin/password-resets endpoints
// (apps/api/app/routers/password_reset.py).
export const RESET_CODE_COOKIE = "sahl_reset_code";

export type ResetTab = "WAITING" | "CODE_ISSUED" | "DONE";
export type ResetStatus = "WAITING" | "CODE_ISSUED" | "COMPLETED" | "EXPIRED" | "CANCELLED";

export interface ResetRequest {
  id: string;
  status: ResetStatus;
  requestedAt: string;
  expiresAt: string;
  attempts: number;
  userId: string;
  fullName: string | null;
  phone: string | null;
}

export const RESET_TABS: ResetTab[] = ["WAITING", "CODE_ISSUED", "DONE"];

export const RESET_TAB_KEYS: Record<ResetTab, MessageKey> = {
  WAITING: "resets.tab.WAITING",
  CODE_ISSUED: "resets.tab.CODE_ISSUED",
  DONE: "resets.tab.DONE",
};

export const RESET_STATUS_KEYS: Record<ResetStatus, MessageKey> = {
  WAITING: "resets.status.WAITING",
  CODE_ISSUED: "resets.status.CODE_ISSUED",
  COMPLETED: "resets.status.COMPLETED",
  EXPIRED: "resets.status.EXPIRED",
  CANCELLED: "resets.status.CANCELLED",
};
