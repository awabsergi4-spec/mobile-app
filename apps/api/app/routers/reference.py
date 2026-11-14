"""Health, remote config, home layout, service categories."""

from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import Connection, and_, or_, select

from ..common import category_key, rows
from ..db import get_conn, t, utcnow
from ..responses import ok
from ..security import current_user

router = APIRouter(tags=["reference"])


@router.get("/health")
def health():
    return ok({"status": "ok"})


@router.get("/config")
def config(regionId: str | None = None, conn: Connection = Depends(get_conn)):
    rce = t("RemoteConfigEntry")
    region_filter = [rce.c.regionId.is_(None)] + ([rce.c.regionId == regionId] if regionId else [])
    entries = rows(conn, select(rce).where(rce.c.deletedAt.is_(None), or_(*region_filter)))
    by_key: dict[str, dict] = {}
    for entry in entries:
        existing = by_key.get(entry["key"])
        if not existing or (existing["regionId"] is None and entry["regionId"] is not None):
            by_key[entry["key"]] = entry
    return ok({k: {"value": v["value"], "valueType": v["valueType"]} for k, v in by_key.items()})


def _matches_targeting(subject: dict[str, Any], rules: dict | None) -> bool:
    """Port of application/targeting/matches-targeting-rules.ts."""
    if not rules:
        return True
    if rules.get("segmentId"):
        return False
    if rules.get("userIds") and subject["id"] not in rules["userIds"]:
        return False
    if rules.get("countryCodes") and subject["country"] not in rules["countryCodes"]:
        return False
    if rules.get("cityNames") and subject["city"] not in rules["cityNames"]:
        return False
    if rules.get("languages") and subject["preferredLanguage"] not in rules["languages"]:
        return False
    provider = subject["provider"]
    if rules.get("userRoles"):
        roles = rules["userRoles"]
        if not ((provider and "PROVIDER" in roles) or (not provider and "CUSTOMER" in roles)):
            return False
    if rules.get("providerType") or rules.get("serviceCategoryIds"):
        if not provider:
            return False
        if rules.get("providerType") == "COMPANY" and not provider["companyId"]:
            return False
        if rules.get("providerType") == "INDIVIDUAL" and provider["companyId"]:
            return False
        if rules.get("serviceCategoryIds") and not set(rules["serviceCategoryIds"]) & set(provider["categoryIds"]):
            return False
    return True


@router.get("/home-layout")
def home_layout(user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    pp, pc, hb = t("ProviderProfile"), t("ProviderCategory"), t("HomeLayoutBlock")
    profile = conn.execute(select(pp.c.id, pp.c.companyId).where(pp.c.userId == user["id"])).mappings().first()
    provider = None
    if profile:
        category_ids = conn.execute(select(pc.c.categoryId).where(pc.c.providerId == profile["id"])).scalars().all()
        provider = {"companyId": profile["companyId"], "categoryIds": list(category_ids)}
    subject = {"id": user["id"], "country": user["country"], "city": user["city"],
               "preferredLanguage": user["preferredLanguage"], "provider": provider}
    now = utcnow()
    blocks = rows(conn, select(hb).where(
        hb.c.status == "PUBLISHED", hb.c.isVisible.is_(True),
        and_(or_(hb.c.startsAt.is_(None), hb.c.startsAt <= now), or_(hb.c.endsAt.is_(None), hb.c.endsAt >= now)),
    ).order_by(hb.c.position))
    return ok([
        {"id": b["id"], "type": b["type"], "position": b["position"], "config": b["config"], "isVisible": b["isVisible"]}
        for b in blocks if _matches_targeting(subject, b["targetingRules"])
    ])


@router.get("/service-categories")
def service_categories(type: str | None = None, locale: str = Query("en"), _: dict = Depends(current_user),
                       conn: Connection = Depends(get_conn)):
    sc, sct = t("ServiceCategory"), t("ServiceCategoryTranslation")
    stmt = select(sc).where(sc.c.isActive.is_(True))
    if type:
        stmt = stmt.where(sc.c.type == type)
    categories = rows(conn, stmt)
    translations = rows(conn, select(sct).where(sct.c.locale.in_([locale, "en"])))
    by_category: dict[str, dict[str, dict]] = {}
    for tr in translations:
        by_category.setdefault(tr["categoryId"], {})[tr["locale"]] = tr
    out = []
    for c in categories:
        trs = by_category.get(c["id"], {})
        tr = trs.get(locale) or trs.get("en")
        en = trs.get("en")
        out.append({"id": c["id"], "type": c["type"], "parentId": c["parentId"],
                    "key": category_key(en["name"] if en else None),
                    "name": tr["name"] if tr else c["id"], "description": tr["description"] if tr else None})
    return ok(out)
