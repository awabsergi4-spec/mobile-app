"""Admin-uploaded category image (ServiceCategory.imageUrl).

Mirrors apps/backend/prisma/migrations/20261115120000_category_image.

Revision ID: 0003_category_image
Revises: 0002_service_listings
Create Date: 2026-11-15
"""

from alembic import op

revision = "0003_category_image"
down_revision = "0002_service_listings"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('ALTER TABLE "ServiceCategory" ADD COLUMN "imageUrl" TEXT')


def downgrade() -> None:
    op.execute('ALTER TABLE "ServiceCategory" DROP COLUMN "imageUrl"')
