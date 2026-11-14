import type { UserRepository } from "@/domain/identity/user.repository";
import type { PasswordHasher } from "@/domain/identity/password-hasher";
import { SessionIssuer, type IssuedSession } from "./session-issuer";

export interface LoginWithPasswordInput {
  phone: string;
  password: string;
  deviceInfo?: string;
}

// Deliberately the same error for "no such user" and "wrong password" —
// distinguishing them would let a caller enumerate registered phone
// numbers by observing which error comes back.
export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid phone or password");
  }
}

export class AccountNotActiveError extends Error {
  constructor() {
    super("Account is not active");
  }
}

export class LoginWithPasswordUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly sessions: SessionIssuer,
  ) {}

  async execute(input: LoginWithPasswordInput): Promise<IssuedSession> {
    const user = await this.users.findByPhone(input.phone);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await this.hasher.verify(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    // Checked after password verification, not before: the caller has
    // already proven they know the password by this point, so revealing
    // "account not active" here isn't a new enumeration vector the way it
    // would be if checked before the password comparison.
    if (user.status !== "ACTIVE") {
      throw new AccountNotActiveError();
    }

    return this.sessions.issue(user.id, input.deviceInfo);
  }
}
