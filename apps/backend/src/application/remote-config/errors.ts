export class RemoteConfigEntryNotFoundError extends Error {
  constructor() {
    super("Remote config entry not found");
  }
}

export class InvalidRemoteConfigValueError extends Error {
  constructor(valueType: string) {
    super(`Value does not match declared valueType "${valueType}"`);
  }
}
