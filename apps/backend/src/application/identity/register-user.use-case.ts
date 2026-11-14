import { assertValidPhone } from "@/domain/identity/user.entity";
import type { UserRepository } from "@/domain/identity/user.repository";
import type { PasswordHasher } from "@/domain/identity/password-hasher";

export interface RegisterUserInput {
  phone: string;
  password: string;
  fullName: string;
  preferredLanguage: string;
  regionId: string;
}

export class PhoneAlreadyRegisteredError extends Error {
  constructor(phone: string) {
    super(`Phone already registered: ${phone}`);
  }
}

// One use case, one entry point. No knowledge of HTTP, Next.js, or Prisma —
// depends only on the repository/hasher interfaces, injected by the caller
// (the presentation-layer route handler). See docs/02-architecture.md §2.
export class RegisterUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: RegisterUserInput) {
    assertValidPhone(input.phone);

    const existing = await this.users.findByPhone(input.phone);
    if (existing) {
      throw new PhoneAlreadyRegisteredError(input.phone);
    }

    const passwordHash = await this.hasher.hash(input.password);

    const user = await this.users.create({
      phone: input.phone,
      email: null,
      passwordHash,
      fullName: input.fullName,
      preferredLanguage: input.preferredLanguage,
      regionId: input.regionId,
      status: "PENDING_VERIFICATION",
    });

    // OTP dispatch is a separate use case (SendOtpUseCase) triggered by the
    // route handler after registration succeeds — kept out of this use case
    // so registration logic doesn't depend on the OTP delivery channel.
    return user;
  }
}
