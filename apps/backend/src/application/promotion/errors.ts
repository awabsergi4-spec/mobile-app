export class PromotionNotFoundError extends Error {
  constructor() {
    super("Promotion not found");
  }
}
