"""On-demand requests, provider offers (sequential dispatch), and the v1 matcher."""

import math
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import Connection, select

from ..common import get_row, page, provider_for_user, require_provider, rows
from ..db import get_conn, insert_row, t, update_rows, utcnow
from ..events import publish
from ..responses import ApiError, ok
from ..security import current_user

router = APIRouter(tags=["on-demand"])

EARTH_RADIUS_KM = 6371.0


class CreateRequestBody(BaseModel):
    categoryId: str = Field(min_length=1)
    description: str = Field(min_length=5, max_length=2000)
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    fulfillmentMode: Literal["INSTANT", "SCHEDULED"] | None = None
    scheduledFor: datetime | None = None
    isEmergency: bool | None = None

    @model_validator(mode="after")
    def _schedule(self):
        if self.fulfillmentMode == "SCHEDULED" and self.scheduledFor is None:
            raise ValueError("scheduledFor is required when fulfillmentMode is SCHEDULED")
        if self.scheduledFor is not None:
            # Store naive UTC like every other timestamp; naive input is taken as UTC.
            when = self.scheduledFor
            if when.tzinfo is not None:
                when = when.astimezone(timezone.utc).replace(tzinfo=None)
            if when <= utcnow():
                raise ValueError("scheduledFor must be in the future")
            self.scheduledFor = when
        return self


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    d_lat, d_lng = math.radians(lat2 - lat1), math.radians(lng2 - lng1)
    a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lng / 2) ** 2
    return EARTH_RADIUS_KM * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def find_best_provider(conn: Connection, request: dict, exclude_ids: list[str]) -> dict | None:
    """Port of DistanceRatingProviderMatcher: ACTIVE+VERIFIED+available providers offering the
    category whose service area contains the point; score = rating*20 - distanceKm."""
    pc, pp, sa = t("ProviderCategory"), t("ProviderProfile"), t("ProviderServiceArea")
    stmt = (select(pp.c.id, pp.c.ratingAverage)
            .select_from(pc.join(pp, pp.c.id == pc.c.providerId))
            .where(pc.c.categoryId == request["categoryId"], pp.c.status == "ACTIVE",
                   pp.c.verificationStatus == "VERIFIED", pp.c.isAvailable.is_(True)))
    if exclude_ids:
        stmt = stmt.where(pp.c.id.notin_(exclude_ids))
    best = None
    for provider in conn.execute(stmt).mappings().all():
        areas = conn.execute(select(sa).where(sa.c.providerId == provider["id"])).mappings().all()
        distances = [d for a in areas
                     if (d := _haversine_km(request["lat"], request["lng"], a["centerLat"], a["centerLng"])) <= a["radiusKm"]]
        if not distances:
            continue
        distance = min(distances)
        score = provider["ratingAverage"] * 20 - distance
        if best is None or score > best["score"]:
            best = {"providerId": provider["id"], "score": score, "distanceKm": distance}
    if best:
        insert_row(conn, "MatchingScoreLog", {"requestId": request["id"], "providerId": best["providerId"],
                                              "score": best["score"], "factors": {"distanceKm": best["distanceKm"]}})
    return best


def _offer(conn: Connection, request: dict, exclude_ids: list[str]) -> None:
    candidate = find_best_provider(conn, request, exclude_ids)
    if candidate:
        insert_row(conn, "OnDemandAssignment", {"requestId": request["id"], "providerId": candidate["providerId"]})
        publish(conn, "OnDemandProviderOffered", {"providerId": candidate["providerId"], "score": candidate["score"]},
                "ON_DEMAND_REQUEST", request["id"])


@router.get("/on-demand")
def list_my_requests(status: str | None = None, cursor: str | None = None, user: dict = Depends(current_user),
                     conn: Connection = Depends(get_conn)):
    odr = t("OnDemandRequest")
    stmt = select(odr).where(odr.c.customerId == user["id"])
    if status:
        stmt = stmt.where(odr.c.status == status)
    return ok(rows(conn, page(stmt, odr, "createdAt", desc=True, cursor=cursor, limit=None, default_limit=25)))


@router.post("/on-demand")
def create_request(body: CreateRequestBody, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    request = insert_row(conn, "OnDemandRequest", {
        "customerId": user["id"], "categoryId": body.categoryId, "description": body.description,
        "lat": body.lat, "lng": body.lng, "fulfillmentMode": body.fulfillmentMode or "INSTANT",
        "scheduledFor": body.scheduledFor, "isEmergency": bool(body.isEmergency),
    })
    publish(conn, "OnDemandRequestCreated", {"categoryId": request["categoryId"], "isEmergency": request["isEmergency"]},
            "ON_DEMAND_REQUEST", request["id"])
    if request["fulfillmentMode"] == "INSTANT":
        _offer(conn, request, [])
    return ok(request, status=201)


@router.get("/on-demand/assignments/me")
def my_assignments(status: str | None = None, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    profile = require_provider(conn, user["id"])
    oda, odr = t("OnDemandAssignment"), t("OnDemandRequest")
    stmt = (select(oda, odr.c.description.label("requestDescription"), odr.c.categoryId.label("requestCategoryId"),
                   odr.c.isEmergency.label("requestIsEmergency"))
            .select_from(oda.outerjoin(odr, odr.c.id == oda.c.requestId))
            .where(oda.c.providerId == profile["id"]))
    if status:
        stmt = stmt.where(oda.c.status == status)
    result = rows(conn, stmt.order_by(oda.c.offeredAt.desc()).limit(25))
    for row in result:
        row["requestIsEmergency"] = bool(row["requestIsEmergency"])
    return ok(result)


def _claim_assignment(conn: Connection, assignment_id: str, user_id: str, to_status: str) -> dict:
    profile = require_provider(conn, user_id)
    assignment = get_row(conn, "OnDemandAssignment", assignment_id)
    if not assignment:
        raise ApiError(404, "ASSIGNMENT_NOT_FOUND", "On-demand assignment not found")
    if assignment["providerId"] != profile["id"]:
        raise ApiError(403, "FORBIDDEN", "This offer was not made to you")
    oda = t("OnDemandAssignment")
    claimed = update_rows(conn, "OnDemandAssignment", (oda.c.id == assignment_id) & (oda.c.status == "OFFERED"),
                          {"status": to_status, "respondedAt": utcnow()})
    if not claimed:
        raise ApiError(409, "ASSIGNMENT_NOT_OFFERED", "This offer is no longer open")
    return assignment


@router.post("/on-demand/assignments/{assignment_id}/accept")
def accept_assignment(assignment_id: str, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    assignment = _claim_assignment(conn, assignment_id, user["id"], "ACCEPTED")
    oda = t("OnDemandAssignment")
    update_rows(conn, "OnDemandAssignment",
                (oda.c.requestId == assignment["requestId"]) & (oda.c.status == "OFFERED") & (oda.c.id != assignment_id),
                {"status": "EXPIRED", "respondedAt": utcnow()})
    odr = t("OnDemandRequest")
    update_rows(conn, "OnDemandRequest", odr.c.id == assignment["requestId"], {"status": "ASSIGNED"})
    publish(conn, "OnDemandAssignmentAccepted", {"providerId": assignment["providerId"]},
            "ON_DEMAND_REQUEST", assignment["requestId"])
    return ok({"status": "ACCEPTED"})


@router.post("/on-demand/assignments/{assignment_id}/decline")
def decline_assignment(assignment_id: str, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    assignment = _claim_assignment(conn, assignment_id, user["id"], "DECLINED")
    request = get_row(conn, "OnDemandRequest", assignment["requestId"])
    if not request:
        raise ApiError(404, "ON_DEMAND_REQUEST_NOT_FOUND", "On-demand request not found")
    publish(conn, "OnDemandAssignmentDeclined", {"providerId": assignment["providerId"]},
            "ON_DEMAND_REQUEST", request["id"])
    oda = t("OnDemandAssignment")
    previous = conn.execute(select(oda.c.providerId).where(oda.c.requestId == request["id"])).scalars().all()
    _offer(conn, request, list(previous))
    return ok({"status": "DECLINED"})


def _require_party(conn: Connection, request: dict, user_id: str) -> None:
    if request["customerId"] == user_id:
        return
    profile = provider_for_user(conn, user_id)
    if profile:
        oda = t("OnDemandAssignment")
        if conn.execute(select(oda.c.id).where(oda.c.requestId == request["id"],
                                               oda.c.providerId == profile["id"])).first():
            return
    raise ApiError(403, "FORBIDDEN", "You are not the customer or an assigned provider on this request")


@router.get("/on-demand/{request_id}")
def get_request(request_id: str, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    request = get_row(conn, "OnDemandRequest", request_id)
    if not request:
        raise ApiError(404, "ON_DEMAND_REQUEST_NOT_FOUND", "On-demand request not found")
    _require_party(conn, request, user["id"])
    return ok(request)


@router.get("/on-demand/{request_id}/assignments")
def request_assignments(request_id: str, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    request = get_row(conn, "OnDemandRequest", request_id)
    if not request:
        raise ApiError(404, "ON_DEMAND_REQUEST_NOT_FOUND", "On-demand request not found")
    _require_party(conn, request, user["id"])
    oda, pp = t("OnDemandAssignment"), t("ProviderProfile")
    return ok(rows(conn, select(oda, pp.c.businessName.label("providerBusinessName"),
                                pp.c.ratingAverage.label("providerRatingAverage"),
                                pp.c.ratingCount.label("providerRatingCount"))
                   .join(pp, pp.c.id == oda.c.providerId)
                   .where(oda.c.requestId == request_id).order_by(oda.c.offeredAt.asc())))


@router.post("/on-demand/{request_id}/cancel")
def cancel_request(request_id: str, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    request = get_row(conn, "OnDemandRequest", request_id)
    if not request:
        raise ApiError(404, "ON_DEMAND_REQUEST_NOT_FOUND", "On-demand request not found")
    if request["customerId"] != user["id"]:
        raise ApiError(403, "FORBIDDEN", "Only the requesting customer can cancel this request")
    if request["status"] not in ("SEARCHING", "ASSIGNED", "EN_ROUTE"):
        raise ApiError(409, "INVALID_STATUS_TRANSITION", f"Cannot move from {request['status']} to CANCELLED")
    odr = t("OnDemandRequest")
    update_rows(conn, "OnDemandRequest", odr.c.id == request_id, {"status": "CANCELLED", "cancelledAt": utcnow()})
    publish(conn, "OnDemandRequestCancelled", {"cancelledByUserId": user["id"], "fromStatus": request["status"]},
            "ON_DEMAND_REQUEST", request_id)
    return ok({"status": "CANCELLED"})
