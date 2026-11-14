import { describe, it, expect } from "vitest";
import { AwardContractBidUseCase } from "../award-contract-bid.use-case";
import { ContractBidNotSubmittedError, ContractProjectNotOpenError, ProviderNotEligibleError } from "../errors";
import {
  FakeContractProjectRepository,
  FakeContractBidRepository,
  FakeContractRepository,
  FakeProviderProfileRepository,
  FakeDomainEventPublisher,
} from "./fakes";

describe("AwardContractBidUseCase", () => {
  it("accepts the winning bid, rejects the rest, awards the project, and creates a Contract", async () => {
    const projects = new FakeContractProjectRepository();
    const bids = new FakeContractBidRepository();
    const contracts = new FakeContractRepository();
    const providers = new FakeProviderProfileRepository();
    const events = new FakeDomainEventPublisher();
    providers.seedEligible("provider-1");
    const project = await projects.create({
      customerId: "customer-1",
      categoryId: "category-1",
      title: "Renovate office",
      description: "Full office renovation",
    });
    const winningBid = await bids.create({ projectId: project.id, providerId: "provider-1", amount: 500000 });
    const losingBid = await bids.create({ projectId: project.id, providerId: "provider-2", amount: 600000 });
    const useCase = new AwardContractBidUseCase(projects, bids, contracts, providers, events);

    const contract = await useCase.execute({ bidId: winningBid.id });

    expect(contract).toMatchObject({ providerId: "provider-1", totalAmount: 500000, status: "IN_PROGRESS" });
    expect((await bids.findById(winningBid.id))?.status).toBe("ACCEPTED");
    expect((await bids.findById(losingBid.id))?.status).toBe("REJECTED");
    expect((await projects.findById(project.id))?.status).toBe("AWARDED");
    expect(events.published[0]).toMatchObject({ type: "ContractAwarded", relatedEntityType: "CONTRACT" });
  });

  it("rejects awarding a bid that isn't SUBMITTED", async () => {
    const projects = new FakeContractProjectRepository();
    const bids = new FakeContractBidRepository();
    const contracts = new FakeContractRepository();
    const providers = new FakeProviderProfileRepository();
    const events = new FakeDomainEventPublisher();
    providers.seedEligible("provider-1");
    const project = await projects.create({
      customerId: "customer-1",
      categoryId: "category-1",
      title: "Renovate office",
      description: "Full office renovation",
    });
    const bid = await bids.create({ projectId: project.id, providerId: "provider-1", amount: 500000 });
    await bids.updateStatus(bid.id, "WITHDRAWN");
    const useCase = new AwardContractBidUseCase(projects, bids, contracts, providers, events);

    await expect(useCase.execute({ bidId: bid.id })).rejects.toBeInstanceOf(ContractBidNotSubmittedError);
  });

  it("refuses to award a bid from a provider suspended since submission", async () => {
    const projects = new FakeContractProjectRepository();
    const bids = new FakeContractBidRepository();
    const contracts = new FakeContractRepository();
    const providers = new FakeProviderProfileRepository();
    const events = new FakeDomainEventPublisher();
    providers.seedEligible("provider-1");
    providers.seed({ ...(await providers.findById("provider-1"))!, status: "SUSPENDED" });
    const project = await projects.create({
      customerId: "customer-1",
      categoryId: "category-1",
      title: "Renovate office",
      description: "Full office renovation",
    });
    const bid = await bids.create({ projectId: project.id, providerId: "provider-1", amount: 500000 });
    const useCase = new AwardContractBidUseCase(projects, bids, contracts, providers, events);

    await expect(useCase.execute({ bidId: bid.id })).rejects.toBeInstanceOf(ProviderNotEligibleError);
    expect(events.published).toHaveLength(0);
  });

  it("surfaces ContractProjectNotOpenError when the project's atomic claim loses a race", async () => {
    const projects = new FakeContractProjectRepository();
    const bids = new FakeContractBidRepository();
    const contracts = new FakeContractRepository();
    const providers = new FakeProviderProfileRepository();
    const events = new FakeDomainEventPublisher();
    providers.seedEligible("provider-2");
    const project = await projects.create({
      customerId: "customer-1",
      categoryId: "category-1",
      title: "Renovate office",
      description: "Full office renovation",
    });
    const bidB = await bids.create({ projectId: project.id, providerId: "provider-2", amount: 450000 });
    const useCase = new AwardContractBidUseCase(projects, bids, contracts, providers, events);

    // Simulates a concurrent award (for a different bid on the same
    // project) that won the race and already claimed the project via
    // compareAndSetStatus, milliseconds before this call reaches the same
    // check — bidB itself is untouched (still SUBMITTED), so only the
    // project-claim guard can catch this.
    const wonByOther = await projects.compareAndSetStatus(project.id, "OPEN_FOR_BIDS", "AWARDED");
    expect(wonByOther).toBe(true);

    await expect(useCase.execute({ bidId: bidB.id })).rejects.toBeInstanceOf(ContractProjectNotOpenError);
    expect((await bids.findById(bidB.id))?.status).toBe("SUBMITTED");
  });
});
