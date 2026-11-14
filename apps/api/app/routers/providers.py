"""Provider profile, availability, documents, verification, portfolio, payout accounts."""

from typing import Any, Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, HttpUrl
from sqlalchemy import Connection, delete, func, select

from ..common import get_row, provider_for_user, require_provider, rows
from ..db import get_conn, insert_row, t, update_rows
from ..events import publish
from ..responses import ApiError, ok
from ..security import current_user

router = APIRouter(tags=["providers"])

AvailabilityMode = Literal["ONLINE", "OFFLINE", "VACATION", "TEMPORARILY_UNAVAILABLE", "EMERGENCY_OFFLINE"]
WithdrawalMethod = Literal["BANK_TRANSFER", "WALLET_TRANSFER", "MOBILE_MONEY"]


class CreateProfileBody(BaseModel):
    businessName: str = Field(min_length=2, max_length=120)
    bio: str | None = Field(default=None, max_length=2000)
    yearsOfExperience: int | None = Field(default=None, ge=0, le=80)
    skills: list[str] | None = Field(default=None, max_length=50)
    travelDistanceKm: float | None = Field(default=None, ge=0, le=1000)
    remoteAvailable: bool | None = None


class UpdateProfileBody(BaseModel):
    businessName: str | None = Field(default=None, min_length=2, max_length=120)
    bio: str | None = Field(default=None, max_length=2000)
    businessLogoUrl: HttpUrl | None = None
    taxNumber: str | None = Field(default=None, max_length=60)
    yearsOfExperience: int | None = Field(default=None, ge=0, le=80)
    skills: list[str] | None = Field(default=None, max_length=50)
    travelDistanceKm: float | None = Field(default=None, ge=0, le=1000)
    remoteAvailable: bool | None = None
    emergencyAvailable: bool | None = None
    emergencyContactName: str | None = Field(default=None, max_length=120)
    emergencyContactPhone: str | None = Field(default=None, min_length=8, max_length=16)


class AvailabilityBody(BaseModel):
    mode: AvailabilityMode


class DocumentBody(BaseModel):
    type: str = Field(min_length=2, max_length=60)
    fileUrl: HttpUrl


class PortfolioBody(BaseModel):
    mediaUrl: HttpUrl
    title: str | None = Field(default=None, max_length=150)
    description: str | None = Field(default=None, max_length=1000)


class PayoutAccountBody(BaseModel):
    method: WithdrawalMethod
    accountDetails: dict[str, Any]
    isDefault: bool | None = None


@router.get("/providers")
def browse_providers(categoryId: str | None = None, remoteAvailable: str | None = None,
                     _: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    pp, pc = t("ProviderProfile"), t("ProviderCategory")
    stmt = select(pp).where(pp.c.status == "ACTIVE", pp.c.verificationStatus == "VERIFIED")
    if remoteAvailable == "true":
        stmt = stmt.where(pp.c.remoteAvailable.is_(True))
    if categoryId:
        stmt = stmt.where(pp.c.id.in_(select(pc.c.providerId).where(pc.c.categoryId == categoryId)))
    providers = rows(conn, stmt.order_by(pp.c.createdAt.desc()).limit(25))
    return ok([{k: p[k] for k in ("id", "businessName", "bio", "ratingAverage", "ratingCount", "skills")} for p in providers])


@router.post("/providers")
def create_profile(body: CreateProfileBody, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    if provider_for_user(conn, user["id"]):
        raise ApiError(409, "PROVIDER_PROFILE_ALREADY_EXISTS", "A provider profile already exists for this user")
    data = body.model_dump(exclude_none=True)
    data.setdefault("skills", [])
    return ok(insert_row(conn, "ProviderProfile", {"userId": user["id"], **data}), status=201)


@router.get("/providers/me")
def my_profile(user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    return ok(require_provider(conn, user["id"]))


@router.patch("/providers/me")
def update_profile(body: UpdateProfileBody, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    profile = require_provider(conn, user["id"])
    data = body.model_dump(exclude_unset=True, mode="json")
    if not data:
        return ok(profile)
    pp = t("ProviderProfile")
    return ok(update_rows(conn, "ProviderProfile", pp.c.id == profile["id"], data)[0])


@router.post("/providers/me/availability")
def set_availability(body: AvailabilityBody, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    profile = require_provider(conn, user["id"])
    pp = t("ProviderProfile")
    # Mode and the matcher's fast-path boolean are always written together.
    update_rows(conn, "ProviderProfile", pp.c.id == profile["id"],
                {"availabilityMode": body.mode, "isAvailable": body.mode == "ONLINE"})
    return ok({"mode": body.mode})


@router.get("/providers/me/documents")
def list_documents(user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    profile = require_provider(conn, user["id"])
    pd = t("ProviderDocument")
    return ok(rows(conn, select(pd).where(pd.c.providerId == profile["id"]).order_by(pd.c.createdAt.desc())))


@router.post("/providers/me/documents")
def add_document(body: DocumentBody, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    profile = require_provider(conn, user["id"])
    return ok(insert_row(conn, "ProviderDocument",
                         {"providerId": profile["id"], "type": body.type, "fileUrl": str(body.fileUrl)}), status=201)


@router.post("/providers/me/verification/submit")
def submit_verification(user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    profile = require_provider(conn, user["id"])
    if profile["verificationStatus"] == "PENDING_REVIEW":
        raise ApiError(409, "VERIFICATION_ALREADY_PENDING", "Provider verification is already pending review")
    pd = t("ProviderDocument")
    count = conn.execute(select(func.count()).select_from(pd).where(pd.c.providerId == profile["id"])).scalar_one()
    if count < 1:
        raise ApiError(422, "VERIFICATION_DOCUMENTS_REQUIRED",
                       "At least one document is required before submitting for verification")
    pp = t("ProviderProfile")
    update_rows(conn, "ProviderProfile", pp.c.id == profile["id"], {"verificationStatus": "PENDING_REVIEW"})
    publish(conn, "ProviderVerificationSubmitted", {}, "PROVIDER_PROFILE", profile["id"])
    return ok({"verificationStatus": "PENDING_REVIEW"})


@router.get("/providers/me/portfolio")
def list_portfolio(user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    profile = require_provider(conn, user["id"])
    pi = t("ProviderPortfolioItem")
    return ok(rows(conn, select(pi).where(pi.c.providerId == profile["id"]).order_by(pi.c.createdAt.desc())))


@router.post("/providers/me/portfolio")
def add_portfolio(body: PortfolioBody, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    profile = require_provider(conn, user["id"])
    data = body.model_dump(exclude_none=True, mode="json")
    return ok(insert_row(conn, "ProviderPortfolioItem", {"providerId": profile["id"], **data}), status=201)


@router.delete("/providers/me/portfolio/{item_id}")
def delete_portfolio(item_id: str, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    profile = require_provider(conn, user["id"])
    item = get_row(conn, "ProviderPortfolioItem", item_id)
    if not item or item["providerId"] != profile["id"]:
        raise ApiError(404, "PORTFOLIO_ITEM_NOT_FOUND", "Portfolio item not found")
    pi = t("ProviderPortfolioItem")
    conn.execute(delete(pi).where(pi.c.id == item_id))
    return ok({"deleted": True})


@router.get("/providers/me/payout-accounts")
def list_payout_accounts(user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    profile = require_provider(conn, user["id"])
    pa = t("ProviderPayoutAccount")
    return ok(rows(conn, select(pa).where(pa.c.providerId == profile["id"]).order_by(pa.c.createdAt.desc())))


@router.post("/providers/me/payout-accounts")
def add_payout_account(body: PayoutAccountBody, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    profile = require_provider(conn, user["id"])
    pa = t("ProviderPayoutAccount")
    if body.isDefault:
        update_rows(conn, "ProviderPayoutAccount", pa.c.providerId == profile["id"], {"isDefault": False})
    return ok(insert_row(conn, "ProviderPayoutAccount", {
        "providerId": profile["id"], "method": body.method, "accountDetails": body.accountDetails,
        "isDefault": bool(body.isDefault),
    }), status=201)


def _own_payout_account(conn: Connection, user_id: str, account_id: str) -> dict:
    profile = require_provider(conn, user_id)
    account = get_row(conn, "ProviderPayoutAccount", account_id)
    if not account or account["providerId"] != profile["id"]:
        raise ApiError(404, "PAYOUT_ACCOUNT_NOT_FOUND", "Payout account not found")
    return account


@router.delete("/providers/me/payout-accounts/{account_id}")
def delete_payout_account(account_id: str, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    _own_payout_account(conn, user["id"], account_id)
    pa = t("ProviderPayoutAccount")
    conn.execute(delete(pa).where(pa.c.id == account_id))
    return ok({"deleted": True})


@router.post("/providers/me/payout-accounts/{account_id}/default")
def set_default_payout_account(account_id: str, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    account = _own_payout_account(conn, user["id"], account_id)
    pa = t("ProviderPayoutAccount")
    update_rows(conn, "ProviderPayoutAccount", pa.c.providerId == account["providerId"], {"isDefault": False})
    update_rows(conn, "ProviderPayoutAccount", pa.c.id == account_id, {"isDefault": True})
    return ok({"defaultPayoutAccountId": account_id})
