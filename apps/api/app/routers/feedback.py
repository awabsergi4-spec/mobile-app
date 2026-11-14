"""Reviews of completed jobs, and help & support tickets."""

from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import Connection, func, select

from ..common import get_row, rows
from ..db import get_conn, insert_row, t, update_rows
from ..events import publish
from ..responses import ApiError, ok
from ..security import current_user

router = APIRouter(tags=["feedback"])

JobType = Literal["ON_DEMAND", "REMOTE", "CONTRACT"]
ScoreCategory = Literal["PROFESSIONALISM", "COMMUNICATION", "QUALITY", "PUNCTUALITY", "VALUE"]


class ReviewBody(BaseModel):
    jobType: JobType
    jobId: str = Field(min_length=1)
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=2000)
    scores: dict[ScoreCategory, int] | None = None


def _job_context(conn: Connection, job_type: str, job_id: str, user_id: str) -> tuple[str, str]:
    """Return (provider_profile_id, review FK column) for a completed job owned by this customer."""
    if job_type == "ON_DEMAND":
        job = get_row(conn, "OnDemandRequest", job_id)
        if not job:
            raise ApiError(404, "JOB_NOT_FOUND", "Job not found")
        oda = t("OnDemandAssignment")
        provider_id = conn.execute(select(oda.c.providerId).where(
            oda.c.requestId == job_id, oda.c.status == "ACCEPTED")).scalar()
        customer_id, column = job["customerId"], "onDemandRequestId"
    elif job_type == "REMOTE":
        job = get_row(conn, "RemoteEngagement", job_id)
        if not job:
            raise ApiError(404, "JOB_NOT_FOUND", "Job not found")
        provider_id, customer_id, column = job["providerId"], job["customerId"], "remoteEngagementId"
    else:
        job = get_row(conn, "Contract", job_id)
        if not job:
            raise ApiError(404, "JOB_NOT_FOUND", "Job not found")
        project = get_row(conn, "ContractProject", job["projectId"])
        provider_id, customer_id, column = job["providerId"], project["customerId"] if project else None, "contractId"
    if customer_id != user_id:
        raise ApiError(403, "FORBIDDEN", "Only the customer of this job can review it")
    if job["status"] != "COMPLETED" or not provider_id:
        raise ApiError(409, "JOB_NOT_COMPLETED", "Only completed jobs can be reviewed")
    return provider_id, column


@router.get("/reviews/for-job")
def my_review_for_job(jobType: JobType, jobId: str, user: dict = Depends(current_user),
                      conn: Connection = Depends(get_conn)):
    column = {"ON_DEMAND": "onDemandRequestId", "REMOTE": "remoteEngagementId", "CONTRACT": "contractId"}[jobType]
    rv = t("Review")
    review = conn.execute(select(rv).where(rv.c[column] == jobId, rv.c.authorId == user["id"])).mappings().first()
    return ok(dict(review) if review else None)


@router.post("/reviews")
def create_review(body: ReviewBody, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    provider_id, column = _job_context(conn, body.jobType, body.jobId, user["id"])
    rv = t("Review")
    if conn.execute(select(rv.c.id).where(rv.c[column] == body.jobId, rv.c.authorId == user["id"])).first():
        raise ApiError(409, "ALREADY_REVIEWED", "You already reviewed this job")
    provider = get_row(conn, "ProviderProfile", provider_id)
    review = insert_row(conn, "Review", {
        "authorId": user["id"], "subjectId": provider["userId"], "rating": body.rating,
        "comment": (body.comment or "").strip() or None, column: body.jobId,
    })
    for category, score in (body.scores or {}).items():
        if 1 <= score <= 5:
            insert_row(conn, "ReviewCategoryScore", {"reviewId": review["id"], "category": category, "score": score})
    # Keep the provider's public rating in step with its reviews.
    avg, count = conn.execute(select(func.avg(rv.c.rating), func.count(rv.c.id))
                              .where(rv.c.subjectId == provider["userId"])).one()
    pp = t("ProviderProfile")
    update_rows(conn, "ProviderProfile", pp.c.id == provider_id,
                {"ratingAverage": round(float(avg or 0), 2), "ratingCount": int(count)})
    publish(conn, "ReviewCreated", {"rating": body.rating, "jobType": body.jobType}, "PROVIDER_PROFILE", provider_id)
    return ok(review, status=201)


# ── Help & support ───────────────────────────────────────────────────────

class TicketBody(BaseModel):
    subject: str = Field(min_length=3, max_length=150)
    message: str = Field(min_length=3, max_length=4000)


class TicketMessageBody(BaseModel):
    body: str = Field(min_length=1, max_length=4000)


def _own_ticket(conn: Connection, ticket_id: str, user_id: str) -> dict:
    ticket = get_row(conn, "SupportTicket", ticket_id)
    if not ticket or ticket["userId"] != user_id:
        raise ApiError(404, "TICKET_NOT_FOUND", "Support ticket not found")
    return ticket


@router.get("/support/tickets")
def my_tickets(user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    st = t("SupportTicket")
    return ok(rows(conn, select(st).where(st.c.userId == user["id"]).order_by(st.c.createdAt.desc()).limit(50)))


@router.post("/support/tickets")
def open_ticket(body: TicketBody, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    ticket = insert_row(conn, "SupportTicket", {"userId": user["id"], "subject": body.subject.strip()})
    insert_row(conn, "SupportTicketMessage", {"ticketId": ticket["id"], "senderId": user["id"], "body": body.message.strip()})
    return ok(ticket, status=201)


@router.get("/support/tickets/{ticket_id}")
def ticket_detail(ticket_id: str, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    ticket = _own_ticket(conn, ticket_id, user["id"])
    sm = t("SupportTicketMessage")
    messages = rows(conn, select(sm).where(sm.c.ticketId == ticket_id).order_by(sm.c.sentAt.asc()))
    for m in messages:
        m["fromMe"] = m["senderId"] == user["id"]
    return ok({**ticket, "messages": messages})


@router.post("/support/tickets/{ticket_id}/messages")
def reply_ticket(ticket_id: str, body: TicketMessageBody, user: dict = Depends(current_user),
                 conn: Connection = Depends(get_conn)):
    ticket = _own_ticket(conn, ticket_id, user["id"])
    if ticket["status"] == "CLOSED":
        raise ApiError(409, "TICKET_CLOSED", "This ticket is closed")
    message = insert_row(conn, "SupportTicketMessage", {"ticketId": ticket_id, "senderId": user["id"], "body": body.body.strip()})
    return ok({**message, "fromMe": True}, status=201)
