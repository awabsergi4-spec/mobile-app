"""Passwords, JWTs, refresh tokens, and the auth/permission dependencies."""

import hashlib
import re
import secrets
from datetime import timedelta
from typing import Any

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from fastapi import Depends, Request
from sqlalchemy import Connection, or_, select

from .config import get_settings
from .db import get_conn, insert_row, t, update_rows, utcnow
from .responses import ApiError

_hasher = PasswordHasher()  # argon2id — verifies hashes written by apps/backend's node argon2 too


def hash_password(plain: str) -> str:
    return _hasher.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return _hasher.verify(hashed, plain)
    except (VerificationError, InvalidHashError):
        return False


# ── Phone numbers ────────────────────────────────────────────────────────

_PHONE_RE = re.compile(r"^\+?[1-9]\d{7,14}$")


def normalize_phone(raw: str) -> str:
    """Canonical form '+<digits>' — spaces/dashes/brackets removed."""
    cleaned = re.sub(r"[\s\-()]", "", raw or "")
    if not _PHONE_RE.fullmatch(cleaned):
        raise ApiError(400, "INVALID_PHONE", "Invalid phone number")
    return "+" + cleaned.lstrip("+")


def find_user_by_phone(conn: Connection, raw: str) -> dict[str, Any] | None:
    try:
        canonical = normalize_phone(raw)
    except ApiError:
        return None
    users = t("User")
    # Older rows may have been stored without the leading '+'.
    row = conn.execute(
        select(users).where(or_(users.c.phone == canonical, users.c.phone == canonical[1:]))
    ).mappings().first()
    return dict(row) if row else None


# ── Tokens ───────────────────────────────────────────────────────────────

def issue_access_token(user_id: str) -> str:
    settings = get_settings()
    now = utcnow()
    payload = {"sub": user_id, "iat": now, "exp": now + timedelta(seconds=settings.access_token_ttl_seconds)}
    return jwt.encode(payload, settings.jwt_private_key, algorithm="RS256")


def verify_access_token(token: str) -> str:
    try:
        payload = jwt.decode(token, get_settings().jwt_public_key, algorithms=["RS256"])
    except jwt.PyJWTError as exc:
        raise ApiError(401, "UNAUTHENTICATED", "Authentication required") from exc
    sub = payload.get("sub")
    if not isinstance(sub, str) or not sub:
        raise ApiError(401, "UNAUTHENTICATED", "Authentication required")
    return sub


def sha256(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def issue_session(conn: Connection, user_id: str, device_info: str | None = None) -> dict[str, str]:
    raw_refresh = secrets.token_hex(32)
    insert_row(conn, "RefreshToken", {
        "userId": user_id,
        "tokenHash": sha256(raw_refresh),
        "deviceInfo": device_info,
        "expiresAt": utcnow() + timedelta(seconds=get_settings().refresh_token_ttl_seconds),
    })
    return {"accessToken": issue_access_token(user_id), "refreshToken": raw_refresh}


def revoke_all_sessions(conn: Connection, user_id: str) -> None:
    tokens = t("RefreshToken")
    update_rows(conn, "RefreshToken", (tokens.c.userId == user_id) & (tokens.c.revokedAt.is_(None)), {"revokedAt": utcnow()})


# ── Dependencies ─────────────────────────────────────────────────────────

def _bearer(request: Request) -> str:
    header = request.headers.get("authorization", "")
    if not header.startswith("Bearer "):
        raise ApiError(401, "UNAUTHENTICATED", "Authentication required")
    return header[len("Bearer "):]


def current_user(request: Request, conn: Connection = Depends(get_conn)) -> dict[str, Any]:
    """Authenticated, ACTIVE user. Suspended/banned/pending accounts are rejected
    on every request (not just at login), so suspension takes effect immediately."""
    user_id = verify_access_token(_bearer(request))
    users = t("User")
    user = conn.execute(select(users).where(users.c.id == user_id)).mappings().first()
    if not user:
        raise ApiError(401, "UNAUTHENTICATED", "Authentication required")
    if user["status"] != "ACTIVE":
        raise ApiError(401, "ACCOUNT_NOT_ACTIVE", "Account is not active")
    return dict(user)


def permission_keys(conn: Connection, user_id: str) -> set[str]:
    usr, srp, perm = t("UserStaffRole"), t("StaffRolePermission"), t("Permission")
    rows = conn.execute(
        select(perm.c.key)
        .select_from(usr.join(srp, srp.c.staffRoleId == usr.c.staffRoleId).join(perm, perm.c.id == srp.c.permissionId))
        .where(usr.c.userId == user_id)
    ).scalars().all()
    return set(rows)


def require_permission(key: str):
    """Fail-closed staff RBAC, same keys as prisma/seed.ts."""

    def dependency(user: dict = Depends(current_user), conn: Connection = Depends(get_conn)) -> dict[str, Any]:
        if key not in permission_keys(conn, user["id"]):
            raise ApiError(403, "FORBIDDEN", f"Missing required permission: {key}")
        return user

    return dependency
