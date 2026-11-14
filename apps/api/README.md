# SAHL API (FastAPI)

The backend the mobile app calls, and that the Admin Platform (apps/backend, Next.js) calls for
authentication and user management. Same PostgreSQL database and same RS256 keypair as apps/backend.

## Run (Windows)

```bash
cd apps/api
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt
cp .env.example .env          # same DATABASE_URL + JWT keys as apps/backend/.env
.venv/Scripts/python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Health: `http://localhost:8000/api/v1/health` · interactive docs: `http://localhost:8000/docs`
- Tests (real DB, every test rolled back): `.venv/Scripts/python -m pytest -q`
- `.claude/launch.json` has a `sahl-api` entry.

## Design

- `app/db.py` — tables are **reflected** from the live schema (Prisma naming: model = table, camelCase columns),
  so rows serialize to the same JSON the Next.js API returned. `insert_row` reproduces Prisma's client-side
  defaults (cuid ids, UTC timestamps, `[]` arrays). The DB session timezone is local, so never rely on
  `DEFAULT CURRENT_TIMESTAMP` — always write UTC from Python.
- **One transaction per request** (`get_conn`): all writes in a handler commit or roll back together.
  Raise `ApiError(..., commit_writes=True)` to keep earlier writes on a failing request.
- Envelope (`app/responses.py`) is identical to apps/backend's: `{success, message, data}` /
  `{success:false, errorCode, message, details?, traceId, timestamp}`. Validation errors use zod's
  `flatten()` shape; malformed JSON returns `400 INVALID_JSON`.
- Auth (`app/security.py`): argon2id (verifies hashes made by apps/backend), RS256 access JWT `{sub}`,
  rotated refresh tokens with reuse detection. **Every authenticated request requires `status = ACTIVE`**,
  and suspension revokes all refresh tokens.
- Phone numbers are normalised to `+<digits>`; lookups also match legacy rows stored without `+`.

## Sign-up & approval (no OTP)

`POST /api/v1/auth/register` `{phone, password, fullName, preferredLanguage, accountType: CUSTOMER|PROVIDER|COMPANY,
email?, businessName? (PROVIDER), companyName? (COMPANY)}` creates the user as `PENDING_VERIFICATION`
(plus the provider profile or company + OWNER membership). Login returns `403 ACCOUNT_PENDING_APPROVAL`
until an admin calls `POST /api/v1/admin/users/{id}/approve` (Admin Platform → Users → Approve account).

## Endpoints (59)

Auth: register, login, refresh, logout, `GET /users/me` · reference: health, config, home-layout,
service-categories · providers (browse, create, `/me` profile/availability/documents/verification/portfolio/
payout-accounts/withdrawals) · companies (create, view/update, members, invitations, documents, verification) ·
on-demand (list/create/detail/cancel, provider offers accept/decline, matcher) · contracts (projects, bids,
award/withdraw, contract detail, milestones) · remote (list/create/detail, milestones) · wallets (`/me`,
transactions) · disputes · notifications · admin users (list/detail/approve/suspend/reactivate).

Not yet ported (still served in-process by apps/backend): milestone funding/status/release, on-demand job
progress & tracking, remote deliver/complete/revisions/meetings, and every admin module except Users.

## Migrations (Alembic)

Schema ownership moved from Prisma to Alembic. `0001_baseline` = the schema from
`apps/backend/prisma/migrations/20260807093213_init`. Mark an existing database once with:

```bash
.venv/Scripts/alembic stamp 0001_baseline
```

Write new revisions by hand (`alembic revision -m "..."`); autogenerate isn't configured because tables are reflected.
