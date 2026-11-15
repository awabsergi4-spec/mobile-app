import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/presentation/admin-session";
import { adminNavSections } from "@/presentation/admin-ui/nav-config";
import { LocaleSwitch } from "@/presentation/admin-ui/locale-switch";
import { getI18n } from "@/presentation/i18n";
import { adminLogoutAction } from "../logout-action";

// Wraps every /admin/* page except /admin/login. Session check here is
// the single gate — individual pages additionally call
// requireAdminPermission() for their own specific permission, since a
// signed-in staff member with SOME permissions may still lack the one a
// given page needs (fail-closed per page, not just per app).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  const { t } = await getI18n();

  return (
    <div className="flex min-h-screen bg-background-light">
      <aside className="w-64 shrink-0 border-e border-text-disabled/20 bg-surface-light">
        <div className="px-5 py-6">
          <span className="text-lg font-semibold text-primary">{t("app.title")}</span>
        </div>
        <nav className="space-y-6 px-3">
          {adminNavSections.map((section) => {
            const visibleItems = section.items.filter((item) => session.permissionKeys.includes(item.permissionKey));
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.titleKey}>
                <p className="px-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">{t(section.titleKey)}</p>
                <div className="mt-1 space-y-0.5">
                  {visibleItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-button px-3 py-2 text-sm text-text-primary hover:bg-primary/10"
                    >
                      {t(item.labelKey)}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-end gap-4 border-b border-text-disabled/20 bg-surface-light px-6 py-3">
          <LocaleSwitch />
          <form action={adminLogoutAction}>
            <button type="submit" className="text-sm font-medium text-text-secondary hover:text-error">
              {t("app.signOut")}
            </button>
          </form>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
