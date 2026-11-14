import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_ACCESS_COOKIE } from "./admin-session";

// HTTP client for the SAHL FastAPI backend (apps/api). The Admin Platform is
// being moved off in-process use cases module by module: modules that have
// been ported (auth, users) call the API through here; the rest still run
// in-process until they are ported.
const API_BASE_URL = (process.env.SAHL_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export class SahlApiError extends Error {
  constructor(
    readonly status: number,
    readonly errorCode: string,
    message: string,
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  accessToken?: string;
}

export async function sahlApi<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
    });
  } catch {
    throw new SahlApiError(503, "API_UNREACHABLE", `SAHL API is not reachable at ${API_BASE_URL}`);
  }

  const payload = (await response.json().catch(() => null)) as
    | { success: true; data: T }
    | { success: false; errorCode: string; message: string }
    | null;

  if (!payload) {
    throw new SahlApiError(response.status, "INVALID_RESPONSE", "SAHL API returned an invalid response");
  }
  if (!payload.success) {
    throw new SahlApiError(response.status, payload.errorCode, payload.message);
  }
  return payload.data;
}

// Calls the API as the signed-in admin (access token from the httpOnly
// session cookie). An expired/revoked session sends the admin back to login.
export async function adminApi<T>(path: string, options: Omit<RequestOptions, "accessToken"> = {}): Promise<T> {
  const store = await cookies();
  const accessToken = store.get(ADMIN_ACCESS_COOKIE)?.value;
  if (!accessToken) {
    redirect("/admin/login");
  }
  try {
    return await sahlApi<T>(path, { ...options, accessToken });
  } catch (err) {
    if (err instanceof SahlApiError && err.status === 401) {
      redirect("/admin/login");
    }
    throw err;
  }
}
