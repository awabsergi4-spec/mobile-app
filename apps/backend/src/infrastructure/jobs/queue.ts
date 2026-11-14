import { Queue } from "bullmq";
import Redis from "ioredis";

// Background jobs per docs/00-system-architecture.md "Background Jobs":
// email/SMS/push sending, image processing, analytics aggregation,
// scheduled reports, referral reward grants, subscription renewals,
// cleanup. One named queue per job family rather than one generic queue,
// so each can have its own concurrency/retry policy and be monitored
// independently.

const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null, // required by BullMQ's blocking connection
});

export const notificationQueue = new Queue("notifications", { connection });
export const mediaProcessingQueue = new Queue("media-processing", { connection });
export const analyticsQueue = new Queue("analytics", { connection });
export const billingQueue = new Queue("billing", { connection }); // referral rewards, subscription renewals

// Workers (the actual job processors) are not yet implemented — this file
// only registers the queues so producers (use cases) have somewhere to
// enqueue into. See docs/07-roadmap.md for when each job family ships.
