import { describe, it, expect } from "vitest";
import { RegisterUserUseCase, PhoneAlreadyRegisteredError } from "../register-user.use-case";
import { InvalidPhoneError } from "@/domain/identity/user.entity";
import { FakeUserRepository, FakePasswordHasher } from "./fakes";

describe("RegisterUserUseCase", () => {
  it("creates a PENDING_VERIFICATION user with a hashed password", async () => {
    const users = new FakeUserRepository();
    const useCase = new RegisterUserUseCase(users, new FakePasswordHasher());

    const user = await useCase.execute({
      phone: "+15551234567",
      password: "correct-horse-battery",
      fullName: "Amina Test",
      preferredLanguage: "en",
      regionId: "region-1",
    });

    expect(user.status).toBe("PENDING_VERIFICATION");
    expect(user.passwordHash).toBe("hashed:correct-horse-battery");
  });

  it("rejects a phone number already registered", async () => {
    const users = new FakeUserRepository();
    const useCase = new RegisterUserUseCase(users, new FakePasswordHasher());
    const input = {
      phone: "+15551234567",
      password: "correct-horse-battery",
      fullName: "Amina Test",
      preferredLanguage: "en",
      regionId: "region-1",
    };

    await useCase.execute(input);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(PhoneAlreadyRegisteredError);
  });

  it("rejects an invalid phone format before touching the repository", async () => {
    const users = new FakeUserRepository();
    const useCase = new RegisterUserUseCase(users, new FakePasswordHasher());

    await expect(
      useCase.execute({
        phone: "not-a-phone",
        password: "correct-horse-battery",
        fullName: "Amina Test",
        preferredLanguage: "en",
        regionId: "region-1",
      }),
    ).rejects.toBeInstanceOf(InvalidPhoneError);
  });
});
