import { describe, it, expect } from "vitest";
import { ReviewProviderVerificationUseCase } from "../review-provider-verification.use-case";
import { ProviderProfileNotFoundError } from "../errors";
import { FakeProviderProfileRepository, FakeAuditLogWriter, FakeDomainEventPublisher } from "./fakes";

describe("ReviewProviderVerificationUseCase", () => {
  it("approves a provider and publishes ProviderVerificationReviewed", async () => {
    const providers = new FakeProviderProfileRepository();
    const auditLog = new FakeAuditLogWriter();
    const events = new FakeDomainEventPublisher();
    const useCase = new ReviewProviderVerificationUseCase(providers, auditLog, events);
    const profile = await providers.create({ userId: "user-1", businessName: "Amina Repairs" });

    await useCase.execute({ providerId: profile.id, decision: "VERIFIED", actorId: "admin-1" });

    const updated = await providers.findById(profile.id);
    expect(updated?.verificationStatus).toBe("VERIFIED");
    expect(updated?.verifiedAt).not.toBeNull();
    expect(events.published[0]).toMatchObject({ type: "ProviderVerificationReviewed", payload: { decision: "VERIFIED" } });
  });

  it("rejects a provider without setting verifiedAt", async () => {
    const providers = new FakeProviderProfileRepository();
    const auditLog = new FakeAuditLogWriter();
    const events = new FakeDomainEventPublisher();
    const useCase = new ReviewProviderVerificationUseCase(providers, auditLog, events);
    const profile = await providers.create({ userId: "user-1", businessName: "Amina Repairs" });

    await useCase.execute({ providerId: profile.id, decision: "REJECTED", reason: "Blurry ID photo", actorId: "admin-1" });

    const updated = await providers.findById(profile.id);
    expect(updated?.verificationStatus).toBe("REJECTED");
    expect(updated?.verifiedAt).toBeNull();
    expect(auditLog.entries[0]).toMatchObject({ metadata: { decision: "REJECTED", reason: "Blurry ID photo" } });
  });

  it("throws when the provider does not exist", async () => {
    const providers = new FakeProviderProfileRepository();
    const auditLog = new FakeAuditLogWriter();
    const events = new FakeDomainEventPublisher();
    const useCase = new ReviewProviderVerificationUseCase(providers, auditLog, events);

    await expect(
      useCase.execute({ providerId: "missing", decision: "VERIFIED", actorId: "admin-1" }),
    ).rejects.toBeInstanceOf(ProviderProfileNotFoundError);
  });
});
