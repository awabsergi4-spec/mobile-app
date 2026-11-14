"""cuid-style string ids (same shape/length class as Prisma's cuid())."""

import secrets
import string
import time

_ALPHABET = string.digits + string.ascii_lowercase


def _base36(number: int) -> str:
    out = ""
    while number:
        number, rem = divmod(number, 36)
        out = _ALPHABET[rem] + out
    return out or "0"


def new_id() -> str:
    timestamp = _base36(int(time.time() * 1000))
    random_part = "".join(secrets.choice(_ALPHABET) for _ in range(16))
    return f"c{timestamp}{random_part}"
