"""Smoke-level checks of the app-facing endpoints against the real schema."""

from sqlalchemy import select

from app.db import insert_row, t, update_rows

API = "/api/v1"


def _active_user(client, admin_headers, phone, **extra):
    body = {"phone": phone, "password": "Secret123", "fullName": "U " + phone[-3:], "preferredLanguage": "en", **extra}
    user_id = client.post(f"{API}/auth/register", json=body).json()["data"]["id"]
    client.post(f"{API}/admin/users/{user_id}/approve", headers=admin_headers)
    token = client.post(f"{API}/auth/login", json={"phone": phone, "password": "Secret123"}).json()["data"]["accessToken"]
    return user_id, {"Authorization": f"Bearer {token}"}


def _category(conn, type_):
    sc = t("ServiceCategory")
    return conn.execute(select(sc.c.id).where(sc.c.type == type_)).scalars().first()


def test_reference_endpoints(client, admin_headers):
    _, h = _active_user(client, admin_headers, "+249913000001")
    cats = client.get(f"{API}/service-categories?type=ON_DEMAND&locale=ar", headers=h).json()["data"]
    assert cats and all(c["type"] == "ON_DEMAND" and c["name"] for c in cats)
    assert client.get(f"{API}/home-layout", headers=h).json()["success"]
    assert client.get(f"{API}/config").json()["success"]


def test_on_demand_matches_and_offer_flow(client, admin_headers, conn):
    category_id = _category(conn, "ON_DEMAND")
    _, provider_h = _active_user(client, admin_headers, "+249913000002", accountType="PROVIDER", businessName="Tow Pro")
    profile = client.get(f"{API}/providers/me", headers=provider_h).json()["data"]
    pp = t("ProviderProfile")
    update_rows(conn, "ProviderProfile", pp.c.id == profile["id"], {"verificationStatus": "VERIFIED"})
    insert_row(conn, "ProviderCategory", {"providerId": profile["id"], "categoryId": category_id})
    insert_row(conn, "ProviderServiceArea", {"providerId": profile["id"], "centerLat": 15.5, "centerLng": 32.56, "radiusKm": 20})
    assert client.post(f"{API}/providers/me/availability", json={"mode": "ONLINE"}, headers=provider_h).status_code == 200

    _, customer_h = _active_user(client, admin_headers, "+249913000003")
    created = client.post(f"{API}/on-demand", headers=customer_h, json={
        "categoryId": category_id, "description": "Car broke down", "lat": 15.51, "lng": 32.55})
    assert created.status_code == 201, created.text
    request = created.json()["data"]
    assert request["status"] == "SEARCHING" and request["fulfillmentMode"] == "INSTANT"

    offers = client.get(f"{API}/on-demand/assignments/me", headers=provider_h).json()["data"]
    assert len(offers) == 1 and offers[0]["requestDescription"] == "Car broke down"
    assert client.post(f"{API}/on-demand/assignments/{offers[0]['id']}/accept", headers=provider_h).status_code == 200
    assert client.get(f"{API}/on-demand/{request['id']}", headers=customer_h).json()["data"]["status"] == "ASSIGNED"
    assert client.get(f"{API}/on-demand", headers=customer_h).json()["data"][0]["id"] == request["id"]
    assert client.post(f"{API}/on-demand/{request['id']}/cancel", headers=customer_h).status_code == 200


def test_contract_bid_award_and_milestone(client, admin_headers, conn):
    category_id = _category(conn, "CONTRACT")
    _, customer_h = _active_user(client, admin_headers, "+249913000004")
    _, provider_h = _active_user(client, admin_headers, "+249913000005", accountType="PROVIDER", businessName="Builder")
    profile = client.get(f"{API}/providers/me", headers=provider_h).json()["data"]
    update_rows(conn, "ProviderProfile", t("ProviderProfile").c.id == profile["id"], {"verificationStatus": "VERIFIED"})

    project = client.post(f"{API}/contracts/projects", headers=customer_h, json={
        "categoryId": category_id, "title": "New fence", "description": "Build a 20m fence around the yard"}).json()["data"]
    bid = client.post(f"{API}/contracts/projects/{project['id']}/bids", headers=provider_h,
                      json={"amount": 500000, "message": "Can start Monday"}).json()["data"]
    contract = client.post(f"{API}/contracts/bids/{bid['id']}/award", headers=customer_h)
    assert contract.status_code == 201, contract.text
    contract_id = contract.json()["data"]["id"]
    milestone = client.post(f"{API}/contracts/{contract_id}/milestones", headers=customer_h,
                            json={"title": "Phase 1", "amount": 250000})
    assert milestone.status_code == 201
    assert len(client.get(f"{API}/contracts/{contract_id}/milestones", headers=provider_h).json()["data"]) == 1
    assert client.get(f"{API}/contracts/bids/me", headers=provider_h).json()["data"][0]["status"] == "ACCEPTED"


def test_company_invitation_flow(client, admin_headers):
    owner_id, owner_h = _active_user(client, admin_headers, "+249913000006", accountType="COMPANY", companyName="Acme")
    company_id = client.get(f"{API}/users/me", headers=owner_h).json()["data"]["ownedCompanyId"]
    _, staff_h = _active_user(client, admin_headers, "+249913000007")
    invite = client.post(f"{API}/companies/{company_id}/members", headers=owner_h, json={"invitedPhone": "+249913000007"})
    assert invite.status_code == 201
    mine = client.get(f"{API}/companies/invitations/mine", headers=staff_h).json()["data"]
    assert mine[0]["companyName"] == "Acme"
    assert client.post(f"{API}/companies/invitations/{mine[0]['id']}/accept", headers=staff_h).status_code == 200
    assert len(client.get(f"{API}/companies/{company_id}/members", headers=owner_h).json()["data"]) == 2


def test_wallet_and_withdrawal_balance_check(client, admin_headers):
    _, provider_h = _active_user(client, admin_headers, "+249913000008", accountType="PROVIDER", businessName="Solo")
    wallet = client.get(f"{API}/wallets/me", headers=provider_h).json()["data"]
    assert wallet["currency"] == "SDG" and wallet["balances"] == []
    res = client.post(f"{API}/providers/me/withdrawals", headers=provider_h, json={"amount": 100, "method": "MOBILE_MONEY"})
    assert res.status_code == 409 and res.json()["errorCode"] == "INSUFFICIENT_BALANCE"


def test_notifications(client, admin_headers, conn):
    user_id, h = _active_user(client, admin_headers, "+249913000009")
    insert_row(conn, "Notification", {"userId": user_id, "type": "broadcast", "title": "Hi", "body": "Welcome"})
    assert client.get(f"{API}/notifications/unread-count", headers=h).json()["data"]["count"] == 1
    assert client.post(f"{API}/notifications/read-all", headers=h).json()["data"]["updatedCount"] == 1
