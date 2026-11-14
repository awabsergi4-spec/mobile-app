import type { ProviderProfileRepository, UpdateProviderProfileInput } from "@/domain/provider/provider-profile.repository";
import type { ProviderProfile } from "@/domain/provider/provider-profile.entity";
import { ProviderProfileNotFoundError } from "./errors";

export class UpdateProviderProfileUseCase {
  constructor(private readonly providers: ProviderProfileRepository) {}

  async execute(providerId: string, input: UpdateProviderProfileInput): Promise<ProviderProfile> {
    const existing = await this.providers.findById(providerId);
    if (!existing) {
      throw new ProviderProfileNotFoundError();
    }

    return this.providers.update(providerId, input);
  }
}
