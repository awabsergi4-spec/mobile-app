import { describe, it, expect } from "vitest";
import { SubmitProviderVerificationUseCase } from "../submit-provider-verification.use-case";
import {
  ProviderProfileNotFoundError,
  ProviderVerificationAlreadyPendingError,
  ProviderVerificationDocumentsRequiredError,
} from "../errors";
import { FakeProviderProfileRepository, FakeProviderDocumentRepository, FakeDomainEventPublisher } from "./fakes";

describe("SubmitProviderVerificationUseCase", () => {
  it("rejects submission with zero uploaded documents", async () => {
    const providers = new FakeProviderProfileRepository();
    const documents = new FakeProviderDocumentRepository();
    const events = new FakeDomainEventPublisher();
    const useCase = new SubmitProviderVerificationUseCase(providers, documents, events);
    const profile = await providers.create({ userId: "user-1", businessName: "Amina Repairs" });

    await expect(useCase.execute({ providerId: profile.id })).rejects.toBeInstanceOf(
      ProviderVerificationDocumentsRequiredError,
    );
    expect(events.published).toHaveLength(0);
  });

  it("transitions to PENDING_REVIEW and publishes ProviderVerificationSubmitted once a document exists", async () => {
    const providers = new FakeProviderProfileRepository();
    const documents = new FakeProviderDocumentRepository();
    const events = new FakeDomainEventPublisher();
    const useCase = new SubmitProviderVerificationUseCase(providers, documents, events);
    const profile = await providers.create({ userId: "user-1", businessName: "Amina Repairs" });
    await documents.create({ providerId: profile.id, type: "national_id", fileUrl: "https://cdn.example.com/id.jpg" });

    await useCase.execute({ providerId: profile.id });

    const updated = await providers.findById(profile.id);
    expect(updated?.verificationStatus).toBe("PENDING_REVIEW");
    expect(events.published).toHaveLength(1);
    expect(events.published[0]).toMatchObject({
      type: "ProviderVerificationSubmitted",
      relatedEntityType: "PROVIDER_PROFILE",
      relatedEntityId: profile.id,
    });
  });

  it("rejects a second submission while already pending review", async () => {
    const providers = new FakeProviderProfileRepository();
    const documents = new FakeProviderDocumentRepository();
    const events = new FakeDomainEventPublisher();
    const useCase = new SubmitProviderVerificationUseCase(providers, documents, events);
    const profile = await providers.create({ userId: "user-1", businessName: "Amina Repairs" });
    await documents.create({ providerId: profile.id, type: "national_id", fileUrl: "https://cdn.example.com/id.jpg" });
    await useCase.execute({ providerId: profile.id });

    await expect(useCase.execute({ providerId: profile.id })).rejects.toBeInstanceOf(
      ProviderVerificationAlreadyPendingError,
    );
  });

  it("throws when the provider does not exist", async () => {
    const providers = new FakeProviderProfileRepository();
    const documents = new FakeProviderDocumentRepository();
    const events = new FakeDomainEventPublisher();
    const useCase = new SubmitProviderVerificationUseCase(providers, documents, events);

    await expect(useCase.execute({ providerId: "missing" })).rejects.toBeInstanceOf(ProviderProfileNotFoundError);
  });
});
