import { NextRequest } from "next/server";
import { loginWithPasswordSchema } from "@sahl/shared/schemas/auth.schema";
import { LoginWithPasswordUseCase, InvalidCredentialsError, AccountNotActiveError } from "@/application/identity/login-with-password.use-case";
import { userRepository, passwordHasher, sessionIssuer } from "@/infrastructure/identity/auth-services";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = loginWithPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
  }

  const useCase = new LoginWithPasswordUseCase(userRepository, passwordHasher, sessionIssuer);

  try {
    const session = await useCase.execute(parsed.data);
    return ok(session);
  } catch (err) {
    if (err instanceof InvalidCredentialsError) {
      return fail("INVALID_CREDENTIALS", err.message, { status: 401 });
    }
    if (err instanceof AccountNotActiveError) {
      return fail("ACCOUNT_NOT_ACTIVE", err.message, { status: 403 });
    }
    throw err;
  }
}
