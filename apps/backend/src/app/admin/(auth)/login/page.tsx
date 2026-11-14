import { redirect } from "next/navigation";
import { getAdminSession } from "@/presentation/admin-session";
import { adminLoginAction } from "./actions";
import { adminLoginErrorMessage } from "./error-messages";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin/dashboard");
  }

  const { error } = await searchParams;
  const errorMessage = adminLoginErrorMessage(error);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background-light px-4">
      <div className="w-full max-w-sm rounded-card bg-surface-light p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-text-primary">SAHL Admin</h1>
        <p className="mt-1 text-sm text-text-secondary">Sign in with your staff account</p>

        {errorMessage && (
          <div className="mt-4 rounded-lg bg-error/10 px-3 py-2 text-sm text-error" role="alert">
            {errorMessage}
          </div>
        )}

        <form action={adminLoginAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-text-primary">
              Phone number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              dir="ltr"
              className="mt-1 w-full rounded-button border border-text-disabled/40 px-3 py-2 text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-primary">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-button border border-text-disabled/40 px-3 py-2 text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-button bg-primary px-4 py-2 font-medium text-white transition hover:bg-secondary"
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
