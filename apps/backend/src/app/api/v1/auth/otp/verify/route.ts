import { NextRequest } from "next/server";
import { verifyOtpSchema } from "@sahl/shared/schemas/auth.schema";
import { VerifyOtpUseCase, OtpInvalidError, OtpAttemptsExceededError } from "@/application/identity/verify-otp.use-case";
import { UserNotFoundError } from "@/application/identity/errors";
import { userRepository, otpRepository, sessionIssuer } from "@/infrastructure/identity/auth-services";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = verifyOtpSchema.safeParse(body);

  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
  }

  const useCase = new VerifyOtpUseCase(userRepository, otpRepository, sessionIssuer);

  try {
    const result = await useCase.execute(parsed.data);
    return ok(result);
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return fail("USER_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof OtpInvalidError) {
      return fail("OTP_INVALID", err.message, { status: 400 });
    }
    if (err instanceof OtpAttemptsExceededError) {
      return fail("OTP_ATTEMPTS_EXCEEDED", err.message, { status: 429 });
    }
    throw err;
  }
}
