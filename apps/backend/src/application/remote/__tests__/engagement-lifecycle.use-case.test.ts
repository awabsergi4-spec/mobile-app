import { describe, it, expect } from "vitest";
import { DeliverRemoteEngagementUseCase } from "../deliver-remote-engagement.use-case";
import { CompleteRemoteEngagementUseCase } from "../complete-remote-engagement.use-case";
import { RequestRemoteRevisionUseCase } from "../request-remote-revision.use-case";
import { UpdateRemoteRevisionStatusUseCase } from "../update-remote-revision-status.use-case";
import {
  InvalidRemoteEngagementStatusTransitionError,
  RemoteEngagementHasUnpaidMilestonesError,
} from "../errors";
import {
  FakeRemoteEngagementRepository,
  FakeRemoteMilestoneRepository,
  FakeRemoteRevisionRepository,
  FakeDomainEventPublisher,
} from "./fakes";

async function seedEngagement(engagements: FakeRemoteEngagementRepository) {
  return engagements.create({
    customerId: "customer-1",
    providerId: "provider-1",
    categoryId: "category-1",
    title: "Landing page redesign",
    priceType: "FIXED",
    amount: 200000,
  });
}

describe("DeliverRemoteEngagementUseCase", () => {
  it("moves ACTIVE to DELIVERED", async () => {
    const engagements = new FakeRemoteEngagementRepository();
    const events = new FakeDomainEventPublisher();
    const engagement = await seedEngagement(engagements);
    const useCase = new DeliverRemoteEngagementUseCase(engagements, events);

    const updated = await useCase.execute({ engagementId: engagement.id });

    expect(updated.status).toBe("DELIVERED");
  });
});

describe("CompleteRemoteEngagementUseCase", () => {
  it("refuses to complete while a milestone is unpaid", async () => {
    const engagements = new FakeRemoteEngagementRepository();
    const milestones = new FakeRemoteMilestoneRepository();
    const events = new FakeDomainEventPublisher();
    const engagement = await seedEngagement(engagements);
    await milestones.create({ engagementId: engagement.id, title: "Phase 1", amount: 200000 });
    await engagements.updateStatus(engagement.id, "DELIVERED");
    const useCase = new CompleteRemoteEngagementUseCase(engagements, milestones, events);

    await expect(useCase.execute({ engagementId: engagement.id })).rejects.toBeInstanceOf(
      RemoteEngagementHasUnpaidMilestonesError,
    );
  });

  it("refuses to complete before delivery", async () => {
    const engagements = new FakeRemoteEngagementRepository();
    const milestones = new FakeRemoteMilestoneRepository();
    const events = new FakeDomainEventPublisher();
    const engagement = await seedEngagement(engagements);
    const useCase = new CompleteRemoteEngagementUseCase(engagements, milestones, events);

    await expect(useCase.execute({ engagementId: engagement.id })).rejects.toBeInstanceOf(
      InvalidRemoteEngagementStatusTransitionError,
    );
  });
});

describe("RequestRemoteRevisionUseCase / UpdateRemoteRevisionStatusUseCase", () => {
  it("requesting a revision sends a DELIVERED engagement back to ACTIVE", async () => {
    const engagements = new FakeRemoteEngagementRepository();
    const revisions = new FakeRemoteRevisionRepository();
    const events = new FakeDomainEventPublisher();
    const engagement = await seedEngagement(engagements);
    await engagements.updateStatus(engagement.id, "DELIVERED");
    const useCase = new RequestRemoteRevisionUseCase(engagements, revisions, events);

    const revision = await useCase.execute({ engagementId: engagement.id, requestedBy: "customer-1", notes: "Wrong colors" });

    expect(revision.status).toBe("REQUESTED");
    expect((await engagements.findById(engagement.id))?.status).toBe("ACTIVE");
    expect(events.published[0]).toMatchObject({ type: "RemoteRevisionRequested" });
  });

  it("walks a revision REQUESTED -> IN_PROGRESS -> RESOLVED", async () => {
    const revisions = new FakeRemoteRevisionRepository();
    const revision = await revisions.create({ engagementId: "engagement-1", requestedBy: "customer-1", notes: "Fix spacing" });
    const useCase = new UpdateRemoteRevisionStatusUseCase(revisions);

    await useCase.execute({ revisionId: revision.id, toStatus: "IN_PROGRESS" });
    const resolved = await useCase.execute({ revisionId: revision.id, toStatus: "RESOLVED" });

    expect(resolved.status).toBe("RESOLVED");
  });
});
