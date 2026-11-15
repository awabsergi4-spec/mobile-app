import { redirect } from "next/navigation";
import { getAdminSession } from "@/presentation/admin-session";
import { LocaleSwitch } from "@/presentation/admin-ui/locale-switch";
import { getI18n } from "@/presentation/i18n";
import { adminLoginAction } from "./actions";
import { adminLoginErrorKey } from "./error-messages";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin/dashboard");
  }

  const { t } = await getI18n();
  const { error } = await searchParams;
  const errorKey = adminLoginErrorKey(error);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background-light px-4">
      <div className="w-full max-w-sm rounded-card bg-surface-light p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">{t("app.title")}</h1>
            <p className="mt-1 text-sm text-text-secondary">{t("login.subtitle")}</p>
          </div>
          <LocaleSwitch />
        </div>

        {errorKey && (
          <div className="mt-4 rounded-lg bg-error/10 px-3 py-2 text-sm text-error" role="alert">
            {t(errorKey)}
          </div>
        )}

        <form action={adminLoginAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="login" className="block text-sm font-medium text-text-primary">
              {t("login.emailOrPhone")}
            </label>
            <input
              id="login"
              name="login"
              type="text"
              inputMode="email"
              required
              autoComplete="username"
              dir="ltr"
              className="mt-1 w-full rounded-button border border-text-disabled/40 px-3 py-2 text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-primary">
              {t("login.password")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              dir="ltr"
              className="mt-1 w-full rounded-button border border-text-disabled/40 px-3 py-2 text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-button bg-primary px-4 py-2 font-medium text-white transition hover:bg-secondary"
          >
            {t("login.submit")}
          </button>
        </form>
      </div>
    </main>
  );
}
