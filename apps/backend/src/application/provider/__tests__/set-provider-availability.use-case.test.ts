import { describe, it, expect } from "vitest";
import { SetProviderAvailabilityUseCase } from "../set-provider-availability.use-case";
import { ProviderProfileNotFoundError } from "../errors";
import { FakeProviderProfileRepository } from "./fakes";

describe("SetProviderAvailabilityUseCase", () => {
  it("sets isAvailable=true when mode is ONLINE", async () => {
    const providers = new FakeProviderProfileRepository();
    const useCase = new SetProviderAvailabilityUseCase(providers);
    const profile = await providers.create({ userId: "user-1", businessName: "Amina Repairs" });

    await useCase.execute({ providerId: profile.id, mode: "ONLINE" });

    const updated = await providers.findById(profile.id);
    expect(updated?.availabilityMode).toBe("ONLINE");
    expect(updated?.isAvailable).toBe(true);
  });

  it("sets isAvailable=false for any non-ONLINE mode", async () => {
    const providers = new FakeProviderProfileRepository();
    const useCase = new SetProviderAvailabilityUseCase(providers);
    const profile = await providers.create({ userId: "user-1", businessName: "Amina Repairs" });

    await useCase.execute({ providerId: profile.id, mode: "VACATION" });

    const updated = await providers.findById(profile.id);
    expect(updated?.availabilityMode).toBe("VACATION");
    expect(updated?.isAvailable).toBe(false);
  });

  it("throws when the provider does not exist", async () => {
    const providers = new FakeProviderProfileRepository();
    const useCase = new SetProviderAvailabilityUseCase(providers);

    await expect(useCase.execute({ providerId: "missing", mode: "ONLINE" })).rejects.toBeInstanceOf(
      ProviderProfileNotFoundError,
    );
  });
});
