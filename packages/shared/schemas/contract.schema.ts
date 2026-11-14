import { z } from "zod";

export const createContractProjectSchema = z
  .object({
    categoryId: z.string().min(1),
    title: z.string().min(3).max(150),
    description: z.string().min(10).max(5000),
    budgetMin: z.number().int().positive().optional(),
    budgetMax: z.number().int().positive().optional(),
  })
  .refine((data) => data.budgetMin == null || data.budgetMax == null || data.budgetMin <= data.budgetMax, {
    message: "budgetMin cannot be greater than budgetMax",
    path: ["budgetMin"],
  });

export type CreateContractProjectPayload = z.infer<typeof createContractProjectSchema>;

export const submitContractBidSchema = z.object({
  amount: z.number().int().positive(),
  message: z.string().max(2000).optional(),
});

export type SubmitContractBidPayload = z.infer<typeof submitContractBidSchema>;

export const createContractMilestoneSchema = z.object({
  title: z.string().min(2).max(150),
  amount: z.number().int().positive(),
  dueDate: z.coerce.date().optional(),
});

export type CreateContractMilestonePayload = z.infer<typeof createContractMilestoneSchema>;

export const updateContractMilestoneStatusSchema = z.object({
  toStatus: z.enum(["IN_PROGRESS", "SUBMITTED", "APPROVED", "PAID"]),
});

export type UpdateContractMilestoneStatusPayload = z.infer<typeof updateContractMilestoneStatusSchema>;

export const uploadContractDocumentSchema = z.object({
  fileUrl: z.string().url(),
});

export type UploadContractDocumentPayload = z.infer<typeof uploadContractDocumentSchema>;
