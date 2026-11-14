import { describe, it, expect } from "vitest";
import { CreateRemoteEngagementUseCase } from "../create-remote-engagement.use-case";
import { ProviderNotEligibleError } from "../errors";
import { FakeRemoteEngagementRepository, FakeProviderProfileRepository } from "./fakes";

describe("CreateRemoteEngagementUseCase", () => {
  it("creates an engagement directly with an ACTIVE, VERIFIED provider", async () => {
    const engagements = new FakeRemoteEngagementRepository();
    const providers = new FakeProviderProfileRepository();
    providers.seedEligible("provider-1");
    const useCase = new CreateRemoteEngagementUseCase(engagements, providers);

    const engagement = await useCase.execute({
      customerId: "customer-1",
      providerId: "provider-1",
      categoryId: "category-1",
      title: "Landing page redesign",
      priceType: "FIXED",
      amount: 200000,
    });

    expect(engagement.status).toBe("ACTIVE");
  });

  it("rejects engaging a provider that isn't ACTIVE and VERIFIED", async () => {
    const engagements = new FakeRemoteEngagementRepository();
    const providers = new FakeProviderProfileRepository();
    providers.seedEligible("provider-1");
    providers.seed({ ...(await providers.findById("provider-1"))!, status: "SUSPENDED" });
    const useCase = new CreateRemoteEngagementUseCase(engagements, providers);

    await expect(
      useCase.execute({
        customerId: "customer-1",
        providerId: "provider-1",
        categoryId: "category-1",
        title: "Landing page redesign",
        priceType: "FIXED",
        amount: 200000,
      }),
    ).rejects.toBeInstanceOf(ProviderNotEligibleError);
  });

  it("rejects engaging an unknown provider id", async () => {
    const engagements = new FakeRemoteEngagementRepository();
    const providers = new FakeProviderProfileRepository();
    const useCase = new CreateRemoteEngagementUseCase(engagements, providers);

    await expect(
      useCase.execute({
        customerId: "customer-1",
        providerId: "does-not-exist",
        categoryId: "category-1",
        title: "Landing page redesign",
        priceType: "FIXED",
        amount: 200000,
      }),
    ).rejects.toBeInstanceOf(ProviderNotEligibleError);
  });
});
