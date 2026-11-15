"""Service listings: services providers post for customers to order.

A listing belongs to a Short-Term (REMOTE) or Long-Term (CONTRACT) category
and has a 16:9 cover plus up to 8 gallery images (Cloudinary URLs, see
``uploads``). New and edited listings are PENDING_REVIEW until an admin
approves them (``/admin/listings``); only PUBLISHED listings of active,
verified providers are visible to customers.
"""

from typing import Literal

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import Connection, delete, func, or_, select

from ..common import category_keys, get_row, is_eligible_provider, provider_for_user, require_provider, rows
from ..db import get_conn, insert_row, t, update_rows, utcnow
from ..events import audit, publish
from ..responses import ApiError, ok
from ..security import current_user, require_permission
from .uploads import is_our_upload

router = APIRouter(tags=["listings"])
admin_router = APIRouter(prefix="/admin/listings", tags=["admin"])
_admin_guard = require_permission("services.manage")

MAX_GALLERY = 8
LISTABLE_TYPES = ("REMOTE", "CONTRACT")


class ListingBody(BaseModel):
    categoryId: str = Field(min_length=1)
    title: str = Field(min_length=5, max_length=100)
    description: str = Field(min_length=20, max_length=5000)
    priceFrom: int = Field(ge=1, le=1_000_000_000)
    deliveryDays: int | None = Field(default=None, ge=1, le=365)
    coverUrl: str = Field(min_length=10, max_length=500)
    images: list[str] = Field(default_factory=list, max_length=MAX_GALLERY)


class RejectBody(BaseModel):
    reason: str = Field(min_length=3, max_length=500)


# ── helpers ──────────────────────────────────────────────────────────────

def _listing_or_404(conn: Connection, listing_id: str) -> dict:
    listing = get_row(conn, "ServiceListing", listing_id)
    if not listing:
        raise ApiError(404, "LISTING_NOT_FOUND", "Service listing not found")
    return listing


def _validate(conn: Connection, body: ListingBody, user_id: str) -> None:
    category = get_row(conn, "ServiceCategory", body.categoryId)
    if not category or not category["isActive"]:
        raise ApiError(422, "CATEGORY_NOT_FOUND", "Service category not found")
    if category["type"] not in LISTABLE_TYPES:
        raise ApiError(422, "CATEGORY_NOT_LISTABLE", "Services can be posted for Short-Term and Long-Term categories only")
    for url in [body.coverUrl, *body.images]:
        if not is_our_upload(url, user_id):
            raise ApiError(422, "INVALID_IMAGE_URL", "Images must be uploaded through the app")


def _save_images(conn: Connection, listing_id: str, urls: list[str]) -> None:
    img = t("ServiceListingImage")
    conn.execute(delete(img).where(img.c.listingId == listing_id))
    for position, url in enumerate(urls):
        insert_row(conn, "ServiceListingImage", {"listingId": listing_id, "url": url, "position": position})


def _images(conn: Connection, listing_ids: list[str]) -> dict[str, list[str]]:
    if not listing_ids:
        return {}
    img = t("ServiceListingImage")
    out: dict[str, list[str]] = {}
    for r in rows(conn, select(img.c.listingId, img.c.url).where(img.c.listingId.in_(listing_ids))
                  .order_by(img.c.listingId, img.c.position)):
        out.setdefault(r["listingId"], []).append(r["url"])
    return out


def _category_info(conn: Connection, ids: list[str], locale: str) -> dict[str, dict]:
    if not ids:
        return {}
    sc, sct = t("ServiceCategory"), t("ServiceCategoryTranslation")
    types = {r["id"]: r["type"] for r in rows(conn, select(sc.c.id, sc.c.type).where(sc.c.id.in_(ids)))}
    names: dict[str, dict[str, str]] = {}
    for tr in rows(conn, select(sct).where(sct.c.categoryId.in_(ids), sct.c.locale.in_([locale, "en"]))):
        names.setdefault(tr["categoryId"], {})[tr["locale"]] = tr["name"]
    keys = category_keys(conn, ids)
    return {
        cid: {"id": cid, "type": types.get(cid), "key": keys.get(cid),
              "name": names.get(cid, {}).get(locale) or names.get(cid, {}).get("en") or cid}
        for cid in ids
    }


def _provider_info(conn: Connection, ids: list[str]) -> dict[str, dict]:
    if not ids:
        return {}
    pp = t("ProviderProfile")
    found = rows(conn, select(pp.c.id, pp.c.businessName, pp.c.businessLogoUrl, pp.c.ratingAverage, pp.c.ratingCount,
                              pp.c.completedJobsCount).where(pp.c.id.in_(ids)))
    return {p["id"]: p for p in found}


def _present(conn: Connection, listings: list[dict], locale: str, *, with_images: bool, owner_view: bool = False) -> list[dict]:
    cats = _category_info(conn, list({x["categoryId"] for x in listings}), locale)
    provs = _provider_info(conn, list({x["providerId"] for x in listings}))
    imgs = _images(conn, [x["id"] for x in listings]) if with_images else {}
    out = []
    for x in listings:
        item = {
            "id": x["id"], "title": x["title"], "priceFrom": x["priceFrom"], "deliveryDays": x["deliveryDays"],
            "coverUrl": x["coverUrl"], "status": x["status"], "createdAt": x["createdAt"], "updatedAt": x["updatedAt"],
            "category": cats.get(x["categoryId"]), "provider": provs.get(x["providerId"]),
        }
        if with_images:
            item["description"] = x["description"]
            item["images"] = imgs.get(x["id"], [])
        if owner_view:
            item["rejectionReason"] = x["rejectionReason"]
        out.append(item)
    return out


def _notify(conn: Connection, provider_id: str, kind: str, listing: dict, reason: str | None = None) -> None:
    profile = get_row(conn, "ProviderProfile", provider_id)
    owner = get_row(conn, "User", profile["userId"]) if profile else None
    if not owner:
        return
    ar = owner["preferredLanguage"] == "ar"
    if kind == "approved":
        title = "تم نشر خدمتك" if ar else "Your service is live"
        body = (f"تمت الموافقة على «{listing['title']}» وأصبحت ظاهرة للعملاء." if ar
                else f"“{listing['title']}” was approved and is now visible to customers.")
    else:
        title = "لم تتم الموافقة على خدمتك" if ar else "Your service needs changes"
        body = (f"«{listing['title']}»: {reason}" if ar else f"“{listing['title']}”: {reason}")
    insert_row(conn, "Notification", {"userId": owner["id"], "type": f"LISTING_{kind.upper()}", "title": title,
                                      "body": body, "data": {"listingId": listing["id"]}})


# ── provider ─────────────────────────────────────────────────────────────

@router.post("/listings")
def create_listing(body: ListingBody, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    profile = require_provider(conn, user["id"])
    if not is_eligible_provider(profile):
        raise ApiError(422, "PROVIDER_NOT_ELIGIBLE", "Your provider profile must be verified before posting services")
    _validate(conn, body, user["id"])
    data = body.model_dump(exclude={"images"})
    listing = insert_row(conn, "ServiceListing", {**data, "providerId": profile["id"], "status": "PENDING_REVIEW"})
    _save_images(conn, listing["id"], body.images)
    # RelatedEntityType has no listing value; keep the id in the payload.
    publish(conn, "ServiceListingSubmitted", {"providerId": profile["id"], "listingId": listing["id"]}, None, None)
    return ok(_present(conn, [listing], "en", with_images=True, owner_view=True)[0], status=201)


@router.get("/listings/mine")
def my_listings(locale: str = "en", user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    profile = require_provider(conn, user["id"])
    sl = t("ServiceListing")
    found = rows(conn, select(sl).where(sl.c.providerId == profile["id"]).order_by(sl.c.createdAt.desc()))
    return ok(_present(conn, found, locale, with_images=True, owner_view=True))


def _own_listing(conn: Connection, listing_id: str, user_id: str) -> dict:
    listing = _listing_or_404(conn, listing_id)
    profile = provider_for_user(conn, user_id)
    if not profile or profile["id"] != listing["providerId"]:
        raise ApiError(403, "FORBIDDEN", "This service belongs to another provider")
    return listing


@router.put("/listings/{listing_id}")
def update_listing(listing_id: str, body: ListingBody, user: dict = Depends(current_user),
                   conn: Connection = Depends(get_conn)):
    _own_listing(conn, listing_id, user["id"])
    _validate(conn, body, user["id"])
    sl = t("ServiceListing")
    # Any edit goes back to review so customers only see approved content.
    updated = update_rows(conn, "ServiceListing", sl.c.id == listing_id, {
        **body.model_dump(exclude={"images"}), "status": "PENDING_REVIEW", "rejectionReason": None,
    })[0]
    _save_images(conn, listing_id, body.images)
    return ok(_present(conn, [updated], "en", with_images=True, owner_view=True)[0])


def _transition(conn: Connection, listing: dict, allowed_from: str, to: str) -> dict:
    if listing["status"] != allowed_from:
        raise ApiError(409, "INVALID_STATUS_TRANSITION", f"Cannot move a {listing['status']} service to {to}")
    sl = t("ServiceListing")
    return update_rows(conn, "ServiceListing", sl.c.id == listing["id"], {"status": to})[0]


@router.post("/listings/{listing_id}/pause")
def pause_listing(listing_id: str, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    listing = _own_listing(conn, listing_id, user["id"])
    return ok({"id": listing_id, "status": _transition(conn, listing, "PUBLISHED", "PAUSED")["status"]})


@router.post("/listings/{listing_id}/resume")
def resume_listing(listing_id: str, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    listing = _own_listing(conn, listing_id, user["id"])
    return ok({"id": listing_id, "status": _transition(conn, listing, "PAUSED", "PUBLISHED")["status"]})


@router.delete("/listings/{listing_id}")
def delete_listing(listing_id: str, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    _own_listing(conn, listing_id, user["id"])
    sl = t("ServiceListing")
    conn.execute(delete(sl).where(sl.c.id == listing_id))  # gallery rows cascade
    return ok({"id": listing_id, "deleted": True})


# ── customers ────────────────────────────────────────────────────────────

def _public_filter(stmt):
    sl, pp = t("ServiceListing"), t("ProviderProfile")
    return (stmt.join(pp, pp.c.id == sl.c.providerId)
            .where(sl.c.status == "PUBLISHED", pp.c.status == "ACTIVE", pp.c.verificationStatus == "VERIFIED"))


@router.get("/listings")
def browse_listings(categoryId: str | None = None, providerId: str | None = None, q: str | None = Query(default=None, max_length=100),
                    sort: Literal["newest", "rating", "price"] = "newest", limit: int = Query(default=30, ge=1, le=60),
                    locale: str = "en", _: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    sl, pp = t("ServiceListing"), t("ProviderProfile")
    stmt = _public_filter(select(sl))
    if categoryId:
        stmt = stmt.where(sl.c.categoryId == categoryId)
    if providerId:
        stmt = stmt.where(sl.c.providerId == providerId)
    if q and q.strip():
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(sl.c.title.ilike(like), sl.c.description.ilike(like)))
    order = {
        "newest": (sl.c.createdAt.desc(),),
        "rating": (pp.c.ratingAverage.desc(), pp.c.ratingCount.desc()),
        "price": (sl.c.priceFrom.asc(),),
    }[sort]
    found = rows(conn, stmt.order_by(*order, sl.c.id).limit(limit))
    return ok(_present(conn, found, locale, with_images=False))


@router.get("/listings/{listing_id}")
def get_listing(listing_id: str, locale: str = "en", user: dict = Depends(current_user),
                conn: Connection = Depends(get_conn)):
    listing = _listing_or_404(conn, listing_id)
    profile = provider_for_user(conn, user["id"])
    is_owner = bool(profile) and profile["id"] == listing["providerId"]
    if not is_owner:
        sl = t("ServiceListing")
        visible = conn.execute(_public_filter(select(sl.c.id)).where(sl.c.id == listing_id)).first()
        if not visible:
            raise ApiError(404, "LISTING_NOT_FOUND", "Service listing not found")
    return ok(_present(conn, [listing], locale, with_images=True, owner_view=is_owner)[0])


# ── admin review ─────────────────────────────────────────────────────────

@admin_router.get("")
def admin_list(status: str | None = "PENDING_REVIEW", limit: int = Query(default=50, ge=1, le=200),
               _: dict = Depends(_admin_guard), conn: Connection = Depends(get_conn)):
    sl = t("ServiceListing")
    stmt = select(sl)
    if status:
        stmt = stmt.where(sl.c.status == status)
    found = rows(conn, stmt.order_by(sl.c.updatedAt.desc()).limit(limit))
    pending = conn.execute(select(func.count()).select_from(sl).where(sl.c.status == "PENDING_REVIEW")).scalar_one()
    return ok({"listings": _present(conn, found, "en", with_images=False, owner_view=True), "pendingCount": pending})


@admin_router.get("/{listing_id}")
def admin_get(listing_id: str, _: dict = Depends(_admin_guard), conn: Connection = Depends(get_conn)):
    listing = _listing_or_404(conn, listing_id)
    return ok(_present(conn, [listing], "en", with_images=True, owner_view=True)[0])


@admin_router.post("/{listing_id}/approve")
def admin_approve(listing_id: str, actor: dict = Depends(_admin_guard), conn: Connection = Depends(get_conn)):
    listing = _listing_or_404(conn, listing_id)
    if listing["status"] != "PENDING_REVIEW":
        raise ApiError(409, "INVALID_STATUS_TRANSITION", f"Cannot approve a {listing['status']} service")
    sl, pc = t("ServiceListing"), t("ProviderCategory")
    update_rows(conn, "ServiceListing", sl.c.id == listing_id,
                {"status": "PUBLISHED", "reviewedAt": utcnow(), "reviewedById": actor["id"], "rejectionReason": None})
    # The provider now offers this category; list them under it too.
    has_category = conn.execute(select(pc.c.id).where(pc.c.providerId == listing["providerId"],
                                                      pc.c.categoryId == listing["categoryId"])).first()
    if not has_category:
        insert_row(conn, "ProviderCategory", {"providerId": listing["providerId"], "categoryId": listing["categoryId"],
                                              "priceMin": listing["priceFrom"], "priceMax": None})
    audit(conn, actor["id"], "listing.approve", "ServiceListing", listing_id)
    _notify(conn, listing["providerId"], "approved", listing)
    return ok({"id": listing_id, "status": "PUBLISHED"})


@admin_router.post("/{listing_id}/reject")
def admin_reject(listing_id: str, body: RejectBody, actor: dict = Depends(_admin_guard),
                 conn: Connection = Depends(get_conn)):
    listing = _listing_or_404(conn, listing_id)
    if listing["status"] not in ("PENDING_REVIEW", "PUBLISHED", "PAUSED"):
        raise ApiError(409, "INVALID_STATUS_TRANSITION", f"Cannot reject a {listing['status']} service")
    sl = t("ServiceListing")
    update_rows(conn, "ServiceListing", sl.c.id == listing_id,
                {"status": "REJECTED", "reviewedAt": utcnow(), "reviewedById": actor["id"], "rejectionReason": body.reason})
    audit(conn, actor["id"], "listing.reject", "ServiceListing", listing_id, {"reason": body.reason})
    _notify(conn, listing["providerId"], "rejected", listing, body.reason)
    return ok({"id": listing_id, "status": "REJECTED"})
