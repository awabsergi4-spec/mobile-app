import { prisma } from "@/infrastructure/prisma-client";
import { PrismaContractProjectRepository } from "./prisma-contract-project.repository";
import { PrismaContractBidRepository } from "./prisma-contract-bid.repository";
import { PrismaContractRepository } from "./prisma-contract.repository";
import { PrismaContractMilestoneRepository } from "./prisma-contract-milestone.repository";
import { PrismaContractDocumentRepository } from "./prisma-contract-document.repository";
import { domainEventPublisher, providerProfileRepository } from "@/infrastructure/provider/provider-services";
import { CreateContractProjectUseCase } from "@/application/contract/create-contract-project.use-case";
import { CancelContractProjectUseCase } from "@/application/contract/cancel-contract-project.use-case";
import { SubmitContractBidUseCase } from "@/application/contract/submit-contract-bid.use-case";
import { WithdrawContractBidUseCase } from "@/application/contract/withdraw-contract-bid.use-case";
import { AwardContractBidUseCase } from "@/application/contract/award-contract-bid.use-case";
import { CreateContractMilestoneUseCase } from "@/application/contract/create-contract-milestone.use-case";
import { UpdateContractMilestoneStatusUseCase } from "@/application/contract/update-contract-milestone-status.use-case";
import { CompleteContractUseCase } from "@/application/contract/complete-contract.use-case";
import { CancelContractUseCase } from "@/application/contract/cancel-contract.use-case";
import { UploadContractDocumentUseCase } from "@/application/contract/upload-contract-document.use-case";
import { FundContractMilestoneUseCase } from "@/application/contract/fund-contract-milestone.use-case";
import { ReleaseContractMilestonePaymentUseCase } from "@/application/contract/release-contract-milestone-payment.use-case";
import {
  initiatePaymentUseCase,
  capturePaymentUseCase,
  fundEscrowUseCase,
  releaseEscrowUseCase,
  escrowRepository,
  walletRepository,
  commissionCalculator,
} from "@/infrastructure/finance/finance-services";

// Wires the Contract module's infrastructure once per process — same
// singleton convention as the other module *-services.ts files.
export const contractProjectRepository = new PrismaContractProjectRepository(prisma);
export const contractBidRepository = new PrismaContractBidRepository(prisma);
export const contractRepository = new PrismaContractRepository(prisma);
export const contractMilestoneRepository = new PrismaContractMilestoneRepository(prisma);
export const contractDocumentRepository = new PrismaContractDocumentRepository(prisma);

export const createContractProjectUseCase = new CreateContractProjectUseCase(contractProjectRepository);
export const cancelContractProjectUseCase = new CancelContractProjectUseCase(contractProjectRepository, contractBidRepository);
export const submitContractBidUseCase = new SubmitContractBidUseCase(
  contractProjectRepository,
  contractBidRepository,
  providerProfileRepository,
);
export const withdrawContractBidUseCase = new WithdrawContractBidUseCase(contractBidRepository);
export const awardContractBidUseCase = new AwardContractBidUseCase(
  contractProjectRepository,
  contractBidRepository,
  contractRepository,
  providerProfileRepository,
  domainEventPublisher,
);
export const createContractMilestoneUseCase = new CreateContractMilestoneUseCase(contractRepository, contractMilestoneRepository);
export const updateContractMilestoneStatusUseCase = new UpdateContractMilestoneStatusUseCase(
  contractMilestoneRepository,
  domainEventPublisher,
);
export const completeContractUseCase = new CompleteContractUseCase(
  contractRepository,
  contractMilestoneRepository,
  domainEventPublisher,
);
export const cancelContractUseCase = new CancelContractUseCase(contractRepository, domainEventPublisher);
export const uploadContractDocumentUseCase = new UploadContractDocumentUseCase(contractRepository, contractDocumentRepository);

export const fundContractMilestoneUseCase = new FundContractMilestoneUseCase(
  contractMilestoneRepository,
  contractRepository,
  escrowRepository,
  initiatePaymentUseCase,
  capturePaymentUseCase,
  fundEscrowUseCase,
);
export const releaseContractMilestonePaymentUseCase = new ReleaseContractMilestonePaymentUseCase(
  contractMilestoneRepository,
  contractRepository,
  providerProfileRepository,
  walletRepository,
  escrowRepository,
  commissionCalculator,
  releaseEscrowUseCase,
  updateContractMilestoneStatusUseCase,
);
