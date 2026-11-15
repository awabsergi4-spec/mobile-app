import type { MessageKey } from "@/presentation/i18n/en";

// Single source of truth for the Admin Platform's sidebar — one entry per
// module named in docs/00-admin-panel-spec.md §4. `permissionKey` gates
// visibility (fail-closed: an item is hidden unless the session actually
// has that key, never shown-then-blocked). Labels are i18n keys.
export interface AdminNavItem {
  labelKey: MessageKey;
  href: string;
  permissionKey: string;
}

export const adminNavSections: { titleKey: MessageKey; items: AdminNavItem[] }[] = [
  {
    titleKey: "nav.overview",
    items: [{ labelKey: "nav.dashboard", href: "/admin/dashboard", permissionKey: "dashboard.view" }],
  },
  {
    titleKey: "nav.operations",
    items: [
      { labelKey: "nav.users", href: "/admin/users", permissionKey: "users.manage" },
      { labelKey: "nav.passwordResets", href: "/admin/password-resets", permissionKey: "users.manage" },
      { labelKey: "nav.providers", href: "/admin/providers", permissionKey: "providers.manage" },
      { labelKey: "nav.companies", href: "/admin/companies", permissionKey: "companies.manage" },
      { labelKey: "nav.services", href: "/admin/services", permissionKey: "services.manage" },
      { labelKey: "nav.listings", href: "/admin/listings", permissionKey: "services.manage" },
      { labelKey: "nav.categories", href: "/admin/categories", permissionKey: "services.manage" },
    ],
  },
  {
    titleKey: "nav.configuration",
    items: [
      { labelKey: "nav.advertisements", href: "/admin/advertisements", permissionKey: "advertisements.manage" },
      { labelKey: "nav.notifications", href: "/admin/notifications", permissionKey: "notifications.manage" },
      { labelKey: "nav.promotions", href: "/admin/promotions", permissionKey: "promotions.manage" },
      { labelKey: "nav.remoteConfig", href: "/admin/config", permissionKey: "config.manage" },
      { labelKey: "nav.ai", href: "/admin/ai", permissionKey: "ai.manage" },
      { labelKey: "nav.workflows", href: "/admin/workflows", permissionKey: "workflows.manage" },
    ],
  },
  {
    titleKey: "nav.finance",
    items: [{ labelKey: "nav.financialCore", href: "/admin/finance", permissionKey: "finance.manage" }],
  },
  {
    titleKey: "nav.compliance",
    items: [{ labelKey: "nav.auditLogs", href: "/admin/audit-logs", permissionKey: "audit.view" }],
  },
];
