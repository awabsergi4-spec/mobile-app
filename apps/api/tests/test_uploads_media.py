"""Profile pictures, portfolio and identity documents go through app uploads."""

from test_customer_phase3 import API, _user, _verified_provider
from test_listings import CLOUD, _provider_user_id, uploads  # noqa: F401  (fixture)

from app.db import t
from sqlalchemy import select


def _url(user_id, folder, name="a.jpg", private=False):
    kind = "authenticated/s--abc123--" if private else "upload"
    return f"https://res.cloudinary.com/{CLOUD}/image/{kind}/v1/sahl/{folder}/{user_id}/{name}"


def test_document_signature_is_private(client, admin_headers, uploads):
    _, h, _ = _user(client, admin_headers, "+249918000001")
    signed = client.post(f"{API}/uploads/signature", headers=h, json={"purpose": "document"}).json()["data"]
    assert signed["type"] == "authenticated" and signed["folder"].startswith("sahl/documents/")
    avatar = client.post(f"{API}/uploads/signature", headers=h, json={"purpose": "avatar"}).json()["data"]
    assert "type" not in avatar


def test_profile_picture(client, admin_headers, uploads):
    user_id, h, _ = _user(client, admin_headers, "+249918000002")
    bad = client.patch(f"{API}/users/me", headers=h, json={"profilePictureUrl": "https://evil.example/x.jpg"})
    assert bad.json()["errorCode"] == "INVALID_IMAGE_URL"
    url = _url(user_id, "avatars")
    me = client.patch(f"{API}/users/me", headers=h, json={"profilePictureUrl": url}).json()["data"]
    assert me["profilePictureUrl"] == url
    cleared = client.patch(f"{API}/users/me", headers=h, json={"profilePictureUrl": None}).json()["data"]
    assert cleared["profilePictureUrl"] is None


def test_provider_profile_blank_fields_and_media(client, admin_headers, conn, uploads):
    sc = t("ServiceCategory")
    cat = conn.execute(select(sc.c.id).where(sc.c.type == "REMOTE")).scalars().first()
    provider_id, ph = _verified_provider(client, admin_headers, conn, "+249918000010", cat)
    uid = _provider_user_id(conn, provider_id)

    # Empty optional fields from the form must not fail validation.
    res = client.patch(f"{API}/providers/me", headers=ph, json={
        "businessName": "Nile Studio", "bio": "", "emergencyContactName": "", "emergencyContactPhone": ""})
    assert res.status_code == 200, res.text
    assert res.json()["data"]["businessName"] == "Nile Studio"

    assert client.post(f"{API}/providers/me/portfolio", headers=ph, json={"mediaUrl": "https://x.example/a.jpg"}) \
        .json()["errorCode"] == "INVALID_IMAGE_URL"
    assert client.post(f"{API}/providers/me/portfolio", headers=ph, json={"mediaUrl": _url(uid, "portfolio")}).status_code == 201

    doc_url = _url(uid, "documents", private=True)
    assert client.post(f"{API}/providers/me/documents", headers=ph, json={"type": "LICENSE", "fileUrl": doc_url}) \
        .json()["errorCode"] == "VALIDATION_ERROR"
    assert client.post(f"{API}/providers/me/documents", headers=ph,
                       json={"type": "PASSPORT", "fileUrl": _url(uid, "documents")}).json()["errorCode"] == "INVALID_IMAGE_URL"
    ok = client.post(f"{API}/providers/me/documents", headers=ph, json={"type": "NATIONAL_ID", "fileUrl": doc_url})
    assert ok.status_code == 201 and ok.json()["data"]["type"] == "NATIONAL_ID"
