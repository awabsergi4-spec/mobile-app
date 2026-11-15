"""Auth: register (admin-approved, no OTP), login, refresh, logout, /users/me."""

from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import Connection, select

from ..common import get_row
from ..db import get_conn, insert_row, t, update_rows, utcnow
from ..events import publish
from ..responses import ApiError, ok
from ..security import (
    current_user, find_user_by_login, find_user_by_phone, hash_password, issue_session, normalize_phone,
    revoke_all_sessions, sha256, verify_password,
)

router = APIRouter(tags=["auth"])


class RegisterBody(BaseModel):
    phone: str = Field(min_length=8, max_length=20)
    password: str = Field(min_length=8, max_length=72)
    fullName: str = Field(min_length=2, max_length=120)
    preferredLanguage: Literal["en", "ar"]
    email: str | None = Field(default=None, max_length=254, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    accountType: Literal["CUSTOMER", "PROVIDER", "COMPANY"] = "CUSTOMER"
    businessName: str | None = Field(default=None, min_length=2, max_length=120)
    companyName: str | None = Field(default=None, min_length=2, max_length=150)

    @model_validator(mode="after")
    def _role_fields(self):
        if self.accountType == "PROVIDER" and not self.businessName:
            raise ValueError("businessName is required for a provider account")
        if self.accountType == "COMPANY" and not self.companyName:
            raise ValueError("companyName is required for a company account")
        return self


class LoginBody(BaseModel):
    # Email or phone number. `phone` is still accepted from older app builds.
    login: str | None = Field(default=None, min_length=3, max_length=254)
    phone: str | None = Field(default=None, min_length=8, max_length=20)
    password: str = Field(min_length=1, max_length=72)
    deviceInfo: str | None = Field(default=None, max_length=255)

    @model_validator(mode="after")
    def _one_identifier(self):
        if not (self.login or self.phone):
            raise ValueError("login (email or phone) is required")
        return self


class RefreshBody(BaseModel):
    refreshToken: str = Field(min_length=1)
    deviceInfo: str | None = Field(default=None, max_length=255)


class LogoutBody(BaseModel):
    refreshToken: str = Field(min_length=1)


@router.post("/auth/register")
def register(body: RegisterBody, conn: Connection = Depends(get_conn)):
    phone = normalize_phone(body.phone)
    if find_user_by_phone(conn, phone):
        raise ApiError(409, "PHONE_ALREADY_REGISTERED", "Phone already registered")
    users = t("User")
    email = body.email.strip().lower() if body.email else None
    if email and conn.execute(select(users.c.id).where(users.c.email == email)).first():
        raise ApiError(409, "EMAIL_ALREADY_REGISTERED", "Email already registered")

    regions = t("Region")
    from ..config import get_settings
    region = conn.execute(select(regions).where(regions.c.code == get_settings().default_region_code)).mappings().first()
    if not region:
        raise ApiError(500, "REGION_NOT_SEEDED", "Default region is not configured")

    # New accounts start PENDING_VERIFICATION and can't sign in until an
    # admin approves them from the Admin Platform (Users → Approve).
    user = insert_row(conn, "User", {
        "phone": phone, "email": email, "passwordHash": hash_password(body.password),
        "fullName": body.fullName.strip(), "preferredLanguage": body.preferredLanguage,
        "status": "PENDING_VERIFICATION", "regionId": region["id"],
    })

    if body.accountType == "PROVIDER":
        insert_row(conn, "ProviderProfile", {"userId": user["id"], "businessName": body.businessName.strip()})
    elif body.accountType == "COMPANY":
        company = insert_row(conn, "Company", {
            "ownerId": user["id"], "name": body.companyName.strip(), "regionId": region["id"],
        })
        insert_row(conn, "CompanyMember", {"companyId": company["id"], "userId": user["id"], "role": "OWNER"})

    publish(conn, "UserRegistered", {"accountType": body.accountType}, "USER", user["id"])
    return ok({"id": user["id"], "phone": user["phone"], "status": user["status"], "accountType": body.accountType},
              status=201)


def _assert_can_sign_in(user: dict) -> None:
    if user["status"] == "PENDING_VERIFICATION":
        raise ApiError(403, "ACCOUNT_PENDING_APPROVAL", "Your account is waiting for admin approval")
    if user["status"] != "ACTIVE":
        raise ApiError(403, "ACCOUNT_NOT_ACTIVE", "Account is not active")


@router.post("/auth/login")
def login(body: LoginBody, conn: Connection = Depends(get_conn)):
    user = find_user_by_login(conn, body.login or body.phone or "")
    # Same error for unknown account and wrong password (no account enumeration).
    if not user or not verify_password(body.password, user["passwordHash"]):
        raise ApiError(401, "INVALID_CREDENTIALS", "Invalid phone or password")
    _assert_can_sign_in(user)
    return ok(issue_session(conn, user["id"], body.deviceInfo))


@router.post("/auth/refresh")
def refresh(body: RefreshBody, conn: Connection = Depends(get_conn)):
    tokens = t("RefreshToken")
    record = conn.execute(select(tokens).where(tokens.c.tokenHash == sha256(body.refreshToken))).mappings().first()
    if not record:
        raise ApiError(401, "INVALID_REFRESH_TOKEN", "Invalid or expired refresh token")
    if record["revokedAt"] is not None:
        # Reuse of a rotated token = likely theft: revoke every session.
        revoke_all_sessions(conn, record["userId"])
        raise ApiError(401, "REFRESH_TOKEN_REUSE_DETECTED",
                       "Refresh token reuse detected — all sessions have been revoked", commit_writes=True)
    if record["expiresAt"] < utcnow():
        raise ApiError(401, "INVALID_REFRESH_TOKEN", "Invalid or expired refresh token")

    user = get_row(conn, "User", record["userId"])
    if not user or user["status"] != "ACTIVE":
        revoke_all_sessions(conn, record["userId"])
        raise ApiError(401, "ACCOUNT_NOT_ACTIVE", "Account is not active", commit_writes=True)

    update_rows(conn, "RefreshToken", tokens.c.id == record["id"], {"revokedAt": utcnow()})
    return ok(issue_session(conn, record["userId"], body.deviceInfo))


@router.post("/auth/logout")
def logout(body: LogoutBody, conn: Connection = Depends(get_conn)):
    tokens = t("RefreshToken")
    update_rows(conn, "RefreshToken",
                (tokens.c.tokenHash == sha256(body.refreshToken)) & (tokens.c.revokedAt.is_(None)),
                {"revokedAt": utcnow()})
    return ok({"loggedOut": True})


def user_payload(conn: Connection, user: dict) -> dict:
    """The `/users/me` shape (never includes passwordHash). Role signals come
    from real relations: company > provider > customer is decided client-side."""
    pp, co, cm = t("ProviderProfile"), t("Company"), t("CompanyMember")
    profile = conn.execute(select(pp.c.id, pp.c.companyId).where(pp.c.userId == user["id"])).mappings().first()
    owned = conn.execute(select(co.c.id).where(co.c.ownerId == user["id"]).limit(1)).scalar()
    membership = conn.execute(
        select(cm.c.companyId, cm.c.role).where(cm.c.userId == user["id"]).limit(1)
    ).mappings().first()
    return {
        "id": user["id"], "phone": user["phone"], "email": user["email"], "fullName": user["fullName"],
        "preferredLanguage": user["preferredLanguage"], "status": user["status"],
        "profilePictureUrl": user["profilePictureUrl"], "createdAt": user["createdAt"],
        "bio": user["bio"], "city": user["city"], "address": user["address"],
        "providerProfile": dict(profile) if profile else None,
        "ownedCompanyId": owned,
        "companyMembership": dict(membership) if membership else None,
    }


@router.get("/users/me")
def me(user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    return ok(user_payload(conn, user))
