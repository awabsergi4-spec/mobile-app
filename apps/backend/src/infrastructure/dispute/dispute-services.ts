import { prisma } from "@/infrastructure/prisma-client";
import { PrismaDisputeRepository } from "./prisma-dispute-repository";
import { auditLogWriter, domainEventPublisher } from "@/infrastructure/provider/provider-services";
import { escrowRepository, releaseEscrowUseCase, refundEscrowUseCase } from "@/infrastructure/finance/finance-services";
import { OpenDisputeUseCase } from "@/application/dispute/open-dispute.use-case";
import { ResolveDisputeUseCase } from "@/application/dispute/resolve-dispute.use-case";

// Wires the Dispute-escrow-integration slice — same singleton convention
// as every other *-services.ts file. Not a full Trust & Safety module
// (see domain/dispute/dispute-repository.ts's header comment).
export const disputeRepository = new PrismaDisputeRepository(prisma);

export const openDisputeUseCase = new OpenDisputeUseCase(disputeRepository, escrowRepository, domainEventPublisher);
export const resolveDisputeUseCase = new ResolveDisputeUseCase(
  disputeRepository,
  escrowRepository,
  releaseEscrowUseCase,
  refundEscrowUseCase,
  auditLogWriter,
  domainEventPublisher,
);
