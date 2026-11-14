"""Admin → Users: search, detail, approve (replaces OTP verification), suspend, reactivate.

Guarded by the ``users.manage`` staff permission (same key as the Admin Platform).
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import Connection, func, or_, select

from ..common import get_row, rows
from ..db import get_conn, t, update_rows, utcnow
from ..events import audit, publish
from ..responses import ApiError, ok
from ..security import require_permission, revoke_all_sessions

router = APIRouter(prefix="/admin/users", tags=["admin"])
_guard = require_permission("users.manage")

_PUBLIC_FIELDS = ("id", "phone", "email", "fullName", "preferredLanguage", "status", "createdAt", "suspendedAt")


class SuspendBody(BaseModel):
    reason: str = Field(min_length=3, max_length=500)


def _account_type(conn: Connection, user_id: str) -> str:
    pp, co = t("ProviderProfile"), t("Company")
    if conn.execute(select(co.c.id).where(co.c.ownerId == user_id)).first():
        return "COMPANY"
    if conn.execute(select(pp.c.id).where(pp.c.userId == user_id)).first():
        return "PROVIDER"
    return "CUSTOMER"


def _public(conn: Connection, user: dict) -> dict:
    return {**{k: user[k] for k in _PUBLIC_FIELDS}, "accountType": _account_type(conn, user["id"])}


@router.get("")
def search_users(query: str | None = None, status: str | None = None, limit: int = 50,
                 _: dict = Depends(_guard), conn: Connection = Depends(get_conn)):
    users = t("User")
    stmt = select(users)
    if status:
        stmt = stmt.where(users.c.status == status)
    if query:
        like = f"%{query}%"
        stmt = stmt.where(or_(users.c.phone.ilike(like), users.c.fullName.ilike(like)))
    found = rows(conn, stmt.order_by(users.c.createdAt.desc()).limit(min(limit, 200)))
    pending = conn.execute(select(func.count()).select_from(users).where(users.c.status == "PENDING_VERIFICATION"))
    return ok({"users": [_public(conn, u) for u in found], "pendingApprovalCount": pending.scalar_one()})


def _user_or_404(conn: Connection, user_id: str) -> dict:
    user = get_row(conn, "User", user_id)
    if not user:
        raise ApiError(404, "USER_NOT_FOUND", "User not found")
    return user


@router.get("/{user_id}")
def get_user(user_id: str, _: dict = Depends(_guard), conn: Connection = Depends(get_conn)):
    return ok(_public(conn, _user_or_404(conn, user_id)))


@router.post("/{user_id}/approve")
def approve_user(user_id: str, actor: dict = Depends(_guard), conn: Connection = Depends(get_conn)):
    user = _user_or_404(conn, user_id)
    if user["status"] != "PENDING_VERIFICATION":
        raise ApiError(409, "INVALID_STATUS_TRANSITION", f"Cannot approve an account that is {user['status']}")
    users = t("User")
    update_rows(conn, "User", users.c.id == user_id, {"status": "ACTIVE"})
    audit(conn, actor["id"], "user.approve", "User", user_id)
    publish(conn, "UserApproved", {}, "USER", user_id)
    return ok({"id": user_id, "status": "ACTIVE"})


@router.post("/{user_id}/suspend")
def suspend_user(user_id: str, body: SuspendBody, actor: dict = Depends(_guard), conn: Connection = Depends(get_conn)):
    user = _user_or_404(conn, user_id)
    if user["status"] == "BANNED":
        raise ApiError(409, "INVALID_STATUS_TRANSITION", "Cannot move a user account from BANNED to SUSPENDED")
    users = t("User")
    update_rows(conn, "User", users.c.id == user_id, {"status": "SUSPENDED", "suspendedAt": utcnow()})
    # Cut off every existing session immediately (refresh tokens); access
    # tokens are rejected on the next request by the ACTIVE-status check.
    revoke_all_sessions(conn, user_id)
    audit(conn, actor["id"], "user.suspend", "User", user_id, {"reason": body.reason})
    publish(conn, "UserSuspended", {"reason": body.reason}, "USER", user_id)
    return ok({"id": user_id, "status": "SUSPENDED"})


@router.post("/{user_id}/reactivate")
def reactivate_user(user_id: str, actor: dict = Depends(_guard), conn: Connection = Depends(get_conn)):
    user = _user_or_404(conn, user_id)
    if user["status"] != "SUSPENDED":
        raise ApiError(409, "INVALID_STATUS_TRANSITION", f"Cannot move a user account from {user['status']} to ACTIVE")
    users = t("User")
    update_rows(conn, "User", users.c.id == user_id, {"status": "ACTIVE", "suspendedAt": None})
    audit(conn, actor["id"], "user.reactivate", "User", user_id)
    publish(conn, "UserReactivated", {}, "USER", user_id)
    return ok({"id": user_id, "status": "ACTIVE"})
