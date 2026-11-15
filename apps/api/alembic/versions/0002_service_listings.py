"""Service listings: providers post services (cover + gallery) for review.

Mirrors apps/backend/prisma/migrations/20261114200000_service_listings
(Prisma's schema stays in step for the Admin Platform's generated client).

Revision ID: 0002_service_listings
Revises: 0001_baseline
Create Date: 2026-11-14
"""

from alembic import op

revision = "0002_service_listings"
down_revision = "0001_baseline"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""CREATE TYPE "ServiceListingStatus" AS ENUM ('PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'PAUSED')""")
    op.execute("""
        CREATE TABLE "ServiceListing" (
            "id" TEXT NOT NULL,
            "providerId" TEXT NOT NULL,
            "categoryId" TEXT NOT NULL,
            "title" TEXT NOT NULL,
            "description" TEXT NOT NULL,
            "priceFrom" INTEGER NOT NULL,
            "deliveryDays" INTEGER,
            "coverUrl" TEXT NOT NULL,
            "status" "ServiceListingStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
            "rejectionReason" TEXT,
            "reviewedAt" TIMESTAMP(3),
            "reviewedById" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "ServiceListing_pkey" PRIMARY KEY ("id")
        )""")
    op.execute("""
        CREATE TABLE "ServiceListingImage" (
            "id" TEXT NOT NULL,
            "listingId" TEXT NOT NULL,
            "url" TEXT NOT NULL,
            "position" INTEGER NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "ServiceListingImage_pkey" PRIMARY KEY ("id")
        )""")
    op.execute("""CREATE INDEX "ServiceListing_categoryId_status_idx" ON "ServiceListing"("categoryId", "status")""")
    op.execute("""CREATE INDEX "ServiceListing_providerId_idx" ON "ServiceListing"("providerId")""")
    op.execute("""CREATE INDEX "ServiceListingImage_listingId_idx" ON "ServiceListingImage"("listingId")""")
    op.execute("""ALTER TABLE "ServiceListing" ADD CONSTRAINT "ServiceListing_providerId_fkey" FOREIGN KEY ("providerId")
                  REFERENCES "ProviderProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE""")
    op.execute("""ALTER TABLE "ServiceListing" ADD CONSTRAINT "ServiceListing_categoryId_fkey" FOREIGN KEY ("categoryId")
                  REFERENCES "ServiceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE""")
    op.execute("""ALTER TABLE "ServiceListingImage" ADD CONSTRAINT "ServiceListingImage_listingId_fkey" FOREIGN KEY ("listingId")
                  REFERENCES "ServiceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE""")


def downgrade() -> None:
    op.execute('DROP TABLE "ServiceListingImage"')
    op.execute('DROP TABLE "ServiceListing"')
    op.execute('DROP TYPE "ServiceListingStatus"')
