// Shared across identity use cases so the same condition isn't represented
// by different error classes/messages depending on which use case hit it.
export class UserNotFoundError extends Error {
  constructor() {
    super("No account found for this phone number");
  }
}
