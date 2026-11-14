"""Response envelope — byte-compatible with apps/backend/src/presentation/http-response.ts.

success: {"success": true, "message": str|null, "data": T}
error:   {"success": false, "errorCode", "message", "details"?, "traceId", "timestamp"}
"""

import uuid
from datetime import date, datetime, timezone
from typing import Any

from fastapi.responses import JSONResponse


def to_json(value: Any) -> Any:
    """Serialise DB rows the way Prisma does: camelCase keys, ISO-8601 UTC with ms + 'Z'."""
    if isinstance(value, datetime):
        return value.isoformat(timespec="milliseconds") + "Z"
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, dict):
        return {k: to_json(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [to_json(v) for v in value]
    return value


def ok(data: Any, status: int = 200, message: str | None = None) -> JSONResponse:
    return JSONResponse({"success": True, "message": message, "data": to_json(data)}, status_code=status)


class ApiError(Exception):
    """Raise from any handler/service to return the error envelope.

    ``commit_writes=True`` keeps writes made earlier in the request (e.g. the
    "revoke every session on refresh-token reuse" side effect) even though
    the request itself fails.
    """

    def __init__(self, status: int, error_code: str, message: str, details: Any = None, commit_writes: bool = False):
        super().__init__(message)
        self.status = status
        self.error_code = error_code
        self.message = message
        self.details = details
        self.commit_writes = commit_writes


def fail(status: int, error_code: str, message: str, details: Any = None) -> JSONResponse:
    body: dict[str, Any] = {
        "success": False,
        "errorCode": error_code,
        "message": message,
        "traceId": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).replace(tzinfo=None).isoformat(timespec="milliseconds") + "Z",
    }
    if details is not None:
        body["details"] = details
    return JSONResponse(body, status_code=status)


def not_found(code: str, message: str) -> ApiError:
    return ApiError(404, code, message)


def forbidden(message: str) -> ApiError:
    return ApiError(403, "FORBIDDEN", message)
