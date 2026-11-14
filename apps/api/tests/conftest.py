"""Integration-test harness: real PostgreSQL, but every test runs inside one
outer transaction that is rolled back afterwards — nothing persists.
Each request gets a SAVEPOINT, mirroring the per-request transaction in app.db.get_conn."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.db import get_conn, get_engine, insert_row, t
from app.main import app
from app.security import hash_password


@pytest.fixture()
def conn():
    connection = get_engine().connect()
    outer = connection.begin()
    try:
        yield connection
    finally:
        outer.rollback()
        connection.close()


@pytest.fixture()
def client(conn):
    def _test_conn():
        savepoint = conn.begin_nested()
        try:
            yield conn
            savepoint.commit()
        except Exception as exc:
            if getattr(exc, "commit_writes", False):
                savepoint.commit()
            else:
                savepoint.rollback()
            raise

    app.dependency_overrides[get_conn] = _test_conn
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def admin_headers(client, conn):
    """A fresh ACTIVE staff user holding the seeded SUPER_ADMIN role."""
    region_id = conn.execute(select(t("Region").c.id).where(t("Region").c.code == "SD")).scalar_one()
    role_id = conn.execute(select(t("StaffRole").c.id).where(t("StaffRole").c.key == "SUPER_ADMIN")).scalar_one()
    admin = insert_row(conn, "User", {
        "phone": "+249911000001", "passwordHash": hash_password("AdminPass123"), "fullName": "Test Admin",
        "preferredLanguage": "en", "status": "ACTIVE", "regionId": region_id,
    })
    insert_row(conn, "UserStaffRole", {"userId": admin["id"], "staffRoleId": role_id})
    res = client.post("/api/v1/auth/login", json={"phone": "+249911000001", "password": "AdminPass123"})
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['data']['accessToken']}"}
