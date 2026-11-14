// Shapes returned by the SAHL API's /admin/users endpoints (apps/api/app/routers/admin_users.py).
export type AdminUserStatus = "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "BANNED";
export type AdminAccountType = "CUSTOMER" | "PROVIDER" | "COMPANY";

export interface AdminUser {
  id: string;
  phone: string;
  email: string | null;
  fullName: string;
  preferredLanguage: string;
  status: AdminUserStatus;
  accountType: AdminAccountType;
  createdAt: string;
  suspendedAt: string | null;
}

export interface AdminUserList {
  users: AdminUser[];
  pendingApprovalCount: number;
}

export const STATUS_LABELS: Record<AdminUserStatus, string> = {
  PENDING_VERIFICATION: "Pending approval",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  BANNED: "Banned",
};

export const ACCOUNT_TYPE_LABELS: Record<AdminAccountType, string> = {
  CUSTOMER: "Customer",
  PROVIDER: "Provider",
  COMPANY: "Company",
};
