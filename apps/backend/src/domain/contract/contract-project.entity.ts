export type ContractProjectStatus = "OPEN_FOR_BIDS" | "AWARDED" | "CANCELLED";

export interface ContractProject {
  id: string;
  customerId: string;
  companyId: string | null;
  categoryId: string;
  title: string;
  description: string;
  budgetMin: number | null;
  budgetMax: number | null;
  status: ContractProjectStatus;
  createdAt: Date;
}
