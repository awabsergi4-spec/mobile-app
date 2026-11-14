export type UserStatus = "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "BANNED";

export interface User {
  id: string;
  phone: string;
  email: string | null;
  passwordHash: string;
  fullName: string;
  preferredLanguage: string;
  status: UserStatus;
  regionId: string;
  createdAt: Date;
}

export class InvalidPhoneError extends Error {
  constructor(phone: string) {
    super(`Invalid phone number: ${phone}`);
  }
}

// Minimal domain-level validation (format only). Uniqueness is a
// repository/persistence concern, not decided here.
export function assertValidPhone(phone: string): void {
  if (!/^\+?[1-9]\d{7,14}$/.test(phone)) {
    throw new InvalidPhoneError(phone);
  }
}
