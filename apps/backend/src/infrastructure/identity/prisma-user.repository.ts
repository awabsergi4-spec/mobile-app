import type { PrismaClient } from "@prisma/client";
import type { User, UserStatus } from "@/domain/identity/user.entity";
import type { SearchUsersFilter, UserRepository } from "@/domain/identity/user.repository";

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async search(filter: SearchUsersFilter): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        status: filter.status,
        ...(filter.query
          ? {
              OR: [
                { phone: { contains: filter.query, mode: "insensitive" } },
                { fullName: { contains: filter.query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: filter.limit ?? 25,
      ...(filter.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
    });
  }

  async create(input: Omit<User, "id" | "createdAt" | "status"> & { status?: User["status"] }): Promise<User> {
    return this.prisma.user.create({
      data: {
        phone: input.phone,
        email: input.email,
        passwordHash: input.passwordHash,
        fullName: input.fullName,
        preferredLanguage: input.preferredLanguage,
        regionId: input.regionId,
        status: input.status ?? "PENDING_VERIFICATION",
      },
    });
  }

  async updateStatus(userId: string, status: UserStatus): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { status } });
  }
}
