import { prisma } from "@/infrastructure/prisma-client";
import { PrismaOnDemandRequestRepository } from "./prisma-on-demand-request.repository";
import { PrismaOnDemandAssignmentRepository } from "./prisma-on-demand-assignment.repository";
import { PrismaOnDemandTrackingRepository } from "./prisma-on-demand-tracking.repository";
import { DistanceRatingProviderMatcher } from "./distance-rating-provider-matcher";
import { domainEventPublisher } from "@/infrastructure/provider/provider-services";
import { CreateOnDemandRequestUseCase } from "@/application/on-demand/create-on-demand-request.use-case";
import { AcceptOnDemandAssignmentUseCase } from "@/application/on-demand/accept-on-demand-assignment.use-case";
import { DeclineOnDemandAssignmentUseCase } from "@/application/on-demand/decline-on-demand-assignment.use-case";
import { UpdateOnDemandStatusUseCase } from "@/application/on-demand/update-on-demand-status.use-case";
import { CancelOnDemandRequestUseCase } from "@/application/on-demand/cancel-on-demand-request.use-case";
import { RecordTrackingPingUseCase } from "@/application/on-demand/record-tracking-ping.use-case";

// Wires the On-Demand module's infrastructure once per process — same
// singleton convention as infrastructure/identity/auth-services.ts,
// infrastructure/provider/provider-services.ts, and
// infrastructure/company/company-services.ts.
export const onDemandRequestRepository = new PrismaOnDemandRequestRepository(prisma);
export const onDemandAssignmentRepository = new PrismaOnDemandAssignmentRepository(prisma);
export const onDemandTrackingRepository = new PrismaOnDemandTrackingRepository(prisma);
export const providerMatcher = new DistanceRatingProviderMatcher(prisma);

export const createOnDemandRequestUseCase = new CreateOnDemandRequestUseCase(
  onDemandRequestRepository,
  onDemandAssignmentRepository,
  providerMatcher,
  domainEventPublisher,
);
export const acceptOnDemandAssignmentUseCase = new AcceptOnDemandAssignmentUseCase(
  onDemandAssignmentRepository,
  onDemandRequestRepository,
  domainEventPublisher,
);
export const declineOnDemandAssignmentUseCase = new DeclineOnDemandAssignmentUseCase(
  onDemandAssignmentRepository,
  onDemandRequestRepository,
  providerMatcher,
  domainEventPublisher,
);
export const updateOnDemandStatusUseCase = new UpdateOnDemandStatusUseCase(onDemandRequestRepository, domainEventPublisher);
export const cancelOnDemandRequestUseCase = new CancelOnDemandRequestUseCase(onDemandRequestRepository, domainEventPublisher);
export const recordTrackingPingUseCase = new RecordTrackingPingUseCase(onDemandRequestRepository, onDemandTrackingRepository);
