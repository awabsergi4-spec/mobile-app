"""Remote engagements and their milestones."""

from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import Connection, select

from ..common import get_row, is_eligible_provider, remote_party, require_provider, rows
from ..db import get_conn, insert_row, t, to_naive_utc
from ..responses import ApiError, ok
from ..security import current_user

router = APIRouter(tags=["remote"])


class CreateEngagementBody(BaseModel):
    providerId: str = Field(min_length=1)
    categoryId: str = Field(min_length=1)
    title: str = Field(min_length=3, max_length=150)
    priceType: Literal["FIXED", "HOURLY"]
    amount: int = Field(gt=0)


class MilestoneBody(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    amount: int = Field(gt=0)
    dueDate: datetime | None = None


@router.get("/remote")
def list_engagements(role: str | None = None, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    re_ = t("RemoteEngagement")
    if role == "provider":
        profile = require_provider(conn, user["id"])
        stmt = select(re_).where(re_.c.providerId == profile["id"])
    else:
        stmt = select(re_).where(re_.c.customerId == user["id"])
    return ok(rows(conn, stmt.order_by(re_.c.createdAt.desc()).limit(25)))


@router.post("/remote")
def create_engagement(body: CreateEngagementBody, user: dict = Depends(current_user),
                      conn: Connection = Depends(get_conn)):
    if not is_eligible_provider(get_row(conn, "ProviderProfile", body.providerId)):
        raise ApiError(422, "PROVIDER_NOT_ELIGIBLE", "Provider must be active and verified")
    return ok(insert_row(conn, "RemoteEngagement", {"customerId": user["id"], **body.model_dump()}), status=201)


def _engagement(conn: Connection, engagement_id: str) -> dict:
    engagement = get_row(conn, "RemoteEngagement", engagement_id)
    if not engagement:
        raise ApiError(404, "REMOTE_ENGAGEMENT_NOT_FOUND", "Remote engagement not found")
    return engagement


@router.get("/remote/{engagement_id}")
def get_engagement(engagement_id: str, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    engagement = _engagement(conn, engagement_id)
    remote_party(conn, engagement, user["id"])
    return ok(engagement)


@router.get("/remote/{engagement_id}/milestones")
def list_milestones(engagement_id: str, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    engagement = _engagement(conn, engagement_id)
    remote_party(conn, engagement, user["id"])
    rm = t("RemoteMilestone")
    return ok(rows(conn, select(rm).where(rm.c.engagementId == engagement_id)))


@router.post("/remote/{engagement_id}/milestones")
def create_milestone(engagement_id: str, body: MilestoneBody, user: dict = Depends(current_user),
                     conn: Connection = Depends(get_conn)):
    engagement = _engagement(conn, engagement_id)
    if engagement["customerId"] != user["id"]:
        raise ApiError(403, "FORBIDDEN", "Only the requesting customer can create milestones on this engagement")
    if engagement["status"] != "ACTIVE":
        raise ApiError(409, "INVALID_STATUS_TRANSITION", f"Cannot add milestones to a {engagement['status']} engagement")
    return ok(insert_row(conn, "RemoteMilestone", {"engagementId": engagement_id, "title": body.title,
                                                   "amount": body.amount, "dueDate": to_naive_utc(body.dueDate)}),
              status=201)
