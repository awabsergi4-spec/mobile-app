"""Database access.

The schema is the one created by apps/backend/prisma/migrations (Prisma
naming: table = model name, column = camelCase field name). Tables are
reflected rather than redeclared so this service can never drift from the
live schema; future schema changes go through Alembic (see alembic/).

Every request runs in ONE database transaction (see ``get_conn``): all
writes a use case performs commit or roll back together.
"""

from collections.abc import Iterator
from datetime import datetime, timezone
from functools import lru_cache
from typing import Any

from sqlalchemy import ARRAY, Connection, MetaData, Table, create_engine, insert, update
from sqlalchemy.engine import Engine

from .config import get_settings
from .ids import new_id

TABLES = [
    "AuditLog", "Company", "CompanyDocument", "CompanyInvitation", "CompanyMember", "Contract",
    "ContractBid", "ContractMilestone", "ContractProject", "Dispute", "DomainEvent", "Escrow",
    "HomeLayoutBlock", "MatchingScoreLog", "Notification", "OnDemandAssignment", "OnDemandRequest",
    "PaymentTransaction", "Permission", "PromotionalCampaign", "ProviderCategory", "ProviderDocument",
    "ProviderPayoutAccount", "ProviderPortfolioItem", "ProviderProfile", "ProviderServiceArea", "RefreshToken",
    "Region", "RemoteConfigEntry", "RemoteEngagement", "RemoteMilestone", "Review", "ReviewCategoryScore",
    "ServiceCategory", "ServiceCategoryTranslation", "StaffRole", "StaffRolePermission", "SupportTicket",
    "SupportTicketMessage", "User", "UserStaffRole", "Wallet", "WalletBalance", "Withdrawal",
]

# Columns Prisma fills with now() on create (@default(now())) or on every write (@updatedAt).
_NOW_ON_CREATE = {
    "createdAt", "offeredAt", "submittedAt", "joinedAt", "requestedAt", "startedAt", "heldAt",
    "occurredAt", "recordedAt", "grantedAt", "computedAt", "uploadedAt", "sentAt", "redeemedAt",
}


def utcnow() -> datetime:
    """Naive UTC, matching how Prisma stores TIMESTAMP(3) values."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def to_naive_utc(value: datetime | None) -> datetime | None:
    """Client datetimes → naive UTC (naive input is assumed to already be UTC)."""
    if value is None or value.tzinfo is None:
        return value
    return value.astimezone(timezone.utc).replace(tzinfo=None)


@lru_cache
def get_engine() -> Engine:
    return create_engine(get_settings().database_url, pool_pre_ping=True)


@lru_cache
def _metadata() -> MetaData:
    metadata = MetaData()
    metadata.reflect(bind=get_engine(), only=TABLES)
    return metadata


def t(name: str) -> Table:
    return _metadata().tables[name]


def get_conn() -> Iterator[Connection]:
    """FastAPI dependency: one connection + one transaction per request.

    Commits when the handler returns; rolls back on any exception unless the
    exception explicitly asks to keep its writes (``commit_writes=True``).
    """
    conn = get_engine().connect()
    trans = conn.begin()
    try:
        yield conn
        trans.commit()
    except Exception as exc:  # noqa: BLE001 — re-raised below
        if getattr(exc, "commit_writes", False):
            trans.commit()
        else:
            trans.rollback()
        raise
    finally:
        conn.close()


def insert_row(conn: Connection, table: str, values: dict[str, Any]) -> dict[str, Any]:
    """INSERT with Prisma-equivalent client-side defaults (cuid id, UTC timestamps, [] arrays)."""
    tbl = t(table)
    now = utcnow()
    data = dict(values)
    if "id" in tbl.c and "id" not in data:
        data["id"] = new_id()
    for col in tbl.c:
        if col.name in data:
            continue
        if col.name in _NOW_ON_CREATE or col.name == "updatedAt":
            data[col.name] = now
        elif isinstance(col.type, ARRAY):
            data[col.name] = []
    row = conn.execute(insert(tbl).values(**data).returning(tbl)).mappings().one()
    return dict(row)


def update_rows(conn: Connection, table: str, where: Any, values: dict[str, Any]) -> list[dict[str, Any]]:
    tbl = t(table)
    data = dict(values)
    if "updatedAt" in tbl.c:
        data.setdefault("updatedAt", utcnow())
    rows = conn.execute(update(tbl).where(where).values(**data).returning(tbl)).mappings().all()
    return [dict(r) for r in rows]
