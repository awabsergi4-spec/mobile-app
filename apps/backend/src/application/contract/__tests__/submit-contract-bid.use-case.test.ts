import { describe, it, expect } from "vitest";
import { SubmitContractBidUseCase } from "../submit-contract-bid.use-case";
import { ContractProjectNotOpenError, ProviderNotEligibleError } from "../errors";
import { FakeContractProjectRepository, FakeContractBidRepository, FakeProviderProfileRepository } from "./fakes";

describe("SubmitContractBidUseCase", () => {
  it("accepts a bid from an ACTIVE, VERIFIED provider on an open project", async () => {
    const projects = new FakeContractProjectRepository();
    const bids = new FakeContractBidRepository();
    const providers = new FakeProviderProfileRepository();
    providers.seedEligible("provider-1");
    const project = await projects.create({
      customerId: "customer-1",
      categoryId: "category-1",
      title: "Renovate office",
      description: "Full office renovation",
    });
    const useCase = new SubmitContractBidUseCase(projects, bids, providers);

    const bid = await useCase.execute({ projectId: project.id, providerId: "provider-1", amount: 500000 });

    expect(bid.status).toBe("SUBMITTED");
  });

  it("rejects a bid from a provider that isn't ACTIVE and VERIFIED", async () => {
    const projects = new FakeContractProjectRepository();
    const bids = new FakeContractBidRepository();
    const providers = new FakeProviderProfileRepository();
    // Not seeded — findById returns null, same as an unknown/never-onboarded provider.
    const project = await projects.create({
      customerId: "customer-1",
      categoryId: "category-1",
      title: "Renovate office",
      description: "Full office renovation",
    });
    const useCase = new SubmitContractBidUseCase(projects, bids, providers);

    await expect(
      useCase.execute({ projectId: project.id, providerId: "provider-1", amount: 500000 }),
    ).rejects.toBeInstanceOf(ProviderNotEligibleError);
  });

  it("rejects a bid on a project that isn't OPEN_FOR_BIDS, even from an eligible provider", async () => {
    const projects = new FakeContractProjectRepository();
    const bids = new FakeContractBidRepository();
    const providers = new FakeProviderProfileRepository();
    providers.seedEligible("provider-1");
    const project = await projects.create({
      customerId: "customer-1",
      categoryId: "category-1",
      title: "Renovate office",
      description: "Full office renovation",
    });
    await projects.updateStatus(project.id, "CANCELLED");
    const useCase = new SubmitContractBidUseCase(projects, bids, providers);

    await expect(
      useCase.execute({ projectId: project.id, providerId: "provider-1", amount: 500000 }),
    ).rejects.toBeInstanceOf(ContractProjectNotOpenError);
  });
});
