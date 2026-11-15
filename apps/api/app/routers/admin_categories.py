"""Admin → Categories: create and edit service categories (English + Arabic).

Guarded by ``services.manage``. Categories are never hard-deleted (requests,
projects and listings reference them); hide one with ``isActive: false``.
"""

from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import Connection, func, select

from ..common import category_key, get_row, rows
from ..db import get_conn, insert_row, t, update_rows
from ..events import audit
from ..responses import ApiError, ok
from ..security import require_permission
from .uploads import is_our_upload

router = APIRouter(prefix="/admin/service-categories", tags=["admin"])
_guard = require_permission("services.manage")


class CategoryBody(BaseModel):
    type: Literal["ON_DEMAND", "REMOTE", "CONTRACT"]
    nameEn: str = Field(min_length=2, max_length=80)
    nameAr: str = Field(min_length=2, max_length=80)
    descriptionEn: str | None = Field(default=None, max_length=500)
    descriptionAr: str | None = Field(default=None, max_length=500)
    imageUrl: str | None = Field(default=None, max_length=500)
    isActive: bool = True


class CategoryPatch(BaseModel):
    nameEn: str | None = Field(default=None, min_length=2, max_length=80)
    nameAr: str | None = Field(default=None, min_length=2, max_length=80)
    descriptionEn: str | None = Field(default=None, max_length=500)
    descriptionAr: str | None = Field(default=None, max_length=500)
    imageUrl: str | None = Field(default=None, max_length=500)  # send null to remove
    isActive: bool | None = None


def _present(conn: Connection, categories: list[dict]) -> list[dict]:
    ids = [c["id"] for c in categories]
    if not ids:
        return []
    sct, sl, pc = t("ServiceCategoryTranslation"), t("ServiceListing"), t("ProviderCategory")
    trs: dict[str, dict[str, dict]] = {}
    for tr in rows(conn, select(sct).where(sct.c.categoryId.in_(ids))):
        trs.setdefault(tr["categoryId"], {})[tr["locale"]] = tr
    listing_counts = dict(conn.execute(select(sl.c.categoryId, func.count()).where(sl.c.categoryId.in_(ids))
                                       .group_by(sl.c.categoryId)).all())
    provider_counts = dict(conn.execute(select(pc.c.categoryId, func.count()).where(pc.c.categoryId.in_(ids))
                                        .group_by(pc.c.categoryId)).all())
    out = []
    for c in categories:
        en, ar = trs.get(c["id"], {}).get("en"), trs.get(c["id"], {}).get("ar")
        out.append({
            "id": c["id"], "type": c["type"], "isActive": c["isActive"], "createdAt": c["createdAt"],
            "imageUrl": c["imageUrl"],
            "nameEn": en["name"] if en else None, "nameAr": ar["name"] if ar else None,
            "descriptionEn": en["description"] if en else None, "descriptionAr": ar["description"] if ar else None,
            "key": category_key(en["name"] if en else None),
            "listingCount": listing_counts.get(c["id"], 0), "providerCount": provider_counts.get(c["id"], 0),
        })
    return out


def _upsert_translation(conn: Connection, category_id: str, locale: str, name: str | None, description: str | None,
                        set_description: bool) -> None:
    sct = t("ServiceCategoryTranslation")
    existing = conn.execute(select(sct.c.id).where(sct.c.categoryId == category_id, sct.c.locale == locale)).first()
    values: dict = {}
    if name is not None:
        values["name"] = name.strip()
    if set_description:
        values["description"] = (description or "").strip() or None
    if not values:
        return
    if existing:
        update_rows(conn, "ServiceCategoryTranslation", sct.c.id == existing[0], values)
    else:
        insert_row(conn, "ServiceCategoryTranslation", {"categoryId": category_id, "locale": locale, **values})


@router.get("")
def list_categories(type: str | None = None, _: dict = Depends(_guard), conn: Connection = Depends(get_conn)):
    sc = t("ServiceCategory")
    stmt = select(sc)
    if type:
        stmt = stmt.where(sc.c.type == type)
    return ok(_present(conn, rows(conn, stmt.order_by(sc.c.type, sc.c.createdAt))))


@router.get("/{category_id}")
def get_category(category_id: str, _: dict = Depends(_guard), conn: Connection = Depends(get_conn)):
    category = get_row(conn, "ServiceCategory", category_id)
    if not category:
        raise ApiError(404, "CATEGORY_NOT_FOUND", "Service category not found")
    return ok(_present(conn, [category])[0])


def _ensure_unique_name(conn: Connection, type_: str, name_en: str, exclude_id: str | None = None) -> None:
    sc, sct = t("ServiceCategory"), t("ServiceCategoryTranslation")
    stmt = (select(sc.c.id).join(sct, sct.c.categoryId == sc.c.id)
            .where(sc.c.type == type_, sct.c.locale == "en", func.lower(sct.c.name) == name_en.strip().lower()))
    if exclude_id:
        stmt = stmt.where(sc.c.id != exclude_id)
    if conn.execute(stmt).first():
        raise ApiError(409, "CATEGORY_EXISTS", "A category with this English name already exists for this type")


def _check_image(url: str | None) -> None:
    if url is not None and not is_our_upload(url, None, purpose="category"):
        raise ApiError(422, "INVALID_IMAGE_URL", "Category images must be uploaded through the admin panel")


@router.post("")
def create_category(body: CategoryBody, actor: dict = Depends(_guard), conn: Connection = Depends(get_conn)):
    _ensure_unique_name(conn, body.type, body.nameEn)
    _check_image(body.imageUrl)
    category = insert_row(conn, "ServiceCategory", {"type": body.type, "isActive": body.isActive,
                                                    "verificationLevel": "NONE", "imageUrl": body.imageUrl})
    _upsert_translation(conn, category["id"], "en", body.nameEn, body.descriptionEn, True)
    _upsert_translation(conn, category["id"], "ar", body.nameAr, body.descriptionAr, True)
    audit(conn, actor["id"], "category.create", "ServiceCategory", category["id"], {"nameEn": body.nameEn})
    return ok(_present(conn, [category])[0], status=201)


@router.patch("/{category_id}")
def update_category(category_id: str, body: CategoryPatch, actor: dict = Depends(_guard),
                    conn: Connection = Depends(get_conn)):
    category = get_row(conn, "ServiceCategory", category_id)
    if not category:
        raise ApiError(404, "CATEGORY_NOT_FOUND", "Service category not found")
    sent = body.model_fields_set
    if body.nameEn is not None:
        _ensure_unique_name(conn, category["type"], body.nameEn, exclude_id=category_id)
    _upsert_translation(conn, category_id, "en", body.nameEn, body.descriptionEn, "descriptionEn" in sent)
    _upsert_translation(conn, category_id, "ar", body.nameAr, body.descriptionAr, "descriptionAr" in sent)
    changes: dict = {}
    if body.isActive is not None:
        changes["isActive"] = body.isActive
    if "imageUrl" in sent:
        _check_image(body.imageUrl)
        changes["imageUrl"] = body.imageUrl
    if changes:
        sc = t("ServiceCategory")
        category = update_rows(conn, "ServiceCategory", sc.c.id == category_id, changes)[0]
    audit(conn, actor["id"], "category.update", "ServiceCategory", category_id, body.model_dump(exclude_unset=True))
    return ok(_present(conn, [category])[0])
