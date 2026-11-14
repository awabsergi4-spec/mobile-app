export type ServiceType = "ON_DEMAND" | "CONTRACT" | "REMOTE";

export interface ServiceCategory {
  id: string;
  type: ServiceType;
  parentId: string | null;
  name: string;
  description: string | null;
}
