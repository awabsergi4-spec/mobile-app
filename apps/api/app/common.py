"""Small shared helpers for routers: row lookups, list paging, party guards."""

from typing import Any

from sqlalchemy import Connection, select

from .db import t
from .responses import ApiError


def get_row(conn: Connection, table: str, row_id: str) -> dict[str, Any] | None:
    tbl = t(table)
    row = conn.execute(select(tbl).where(tbl.c.id == row_id)).mappings().first()
    return dict(row) if row else None


def rows(conn: Connection, stmt) -> list[dict[str, Any]]:
    return [dict(r) for r in conn.execute(stmt).mappings().all()]


def page(stmt, table, sort_column: str, *, desc: bool, cursor: str | None, limit: int | None, default_limit: int):
    """Prisma-style cursor paging: order by ``sort_column`` and return rows after the cursor row."""
    col = table.c[sort_column]
    stmt = stmt.order_by(col.desc() if desc else col.asc(), table.c.id)
    if cursor:
        anchor = select(col).where(table.c.id == cursor).scalar_subquery()
        stmt = stmt.where(table.c.id != cursor).where(col <= anchor if desc else col >= anchor)
    return stmt.limit(limit or default_limit)


def provider_for_user(conn: Connection, user_id: str) -> dict[str, Any] | None:
    pp = t("ProviderProfile")
    row = conn.execute(select(pp).where(pp.c.userId == user_id)).mappings().first()
    return dict(row) if row else None


def require_provider(conn: Connection, user_id: str) -> dict[str, Any]:
    profile = provider_for_user(conn, user_id)
    if not profile:
        raise ApiError(404, "PROVIDER_PROFILE_NOT_FOUND", "No provider profile for this account")
    return profile


def is_eligible_provider(profile: dict[str, Any] | None) -> bool:
    return bool(profile) and profile["status"] == "ACTIVE" and profile["verificationStatus"] == "VERIFIED"


def contract_party(conn: Connection, contract: dict, project: dict, user_id: str) -> str:
    if project["customerId"] == user_id:
        return "customer"
    profile = provider_for_user(conn, user_id)
    if profile and profile["id"] == contract["providerId"]:
        return "provider"
    raise ApiError(403, "FORBIDDEN", "You are not the customer or provider on this contract")


def remote_party(conn: Connection, engagement: dict, user_id: str) -> str:
    if engagement["customerId"] == user_id:
        return "customer"
    profile = provider_for_user(conn, user_id)
    if profile and profile["id"] == engagement["providerId"]:
        return "provider"
    raise ApiError(403, "FORBIDDEN", "You are not the customer or provider on this engagement")


def region_for_user(conn: Connection, user: dict[str, Any]) -> dict[str, Any]:
    region = get_row(conn, "Region", user["regionId"])
    if not region:
        raise ApiError(500, "REGION_NOT_FOUND", "Region not found for this account")
    return region


def category_key(english_name: str | None) -> str | None:
    """Stable, locale-independent key for a category (its English name as a
    slug, e.g. "Legal Consultation" -> "legal-consultation"). The app maps
    it to bundled artwork; there is no image column on ServiceCategory."""
    if not english_name:
        return None
    return "-".join("".join(ch if ch.isalnum() else " " for ch in english_name.lower()).split()) or None


def category_images(conn: Connection, category_ids: list[str]) -> dict[str, str | None]:
    """Admin-uploaded picture per category (None when not set)."""
    if not category_ids:
        return {}
    sc = t("ServiceCategory")
    return dict(conn.execute(select(sc.c.id, sc.c.imageUrl).where(sc.c.id.in_(category_ids))).all())


def category_keys(conn: Connection, category_ids: list[str]) -> dict[str, str | None]:
    if not category_ids:
        return {}
    sct = t("ServiceCategoryTranslation")
    found = conn.execute(select(sct.c.categoryId, sct.c.name)
                         .where(sct.c.categoryId.in_(category_ids), sct.c.locale == "en")).all()
    return {cid: category_key(name) for cid, name in found}
