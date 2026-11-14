import type { PrismaClient } from "@prisma/client";
import type { ProviderProfile, AccountLifecycleStatus, AvailabilityMode, VerificationStatus } from "@/domain/provider/provider-profile.entity";
import type {
  ProviderProfileRepository,
  CreateProviderProfileInput,
  UpdateProviderProfileInput,
  SearchProviderProfilesFilter,
} from "@/domain/provider/provider-profile.repository";

export class PrismaProviderProfileRepository implements ProviderProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateProviderProfileInput): Promise<ProviderProfile> {
    return this.prisma.providerProfile.create({
      data: {
        userId: input.userId,
        companyId: input.companyId,
        businessName: input.businessName,
        bio: input.bio,
        yearsOfExperience: input.yearsOfExperience,
        skills: input.skills ?? [],
        travelDistanceKm: input.travelDistanceKm,
        remoteAvailable: input.remoteAvailable ?? false,
      },
    }) as unknown as Promise<ProviderProfile>;
  }

  async findById(id: string): Promise<ProviderProfile | null> {
    return this.prisma.providerProfile.findUnique({ where: { id } }) as unknown as Promise<ProviderProfile | null>;
  }

  async findByUserId(userId: string): Promise<ProviderProfile | null> {
    return this.prisma.providerProfile.findUnique({ where: { userId } }) as unknown as Promise<ProviderProfile | null>;
  }

  async update(id: string, input: UpdateProviderProfileInput): Promise<ProviderProfile> {
    return this.prisma.providerProfile.update({
      where: { id },
      data: input,
    }) as unknown as Promise<ProviderProfile>;
  }

  async updateLifecycleStatus(id: string, status: AccountLifecycleStatus, details?: { reason?: string }): Promise<void> {
    await this.prisma.providerProfile.update({
      where: { id },
      data: {
        status,
        suspendedAt: status === "SUSPENDED" ? new Date() : null,
        suspendedReason: status === "SUSPENDED" ? details?.reason : null,
        deletedAt: status === "DELETED" ? new Date() : null,
      },
    });
  }

  async updateVerificationStatus(id: string, status: VerificationStatus): Promise<void> {
    await this.prisma.providerProfile.update({
      where: { id },
      data: { verificationStatus: status, verifiedAt: status === "VERIFIED" ? new Date() : undefined },
    });
  }

  async updateAvailability(id: string, mode: AvailabilityMode, isAvailable: boolean): Promise<void> {
    await this.prisma.providerProfile.update({
      where: { id },
      data: { availabilityMode: mode, isAvailable },
    });
  }

  async search(filter: SearchProviderProfilesFilter): Promise<ProviderProfile[]> {
    return this.prisma.providerProfile.findMany({
      where: {
        status: filter.status,
        verificationStatus: filter.verificationStatus,
        remoteAvailable: filter.remoteAvailable,
        ...(filter.query ? { businessName: { contains: filter.query, mode: "insensitive" } } : {}),
        ...(filter.categoryId ? { categories: { some: { categoryId: filter.categoryId } } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: filter.limit ?? 25,
      ...(filter.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
    }) as unknown as Promise<ProviderProfile[]>;
  }
}
