"""Phase 3 (customer) endpoints: catalog, account, reviews, support, ported actions."""

from sqlalchemy import select

from app.common import category_key
from app.db import insert_row, t, update_rows

API = "/api/v1"


def _user(client, admin_headers, phone, **extra):
    body = {"phone": phone, "password": "Secret123", "fullName": "Sara Ahmed " + phone[-2:], "preferredLanguage": "ar", **extra}
    user_id = client.post(f"{API}/auth/register", json=body).json()["data"]["id"]
    client.post(f"{API}/admin/users/{user_id}/approve", headers=admin_headers)
    tokens = client.post(f"{API}/auth/login", json={"phone": phone, "password": "Secret123"}).json()["data"]
    return user_id, {"Authorization": f"Bearer {tokens['accessToken']}"}, tokens


def _category(conn, type_):
    sc = t("ServiceCategory")
    return conn.execute(select(sc.c.id).where(sc.c.type == type_)).scalars().first()


def _verified_provider(client, admin_headers, conn, phone, category_id, name="Nile Plumbing", price=(5000, 15000)):
    _, headers, _ = _user(client, admin_headers, phone, accountType="PROVIDER", businessName=name)
    profile = client.get(f"{API}/providers/me", headers=headers).json()["data"]
    pp = t("ProviderProfile")
    update_rows(conn, "ProviderProfile", pp.c.id == profile["id"],
                {"verificationStatus": "VERIFIED", "skills": ["pipes", "heaters"], "bio": "Fast and tidy"})
    insert_row(conn, "ProviderCategory", {"providerId": profile["id"], "categoryId": category_id,
                                          "priceMin": price[0], "priceMax": price[1]})
    return profile["id"], headers


def test_explore_category_detail_search_and_public_profile(client, admin_headers, conn):
    cat = _category(conn, "ON_DEMAND")
    provider_id, _ = _verified_provider(client, admin_headers, conn, "+249914000001", cat)
    _, h, _ = _user(client, admin_headers, "+249914000002")

    listed = client.get(f"{API}/explore/providers?categoryId={cat}", headers=h).json()["data"]
    mine = [p for p in listed if p["id"] == provider_id]
    assert mine and mine[0]["priceMin"] == 5000 and mine[0]["priceMax"] == 15000
    assert "userId" not in mine[0] and "taxNumber" not in mine[0]

    detail = client.get(f"{API}/service-categories/{cat}?locale=ar", headers=h).json()["data"]
    assert detail["providerCount"] >= 1 and detail["priceMin"] is not None and detail["name"]
    # The locale-independent key is derived from the English name, even for ?locale=ar.
    en_name = client.get(f"{API}/service-categories/{cat}?locale=en", headers=h).json()["data"]["name"]
    assert detail["key"] == category_key(en_name)
    listing = client.get(f"{API}/service-categories?type=ON_DEMAND&locale=ar", headers=h).json()["data"]
    assert next(c for c in listing if c["id"] == cat)["key"] == detail["key"]

    found = client.get(f"{API}/search?q=heaters", headers=h).json()["data"]
    assert any(p["id"] == provider_id for p in found["providers"])

    profile = client.get(f"{API}/providers/{provider_id}/profile?locale=en", headers=h).json()["data"]
    assert profile["businessName"] == "Nile Plumbing" and profile["services"][0]["name"]
    assert profile["services"][0]["key"] == detail["key"]
    assert profile["portfolio"] == [] and profile["recentReviews"] == []

    assert client.get(f"{API}/providers/nope/profile", headers=h).json()["errorCode"] == "PROVIDER_NOT_FOUND"


def test_unverified_providers_are_not_public(client, admin_headers, conn):
    _, ph, _ = _user(client, admin_headers, "+249914000003", accountType="PROVIDER", businessName="Hidden Co")
    hidden_id = client.get(f"{API}/providers/me", headers=ph).json()["data"]["id"]
    _, h, _ = _user(client, admin_headers, "+249914000004")
    assert client.get(f"{API}/providers/{hidden_id}/profile", headers=h).status_code == 404
    assert all(p["id"] != hidden_id for p in client.get(f"{API}/explore/providers", headers=h).json()["data"])


def test_profile_edit_password_and_notification_prefs(client, admin_headers):
    _, h, tokens = _user(client, admin_headers, "+249914000005")
    updated = client.patch(f"{API}/users/me", headers=h, json={"fullName": "Sara New", "city": "Khartoum",
                                                                "email": "Sara@Example.com"}).json()["data"]
    assert updated["fullName"] == "Sara New" and updated["city"] == "Khartoum" and updated["email"] == "sara@example.com"

    bad = client.post(f"{API}/users/me/password", headers=h, json={"currentPassword": "wrong", "newPassword": "NewSecret1"})
    assert bad.json()["errorCode"] == "INVALID_CURRENT_PASSWORD"
    good = client.post(f"{API}/users/me/password", headers=h, json={"currentPassword": "Secret123", "newPassword": "NewSecret1"})
    assert good.status_code == 200 and good.json()["data"]["accessToken"]
    # Other sessions are signed out.
    assert client.post(f"{API}/auth/refresh", json={"refreshToken": tokens["refreshToken"]}).status_code == 401
    assert client.post(f"{API}/auth/login", json={"phone": "+249914000005", "password": "NewSecret1"}).status_code == 200

    h2 = {"Authorization": f"Bearer {good.json()['data']['accessToken']}"}
    assert client.get(f"{API}/users/me/notification-preferences", headers=h2).json()["data"] == {
        "orders": True, "messages": True, "promotions": True, "account": True}
    saved = client.put(f"{API}/users/me/notification-preferences", headers=h2,
                       json={"orders": True, "messages": True, "promotions": False, "account": True}).json()["data"]
    assert saved["promotions"] is False


def test_review_only_after_completion_and_updates_rating(client, admin_headers, conn):
    cat = _category(conn, "ON_DEMAND")
    provider_id, _ = _verified_provider(client, admin_headers, conn, "+249914000006", cat)
    customer_id, h, _ = _user(client, admin_headers, "+249914000007")
    request = insert_row(conn, "OnDemandRequest", {"customerId": customer_id, "categoryId": cat, "description": "Leak",
                                                   "lat": 15.5, "lng": 32.5, "status": "IN_PROGRESS"})
    insert_row(conn, "OnDemandAssignment", {"requestId": request["id"], "providerId": provider_id, "status": "ACCEPTED"})

    body = {"jobType": "ON_DEMAND", "jobId": request["id"], "rating": 4, "comment": "Good", "scores": {"QUALITY": 5}}
    assert client.post(f"{API}/reviews", headers=h, json=body).json()["errorCode"] == "JOB_NOT_COMPLETED"
    update_rows(conn, "OnDemandRequest", t("OnDemandRequest").c.id == request["id"], {"status": "COMPLETED"})
    assert client.post(f"{API}/reviews", headers=h, json=body).status_code == 201
    assert client.post(f"{API}/reviews", headers=h, json=body).json()["errorCode"] == "ALREADY_REVIEWED"

    profile = client.get(f"{API}/providers/{provider_id}/profile", headers=h).json()["data"]
    assert profile["ratingAverage"] == 4 and profile["ratingCount"] == 1
    assert profile["recentReviews"][0]["authorName"] == "Sara"
    mine = client.get(f"{API}/reviews/for-job?jobType=ON_DEMAND&jobId={request['id']}", headers=h).json()["data"]
    assert mine["rating"] == 4


def test_support_tickets(client, admin_headers):
    _, h, _ = _user(client, admin_headers, "+249914000008")
    ticket = client.post(f"{API}/support/tickets", headers=h, json={"subject": "Payment question", "message": "Hello"}).json()["data"]
    client.post(f"{API}/support/tickets/{ticket['id']}/messages", headers=h, json={"body": "Any update?"})
    detail = client.get(f"{API}/support/tickets/{ticket['id']}", headers=h).json()["data"]
    assert detail["status"] == "OPEN" and len(detail["messages"]) == 2 and detail["messages"][0]["fromMe"]
    _, other, _ = _user(client, admin_headers, "+249914000009")
    assert client.get(f"{API}/support/tickets/{ticket['id']}", headers=other).status_code == 404


def test_contract_cancel_and_milestone_status_rules(client, admin_headers, conn):
    cat = _category(conn, "CONTRACT")
    _, ph = _verified_provider(client, admin_headers, conn, "+249914000010", cat, name="Build Co")
    _, ch, _ = _user(client, admin_headers, "+249914000011")
    p1 = client.post(f"{API}/contracts/projects", headers=ch, json={
        "categoryId": cat, "title": "Garden wall", "description": "Build a garden wall 10 metres"}).json()["data"]
    assert client.post(f"{API}/contracts/projects/{p1['id']}/cancel", headers=ch).json()["data"]["status"] == "CANCELLED"

    p2 = client.post(f"{API}/contracts/projects", headers=ch, json={
        "categoryId": cat, "title": "Kitchen", "description": "Renovate a small kitchen"}).json()["data"]
    bid = client.post(f"{API}/contracts/projects/{p2['id']}/bids", headers=ph, json={"amount": 90000}).json()["data"]
    contract = client.post(f"{API}/contracts/bids/{bid['id']}/award", headers=ch).json()["data"]
    assert client.get(f"{API}/contracts/projects/{p2['id']}").json()["data"]["contractId"] == contract["id"]
    assert client.get(f"{API}/contracts/projects/{p1['id']}").json()["data"]["contractId"] is None
    ms = client.post(f"{API}/contracts/{contract['id']}/milestones", headers=ch, json={"title": "Phase 1", "amount": 45000}).json()["data"]

    url = f"{API}/contracts/milestones/{ms['id']}/status"
    assert client.post(url, headers=ch, json={"toStatus": "IN_PROGRESS"}).json()["errorCode"] == "FORBIDDEN"
    assert client.post(url, headers=ph, json={"toStatus": "SUBMITTED"}).json()["errorCode"] == "INVALID_STATUS_TRANSITION"
    assert client.post(url, headers=ph, json={"toStatus": "IN_PROGRESS"}).status_code == 200
    assert client.post(url, headers=ph, json={"toStatus": "SUBMITTED"}).status_code == 200
    assert client.post(url, headers=ch, json={"toStatus": "APPROVED"}).json()["data"]["status"] == "APPROVED"


def test_on_demand_assignments_show_provider(client, admin_headers, conn):
    cat = _category(conn, "ON_DEMAND")
    provider_id, _ = _verified_provider(client, admin_headers, conn, "+249914000012", cat, name="Quick Fix")
    customer_id, h, _ = _user(client, admin_headers, "+249914000013")
    request = insert_row(conn, "OnDemandRequest", {"customerId": customer_id, "categoryId": cat, "description": "Help",
                                                   "lat": 15.5, "lng": 32.5, "status": "ASSIGNED"})
    insert_row(conn, "OnDemandAssignment", {"requestId": request["id"], "providerId": provider_id, "status": "ACCEPTED"})
    items = client.get(f"{API}/on-demand/{request['id']}/assignments", headers=h).json()["data"]
    assert items[0]["providerBusinessName"] == "Quick Fix"


def test_promotions_only_active_window(client, admin_headers, conn):
    from datetime import timedelta
    from app.db import utcnow
    _, h, _ = _user(client, admin_headers, "+249914000014")
    now = utcnow()
    live = insert_row(conn, "PromotionalCampaign", {"name": "Eid", "discountType": "PERCENTAGE", "discountValue": 10,
                                                    "startsAt": now - timedelta(days=1), "endsAt": now + timedelta(days=1),
                                                    "isActive": True})
    insert_row(conn, "PromotionalCampaign", {"name": "Old", "discountType": "FLAT", "discountValue": 5,
                                             "startsAt": now - timedelta(days=9), "endsAt": now - timedelta(days=2),
                                             "isActive": True})
    names = [p["id"] for p in client.get(f"{API}/promotions", headers=h).json()["data"]]
    assert live["id"] in names and len([n for n in names if n == live["id"]]) == 1


def test_category_key_slug():
    assert category_key("Legal Consultation") == "legal-consultation"
    assert category_key("  Graphic   Design ") == "graphic-design"
    assert category_key(None) is None and category_key("") is None
