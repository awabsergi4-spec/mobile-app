"""Service listings, signed uploads and admin category management."""

import hashlib

import pytest
from sqlalchemy import select

from app.config import get_settings
from app.db import t

from test_customer_phase3 import API, _user, _verified_provider

CLOUD = "sahl-test"


@pytest.fixture()
def uploads(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "cloudinary_cloud_name", CLOUD)
    monkeypatch.setattr(settings, "cloudinary_api_key", "key123")
    monkeypatch.setattr(settings, "cloudinary_api_secret", "secret456")
    return settings


def _img(user_id, name="a.jpg"):
    return f"https://res.cloudinary.com/{CLOUD}/image/upload/v1/sahl/listings/{user_id}/{name}"


def _category(client, admin_headers, type_="REMOTE", name="Voice Over"):
    res = client.post(f"{API}/admin/service-categories", headers=admin_headers, json={
        "type": type_, "nameEn": name, "nameAr": "تعليق صوتي", "descriptionEn": "Narration and dubbing"})
    assert res.status_code == 201, res.text
    return res.json()["data"]


def _provider_user_id(conn, provider_id):
    pp = t("ProviderProfile")
    return conn.execute(select(pp.c.userId).where(pp.c.id == provider_id)).scalar_one()


def test_upload_signature(client, admin_headers):
    _, h, _ = _user(client, admin_headers, "+249915000001")
    settings = get_settings()
    if not settings.uploads_enabled:
        assert client.post(f"{API}/uploads/signature", headers=h, json={"purpose": "listing"}).json()["errorCode"] \
            == "UPLOADS_NOT_CONFIGURED"


def test_upload_signature_when_configured(client, admin_headers, uploads):
    user_id, h, _ = _user(client, admin_headers, "+249915000002")
    assert client.get(f"{API}/uploads/status", headers=h).json()["data"]["enabled"] is True
    data = client.post(f"{API}/uploads/signature", headers=h, json={"purpose": "listing"}).json()["data"]
    assert data["folder"] == f"sahl/listings/{user_id}" and data["cloudName"] == CLOUD
    expected = hashlib.sha1(f"folder={data['folder']}&timestamp={data['timestamp']}secret456".encode()).hexdigest()
    assert data["signature"] == expected and "secret" not in str({k: v for k, v in data.items() if k != "signature"})


def test_admin_categories(client, admin_headers):
    cat = _category(client, admin_headers)
    assert cat["key"] == "voice-over" and cat["nameAr"] == "تعليق صوتي" and cat["isActive"] is True
    dup = client.post(f"{API}/admin/service-categories", headers=admin_headers,
                      json={"type": "REMOTE", "nameEn": "voice over", "nameAr": "تكرار"})
    assert dup.json()["errorCode"] == "CATEGORY_EXISTS"

    patched = client.patch(f"{API}/admin/service-categories/{cat['id']}", headers=admin_headers,
                           json={"nameEn": "Voice-over", "isActive": False}).json()["data"]
    assert patched["nameEn"] == "Voice-over" and patched["isActive"] is False and patched["nameAr"] == "تعليق صوتي"

    _, h, _ = _user(client, admin_headers, "+249915000003")
    listed = client.get(f"{API}/service-categories?type=REMOTE", headers=h).json()["data"]
    assert all(c["id"] != cat["id"] for c in listed)  # inactive is hidden from the app
    assert client.get(f"{API}/admin/service-categories", headers=h).json()["errorCode"] == "FORBIDDEN"


def test_listing_review_lifecycle(client, admin_headers, conn, uploads):
    cat = _category(client, admin_headers, name="Video Editing")
    provider_id, ph = _verified_provider(client, admin_headers, conn, "+249915000010", cat["id"], name="Cut Studio")
    uid = _provider_user_id(conn, provider_id)
    body = {"categoryId": cat["id"], "title": "Edit your YouTube video", "description": "Cuts, colour, captions and music.",
            "priceFrom": 15000, "deliveryDays": 3, "coverUrl": _img(uid), "images": [_img(uid, "b.jpg"), _img(uid, "c.jpg")]}

    bad = client.post(f"{API}/listings", headers=ph, json={**body, "coverUrl": "https://evil.example/x.jpg"})
    assert bad.json()["errorCode"] == "INVALID_IMAGE_URL"
    other = client.post(f"{API}/listings", headers=ph, json={**body, "coverUrl": _img("someone-else")})
    assert other.json()["errorCode"] == "INVALID_IMAGE_URL"

    created = client.post(f"{API}/listings", headers=ph, json=body)
    assert created.status_code == 201
    listing = created.json()["data"]
    assert listing["status"] == "PENDING_REVIEW" and len(listing["images"]) == 2

    _, ch, _ = _user(client, admin_headers, "+249915000011")
    assert client.get(f"{API}/listings/{listing['id']}", headers=ch).json()["errorCode"] == "LISTING_NOT_FOUND"
    assert client.get(f"{API}/listings?categoryId={cat['id']}", headers=ch).json()["data"] == []

    queue = client.get(f"{API}/admin/listings", headers=admin_headers).json()["data"]
    assert queue["pendingCount"] >= 1 and any(x["id"] == listing["id"] for x in queue["listings"])
    assert client.post(f"{API}/admin/listings/{listing['id']}/approve", headers=admin_headers).json()["data"]["status"] \
        == "PUBLISHED"

    cards = client.get(f"{API}/listings?categoryId={cat['id']}&locale=ar", headers=ch).json()["data"]
    assert len(cards) == 1 and cards[0]["provider"]["businessName"] == "Cut Studio"
    assert cards[0]["category"]["key"] == "video-editing" and cards[0]["category"]["name"] == "تعليق صوتي"
    by_provider = client.get(f"{API}/listings?providerId={provider_id}", headers=ch).json()["data"]
    assert [x["id"] for x in by_provider] == [listing["id"]]
    detail = client.get(f"{API}/listings/{listing['id']}", headers=ch).json()["data"]
    assert detail["images"] == body["images"] and "rejectionReason" not in detail

    pc = t("ProviderCategory")
    assert conn.execute(select(pc.c.id).where(pc.c.providerId == provider_id, pc.c.categoryId == cat["id"])).first()
    n = t("Notification")
    assert conn.execute(select(n.c.type).where(n.c.userId == uid)).scalars().all().count("LISTING_APPROVED") == 1

    # Editing sends it back to review and hides it.
    edited = client.put(f"{API}/listings/{listing['id']}", headers=ph, json={**body, "images": []}).json()["data"]
    assert edited["status"] == "PENDING_REVIEW" and edited["images"] == []
    assert client.get(f"{API}/listings?categoryId={cat['id']}", headers=ch).json()["data"] == []

    rejected = client.post(f"{API}/admin/listings/{listing['id']}/reject", headers=admin_headers,
                           json={"reason": "Cover is blurry"})
    assert rejected.json()["data"]["status"] == "REJECTED"
    mine = client.get(f"{API}/listings/mine", headers=ph).json()["data"]
    assert mine[0]["rejectionReason"] == "Cover is blurry"

    client.put(f"{API}/listings/{listing['id']}", headers=ph, json=body)
    client.post(f"{API}/admin/listings/{listing['id']}/approve", headers=admin_headers)
    assert client.post(f"{API}/listings/{listing['id']}/pause", headers=ph).json()["data"]["status"] == "PAUSED"
    assert client.get(f"{API}/listings/{listing['id']}", headers=ch).json()["errorCode"] == "LISTING_NOT_FOUND"
    assert client.post(f"{API}/listings/{listing['id']}/resume", headers=ph).json()["data"]["status"] == "PUBLISHED"

    _, ph2 = _verified_provider(client, admin_headers, conn, "+249915000012", cat["id"], name="Other")
    assert client.delete(f"{API}/listings/{listing['id']}", headers=ph2).json()["errorCode"] == "FORBIDDEN"
    assert client.delete(f"{API}/listings/{listing['id']}", headers=ph).json()["data"]["deleted"] is True
    img = t("ServiceListingImage")
    assert conn.execute(select(img.c.id).where(img.c.listingId == listing["id"])).first() is None


def test_listing_rules(client, admin_headers, conn, uploads):
    sc = t("ServiceCategory")
    on_demand = conn.execute(select(sc.c.id).where(sc.c.type == "ON_DEMAND")).scalars().first()
    provider_id, ph = _verified_provider(client, admin_headers, conn, "+249915000020", on_demand)
    uid = _provider_user_id(conn, provider_id)
    res = client.post(f"{API}/listings", headers=ph, json={
        "categoryId": on_demand, "title": "Fix your sink", "description": "Any leak, same day, all tools included.",
        "priceFrom": 5000, "coverUrl": _img(uid)})
    assert res.json()["errorCode"] == "CATEGORY_NOT_LISTABLE"

    _, ch, _ = _user(client, admin_headers, "+249915000021")
    assert client.post(f"{API}/listings", headers=ch, json={
        "categoryId": on_demand, "title": "x" * 6, "description": "y" * 25, "priceFrom": 1, "coverUrl": _img(uid)
    }).json()["errorCode"] == "PROVIDER_PROFILE_NOT_FOUND"
    assert client.post(f"{API}/admin/listings/nope/approve", headers=ch).json()["errorCode"] == "FORBIDDEN"


def test_category_image(client, admin_headers, uploads):
    _, h, _ = _user(client, admin_headers, "+249915000030")
    assert client.post(f"{API}/uploads/signature", headers=h, json={"purpose": "category"}).json()["errorCode"] == "FORBIDDEN"
    signed = client.post(f"{API}/uploads/signature", headers=admin_headers, json={"purpose": "category"}).json()["data"]
    assert signed["folder"].startswith("sahl/categories/")

    good = f"https://res.cloudinary.com/{CLOUD}/image/upload/v1/{signed['folder']}/writing.jpg"
    bad = client.post(f"{API}/admin/service-categories", headers=admin_headers, json={
        "type": "REMOTE", "nameEn": "Writing", "nameAr": "كتابة", "imageUrl": _img("someone", "x.jpg")})
    assert bad.json()["errorCode"] == "INVALID_IMAGE_URL"

    cat = client.post(f"{API}/admin/service-categories", headers=admin_headers, json={
        "type": "REMOTE", "nameEn": "Writing", "nameAr": "كتابة", "imageUrl": good}).json()["data"]
    assert cat["imageUrl"] == good
    listed = client.get(f"{API}/service-categories?type=REMOTE", headers=h).json()["data"]
    assert next(c for c in listed if c["id"] == cat["id"])["imageUrl"] == good
    assert client.get(f"{API}/service-categories/{cat['id']}", headers=h).json()["data"]["imageUrl"] == good

    # Renaming keeps the image; sending null removes it.
    kept = client.patch(f"{API}/admin/service-categories/{cat['id']}", headers=admin_headers, json={"nameEn": "Copywriting"})
    assert kept.json()["data"]["imageUrl"] == good
    cleared = client.patch(f"{API}/admin/service-categories/{cat['id']}", headers=admin_headers, json={"imageUrl": None})
    assert cleared.json()["data"]["imageUrl"] is None
