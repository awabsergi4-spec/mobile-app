import type { MessageKey } from "@/presentation/i18n/en";

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

export const LISTING_STATUSES: ListingStatus[] = ["PENDING_REVIEW", "PUBLISHED", "REJECTED", "PAUSED"];

export const LISTING_STATUS_KEYS: Record<ListingStatus, MessageKey> = {
  PENDING_REVIEW: "listings.status.PENDING_REVIEW",
  PUBLISHED: "listings.status.PUBLISHED",
  REJECTED: "listings.status.REJECTED",
  PAUSED: "listings.status.PAUSED",
};
