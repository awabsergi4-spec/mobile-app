import { describe, it, expect } from "vitest";
import { SuspendProviderUseCase } from "../suspend-provider.use-case";
import { ReactivateProviderUseCase } from "../reactivate-provider.use-case";
import { DeleteProviderUseCase } from "../delete-provider.use-case";
import { ProviderProfileNotFoundError } from "../errors";
import { FakeProviderProfileRepository, FakeAuditLogWriter, FakeDomainEventPublisher } from "./fakes";

function buildHarness() {
  const providers = new FakeProviderProfileRepository();
  const auditLog = new FakeAuditLogWriter();
  const events = new FakeDomainEventPublisher();
  return { providers, auditLog, events };
}

describe("SuspendProviderUseCase", () => {
  it("suspends an active provider, writing an audit entry and publishing an event", async () => {
    const { providers, auditLog, events } = buildHarness();
    const useCase = new SuspendProviderUseCase(providers, auditLog, events);
    const profile = await providers.create({ userId: "user-1", businessName: "Amina Repairs" });

    await useCase.execute({ providerId: profile.id, reason: "Fraud report", actorId: "admin-1" });

    const updated = await providers.findById(profile.id);
    expect(updated?.status).toBe("SUSPENDED");
    expect(updated?.suspendedReason).toBe("Fraud report");
    expect(auditLog.entries).toHaveLength(1);
    expect(auditLog.entries[0]).toMatchObject({ action: "provider.suspend", entityId: profile.id });
    expect(events.published).toHaveLength(1);
    expect(events.published[0]).toMatchObject({ type: "ProviderSuspended", relatedEntityType: "PROVIDER_PROFILE" });
  });

  it("throws when the provider does not exist", async () => {
    const { providers, auditLog, events } = buildHarness();
    const useCase = new SuspendProviderUseCase(providers, auditLog, events);

    await expect(
      useCase.execute({ providerId: "missing", reason: "x", actorId: "admin-1" }),
    ).rejects.toBeInstanceOf(ProviderProfileNotFoundError);
  });
});

describe("ReactivateProviderUseCase", () => {
  it("clears suspension fields and returns the provider to ACTIVE", async () => {
    const { providers, auditLog, events } = buildHarness();
    const profile = await providers.create({ userId: "user-1", businessName: "Amina Repairs" });
    await new SuspendProviderUseCase(providers, auditLog, events).execute({
      providerId: profile.id,
      reason: "Fraud report",
      actorId: "admin-1",
    });

    await new ReactivateProviderUseCase(providers, auditLog, events).execute({ providerId: profile.id, actorId: "admin-1" });

    const updated = await providers.findById(profile.id);
    expect(updated?.status).toBe("ACTIVE");
    expect(updated?.suspendedAt).toBeNull();
    expect(updated?.suspendedReason).toBeNull();
  });
});

describe("DeleteProviderUseCase", () => {
  it("soft-deletes the provider (status + deletedAt), not a hard delete", async () => {
    const { providers, auditLog, events } = buildHarness();
    const useCase = new DeleteProviderUseCase(providers, auditLog, events);
    const profile = await providers.create({ userId: "user-1", businessName: "Amina Repairs" });

    await useCase.execute({ providerId: profile.id, actorId: "admin-1" });

    const updated = await providers.findById(profile.id);
    expect(updated?.status).toBe("DELETED");
    expect(updated?.deletedAt).not.toBeNull();
  });
});
