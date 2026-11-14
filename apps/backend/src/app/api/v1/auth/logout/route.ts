import { NextRequest } from "next/server";
import { logoutSchema } from "@sahl/shared/schemas/auth.schema";
import { LogoutUseCase } from "@/application/identity/logout.use-case";
import { refreshTokenRepository } from "@/infrastructure/identity/auth-services";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = logoutSchema.safeParse(body);

  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
  }

  const useCase = new LogoutUseCase(refreshTokenRepository);
  await useCase.execute(parsed.data);

  return ok({ loggedOut: true });
}
