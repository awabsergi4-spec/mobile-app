export type PriceType = "FIXED" | "HOURLY";

export type RemoteEngagementStatus = "ACTIVE" | "DELIVERED" | "COMPLETED" | "CANCELLED";

export interface RemoteEngagement {
  id: string;
  customerId: string;
  companyId: string | null;
  providerId: string;
  categoryId: string;
  title: string;
  priceType: PriceType;
  amount: number;
  status: RemoteEngagementStatus;
  createdAt: Date;
  completedAt: Date | null;
}
