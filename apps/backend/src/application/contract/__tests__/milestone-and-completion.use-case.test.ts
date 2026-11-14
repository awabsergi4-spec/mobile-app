import { describe, it, expect } from "vitest";
import { UpdateContractMilestoneStatusUseCase } from "../update-contract-milestone-status.use-case";
import { CompleteContractUseCase } from "../complete-contract.use-case";
import { ContractHasUnpaidMilestonesError, InvalidMilestoneStatusTransitionError } from "../errors";
import { FakeContractRepository, FakeContractMilestoneRepository, FakeDomainEventPublisher } from "./fakes";

describe("UpdateContractMilestoneStatusUseCase", () => {
  it("walks PENDING -> IN_PROGRESS -> SUBMITTED -> APPROVED -> PAID", async () => {
    const milestones = new FakeContractMilestoneRepository();
    const events = new FakeDomainEventPublisher();
    const milestone = await milestones.create({ contractId: "contract-1", title: "Design phase", amount: 100000 });
    const useCase = new UpdateContractMilestoneStatusUseCase(milestones, events);

    await useCase.execute({ milestoneId: milestone.id, toStatus: "IN_PROGRESS" });
    await useCase.execute({ milestoneId: milestone.id, toStatus: "SUBMITTED" });
    await useCase.execute({ milestoneId: milestone.id, toStatus: "APPROVED" });
    const paid = await useCase.execute({ milestoneId: milestone.id, toStatus: "PAID" });

    expect(paid.status).toBe("PAID");
    expect(events.published.map((e) => e.type)).toEqual([
      "ContractMilestoneSubmitted",
      "ContractMilestoneApproved",
      "ContractMilestonePaid",
    ]);
  });

  it("rejects skipping a step (PENDING straight to APPROVED)", async () => {
    const milestones = new FakeContractMilestoneRepository();
    const events = new FakeDomainEventPublisher();
    const milestone = await milestones.create({ contractId: "contract-1", title: "Design phase", amount: 100000 });
    const useCase = new UpdateContractMilestoneStatusUseCase(milestones, events);

    await expect(useCase.execute({ milestoneId: milestone.id, toStatus: "APPROVED" })).rejects.toBeInstanceOf(
      InvalidMilestoneStatusTransitionError,
    );
  });
});

describe("CompleteContractUseCase", () => {
  it("refuses to complete while any milestone is unpaid", async () => {
    const contracts = new FakeContractRepository();
    const milestones = new FakeContractMilestoneRepository();
    const events = new FakeDomainEventPublisher();
    const contract = await contracts.create({ projectId: "project-1", providerId: "provider-1", totalAmount: 100000 });
    await milestones.create({ contractId: contract.id, title: "Design phase", amount: 100000 });
    const useCase = new CompleteContractUseCase(contracts, milestones, events);

    await expect(useCase.execute({ contractId: contract.id })).rejects.toBeInstanceOf(ContractHasUnpaidMilestonesError);
  });

  it("completes once every milestone is PAID", async () => {
    const contracts = new FakeContractRepository();
    const milestones = new FakeContractMilestoneRepository();
    const events = new FakeDomainEventPublisher();
    const contract = await contracts.create({ projectId: "project-1", providerId: "provider-1", totalAmount: 100000 });
    const milestone = await milestones.create({ contractId: contract.id, title: "Design phase", amount: 100000 });
    await milestones.updateStatus(milestone.id, "PAID");
    const useCase = new CompleteContractUseCase(contracts, milestones, events);

    const updated = await useCase.execute({ contractId: contract.id });

    expect(updated.status).toBe("COMPLETED");
    expect(updated.completedAt).not.toBeNull();
  });

  it("completes a contract with zero milestones (fixed-price, no milestone breakdown)", async () => {
    const contracts = new FakeContractRepository();
    const milestones = new FakeContractMilestoneRepository();
    const events = new FakeDomainEventPublisher();
    const contract = await contracts.create({ projectId: "project-1", providerId: "provider-1", totalAmount: 100000 });
    const useCase = new CompleteContractUseCase(contracts, milestones, events);

    const updated = await useCase.execute({ contractId: contract.id });

    expect(updated.status).toBe("COMPLETED");
  });
});
