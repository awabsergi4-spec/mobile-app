import { NextRequest } from "next/server";
import { refreshSessionSchema } from "@sahl/shared/schemas/auth.schema";
import {
  RefreshSessionUseCase,
  InvalidRefreshTokenError,
  RefreshTokenReuseDetectedError,
} from "@/application/identity/refresh-session.use-case";
import { refreshTokenRepository, sessionIssuer } from "@/infrastructure/identity/auth-services";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = refreshSessionSchema.safeParse(body);

  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
  }

  const useCase = new RefreshSessionUseCase(refreshTokenRepository, sessionIssuer);

  try {
    const session = await useCase.execute(parsed.data);
    return ok(session);
  } catch (err) {
    if (err instanceof RefreshTokenReuseDetectedError) {
      return fail("REFRESH_TOKEN_REUSE_DETECTED", err.message, { status: 401 });
    }
    if (err instanceof InvalidRefreshTokenError) {
      return fail("INVALID_REFRESH_TOKEN", err.message, { status: 401 });
    }
    throw err;
  }
}
