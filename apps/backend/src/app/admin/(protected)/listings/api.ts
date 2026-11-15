// Shapes returned by the SAHL API's /admin/listings endpoints
// (apps/api/app/routers/listings.py).
export type ListingStatus = "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "PAUSED";

export interface AdminListing {
  id: string;
  title: string;
  priceFrom: number;
  deliveryDays: number | null;
  coverUrl: string;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
  rejectionReason: string | null;
  description?: string;
  images?: string[];
  category: { id: string; type: string; name: string; key: string | null } | null;
  provider: { id: string; businessName: string; ratingAverage: number; ratingCount: number } | null;
}

export interface AdminListingQueue {
  listings: AdminListing[];
  pendingCount: number;
}

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  PENDING_REVIEW: "Waiting for review",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
  PAUSED: "Paused by provider",
};
