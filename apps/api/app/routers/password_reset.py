"""Forgot password, admin-assisted (there is no SMS provider).

1. The user asks for a reset from the app (``POST /auth/password-reset/request``).
2. The request shows up in Admin → Password resets.
3. An admin generates a 6-digit code (shown once) and sends it to the user
   by phone/WhatsApp.
4. The user enters the code and a new password
   (``POST /auth/password-reset/confirm``); every session is signed out.

Stored in ``OtpCode`` (purpose ``PASSWORD_RESET``): ``codeHash`` holds a
marker while the request waits for an admin, then the argon2 hash of the code.
"""

import secrets
from datetime import timedelta
from typing import Literal

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import Connection, and_, func, select

from ..common import get_row, rows
from ..db import get_conn, insert_row, t, update_rows, utcnow
from ..events import audit, publish
from ..responses import ApiError, ok
from ..security import find_user_by_phone, hash_password, require_permission, revoke_all_sessions, verify_password

router = APIRouter(tags=["auth"])
admin_router = APIRouter(prefix="/admin/password-resets", tags=["admin"])
_guard = require_permission("users.manage")

PURPOSE = "PASSWORD_RESET"
WAITING = "WAITING_FOR_ADMIN"  # codeHash marker before a code is issued
CANCELLED = "CANCELLED"
REQUEST_TTL = timedelta(days=2)  # how long a request waits for an admin
CODE_TTL = timedelta(minutes=30)  # how long an issued code is valid
MAX_ATTEMPTS = 5


class RequestBody(BaseModel):
    phone: str = Field(min_length=6, max_length=20)


class ConfirmBody(BaseModel):
    phone: str = Field(min_length=6, max_length=20)
    code: str = Field(pattern=r"^\d{6}$")
    newPassword: str = Field(min_length=8, max_length=72)


def _open_requests(conn: Connection, user_id: str) -> list[dict]:
    otp = t("OtpCode")
    return rows(conn, select(otp).where(otp.c.userId == user_id, otp.c.purpose == PURPOSE, otp.c.consumedAt.is_(None),
                                        otp.c.expiresAt > utcnow()).order_by(otp.c.createdAt.desc()))


@router.post("/auth/password-reset/request")
def request_reset(body: RequestBody, conn: Connection = Depends(get_conn)):
    user = find_user_by_phone(conn, body.phone)
    # Same answer whether or not the number has an account (no enumeration).
    if user and user["status"] == "ACTIVE" and not _open_requests(conn, user["id"]):
        insert_row(conn, "OtpCode", {"userId": user["id"], "purpose": PURPOSE, "codeHash": WAITING,
                                     "expiresAt": utcnow() + REQUEST_TTL, "attempts": 0})
        publish(conn, "PasswordResetRequested", {"userId": user["id"]}, "USER", user["id"])
    return ok({"requested": True})


@router.post("/auth/password-reset/confirm")
def confirm_reset(body: ConfirmBody, conn: Connection = Depends(get_conn)):
    user = find_user_by_phone(conn, body.phone)
    issued = [r for r in _open_requests(conn, user["id"]) if r["codeHash"] not in (WAITING, CANCELLED)] if user else []
    if not issued:
        raise ApiError(400, "INVALID_RESET_CODE", "The code is wrong or has expired")
    record = issued[0]
    otp = t("OtpCode")
    if record["attempts"] >= MAX_ATTEMPTS:
        raise ApiError(429, "TOO_MANY_ATTEMPTS", "Too many wrong codes; ask for a new one")
    if not verify_password(body.code, record["codeHash"]):
        update_rows(conn, "OtpCode", otp.c.id == record["id"], {"attempts": record["attempts"] + 1})
        raise ApiError(400, "INVALID_RESET_CODE", "The code is wrong or has expired", commit_writes=True)
    users = t("User")
    update_rows(conn, "User", users.c.id == user["id"], {"passwordHash": hash_password(body.newPassword)})
    update_rows(conn, "OtpCode", otp.c.id == record["id"], {"consumedAt": utcnow()})
    revoke_all_sessions(conn, user["id"])
    audit(conn, user["id"], "user.password_reset", "User", user["id"])
    return ok({"reset": True})


# ── admin ────────────────────────────────────────────────────────────────

def _status(r: dict, now) -> str:
    if r["codeHash"] == CANCELLED:
        return "CANCELLED"
    if r["consumedAt"] is not None:
        return "COMPLETED"
    if r["expiresAt"] <= now:
        return "EXPIRED"
    return "WAITING" if r["codeHash"] == WAITING else "CODE_ISSUED"


def _present(conn: Connection, records: list[dict]) -> list[dict]:
    users = t("User")
    ids = list({r["userId"] for r in records})
    people = {u["id"]: u for u in rows(conn, select(users.c.id, users.c.fullName, users.c.phone).where(users.c.id.in_(ids)))} if ids else {}
    now = utcnow()
    return [{
        "id": r["id"], "status": _status(r, now), "requestedAt": r["createdAt"], "expiresAt": r["expiresAt"],
        "attempts": r["attempts"], "userId": r["userId"],
        "fullName": people.get(r["userId"], {}).get("fullName"), "phone": people.get(r["userId"], {}).get("phone"),
    } for r in records]


@admin_router.get("")
def list_requests(status: Literal["WAITING", "CODE_ISSUED", "DONE"] = "WAITING", limit: int = Query(default=50, ge=1, le=200),
                  _: dict = Depends(_guard), conn: Connection = Depends(get_conn)):
    otp, now = t("OtpCode"), utcnow()
    open_ = and_(otp.c.consumedAt.is_(None), otp.c.expiresAt > now)
    cond = {
        "WAITING": and_(open_, otp.c.codeHash == WAITING),
        "CODE_ISSUED": and_(open_, otp.c.codeHash != WAITING, otp.c.codeHash != CANCELLED),
        "DONE": ~open_ | (otp.c.codeHash == CANCELLED),
    }[status]
    found = rows(conn, select(otp).where(otp.c.purpose == PURPOSE, cond).order_by(otp.c.createdAt.desc()).limit(limit))
    waiting = conn.execute(select(func.count()).select_from(otp).where(otp.c.purpose == PURPOSE, open_,
                                                                       otp.c.codeHash == WAITING)).scalar_one()
    return ok({"requests": _present(conn, found), "waitingCount": waiting})


def _request_or_404(conn: Connection, request_id: str) -> dict:
    record = get_row(conn, "OtpCode", request_id)
    if not record or record["purpose"] != PURPOSE:
        raise ApiError(404, "RESET_REQUEST_NOT_FOUND", "Password reset request not found")
    return record


@admin_router.post("/{request_id}/issue")
def issue_code(request_id: str, actor: dict = Depends(_guard), conn: Connection = Depends(get_conn)):
    record = _request_or_404(conn, request_id)
    if _status(record, utcnow()) not in ("WAITING", "CODE_ISSUED"):
        raise ApiError(409, "INVALID_STATUS_TRANSITION", "This request is closed; the user must ask again")
    code = f"{secrets.randbelow(1_000_000):06d}"
    otp = t("OtpCode")
    expires = utcnow() + CODE_TTL
    update_rows(conn, "OtpCode", otp.c.id == request_id, {"codeHash": hash_password(code), "expiresAt": expires, "attempts": 0})
    audit(conn, actor["id"], "password_reset.issue_code", "User", record["userId"])
    # The code is returned once, for the admin to pass on; only its hash is stored.
    return ok({"id": request_id, "code": code, "expiresAt": expires})


@admin_router.post("/{request_id}/cancel")
def cancel_request(request_id: str, actor: dict = Depends(_guard), conn: Connection = Depends(get_conn)):
    record = _request_or_404(conn, request_id)
    otp = t("OtpCode")
    update_rows(conn, "OtpCode", otp.c.id == request_id, {"codeHash": CANCELLED, "consumedAt": utcnow()})
    audit(conn, actor["id"], "password_reset.cancel", "User", record["userId"])
    return ok({"id": request_id, "status": "CANCELLED"})
