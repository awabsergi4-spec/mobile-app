import type { ProviderProfileRepository } from "@/domain/provider/provider-profile.repository";
import type { AvailabilityMode } from "@/domain/provider/provider-profile.entity";
import { ProviderProfileNotFoundError } from "./errors";

export interface SetProviderAvailabilityInput {
  providerId: string;
  mode: AvailabilityMode;
}

// Updates availabilityMode and the isAvailable fast-path boolean together in
// one call (isAvailable = mode === "ONLINE"), per the schema comment
// documenting this "write both together" discipline — isAvailable exists
// only as a cheap index/query shortcut, availabilityMode is the source of truth.
export class SetProviderAvailabilityUseCase {
  constructor(private readonly providers: ProviderProfileRepository) {}

  async execute(input: SetProviderAvailabilityInput): Promise<void> {
    const provider = await this.providers.findById(input.providerId);
    if (!provider) {
      throw new ProviderProfileNotFoundError();
    }

    await this.providers.updateAvailability(input.providerId, input.mode, input.mode === "ONLINE");
  }
}
