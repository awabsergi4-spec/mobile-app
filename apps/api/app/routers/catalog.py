"""Customer-facing catalog: explore providers, category details, search,
public provider profiles, provider reviews, active promotions.

Only ACTIVE + VERIFIED providers are ever listed publicly.
"""

from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import Connection, String, and_, cast, func, or_, select

from ..common import category_images, category_key, category_keys, get_row, rows
from ..db import get_conn, t, utcnow
from ..responses import ApiError, ok
from ..security import current_user

router = APIRouter(tags=["catalog"])

_PUBLIC_PROVIDER_FIELDS = (
    "id", "businessName", "bio", "businessLogoUrl", "ratingAverage", "ratingCount", "completedJobsCount",
    "skills", "yearsOfExperience", "remoteAvailable", "verificationStatus", "isAvailable", "availabilityMode",
    "companyId",
)


def _public_providers_query():
    pp = t("ProviderProfile")
    return pp, select(*[pp.c[f] for f in _PUBLIC_PROVIDER_FIELDS]).where(
        pp.c.status == "ACTIVE", pp.c.verificationStatus == "VERIFIED"
    )


def _category_names(conn: Connection, category_ids: list[str], locale: str) -> dict[str, str]:
    if not category_ids:
        return {}
    sct = t("ServiceCategoryTranslation")
    names: dict[str, dict[str, str]] = {}
    for tr in rows(conn, select(sct).where(sct.c.categoryId.in_(category_ids), sct.c.locale.in_([locale, "en"]))):
        names.setdefault(tr["categoryId"], {})[tr["locale"]] = tr["name"]
    return {cid: (n.get(locale) or n.get("en") or cid) for cid, n in names.items()}


@router.get("/explore/providers")
def explore_providers(
    categoryId: str | None = None,
    q: str | None = Query(default=None, max_length=100),
    sort: Literal["rating", "jobs", "newest"] = "rating",
    remoteOnly: bool = False,
    limit: int = Query(default=30, ge=1, le=50),
    _: dict = Depends(current_user),
    conn: Connection = Depends(get_conn),
):
    pp, stmt = _public_providers_query()
    pc = t("ProviderCategory")
    if categoryId:
        stmt = stmt.add_columns(pc.c.priceMin, pc.c.priceMax).join(
            pc, and_(pc.c.providerId == pp.c.id, pc.c.categoryId == categoryId)
        )
    if remoteOnly:
        stmt = stmt.where(pp.c.remoteAvailable.is_(True))
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(pp.c.businessName.ilike(like), cast(pp.c.skills, String).ilike(like), pp.c.bio.ilike(like)))
    order = {
        "rating": (pp.c.ratingAverage.desc(), pp.c.ratingCount.desc()),
        "jobs": (pp.c.completedJobsCount.desc(),),
        "newest": (pp.c.createdAt.desc(),),
    }[sort]
    return ok(rows(conn, stmt.order_by(*order, pp.c.id).limit(limit)))


@router.get("/service-categories/{category_id}")
def category_detail(category_id: str, locale: str = "en", _: dict = Depends(current_user),
                    conn: Connection = Depends(get_conn)):
    category = get_row(conn, "ServiceCategory", category_id)
    if not category or not category["isActive"]:
        raise ApiError(404, "CATEGORY_NOT_FOUND", "Service category not found")
    sct, pc, pp = t("ServiceCategoryTranslation"), t("ProviderCategory"), t("ProviderProfile")
    translations = {tr["locale"]: tr for tr in rows(conn, select(sct).where(sct.c.categoryId == category_id))}
    tr = translations.get(locale) or translations.get("en")
    stats = conn.execute(
        select(func.count(pc.c.id), func.min(pc.c.priceMin), func.max(pc.c.priceMax))
        .select_from(pc.join(pp, pp.c.id == pc.c.providerId))
        .where(pc.c.categoryId == category_id, pp.c.status == "ACTIVE", pp.c.verificationStatus == "VERIFIED")
    ).one()
    return ok({
        "id": category["id"], "type": category["type"], "parentId": category["parentId"],
        "name": tr["name"] if tr else category["id"], "description": tr["description"] if tr else None,
        "key": category_key(translations["en"]["name"] if "en" in translations else None),
        "imageUrl": category["imageUrl"],
        "skillLevel": category["skillLevel"], "locationRequirement": category["locationRequirement"],
        "durationClass": category["durationClass"],
        "providerCount": stats[0], "priceMin": stats[1], "priceMax": stats[2],
    })


@router.get("/search")
def search(q: str = Query(min_length=1, max_length=100), locale: str = "en", _: dict = Depends(current_user),
           conn: Connection = Depends(get_conn)):
    like = f"%{q.strip()}%"
    sc, sct = t("ServiceCategory"), t("ServiceCategoryTranslation")
    matched_ids = conn.execute(
        select(sct.c.categoryId).join(sc, sc.c.id == sct.c.categoryId)
        .where(sc.c.isActive.is_(True), or_(sct.c.name.ilike(like), sct.c.description.ilike(like))).distinct()
    ).scalars().all()
    categories = rows(conn, select(sc).where(sc.c.id.in_(matched_ids))) if matched_ids else []
    names = _category_names(conn, [c["id"] for c in categories], locale)
    keys = category_keys(conn, [c["id"] for c in categories])
    pp, stmt = _public_providers_query()
    providers = rows(conn, stmt.where(
        or_(pp.c.businessName.ilike(like), cast(pp.c.skills, String).ilike(like), pp.c.bio.ilike(like))
    ).order_by(pp.c.ratingAverage.desc(), pp.c.id).limit(20))
    return ok({
        "categories": [{"id": c["id"], "type": c["type"], "name": names.get(c["id"], c["id"]), "key": keys.get(c["id"]),
                        "imageUrl": c["imageUrl"]}
                       for c in categories],
        "providers": providers,
    })


def _public_provider_or_404(conn: Connection, provider_id: str) -> dict:
    pp, stmt = _public_providers_query()
    row = conn.execute(stmt.where(pp.c.id == provider_id)).mappings().first()
    if not row:
        raise ApiError(404, "PROVIDER_NOT_FOUND", "Provider not found")
    return dict(row)


def _reviews_for_subject(conn: Connection, subject_id: str, limit: int) -> list[dict]:
    rv, users = t("Review"), t("User")
    result = rows(conn, select(rv.c.id, rv.c.rating, rv.c.comment, rv.c.createdAt, users.c.fullName)
                  .join(users, users.c.id == rv.c.authorId)
                  .where(rv.c.subjectId == subject_id).order_by(rv.c.createdAt.desc()).limit(limit))
    for r in result:
        # Only the reviewer's first name is public.
        r["authorName"] = (r.pop("fullName") or "").split(" ")[0]
    return result


@router.get("/providers/{provider_id}/profile")
def provider_public_profile(provider_id: str, locale: str = "en", _: dict = Depends(current_user),
                            conn: Connection = Depends(get_conn)):
    profile = _public_provider_or_404(conn, provider_id)
    pp, users = t("ProviderProfile"), t("User")
    owner = conn.execute(select(users.c.fullName, users.c.profilePictureUrl, users.c.city)
                         .join(pp, pp.c.userId == users.c.id).where(pp.c.id == provider_id)).mappings().one()
    user_id = conn.execute(select(pp.c.userId).where(pp.c.id == provider_id)).scalar_one()
    pc, sc = t("ProviderCategory"), t("ServiceCategory")
    services = rows(conn, select(pc.c.categoryId, pc.c.priceMin, pc.c.priceMax, sc.c.type)
                    .join(sc, sc.c.id == pc.c.categoryId)
                    .where(pc.c.providerId == provider_id, sc.c.isActive.is_(True)))
    names = _category_names(conn, [s["categoryId"] for s in services], locale)
    keys = category_keys(conn, [s["categoryId"] for s in services])
    images = category_images(conn, [s["categoryId"] for s in services])
    for s in services:
        s["name"] = names.get(s["categoryId"], s["categoryId"])
        s["key"] = keys.get(s["categoryId"])
        s["imageUrl"] = images.get(s["categoryId"])
    pi = t("ProviderPortfolioItem")
    portfolio = rows(conn, select(pi.c.id, pi.c.title, pi.c.description, pi.c.mediaUrl, pi.c.createdAt)
                     .where(pi.c.providerId == provider_id).order_by(pi.c.createdAt.desc()).limit(24))
    company = get_row(conn, "Company", profile["companyId"]) if profile["companyId"] else None
    return ok({
        **profile,
        "ownerName": owner["fullName"], "profilePictureUrl": owner["profilePictureUrl"], "city": owner["city"],
        "companyName": company["name"] if company else None,
        "services": services,
        "portfolio": portfolio,
        "recentReviews": _reviews_for_subject(conn, user_id, 5),
    })


@router.get("/providers/{provider_id}/reviews")
def provider_reviews(provider_id: str, _: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    _public_provider_or_404(conn, provider_id)
    pp = t("ProviderProfile")
    user_id = conn.execute(select(pp.c.userId).where(pp.c.id == provider_id)).scalar_one()
    return ok(_reviews_for_subject(conn, user_id, 50))


@router.get("/promotions")
def active_promotions(categoryId: str | None = None, _: dict = Depends(current_user),
                      conn: Connection = Depends(get_conn)):
    pr = t("PromotionalCampaign")
    now = utcnow()
    stmt = select(pr).where(pr.c.isActive.is_(True), pr.c.startsAt <= now, pr.c.endsAt >= now)
    if categoryId:
        stmt = stmt.where(pr.c.categoryId == categoryId)
    return ok(rows(conn, stmt.order_by(pr.c.startsAt.desc())))
