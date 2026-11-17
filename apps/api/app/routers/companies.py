"""Companies: create, view/update, members, invitations, documents, verification."""

from datetime import timedelta
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, HttpUrl
from sqlalchemy import Connection, delete, func, select

from ..common import get_row, rows
from ..db import get_conn, insert_row, t, update_rows, utcnow
from ..events import audit, publish
from ..responses import ApiError, ok
from ..security import current_user
from .uploads import is_our_upload

router = APIRouter(tags=["companies"])

INVITATION_TTL = timedelta(days=7)
NonOwnerRole = Literal["MANAGER", "STAFF"]


class CreateCompanyBody(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    regionId: str = Field(min_length=1)
    description: str | None = Field(default=None, max_length=2000)
    logoUrl: HttpUrl | None = None


class UpdateCompanyBody(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    description: str | None = Field(default=None, max_length=2000)
    logoUrl: HttpUrl | None = None


class InviteBody(BaseModel):
    invitedPhone: str = Field(min_length=8, max_length=16)
    role: NonOwnerRole | None = None


class RoleBody(BaseModel):
    role: NonOwnerRole


# Documents a company can submit for verification.
CompanyDocumentType = Literal["COMMERCIAL_REGISTRATION", "TAX_CERTIFICATE", "NATIONAL_ID", "PASSPORT", "DRIVER_LICENSE"]


class DocumentBody(BaseModel):
    type: CompanyDocumentType
    fileUrl: HttpUrl


def _member(conn: Connection, company_id: str, user_id: str) -> dict | None:
    cm = t("CompanyMember")
    row = conn.execute(select(cm).where(cm.c.companyId == company_id, cm.c.userId == user_id)).mappings().first()
    return dict(row) if row else None


def _require_membership(conn: Connection, company_id: str, user_id: str) -> dict:
    member = _member(conn, company_id, user_id)
    if not member:
        raise ApiError(403, "FORBIDDEN", "You are not a member of this company")
    return member


def _require_role(conn: Connection, company_id: str, user_id: str, roles: tuple[str, ...] = ("OWNER", "MANAGER")) -> dict:
    member = _require_membership(conn, company_id, user_id)
    if member["role"] not in roles:
        raise ApiError(403, "FORBIDDEN", "Your role does not permit this action")
    return member


@router.post("/companies")
def create_company(body: CreateCompanyBody, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    co = t("Company")
    if conn.execute(select(co.c.id).where(co.c.ownerId == user["id"])).first():
        raise ApiError(409, "COMPANY_ALREADY_EXISTS", "This user already owns a company")
    company = insert_row(conn, "Company", {"ownerId": user["id"], **body.model_dump(exclude_none=True, mode="json")})
    insert_row(conn, "CompanyMember", {"companyId": company["id"], "userId": user["id"], "role": "OWNER"})
    return ok(company, status=201)


@router.get("/companies/invitations/mine")
def my_invitations(user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    ci, co = t("CompanyInvitation"), t("Company")
    invitations = rows(conn, select(ci, co.c.name.label("companyName"))
                       .select_from(ci.outerjoin(co, co.c.id == ci.c.companyId))
                       .where(ci.c.invitedPhone == user["phone"], ci.c.status == "PENDING"))
    return ok(invitations)


@router.get("/companies/{company_id}")
def get_company(company_id: str, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    company = get_row(conn, "Company", company_id)
    if not company:
        raise ApiError(404, "COMPANY_NOT_FOUND", "Company not found")
    _require_membership(conn, company_id, user["id"])
    return ok(company)


@router.patch("/companies/{company_id}")
def update_company(company_id: str, body: UpdateCompanyBody, user: dict = Depends(current_user),
                   conn: Connection = Depends(get_conn)):
    _require_role(conn, company_id, user["id"])
    if not get_row(conn, "Company", company_id):
        raise ApiError(404, "COMPANY_NOT_FOUND", "Company not found")
    data = body.model_dump(exclude_unset=True, mode="json")
    co = t("Company")
    return ok(update_rows(conn, "Company", co.c.id == company_id, data)[0] if data else get_row(conn, "Company", company_id))


@router.get("/companies/{company_id}/members")
def list_members(company_id: str, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    _require_membership(conn, company_id, user["id"])
    cm = t("CompanyMember")
    return ok(rows(conn, select(cm).where(cm.c.companyId == company_id).order_by(cm.c.joinedAt.asc())))


@router.post("/companies/{company_id}/members")
def invite_member(company_id: str, body: InviteBody, user: dict = Depends(current_user),
                  conn: Connection = Depends(get_conn)):
    inviter = _member(conn, company_id, user["id"])
    if not inviter or inviter["role"] not in ("OWNER", "MANAGER"):
        raise ApiError(403, "FORBIDDEN", "Only an OWNER or MANAGER can do this")
    ci = t("CompanyInvitation")
    pending = conn.execute(select(ci.c.id).where(
        ci.c.invitedPhone == body.invitedPhone, ci.c.status == "PENDING", ci.c.companyId == company_id)).first()
    if pending:
        raise ApiError(409, "INVITATION_ALREADY_PENDING", "An invitation is already pending for this phone")
    invitation = insert_row(conn, "CompanyInvitation", {
        "companyId": company_id, "invitedPhone": body.invitedPhone, "invitedById": user["id"],
        "role": body.role or "STAFF", "expiresAt": utcnow() + INVITATION_TTL,
    })
    publish(conn, "CompanyMemberInvited", {"invitedPhone": body.invitedPhone, "role": invitation["role"]},
            "COMPANY", company_id)
    return ok(invitation, status=201)


def _member_for_change(conn: Connection, member_id: str, actor_id: str, owner_only: bool) -> dict:
    member = get_row(conn, "CompanyMember", member_id)
    if not member:
        raise ApiError(404, "COMPANY_MEMBER_NOT_FOUND", "Company member not found")
    if member["role"] == "OWNER":
        raise ApiError(409, "COMPANY_OWNER_ROLE_PROTECTED", "The company owner's membership cannot be changed")
    actor = _member(conn, member["companyId"], actor_id)
    allowed = ("OWNER",) if owner_only else ("OWNER", "MANAGER")
    if not actor or actor["role"] not in allowed:
        raise ApiError(403, "FORBIDDEN", "Your role does not permit this action")
    return member


@router.patch("/companies/members/{member_id}")
def update_member_role(member_id: str, body: RoleBody, user: dict = Depends(current_user),
                       conn: Connection = Depends(get_conn)):
    member = _member_for_change(conn, member_id, user["id"], owner_only=True)
    cm = t("CompanyMember")
    updated = update_rows(conn, "CompanyMember", cm.c.id == member_id, {"role": body.role})[0]
    audit(conn, user["id"], "company.member.update_role", "CompanyMember", member_id,
          {"companyId": member["companyId"], "role": body.role})
    return ok(updated)


@router.delete("/companies/members/{member_id}")
def remove_member(member_id: str, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    member = _member_for_change(conn, member_id, user["id"], owner_only=False)
    cm = t("CompanyMember")
    conn.execute(delete(cm).where(cm.c.id == member_id))
    audit(conn, user["id"], "company.member.remove", "CompanyMember", member_id,
          {"companyId": member["companyId"], "removedUserId": member["userId"]})
    return ok({"removed": True})


@router.get("/companies/{company_id}/invitations")
def list_invitations(company_id: str, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    _require_role(conn, company_id, user["id"])
    ci = t("CompanyInvitation")
    return ok(rows(conn, select(ci).where(ci.c.companyId == company_id).order_by(ci.c.createdAt.desc())))


@router.post("/companies/invitations/{invitation_id}/accept")
def accept_invitation(invitation_id: str, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    invitation = get_row(conn, "CompanyInvitation", invitation_id)
    if not invitation or invitation["invitedPhone"] != user["phone"]:
        raise ApiError(404, "COMPANY_INVITATION_NOT_FOUND", "Company invitation not found")
    if invitation["status"] != "PENDING":
        raise ApiError(409, "COMPANY_INVITATION_NOT_PENDING", "Company invitation is no longer pending")
    ci = t("CompanyInvitation")
    if invitation["expiresAt"] < utcnow():
        update_rows(conn, "CompanyInvitation", ci.c.id == invitation_id, {"status": "EXPIRED"})
        raise ApiError(410, "COMPANY_INVITATION_EXPIRED", "Company invitation has expired", commit_writes=True)
    if _member(conn, invitation["companyId"], user["id"]):
        raise ApiError(409, "COMPANY_MEMBER_ALREADY_EXISTS", "You are already a member of this company")
    member = insert_row(conn, "CompanyMember",
                        {"companyId": invitation["companyId"], "userId": user["id"], "role": invitation["role"]})
    update_rows(conn, "CompanyInvitation", ci.c.id == invitation_id, {"status": "ACCEPTED", "respondedAt": utcnow()})
    publish(conn, "CompanyInvitationAccepted", {"role": invitation["role"], "userId": user["id"]},
            "COMPANY", invitation["companyId"])
    return ok(member)


@router.post("/companies/invitations/{invitation_id}/cancel")
def cancel_invitation(invitation_id: str, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    invitation = get_row(conn, "CompanyInvitation", invitation_id)
    if not invitation:
        raise ApiError(404, "COMPANY_INVITATION_NOT_FOUND", "Company invitation not found")
    actor = _member(conn, invitation["companyId"], user["id"])
    if not actor or actor["role"] not in ("OWNER", "MANAGER"):
        raise ApiError(403, "FORBIDDEN", "Only an OWNER or MANAGER can do this")
    if invitation["status"] != "PENDING":
        raise ApiError(409, "COMPANY_INVITATION_NOT_PENDING", "Company invitation is no longer pending")
    ci = t("CompanyInvitation")
    update_rows(conn, "CompanyInvitation", ci.c.id == invitation_id, {"status": "CANCELLED", "respondedAt": utcnow()})
    return ok({"status": "CANCELLED"})


@router.get("/companies/{company_id}/documents")
def list_documents(company_id: str, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    _require_role(conn, company_id, user["id"])
    cd = t("CompanyDocument")
    return ok(rows(conn, select(cd).where(cd.c.companyId == company_id).order_by(cd.c.createdAt.desc())))


@router.post("/companies/{company_id}/documents")
def add_document(company_id: str, body: DocumentBody, user: dict = Depends(current_user),
                 conn: Connection = Depends(get_conn)):
    _require_role(conn, company_id, user["id"])
    if not is_our_upload(str(body.fileUrl), user["id"], purpose="document"):
        raise ApiError(422, "INVALID_IMAGE_URL", "Documents must be uploaded from the app")
    return ok(insert_row(conn, "CompanyDocument",
                         {"companyId": company_id, "type": body.type, "fileUrl": str(body.fileUrl)}), status=201)


@router.post("/companies/{company_id}/verification/submit")
def submit_verification(company_id: str, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    _require_role(conn, company_id, user["id"])
    company = get_row(conn, "Company", company_id)
    if not company:
        raise ApiError(404, "COMPANY_NOT_FOUND", "Company not found")
    if company["verificationStatus"] == "PENDING_REVIEW":
        raise ApiError(409, "VERIFICATION_ALREADY_PENDING", "Company verification is already pending review")
    cd = t("CompanyDocument")
    if conn.execute(select(func.count()).select_from(cd).where(cd.c.companyId == company_id)).scalar_one() < 1:
        raise ApiError(422, "VERIFICATION_DOCUMENTS_REQUIRED",
                       "At least one document is required before submitting for verification")
    co = t("Company")
    update_rows(conn, "Company", co.c.id == company_id, {"verificationStatus": "PENDING_REVIEW"})
    publish(conn, "CompanyVerificationSubmitted", {}, "COMPANY", company_id)
    return ok({"verificationStatus": "PENDING_REVIEW"})
