import { describe, it, expect } from "vitest";
import { CreateProviderProfileUseCase } from "../create-provider-profile.use-case";
import { ProviderProfileAlreadyExistsError } from "../errors";
import { FakeProviderProfileRepository } from "./fakes";

describe("CreateProviderProfileUseCase", () => {
  it("creates a provider profile for a user with no existing profile", async () => {
    const providers = new FakeProviderProfileRepository();
    const useCase = new CreateProviderProfileUseCase(providers);

    const profile = await useCase.execute({ userId: "user-1", businessName: "Amina Repairs" });

    expect(profile.userId).toBe("user-1");
    expect(profile.businessName).toBe("Amina Repairs");
    expect(profile.verificationStatus).toBe("UNVERIFIED");
    expect(profile.status).toBe("ACTIVE");
  });

  it("rejects a second profile for the same user", async () => {
    const providers = new FakeProviderProfileRepository();
    const useCase = new CreateProviderProfileUseCase(providers);

    await useCase.execute({ userId: "user-1", businessName: "Amina Repairs" });

    await expect(
      useCase.execute({ userId: "user-1", businessName: "Amina Repairs Again" }),
    ).rejects.toBeInstanceOf(ProviderProfileAlreadyExistsError);
  });
});
