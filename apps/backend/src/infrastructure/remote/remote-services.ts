import { prisma } from "@/infrastructure/prisma-client";
import { PrismaRemoteEngagementRepository } from "./prisma-remote-engagement.repository";
import { PrismaRemoteMilestoneRepository } from "./prisma-remote-milestone.repository";
import { PrismaRemoteRevisionRepository } from "./prisma-remote-revision.repository";
import { PrismaRemoteMeetingRepository } from "./prisma-remote-meeting.repository";
import { domainEventPublisher, providerProfileRepository } from "@/infrastructure/provider/provider-services";
import { CreateRemoteEngagementUseCase } from "@/application/remote/create-remote-engagement.use-case";
import { DeliverRemoteEngagementUseCase } from "@/application/remote/deliver-remote-engagement.use-case";
import { CompleteRemoteEngagementUseCase } from "@/application/remote/complete-remote-engagement.use-case";
import { CancelRemoteEngagementUseCase } from "@/application/remote/cancel-remote-engagement.use-case";
import { CreateRemoteMilestoneUseCase } from "@/application/remote/create-remote-milestone.use-case";
import { UpdateRemoteMilestoneStatusUseCase } from "@/application/remote/update-remote-milestone-status.use-case";
import { RequestRemoteRevisionUseCase } from "@/application/remote/request-remote-revision.use-case";
import { UpdateRemoteRevisionStatusUseCase } from "@/application/remote/update-remote-revision-status.use-case";
import { ScheduleRemoteMeetingUseCase } from "@/application/remote/schedule-remote-meeting.use-case";
import { FundRemoteMilestoneUseCase } from "@/application/remote/fund-remote-milestone.use-case";
import { ReleaseRemoteMilestonePaymentUseCase } from "@/application/remote/release-remote-milestone-payment.use-case";
import {
  initiatePaymentUseCase,
  capturePaymentUseCase,
  fundEscrowUseCase,
  releaseEscrowUseCase,
  escrowRepository,
  walletRepository,
  commissionCalculator,
} from "@/infrastructure/finance/finance-services";

// Wires the Remote module's infrastructure once per process — same
// singleton convention as the other module *-services.ts files.
export const remoteEngagementRepository = new PrismaRemoteEngagementRepository(prisma);
export const remoteMilestoneRepository = new PrismaRemoteMilestoneRepository(prisma);
export const remoteRevisionRepository = new PrismaRemoteRevisionRepository(prisma);
export const remoteMeetingRepository = new PrismaRemoteMeetingRepository(prisma);

export const createRemoteEngagementUseCase = new CreateRemoteEngagementUseCase(remoteEngagementRepository, providerProfileRepository);
export const deliverRemoteEngagementUseCase = new DeliverRemoteEngagementUseCase(remoteEngagementRepository, domainEventPublisher);
export const completeRemoteEngagementUseCase = new CompleteRemoteEngagementUseCase(
  remoteEngagementRepository,
  remoteMilestoneRepository,
  domainEventPublisher,
);
export const cancelRemoteEngagementUseCase = new CancelRemoteEngagementUseCase(remoteEngagementRepository, domainEventPublisher);
export const createRemoteMilestoneUseCase = new CreateRemoteMilestoneUseCase(remoteEngagementRepository, remoteMilestoneRepository);
export const updateRemoteMilestoneStatusUseCase = new UpdateRemoteMilestoneStatusUseCase(remoteMilestoneRepository, domainEventPublisher);
export const requestRemoteRevisionUseCase = new RequestRemoteRevisionUseCase(
  remoteEngagementRepository,
  remoteRevisionRepository,
  domainEventPublisher,
);
export const updateRemoteRevisionStatusUseCase = new UpdateRemoteRevisionStatusUseCase(remoteRevisionRepository);
export const scheduleRemoteMeetingUseCase = new ScheduleRemoteMeetingUseCase(remoteEngagementRepository, remoteMeetingRepository);

export const fundRemoteMilestoneUseCase = new FundRemoteMilestoneUseCase(
  remoteMilestoneRepository,
  remoteEngagementRepository,
  escrowRepository,
  initiatePaymentUseCase,
  capturePaymentUseCase,
  fundEscrowUseCase,
);
export const releaseRemoteMilestonePaymentUseCase = new ReleaseRemoteMilestonePaymentUseCase(
  remoteMilestoneRepository,
  remoteEngagementRepository,
  providerProfileRepository,
  walletRepository,
  escrowRepository,
  commissionCalculator,
  releaseEscrowUseCase,
  updateRemoteMilestoneStatusUseCase,
);
