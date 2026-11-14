export type ContractStatus = "IN_PROGRESS" | "COMPLETED" | "DISPUTED" | "CANCELLED";

export interface Contract {
  id: string;
  projectId: string;
  providerId: string;
  totalAmount: number;
  status: ContractStatus;
  startedAt: Date;
  completedAt: Date | null;
}
