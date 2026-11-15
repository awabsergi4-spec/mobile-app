"""Admin-assisted password reset."""

from test_customer_phase3 import API, _user


def test_password_reset_flow(client, admin_headers):
    user_id, h, tokens = _user(client, admin_headers, "+249916000001")

    # Unknown numbers get the same answer (no account enumeration).
    assert client.post(f"{API}/auth/password-reset/request", json={"phone": "+249916999999"}).json()["data"]["requested"]
    assert client.post(f"{API}/auth/password-reset/request", json={"phone": "+249916000001"}).status_code == 200
    # A second request while one is open does not pile up.
    client.post(f"{API}/auth/password-reset/request", json={"phone": "+249916000001"})

    queue = client.get(f"{API}/admin/password-resets", headers=admin_headers).json()["data"]
    mine = [r for r in queue["requests"] if r["userId"] == user_id]
    assert len(mine) == 1 and mine[0]["status"] == "WAITING" and mine[0]["phone"].endswith("916000001")
    assert client.get(f"{API}/admin/password-resets", headers=h).json()["errorCode"] == "FORBIDDEN"

    confirm = {"phone": "+249916000001", "code": "123456", "newPassword": "NewSecret99"}
    # No code issued yet.
    assert client.post(f"{API}/auth/password-reset/confirm", json=confirm).json()["errorCode"] == "INVALID_RESET_CODE"

    code = client.post(f"{API}/admin/password-resets/{mine[0]['id']}/issue", headers=admin_headers).json()["data"]["code"]
    assert len(code) == 6 and code.isdigit()
    wrong = "000000" if code != "000000" else "111111"
    assert client.post(f"{API}/auth/password-reset/confirm", json={**confirm, "code": wrong}).json()["errorCode"] \
        == "INVALID_RESET_CODE"

    assert client.post(f"{API}/auth/password-reset/confirm", json={**confirm, "code": code}).json()["data"]["reset"]
    # Old sessions are signed out; the new password works, the old one doesn't.
    assert client.post(f"{API}/auth/refresh", json={"refreshToken": tokens["refreshToken"]}).status_code == 401
    assert client.post(f"{API}/auth/login", json={"phone": "+249916000001", "password": "Secret123"}).json()["errorCode"] \
        == "INVALID_CREDENTIALS"
    assert client.post(f"{API}/auth/login", json={"phone": "+249916000001", "password": "NewSecret99"}).status_code == 200
    # The code can't be reused.
    assert client.post(f"{API}/auth/password-reset/confirm", json={**confirm, "code": code}).json()["errorCode"] \
        == "INVALID_RESET_CODE"
    done = client.get(f"{API}/admin/password-resets?status=DONE", headers=admin_headers).json()["data"]["requests"]
    assert any(r["id"] == mine[0]["id"] and r["status"] == "COMPLETED" for r in done)


def test_password_reset_attempt_limit_and_cancel(client, admin_headers):
    user_id, _, _ = _user(client, admin_headers, "+249916000002")
    client.post(f"{API}/auth/password-reset/request", json={"phone": "+249916000002"})
    req = next(r for r in client.get(f"{API}/admin/password-resets", headers=admin_headers).json()["data"]["requests"]
               if r["userId"] == user_id)
    code = client.post(f"{API}/admin/password-resets/{req['id']}/issue", headers=admin_headers).json()["data"]["code"]
    wrong = "000000" if code != "000000" else "111111"
    body = {"phone": "+249916000002", "code": wrong, "newPassword": "Another123"}
    for _ in range(5):
        client.post(f"{API}/auth/password-reset/confirm", json=body)
    assert client.post(f"{API}/auth/password-reset/confirm", json={**body, "code": code}).json()["errorCode"] \
        == "TOO_MANY_ATTEMPTS"

    assert client.post(f"{API}/admin/password-resets/{req['id']}/cancel", headers=admin_headers).json()["data"]["status"] \
        == "CANCELLED"
    assert client.post(f"{API}/admin/password-resets/{req['id']}/issue", headers=admin_headers).json()["errorCode"] \
        == "INVALID_STATUS_TRANSITION"
