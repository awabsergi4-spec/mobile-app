import { z } from "zod";

export const suspendUserSchema = z.object({
  reason: z.string().min(3).max(500),
});

export type SuspendUserPayload = z.infer<typeof suspendUserSchema>;
