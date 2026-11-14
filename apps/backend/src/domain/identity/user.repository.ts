import type { User, UserStatus } from "./user.entity";

export interface SearchUsersFilter {
  query?: string; // matches phone or fullName, case-insensitive
  status?: UserStatus;
  limit?: number;
  cursor?: string;
}

// Interface only — implemented in infrastructure/identity/prisma-user.repository.ts.
// application/ depends on this interface, never on the Prisma implementation directly.
export interface UserRepository {
  findByPhone(phone: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(input: Omit<User, "id" | "createdAt" | "status"> & { status?: User["status"] }): Promise<User>;
  updateStatus(userId: string, status: UserStatus): Promise<void>;
  // Admin-facing search — returns the full User (including passwordHash,
  // same as findByPhone always has); callers at the route/presentation
  // layer are responsible for stripping it before it reaches a client, the
  // same discipline /api/v1/users/me already follows.
  search(filter: SearchUsersFilter): Promise<User[]>;
}
