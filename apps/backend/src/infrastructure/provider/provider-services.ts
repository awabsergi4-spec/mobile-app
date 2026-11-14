import { prisma } from "@/infrastructure/prisma-client";
import { PrismaProviderProfileRepository } from "./prisma-provider-profile.repository";
import { PrismaProviderDocumentRepository } from "./prisma-provider-document.repository";
import { PrismaProviderPayoutAccountRepository } from "./prisma-provider-payout-account.repository";
import { PrismaProviderPortfolioRepository } from "./prisma-provider-portfolio.repository";
import { PrismaAuditLogWriter } from "@/infrastructure/audit/prisma-audit-log-writer";
import { PrismaDomainEventPublisher } from "@/infrastructure/workflow/prisma-domain-event-publisher";
import { CreateProviderProfileUseCase } from "@/application/provider/create-provider-profile.use-case";
import { UpdateProviderProfileUseCase } from "@/application/provider/update-provider-profile.use-case";
import { SuspendProviderUseCase } from "@/application/provider/suspend-provider.use-case";
import { ReactivateProviderUseCase } from "@/application/provider/reactivate-provider.use-case";
import { DeleteProviderUseCase } from "@/application/provider/delete-provider.use-case";
import { SetProviderAvailabilityUseCase } from "@/application/provider/set-provider-availability.use-case";
import { SubmitProviderVerificationUseCase } from "@/application/provider/submit-provider-verification.use-case";
import { ReviewProviderVerificationUseCase } from "@/application/provider/review-provider-verification.use-case";

// Wires the Provider module's infrastructure once per process — same
// singleton convention as infrastructure/identity/auth-services.ts.
export const providerProfileRepository = new PrismaProviderProfileRepository(prisma);
export const providerDocumentRepository = new PrismaProviderDocumentRepository(prisma);
export const providerPayoutAccountRepository = new PrismaProviderPayoutAccountRepository(prisma);
export const providerPortfolioRepository = new PrismaProviderPortfolioRepository(prisma);
export const auditLogWriter = new PrismaAuditLogWriter(prisma);
export const domainEventPublisher = new PrismaDomainEventPublisher(prisma);

export const createProviderProfileUseCase = new CreateProviderProfileUseCase(providerProfileRepository);
export const updateProviderProfileUseCase = new UpdateProviderProfileUseCase(providerProfileRepository);
export const suspendProviderUseCase = new SuspendProviderUseCase(providerProfileRepository, auditLogWriter, domainEventPublisher);
export const reactivateProviderUseCase = new ReactivateProviderUseCase(providerProfileRepository, auditLogWriter, domainEventPublisher);
export const deleteProviderUseCase = new DeleteProviderUseCase(providerProfileRepository, auditLogWriter, domainEventPublisher);
export const setProviderAvailabilityUseCase = new SetProviderAvailabilityUseCase(providerProfileRepository);
export const submitProviderVerificationUseCase = new SubmitProviderVerificationUseCase(
  providerProfileRepository,
  providerDocumentRepository,
  domainEventPublisher,
);
export const reviewProviderVerificationUseCase = new ReviewProviderVerificationUseCase(
  providerProfileRepository,
  auditLogWriter,
  domainEventPublisher,
);
