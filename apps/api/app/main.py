"""SAHL API (FastAPI) — the backend the mobile app and Admin Platform call.

Run:  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000   (from apps/api)
"""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import get_settings
from .responses import ApiError, fail
from .routers import (
    account, admin_users, auth, catalog, companies, contracts, engagement, feedback, on_demand, providers, reference,
    remote, wallet,
)

API_PREFIX = "/api/v1"

app = FastAPI(title="SAHL API", version="1.0.0", docs_url="/docs", openapi_url="/openapi.json")

if get_settings().cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_settings().cors_origins,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )

for module in (reference, auth, account, catalog, providers, companies, on_demand, contracts, remote, wallet, engagement,
               feedback, admin_users):
    app.include_router(module.router, prefix=API_PREFIX)


@app.exception_handler(ApiError)
async def _api_error(_: Request, exc: ApiError):
    return fail(exc.status, exc.error_code, exc.message, exc.details)


@app.exception_handler(RequestValidationError)
async def _validation_error(_: Request, exc: RequestValidationError):
    # Same shape as zod's error.flatten(): {formErrors: [...], fieldErrors: {field: [...]}}
    form_errors: list[str] = []
    field_errors: dict[str, list[str]] = {}
    for err in exc.errors():
        loc = [str(p) for p in err.get("loc", ()) if p not in ("body", "query", "path")]
        message = str(err.get("msg", "Invalid value")).removeprefix("Value error, ")
        if err.get("type") == "json_invalid":
            return fail(400, "INVALID_JSON", "Request body is not valid JSON")
        if loc:
            field_errors.setdefault(loc[0], []).append(message)
        else:
            form_errors.append(message)
    return fail(400, "VALIDATION_ERROR", "Invalid input", {"formErrors": form_errors, "fieldErrors": field_errors})


@app.exception_handler(StarletteHTTPException)
async def _http_error(_: Request, exc: StarletteHTTPException):
    code = {404: "NOT_FOUND", 405: "METHOD_NOT_ALLOWED"}.get(exc.status_code, "HTTP_ERROR")
    return fail(exc.status_code, code, str(exc.detail))


@app.exception_handler(Exception)
async def _unhandled(_: Request, exc: Exception):
    return fail(500, "INTERNAL_ERROR", "Something went wrong")
