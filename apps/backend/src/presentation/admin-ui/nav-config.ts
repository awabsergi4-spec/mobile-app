// Single source of truth for the Admin Platform's sidebar — one entry per
// module named in docs/00-admin-panel-spec.md §4. `permissionKey` gates
// visibility (fail-closed: an item is hidden unless the session actually
// has that key, never shown-then-blocked). Not every href has a built page
// yet — see docs/07-roadmap.md for what's landed vs. still Phase C/D/E.
export interface AdminNavItem {
  label: string;
  href: string;
  permissionKey: string;
}

export const adminNavSections: { title: string; items: AdminNavItem[] }[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/admin/dashboard", permissionKey: "dashboard.view" }],
  },
  {
    title: "Operations",
    items: [
      { label: "Users", href: "/admin/users", permissionKey: "users.manage" },
      { label: "Providers", href: "/admin/providers", permissionKey: "providers.manage" },
      { label: "Companies", href: "/admin/companies", permissionKey: "companies.manage" },
      { label: "Services", href: "/admin/services", permissionKey: "services.manage" },
      { label: "Service Listings", href: "/admin/listings", permissionKey: "services.manage" },
      { label: "Categories", href: "/admin/categories", permissionKey: "services.manage" },
    ],
  },
  {
    title: "Configuration",
    items: [
      { label: "Advertisements", href: "/admin/advertisements", permissionKey: "advertisements.manage" },
      { label: "Notifications", href: "/admin/notifications", permissionKey: "notifications.manage" },
      { label: "Promotions", href: "/admin/promotions", permissionKey: "promotions.manage" },
      { label: "Remote Config", href: "/admin/config", permissionKey: "config.manage" },
      { label: "AI Features", href: "/admin/ai", permissionKey: "ai.manage" },
      { label: "Workflows", href: "/admin/workflows", permissionKey: "workflows.manage" },
    ],
  },
  {
    title: "Finance",
    items: [{ label: "Financial Core", href: "/admin/finance", permissionKey: "finance.manage" }],
  },
  {
    title: "Compliance",
    items: [{ label: "Audit Logs", href: "/admin/audit-logs", permissionKey: "audit.view" }],
  },
];
