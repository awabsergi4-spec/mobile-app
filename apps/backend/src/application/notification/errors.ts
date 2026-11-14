export class NotificationBroadcastNotFoundError extends Error {
  constructor() {
    super("Notification broadcast not found");
  }
}

export class NotificationBroadcastAlreadySentError extends Error {
  constructor() {
    super("Notification broadcast has already been sent");
  }
}
