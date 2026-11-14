import { NextRequest } from "next/server";
import { requestOtpSchema } from "@sahl/shared/schemas/auth.schema";
import { RequestOtpUseCase, OtpRequestedTooSoonError } from "@/application/identity/request-otp.use-case";
import { UserNotFoundError } from "@/application/identity/errors";
import { userRepository, otpRepository, otpSender, remoteConfigReader } from "@/infrastructure/identity/auth-services";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = requestOtpSchema.safeParse(body);

  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
  }

  const useCase = new RequestOtpUseCase(userRepository, otpRepository, otpSender, remoteConfigReader);

  try {
    const result = await useCase.execute(parsed.data);
    return ok(result, { status: 202 });
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return fail("USER_NOT_FOUND", err.message, { status: 404 });
    }
    if (err instanceof OtpRequestedTooSoonError) {
      return fail("OTP_REQUESTED_TOO_SOON", err.message, { status: 429 });
    }
    throw err;
  }
}
