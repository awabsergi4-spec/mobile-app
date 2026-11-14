"""Contract module: projects, bids, award, contracts, milestones."""

from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import Connection, select

from ..common import contract_party, get_row, is_eligible_provider, page, require_provider, rows
from ..db import get_conn, insert_row, t, to_naive_utc, update_rows
from ..events import publish
from ..responses import ApiError, ok
from ..security import current_user

router = APIRouter(tags=["contracts"])


class CreateProjectBody(BaseModel):
    categoryId: str = Field(min_length=1)
    title: str = Field(min_length=3, max_length=150)
    description: str = Field(min_length=10, max_length=5000)
    budgetMin: int | None = Field(default=None, gt=0)
    budgetMax: int | None = Field(default=None, gt=0)

    @model_validator(mode="after")
    def _budget(self):
        if self.budgetMin is not None and self.budgetMax is not None and self.budgetMin > self.budgetMax:
            raise ValueError("budgetMin cannot be greater than budgetMax")
        return self


class BidBody(BaseModel):
    amount: int = Field(gt=0)
    message: str | None = Field(default=None, max_length=2000)


class MilestoneBody(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    amount: int = Field(gt=0)
    dueDate: datetime | None = None


@router.get("/contracts/projects")
def list_projects(mine: str | None = None, cursor: str | None = None, user: dict = Depends(current_user),
                  conn: Connection = Depends(get_conn)):
    cp = t("ContractProject")
    stmt = select(cp).where(cp.c.customerId == user["id"]) if mine == "true" else \
        select(cp).where(cp.c.status == "OPEN_FOR_BIDS")
    return ok(rows(conn, page(stmt, cp, "createdAt", desc=True, cursor=cursor, limit=None, default_limit=25)))


@router.post("/contracts/projects")
def create_project(body: CreateProjectBody, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    return ok(insert_row(conn, "ContractProject", {"customerId": user["id"], **body.model_dump(exclude_none=True)}),
              status=201)


@router.get("/contracts/projects/{project_id}")
def get_project(project_id: str, conn: Connection = Depends(get_conn)):
    # Public: open projects are guest-browsable; bidding requires auth.
    project = get_row(conn, "ContractProject", project_id)
    if not project:
        raise ApiError(404, "CONTRACT_PROJECT_NOT_FOUND", "Contract project not found")
    return ok(project)


@router.get("/contracts/projects/{project_id}/bids")
def list_project_bids(project_id: str, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    project = get_row(conn, "ContractProject", project_id)
    if not project:
        raise ApiError(404, "CONTRACT_PROJECT_NOT_FOUND", "Contract project not found")
    if project["customerId"] != user["id"]:
        raise ApiError(403, "FORBIDDEN", "Only the posting customer can view all bids on this project")
    cb = t("ContractBid")
    return ok(rows(conn, select(cb).where(cb.c.projectId == project_id).order_by(cb.c.submittedAt.asc())))


@router.post("/contracts/projects/{project_id}/bids")
def submit_bid(project_id: str, body: BidBody, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    profile = require_provider(conn, user["id"])
    project = get_row(conn, "ContractProject", project_id)
    if not project:
        raise ApiError(404, "CONTRACT_PROJECT_NOT_FOUND", "Contract project not found")
    if project["status"] != "OPEN_FOR_BIDS":
        raise ApiError(409, "CONTRACT_PROJECT_NOT_OPEN", "Contract project is not open for bids")
    if not is_eligible_provider(profile):
        raise ApiError(403, "PROVIDER_NOT_ELIGIBLE", "Provider must be active and verified")
    return ok(insert_row(conn, "ContractBid", {"projectId": project_id, "providerId": profile["id"],
                                               "amount": body.amount, "message": body.message}), status=201)


@router.get("/contracts/bids/me")
def my_bids(status: str | None = None, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    profile = require_provider(conn, user["id"])
    cb = t("ContractBid")
    stmt = select(cb).where(cb.c.providerId == profile["id"])
    if status:
        stmt = stmt.where(cb.c.status == status)
    return ok(rows(conn, stmt.order_by(cb.c.submittedAt.desc()).limit(25)))


@router.post("/contracts/bids/{bid_id}/award")
def award_bid(bid_id: str, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    bid = get_row(conn, "ContractBid", bid_id)
    if not bid:
        raise ApiError(404, "CONTRACT_BID_NOT_FOUND", "Contract bid not found")
    project = get_row(conn, "ContractProject", bid["projectId"])
    if not project or project["customerId"] != user["id"]:
        raise ApiError(403, "FORBIDDEN", "Only the posting customer can award this bid")
    if bid["status"] != "SUBMITTED":
        raise ApiError(409, "CONTRACT_BID_NOT_SUBMITTED", "Contract bid is not in SUBMITTED status")
    if not is_eligible_provider(get_row(conn, "ProviderProfile", bid["providerId"])):
        raise ApiError(409, "PROVIDER_NOT_ELIGIBLE", "Provider must be active and verified")
    cp, cb = t("ContractProject"), t("ContractBid")
    if not update_rows(conn, "ContractProject", (cp.c.id == bid["projectId"]) & (cp.c.status == "OPEN_FOR_BIDS"),
                       {"status": "AWARDED"}):
        raise ApiError(409, "CONTRACT_PROJECT_NOT_OPEN", "Contract project is not open for bids")
    update_rows(conn, "ContractBid", cb.c.id == bid_id, {"status": "ACCEPTED"})
    update_rows(conn, "ContractBid",
                (cb.c.projectId == bid["projectId"]) & (cb.c.status == "SUBMITTED") & (cb.c.id != bid_id),
                {"status": "REJECTED"})
    contract = insert_row(conn, "Contract", {"projectId": bid["projectId"], "providerId": bid["providerId"],
                                             "totalAmount": bid["amount"]})
    publish(conn, "ContractAwarded", {"providerId": bid["providerId"], "totalAmount": bid["amount"]},
            "CONTRACT", contract["id"])
    return ok(contract, status=201)


@router.post("/contracts/bids/{bid_id}/withdraw")
def withdraw_bid(bid_id: str, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    profile = require_provider(conn, user["id"])
    bid = get_row(conn, "ContractBid", bid_id)
    if not bid:
        raise ApiError(404, "CONTRACT_BID_NOT_FOUND", "Contract bid not found")
    if bid["providerId"] != profile["id"]:
        raise ApiError(403, "FORBIDDEN", "You did not submit this bid")
    if bid["status"] != "SUBMITTED":
        raise ApiError(409, "CONTRACT_BID_NOT_SUBMITTED", "Contract bid is not in SUBMITTED status")
    cb = t("ContractBid")
    update_rows(conn, "ContractBid", cb.c.id == bid_id, {"status": "WITHDRAWN"})
    return ok({"status": "WITHDRAWN"})


def _contract_and_project(conn: Connection, contract_id: str) -> tuple[dict, dict]:
    contract = get_row(conn, "Contract", contract_id)
    if not contract:
        raise ApiError(404, "CONTRACT_NOT_FOUND", "Contract not found")
    project = get_row(conn, "ContractProject", contract["projectId"])
    if not project:
        raise ApiError(404, "CONTRACT_PROJECT_NOT_FOUND", "Contract project not found")
    return contract, project


@router.get("/contracts/{contract_id}")
def get_contract(contract_id: str, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    contract, project = _contract_and_project(conn, contract_id)
    contract_party(conn, contract, project, user["id"])
    return ok(contract)


@router.get("/contracts/{contract_id}/milestones")
def list_milestones(contract_id: str, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    contract, project = _contract_and_project(conn, contract_id)
    contract_party(conn, contract, project, user["id"])
    cm = t("ContractMilestone")
    return ok(rows(conn, select(cm).where(cm.c.contractId == contract_id)))


@router.post("/contracts/{contract_id}/milestones")
def create_milestone(contract_id: str, body: MilestoneBody, user: dict = Depends(current_user),
                     conn: Connection = Depends(get_conn)):
    contract = get_row(conn, "Contract", contract_id)
    if not contract:
        raise ApiError(404, "CONTRACT_NOT_FOUND", "Contract not found")
    project = get_row(conn, "ContractProject", contract["projectId"])
    if not project or project["customerId"] != user["id"]:
        raise ApiError(403, "FORBIDDEN", "Only the posting customer can create milestones on this contract")
    if contract["status"] != "IN_PROGRESS":
        raise ApiError(409, "INVALID_STATUS_TRANSITION", f"Cannot add milestones to a {contract['status']} contract")
    return ok(insert_row(conn, "ContractMilestone", {"contractId": contract_id, "title": body.title,
                                                     "amount": body.amount, "dueDate": to_naive_utc(body.dueDate)}),
              status=201)
