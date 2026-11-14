"""Disputes (party-opened) and in-app notifications."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import Connection, func, select

from ..common import contract_party, get_row, page, remote_party, rows
from ..db import get_conn, insert_row, t, update_rows, utcnow
from ..events import publish
from ..responses import ApiError, ok
from ..security import current_user

router = APIRouter(tags=["engagement"])


class OpenDisputeBody(BaseModel):
    relatedEntityType: str = Field(min_length=1, max_length=60)
    relatedEntityId: str = Field(min_length=1)
    reason: str = Field(min_length=3, max_length=2000)


def _assert_can_open(conn: Connection, entity_type: str, entity_id: str, user_id: str) -> None:
    if entity_type == "CONTRACT_MILESTONE":
        milestone = get_row(conn, "ContractMilestone", entity_id)
        if not milestone:
            raise ApiError(404, "NOT_FOUND", "Contract milestone not found")
        contract = get_row(conn, "Contract", milestone["contractId"])
        if not contract:
            raise ApiError(404, "NOT_FOUND", "Contract not found")
        project = get_row(conn, "ContractProject", contract["projectId"])
        if not project:
            raise ApiError(404, "NOT_FOUND", "Contract project not found")
        contract_party(conn, contract, project, user_id)
        return
    if entity_type == "REMOTE_MILESTONE":
        milestone = get_row(conn, "RemoteMilestone", entity_id)
        if not milestone:
            raise ApiError(404, "NOT_FOUND", "Remote milestone not found")
        engagement = get_row(conn, "RemoteEngagement", milestone["engagementId"])
        if not engagement:
            raise ApiError(404, "NOT_FOUND", "Remote engagement not found")
        remote_party(conn, engagement, user_id)
        return
    raise ApiError(400, "UNSUPPORTED_DISPUTE_ENTITY", f"Self-service dispute opening is not supported for {entity_type}")


@router.get("/disputes")
def my_disputes(user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    d = t("Dispute")
    return ok(rows(conn, select(d).where(d.c.raisedById == user["id"]).order_by(d.c.createdAt.desc()).limit(25)))


@router.post("/disputes")
def open_dispute(body: OpenDisputeBody, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    _assert_can_open(conn, body.relatedEntityType, body.relatedEntityId, user["id"])
    dispute = insert_row(conn, "Dispute", {"raisedById": user["id"], "relatedEntityType": body.relatedEntityType,
                                           "relatedEntityId": body.relatedEntityId, "reason": body.reason})
    es = t("Escrow")
    escrow = conn.execute(select(es).where(es.c.relatedEntityType == body.relatedEntityType,
                                           es.c.relatedEntityId == body.relatedEntityId)).mappings().first()
    if escrow and escrow["status"] in ("HELD", "PARTIALLY_RELEASED"):
        update_rows(conn, "Escrow", es.c.id == escrow["id"], {"status": "DISPUTED", "disputedAt": utcnow()})
    publish(conn, "DisputeOpened", {"reason": body.reason, "escrowLocked": bool(escrow)},
            body.relatedEntityType, body.relatedEntityId)
    return ok(dispute, status=201)


@router.get("/notifications")
def my_notifications(unreadOnly: str | None = None, cursor: str | None = None, limit: int | None = None,
                     user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    n = t("Notification")
    stmt = select(n).where(n.c.userId == user["id"])
    if unreadOnly == "true":
        stmt = stmt.where(n.c.readAt.is_(None))
    return ok(rows(conn, page(stmt, n, "createdAt", desc=True, cursor=cursor, limit=limit, default_limit=50)))


@router.get("/notifications/unread-count")
def unread_count(user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    n = t("Notification")
    count = conn.execute(select(func.count()).select_from(n).where(n.c.userId == user["id"], n.c.readAt.is_(None)))
    return ok({"count": count.scalar_one()})


@router.post("/notifications/read-all")
def read_all(user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    n = t("Notification")
    updated = update_rows(conn, "Notification", (n.c.userId == user["id"]) & n.c.readAt.is_(None), {"readAt": utcnow()})
    return ok({"updatedCount": len(updated)})


@router.post("/notifications/{notification_id}/read")
def read_one(notification_id: str, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    n = t("Notification")
    update_rows(conn, "Notification",
                (n.c.id == notification_id) & (n.c.userId == user["id"]) & n.c.readAt.is_(None), {"readAt": utcnow()})
    return ok({"success": True})
