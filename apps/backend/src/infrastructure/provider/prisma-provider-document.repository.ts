import type { PrismaClient } from "@prisma/client";
import type {
  ProviderDocument,
  ProviderDocumentStatus,
  ProviderDocumentRepository,
  CreateProviderDocumentInput,
} from "@/domain/provider/provider-document.repository";

export class PrismaProviderDocumentRepository implements ProviderDocumentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateProviderDocumentInput): Promise<ProviderDocument> {
    return this.prisma.providerDocument.create({
      data: {
        providerId: input.providerId,
        type: input.type,
        fileUrl: input.fileUrl,
      },
    }) as unknown as Promise<ProviderDocument>;
  }

  async findById(id: string): Promise<ProviderDocument | null> {
    return this.prisma.providerDocument.findUnique({ where: { id } }) as unknown as Promise<ProviderDocument | null>;
  }

  async listByProviderId(providerId: string): Promise<ProviderDocument[]> {
    return this.prisma.providerDocument.findMany({
      where: { providerId },
      orderBy: { createdAt: "desc" },
    }) as unknown as Promise<ProviderDocument[]>;
  }

  async countByProviderId(providerId: string): Promise<number> {
    return this.prisma.providerDocument.count({ where: { providerId } });
  }

  async updateStatus(id: string, status: ProviderDocumentStatus): Promise<ProviderDocument> {
    return this.prisma.providerDocument.update({
      where: { id },
      data: { status, reviewedAt: new Date() },
    }) as unknown as Promise<ProviderDocument>;
  }
}
