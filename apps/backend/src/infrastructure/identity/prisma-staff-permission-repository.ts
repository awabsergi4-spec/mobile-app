import type { PrismaClient } from "@prisma/client";
import type { StaffPermissionRepository } from "@/domain/identity/staff-permission-repository";

export class PrismaStaffPermissionRepository implements StaffPermissionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getPermissionKeys(userId: string): Promise<string[]> {
    const staffRoles = await this.prisma.userStaffRole.findMany({
      where: { userId },
      include: { staffRole: { include: { permissions: { include: { permission: true } } } } },
    });

    const keys = new Set<string>();
    for (const userStaffRole of staffRoles) {
      for (const staffRolePermission of userStaffRole.staffRole.permissions) {
        keys.add(staffRolePermission.permission.key);
      }
    }

    return [...keys];
  }
}
