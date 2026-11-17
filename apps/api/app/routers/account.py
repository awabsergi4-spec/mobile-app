"""The signed-in user's own account: profile edit, password change,
notification preferences."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, HttpUrl
from sqlalchemy import Connection, select

from ..db import get_conn, t, update_rows
from ..events import audit
from ..responses import ApiError, ok
from ..security import current_user, hash_password, issue_session, revoke_all_sessions, verify_password
from .auth import user_payload
from .uploads import is_our_upload

router = APIRouter(tags=["account"])

# Categories a user can opt out of. Missing keys default to "on".
NOTIFICATION_KEYS = ("orders", "messages", "promotions", "account")


class UpdateMeBody(BaseModel):
    fullName: str | None = Field(default=None, min_length=2, max_length=120)
    email: str | None = Field(default=None, max_length=254, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    preferredLanguage: str | None = Field(default=None, pattern=r"^(ar|en)$")
    bio: str | None = Field(default=None, max_length=1000)
    city: str | None = Field(default=None, max_length=120)
    address: str | None = Field(default=None, max_length=300)
    profilePictureUrl: str | None = Field(default=None, max_length=500)  # null removes it
    profilePictureUrl: HttpUrl | None = None


class ChangePasswordBody(BaseModel):
    currentPassword: str = Field(min_length=1, max_length=72)
    newPassword: str = Field(min_length=8, max_length=72)
    deviceInfo: str | None = Field(default=None, max_length=255)


class NotificationPrefsBody(BaseModel):
    orders: bool = True
    messages: bool = True
    promotions: bool = True
    account: bool = True


@router.patch("/users/me")
def update_me(body: UpdateMeBody, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    data = body.model_dump(exclude_unset=True, mode="json")
    if "fullName" in data and data["fullName"]:
        data["fullName"] = data["fullName"].strip()
    if data.get("email"):
        data["email"] = data["email"].strip().lower()
        users = t("User")
        taken = conn.execute(select(users.c.id).where(users.c.email == data["email"], users.c.id != user["id"])).first()
        if taken:
            raise ApiError(409, "EMAIL_ALREADY_REGISTERED", "Email already registered")
    if data.get("profilePictureUrl") and not is_our_upload(data["profilePictureUrl"], user["id"], purpose="avatar"):
        raise ApiError(422, "INVALID_IMAGE_URL", "Profile pictures must be uploaded from the app")
    if not data:
        return ok(user_payload(conn, user))
    users = t("User")
    updated = update_rows(conn, "User", users.c.id == user["id"], data)[0]
    return ok(user_payload(conn, updated))


@router.post("/users/me/password")
def change_password(body: ChangePasswordBody, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    if not verify_password(body.currentPassword, user["passwordHash"]):
        raise ApiError(400, "INVALID_CURRENT_PASSWORD", "Current password is incorrect")
    if body.currentPassword == body.newPassword:
        raise ApiError(400, "PASSWORD_UNCHANGED", "The new password must be different")
    users = t("User")
    update_rows(conn, "User", users.c.id == user["id"], {"passwordHash": hash_password(body.newPassword)})
    # Sign out every other device; this device gets a fresh session.
    revoke_all_sessions(conn, user["id"])
    audit(conn, user["id"], "user.password_change", "User", user["id"])
    return ok(issue_session(conn, user["id"], body.deviceInfo))


def _prefs(user: dict) -> dict:
    stored = user.get("notificationPreferences") or {}
    return {key: bool(stored.get(key, True)) for key in NOTIFICATION_KEYS}


@router.get("/users/me/notification-preferences")
def get_notification_prefs(user: dict = Depends(current_user)):
    return ok(_prefs(user))


@router.put("/users/me/notification-preferences")
def put_notification_prefs(body: NotificationPrefsBody, user: dict = Depends(current_user),
                           conn: Connection = Depends(get_conn)):
    users = t("User")
    updated = update_rows(conn, "User", users.c.id == user["id"], {"notificationPreferences": body.model_dump()})[0]
    return ok(_prefs(updated))
