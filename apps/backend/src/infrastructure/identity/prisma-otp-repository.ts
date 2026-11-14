import type { PrismaClient } from "@prisma/client";
import type { OtpCodeRecord, OtpPurpose, OtpRepository } from "@/domain/identity/otp-repository";

export class PrismaOtpRepository implements OtpRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: { userId: string; codeHash: string; purpose: OtpPurpose; expiresAt: Date }): Promise<OtpCodeRecord> {
    return this.prisma.otpCode.create({ data: input });
  }

  async findLatestActive(userId: string, purpose: OtpPurpose): Promise<OtpCodeRecord | null> {
    return this.prisma.otpCode.findFirst({
      where: { userId, purpose, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async incrementAttempts(id: string): Promise<void> {
    await this.prisma.otpCode.update({ where: { id }, data: { attempts: { increment: 1 } } });
  }

  async markConsumed(id: string): Promise<void> {
    await this.prisma.otpCode.update({ where: { id }, data: { consumedAt: new Date() } });
  }
}
