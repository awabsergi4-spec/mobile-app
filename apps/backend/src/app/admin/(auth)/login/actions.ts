"use server";

import { redirect } from "next/navigation";
import { tokenService, staffPermissionRepository } from "@/infrastructure/identity/auth-services";
import { setAdminSessionCookies } from "@/presentation/admin-session";
import { sahlApi, SahlApiError } from "@/presentation/sahl-api";
import type { IssuedSession } from "@/application/identity/session-issuer";

const ERROR_CODE_TO_QUERY: Record<string, string> = {
  INVALID_CREDENTIALS: "invalid_credentials",
  VALIDATION_ERROR: "invalid_credentials",
  INVALID_PHONE: "invalid_credentials",
  ACCOUNT_PENDING_APPROVAL: "pending_approval",
  ACCOUNT_NOT_ACTIVE: "account_not_active",
  API_UNREACHABLE: "api_unreachable",
};

// Authenticates through the SAHL API (apps/api, FastAPI) — the same login
// endpoint the mobile app uses. The access token is verified locally with
// the shared RS256 public key, then the staff-permission gate decides
// whether this account may use the Admin Platform at all.
export async function adminLoginAction(formData: FormData): Promise<void> {
  const phone = String(formData.get("phone") ?? "");
  const password = String(formData.get("password") ?? "");

  let session: IssuedSession;
  try {
    session = await sahlApi<IssuedSession>("/auth/login", { method: "POST", body: { phone, password } });
  } catch (err) {
    const code = err instanceof SahlApiError ? ERROR_CODE_TO_QUERY[err.errorCode] : undefined;
    redirect(`/admin/login?error=${code ?? "unknown"}`);
  }

  const claims = tokenService.verifyAccessToken(session.accessToken);
  const permissionKeys = await staffPermissionRepository.getPermissionKeys(claims.sub);
  if (permissionKeys.length === 0) {
    redirect("/admin/login?error=not_staff");
  }

  await setAdminSessionCookies(session);
  redirect("/admin/dashboard");
}
