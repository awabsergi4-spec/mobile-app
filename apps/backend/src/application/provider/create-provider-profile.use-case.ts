import type { ProviderProfileRepository, CreateProviderProfileInput } from "@/domain/provider/provider-profile.repository";
import type { ProviderProfile } from "@/domain/provider/provider-profile.entity";
import { ProviderProfileAlreadyExistsError } from "./errors";

// One provider profile per user (a user "becomes" a provider by creating
// this profile) — mirrors the "one identity, dual role" principle from
// ADR-004 rather than forking a second account system for providers.
export class CreateProviderProfileUseCase {
  constructor(private readonly providers: ProviderProfileRepository) {}

  async execute(input: CreateProviderProfileInput): Promise<ProviderProfile> {
    const existing = await this.providers.findByUserId(input.userId);
    if (existing) {
      throw new ProviderProfileAlreadyExistsError();
    }

    return this.providers.create(input);
  }
}
