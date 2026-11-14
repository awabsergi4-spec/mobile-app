"""Wallet view, wallet transactions, provider withdrawal requests."""

from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import Connection, or_, select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from ..common import page, region_for_user, require_provider, rows
from ..db import get_conn, insert_row, t, update_rows, utcnow
from ..events import publish
from ..ids import new_id
from ..responses import ApiError, ok
from ..security import current_user

router = APIRouter(tags=["wallet"])


class WithdrawalBody(BaseModel):
    amount: int = Field(gt=0)
    method: Literal["BANK_TRANSFER", "WALLET_TRANSFER", "MOBILE_MONEY"]


def _get_or_create_wallet(conn: Connection, user: dict) -> dict:
    wallets = t("Wallet")
    existing = conn.execute(select(wallets).where(wallets.c.userId == user["id"])).mappings().first()
    if existing:
        return dict(existing)
    region = region_for_user(conn, user)
    return insert_row(conn, "Wallet", {"userId": user["id"], "currency": region["defaultCurrency"]})


def _adjust_balance(conn: Connection, wallet_id: str, bucket: str, delta: int) -> None:
    wb = t("WalletBalance")
    stmt = pg_insert(wb).values(id=new_id(), walletId=wallet_id, bucket=bucket, amount=delta, updatedAt=utcnow())
    conn.execute(stmt.on_conflict_do_update(
        index_elements=["walletId", "bucket"], set_={"amount": wb.c.amount + delta, "updatedAt": utcnow()}))


@router.get("/wallets/me")
def my_wallet(user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    wallet = _get_or_create_wallet(conn, user)
    wb = t("WalletBalance")
    balances = rows(conn, select(wb.c.bucket, wb.c.amount).where(wb.c.walletId == wallet["id"]))
    return ok({**wallet, "balances": balances})


@router.get("/wallets/me/transactions")
def my_transactions(cursor: str | None = None, limit: int | None = None, user: dict = Depends(current_user),
                    conn: Connection = Depends(get_conn)):
    wallets, ptx = t("Wallet"), t("PaymentTransaction")
    wallet = conn.execute(select(wallets).where(wallets.c.userId == user["id"])).mappings().first()
    if not wallet:
        return ok([])
    stmt = select(ptx).where(or_(ptx.c.sourceWalletId == wallet["id"], ptx.c.destinationWalletId == wallet["id"]))
    txs = rows(conn, page(stmt, ptx, "createdAt", desc=True, cursor=cursor, limit=limit, default_limit=50))
    return ok([{
        "id": r["id"], "type": r["type"], "amount": r["amount"], "currency": r["currency"], "status": r["status"],
        "direction": "OUT" if r["sourceWalletId"] == wallet["id"] else "IN",
        "relatedEntityType": r["relatedEntityType"], "relatedEntityId": r["relatedEntityId"], "createdAt": r["createdAt"],
    } for r in txs])


@router.get("/providers/me/withdrawals")
def my_withdrawals(cursor: str | None = None, limit: int | None = None, user: dict = Depends(current_user),
                   conn: Connection = Depends(get_conn)):
    profile = require_provider(conn, user["id"])
    wd = t("Withdrawal")
    stmt = select(wd).where(wd.c.providerId == profile["id"])
    return ok(rows(conn, page(stmt, wd, "requestedAt", desc=True, cursor=cursor, limit=limit, default_limit=25)))


@router.post("/providers/me/withdrawals")
def request_withdrawal(body: WithdrawalBody, user: dict = Depends(current_user), conn: Connection = Depends(get_conn)):
    profile = require_provider(conn, user["id"])
    wallet = _get_or_create_wallet(conn, user)
    if wallet["isFrozen"]:
        raise ApiError(403, "WALLET_FROZEN", "This wallet is frozen")
    wb = t("WalletBalance")
    # Atomic conditional debit: only succeeds if AVAILABLE covers the amount.
    debited = update_rows(conn, "WalletBalance",
                          (wb.c.walletId == wallet["id"]) & (wb.c.bucket == "AVAILABLE") & (wb.c.amount >= body.amount),
                          {"amount": wb.c.amount - body.amount})
    if not debited:
        raise ApiError(409, "INSUFFICIENT_BALANCE", "Insufficient AVAILABLE balance")
    _adjust_balance(conn, wallet["id"], "LOCKED", body.amount)
    withdrawal = insert_row(conn, "Withdrawal", {
        "providerId": profile["id"], "walletId": wallet["id"], "amount": body.amount, "feeMinorUnits": 0,
        "currency": wallet["currency"], "method": body.method,
    })
    publish(conn, "WithdrawalRequested", {"amount": body.amount, "currency": wallet["currency"], "method": body.method},
            "WITHDRAWAL", withdrawal["id"])
    return ok(withdrawal, status=201)
