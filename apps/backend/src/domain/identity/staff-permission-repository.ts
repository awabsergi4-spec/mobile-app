// Interface only — implemented in infrastructure/identity/prisma-staff-permission-repository.ts.
// Backs presentation/require-permission.ts's fail-closed RBAC check
// (docs/04-api-modules.md §3, docs/05-security.md §2).
export interface StaffPermissionRepository {
  getPermissionKeys(userId: string): Promise<string[]>;
}
