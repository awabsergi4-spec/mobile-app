// Interface only — implemented with argon2 in infrastructure/identity/argon2-password-hasher.ts.
// See docs/05-security.md §1: argon2id, never a weaker hash.
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}
