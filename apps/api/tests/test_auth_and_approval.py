API = "/api/v1"


def register(client, phone="+249912345678", **extra):
    body = {"phone": phone, "password": "Secret123", "fullName": "Test User", "preferredLanguage": "ar", **extra}
    return client.post(f"{API}/auth/register", json=body)


def login(client, phone="+249912345678", password="Secret123"):
    return client.post(f"{API}/auth/login", json={"phone": phone, "password": password})


def approve(client, admin_headers, user_id):
    return client.post(f"{API}/admin/users/{user_id}/approve", headers=admin_headers)


def test_health_envelope(client):
    res = client.get(f"{API}/health")
    assert res.status_code == 200
    assert res.json() == {"success": True, "message": None, "data": {"status": "ok"}}


def test_signup_waits_for_admin_approval_then_logs_in(client, admin_headers):
    res = register(client)
    assert res.status_code == 201, res.text
    data = res.json()["data"]
    assert data["status"] == "PENDING_VERIFICATION" and data["accountType"] == "CUSTOMER"

    blocked = login(client)
    assert blocked.status_code == 403
    assert blocked.json()["errorCode"] == "ACCOUNT_PENDING_APPROVAL"

    assert approve(client, admin_headers, data["id"]).status_code == 200
    assert approve(client, admin_headers, data["id"]).json()["errorCode"] == "INVALID_STATUS_TRANSITION"

    session = login(client)
    assert session.status_code == 200
    token = session.json()["data"]["accessToken"]
    me = client.get(f"{API}/users/me", headers={"Authorization": f"Bearer {token}"}).json()["data"]
    assert me["status"] == "ACTIVE" and me["providerProfile"] is None and me["ownedCompanyId"] is None
    assert me["createdAt"].endswith("Z")


def test_phone_is_normalised_on_register_and_login(client, admin_headers):
    res = register(client, phone="+249 912-345 679")
    assert res.json()["data"]["phone"] == "+249912345679"
    approve(client, admin_headers, res.json()["data"]["id"])
    assert login(client, phone="249912345679").status_code == 200


def test_duplicate_phone_rejected(client):
    register(client)
    assert register(client).json()["errorCode"] == "PHONE_ALREADY_REGISTERED"


def test_provider_and_company_signup_create_their_records(client, admin_headers):
    provider = register(client, phone="+249912000001", accountType="PROVIDER", businessName="Fix It")
    company = register(client, phone="+249912000002", accountType="COMPANY", companyName="Build Co")
    for res in (provider, company):
        approve(client, admin_headers, res.json()["data"]["id"])

    def me(phone):
        token = login(client, phone=phone).json()["data"]["accessToken"]
        return client.get(f"{API}/users/me", headers={"Authorization": f"Bearer {token}"}).json()["data"]

    assert me("+249912000001")["providerProfile"] is not None
    company_me = me("+249912000002")
    assert company_me["ownedCompanyId"] is not None
    assert company_me["companyMembership"]["role"] == "OWNER"


def test_provider_signup_requires_business_name(client):
    res = register(client, accountType="PROVIDER")
    assert res.status_code == 400 and res.json()["errorCode"] == "VALIDATION_ERROR"


def test_refresh_rotation_and_reuse_detection(client, admin_headers):
    approve(client, admin_headers, register(client).json()["data"]["id"])
    first = login(client).json()["data"]
    rotated = client.post(f"{API}/auth/refresh", json={"refreshToken": first["refreshToken"]})
    assert rotated.status_code == 200
    reuse = client.post(f"{API}/auth/refresh", json={"refreshToken": first["refreshToken"]})
    assert reuse.json()["errorCode"] == "REFRESH_TOKEN_REUSE_DETECTED"
    # Reuse revoked every session, including the freshly rotated one.
    after = client.post(f"{API}/auth/refresh", json={"refreshToken": rotated.json()["data"]["refreshToken"]})
    assert after.json()["errorCode"] == "REFRESH_TOKEN_REUSE_DETECTED"


def test_suspension_cuts_off_access_and_refresh(client, admin_headers):
    user_id = register(client).json()["data"]["id"]
    approve(client, admin_headers, user_id)
    session = login(client).json()["data"]
    headers = {"Authorization": f"Bearer {session['accessToken']}"}
    assert client.get(f"{API}/users/me", headers=headers).status_code == 200

    res = client.post(f"{API}/admin/users/{user_id}/suspend", json={"reason": "fraud check"}, headers=admin_headers)
    assert res.status_code == 200

    denied = client.get(f"{API}/users/me", headers=headers)
    assert denied.status_code == 401 and denied.json()["errorCode"] == "ACCOUNT_NOT_ACTIVE"
    assert client.post(f"{API}/auth/refresh", json={"refreshToken": session["refreshToken"]}).status_code == 401
    assert login(client).json()["errorCode"] == "ACCOUNT_NOT_ACTIVE"

    client.post(f"{API}/admin/users/{user_id}/reactivate", headers=admin_headers)
    assert login(client).status_code == 200


def test_admin_endpoints_require_permission(client, admin_headers):
    approve(client, admin_headers, register(client).json()["data"]["id"])
    token = login(client).json()["data"]["accessToken"]
    res = client.get(f"{API}/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403 and res.json()["errorCode"] == "FORBIDDEN"
    listing = client.get(f"{API}/admin/users?status=PENDING_VERIFICATION", headers=admin_headers).json()["data"]
    assert "pendingApprovalCount" in listing


def test_validation_and_bad_json_envelopes(client):
    res = client.post(f"{API}/auth/login", json={"phone": "1"})
    body = res.json()
    assert res.status_code == 400 and body["errorCode"] == "VALIDATION_ERROR"
    assert "phone" in body["details"]["fieldErrors"] and "traceId" in body

    bad = client.post(f"{API}/auth/login", content=b"{not json", headers={"Content-Type": "application/json"})
    assert bad.status_code == 400 and bad.json()["errorCode"] == "INVALID_JSON"


def test_protected_route_without_token(client):
    res = client.get(f"{API}/wallets/me")
    assert res.status_code == 401 and res.json()["errorCode"] == "UNAUTHENTICATED"
