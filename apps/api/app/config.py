"""Runtime configuration, read from apps/api/.env (or the process environment).

JWT_PRIVATE_KEY / JWT_PUBLIC_KEY must be the SAME RS256 keypair the Admin
Platform (apps/backend) uses: the admin verifies access tokens issued here
with the public key. Values may be single-line with literal ``\\n`` escapes
(the format used in apps/backend/.env) — they are normalised on load.
"""

import re
from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

API_ROOT = Path(__file__).resolve().parent.parent


def _parse_duration(value: str) -> int:
    match = re.fullmatch(r"(\d+)([smhd])", value.strip())
    if not match:
        raise ValueError(f'Invalid duration "{value}" (expected e.g. "15m", "30d")')
    return int(match.group(1)) * {"s": 1, "m": 60, "h": 3600, "d": 86400}[match.group(2)]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=API_ROOT / ".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str
    jwt_private_key: str
    jwt_public_key: str
    access_token_ttl: str = "15m"
    refresh_token_ttl: str = "30d"
    allowed_origins: str = ""
    default_region_code: str = "SD"
    # Image uploads (listing covers/galleries). Empty = uploads disabled.
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    @field_validator("jwt_private_key", "jwt_public_key")
    @classmethod
    def _unescape_pem(cls, value: str) -> str:
        return value.replace("\\n", "\n").strip()

    @field_validator("database_url")
    @classmethod
    def _sqlalchemy_url(cls, value: str) -> str:
        # Same URL apps/backend uses for Prisma; strip Prisma-only query params
        # and select the psycopg (v3) driver.
        url = re.sub(r"[?&]schema=[^&]*", "", value)
        return re.sub(r"^postgres(ql)?://", "postgresql+psycopg://", url)

    @property
    def access_token_ttl_seconds(self) -> int:
        return _parse_duration(self.access_token_ttl)

    @property
    def refresh_token_ttl_seconds(self) -> int:
        return _parse_duration(self.refresh_token_ttl)

    @property
    def uploads_enabled(self) -> bool:
        return bool(self.cloudinary_cloud_name and self.cloudinary_api_key and self.cloudinary_api_secret)

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
