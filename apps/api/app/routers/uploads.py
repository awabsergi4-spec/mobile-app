"""Signed direct uploads to Cloudinary.

The app asks for a short-lived signature, uploads the file straight to
Cloudinary (the API never handles image bytes), then sends the resulting
secure URL back with the listing. ``is_our_upload`` makes sure stored URLs
point at our own Cloudinary account and folder.
"""

import hashlib
import time
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import Connection

from ..config import get_settings
from ..db import get_conn
from ..responses import ApiError, ok
from ..security import current_user, permission_keys

router = APIRouter(tags=["uploads"])

ROOT_FOLDER = "sahl"
PURPOSE_FOLDERS = {
    "listing": f"{ROOT_FOLDER}/listings",
    "category": f"{ROOT_FOLDER}/categories",
    "avatar": f"{ROOT_FOLDER}/avatars",
    "portfolio": f"{ROOT_FOLDER}/portfolio",
    "document": f"{ROOT_FOLDER}/documents",
}
# ID documents are stored as "authenticated" assets: not reachable by
# public URL, only through the signed URL Cloudinary returns.
PRIVATE_PURPOSES = {"document"}


class SignatureBody(BaseModel):
    purpose: Literal["listing", "category", "avatar", "portfolio", "document"]


def _sign(params: dict[str, str | int], secret: str) -> str:
    # https://cloudinary.com/documentation/authentication_signatures
    to_sign = "&".join(f"{k}={params[k]}" for k in sorted(params))
    return hashlib.sha1(f"{to_sign}{secret}".encode()).hexdigest()


@router.get("/uploads/status")
def upload_status(_: dict = Depends(current_user)):
    return ok({"enabled": get_settings().uploads_enabled})


@router.post("/uploads/signature")
def upload_signature(body: SignatureBody, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    settings = get_settings()
    if not settings.uploads_enabled:
        raise ApiError(503, "UPLOADS_NOT_CONFIGURED", "Image uploads are not configured on this server")
    if body.purpose == "category" and "services.manage" not in permission_keys(conn, user["id"]):
        raise ApiError(403, "FORBIDDEN", "Missing required permission: services.manage")
    folder = f"{PURPOSE_FOLDERS[body.purpose]}/{user['id']}"
    params: dict[str, str | int] = {"folder": folder, "timestamp": int(time.time())}
    if body.purpose in PRIVATE_PURPOSES:
        params["type"] = "authenticated"
    return ok({
        **params,
        "signature": _sign(params, settings.cloudinary_api_secret),
        "apiKey": settings.cloudinary_api_key,
        "cloudName": settings.cloudinary_cloud_name,
        "uploadUrl": f"https://api.cloudinary.com/v1_1/{settings.cloudinary_cloud_name}/image/upload",
    })


def is_our_upload(url: str, user_id: str | None, purpose: str = "listing") -> bool:
    """True when ``url`` is an image uploaded to our Cloudinary folder for
    ``purpose``, by ``user_id`` when given (any uploader when None)."""
    cloud = get_settings().cloudinary_cloud_name
    if not cloud:
        return False
    delivery = "authenticated" if purpose in PRIVATE_PURPOSES else "upload"
    prefix = f"https://res.cloudinary.com/{cloud}/image/{delivery}/"
    if not url.startswith(prefix) or len(url) > 500:
        return False
    folder = f"/{PURPOSE_FOLDERS[purpose]}/"
    return f"{folder}{user_id}/" in url if user_id else folder in url
