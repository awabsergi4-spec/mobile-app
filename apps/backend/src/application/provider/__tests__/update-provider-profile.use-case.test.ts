import { describe, it, expect } from "vitest";
import { UpdateProviderProfileUseCase } from "../update-provider-profile.use-case";
import { ProviderProfileNotFoundError } from "../errors";
import { FakeProviderProfileRepository } from "./fakes";

describe("UpdateProviderProfileUseCase", () => {
  it("updates fields on an existing profile", async () => {
    const providers = new FakeProviderProfileRepository();
    const useCase = new UpdateProviderProfileUseCase(providers);
    const profile = await providers.create({ userId: "user-1", businessName: "Amina Repairs" });

    const updated = await useCase.execute(profile.id, { bio: "Fixing things since 2015" });

    expect(updated.bio).toBe("Fixing things since 2015");
    expect(updated.businessName).toBe("Amina Repairs");
  });

  it("throws when the profile does not exist", async () => {
    const providers = new FakeProviderProfileRepository();
    const useCase = new UpdateProviderProfileUseCase(providers);

    await expect(useCase.execute("missing-id", { bio: "x" })).rejects.toBeInstanceOf(ProviderProfileNotFoundError);
  });
});
