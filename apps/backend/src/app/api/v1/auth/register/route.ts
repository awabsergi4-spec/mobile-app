import { NextRequest } from "next/server";
import { registerUserSchema } from "@sahl/shared/schemas/auth.schema";
import { prisma } from "@/infrastructure/prisma-client";
import { PrismaUserRepository } from "@/infrastructure/identity/prisma-user.repository";
import { Argon2PasswordHasher } from "@/infrastructure/identity/argon2-password-hasher";
import {
  RegisterUserUseCase,
  PhoneAlreadyRegisteredError,
} from "@/application/identity/register-user.use-case";
import { ok, fail } from "@/presentation/http-response";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = registerUserSchema.safeParse(body);

  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Invalid input", { status: 400, details: parsed.error.flatten() });
  }

  const region = await prisma.region.findUnique({ where: { code: "SD" } });
  if (!region) {
    return fail("REGION_NOT_SEEDED", "Default region is not configured", { status: 500 });
  }

  const useCase = new RegisterUserUseCase(new PrismaUserRepository(prisma), new Argon2PasswordHasher());

  try {
    const user = await useCase.execute({ ...parsed.data, regionId: region.id });
    return ok({ id: user.id, phone: user.phone, status: user.status }, { status: 201 });
  } catch (err) {
    if (err instanceof PhoneAlreadyRegisteredError) {
      return fail("PHONE_ALREADY_REGISTERED", err.message, { status: 409 });
    }
    throw err;
  }
}
