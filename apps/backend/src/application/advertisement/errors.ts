export class AdvertisementNotFoundError extends Error {
  constructor() {
    super("Advertisement not found");
  }
}
