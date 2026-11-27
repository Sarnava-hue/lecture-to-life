import json
from pathlib import Path

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]

_PLACEHOLDER_SECRETS = {
    "",
    "replace_this_with_a_long_random_secret_key",
    "change_this_to_a_long_random_secret_key",
    "secret",
    "changeme",
}


class Settings(BaseSettings):
    """Application settings loaded from backend/.env and environment variables."""

    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"
    GEMINI_FALLBACK_MODELS: list[str] = [
        "gemini-3.1-flash-lite",
        "gemini-3.5-flash",
        "gemini-3.8-flash",
    ]
    GEMINI_EMBEDDING_MODEL: str = "gemini-embedding-001"

    ENVIRONMENT: str = "development"
    CORS_ORIGINS: list[str] | str = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    RATE_LIMIT_ENABLED: bool = True
    AUTH_RATE_LIMIT_REQUESTS: int = 30
    AUTH_RATE_LIMIT_WINDOW_SECONDS: int = 60

    UPLOAD_DIR: str = "storage/lectures"
    MAX_UPLOAD_SIZE_MB: int = 100

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: list[str] | str) -> list[str]:
        if isinstance(value, str):
            stripped = value.strip()
            if not stripped:
                return []
            if stripped.startswith("["):
                parsed = json.loads(stripped)
                return [str(item).strip() for item in parsed if str(item).strip()]
            return [origin.strip() for origin in stripped.split(",") if origin.strip()]
        return [str(item).strip() for item in value if str(item).strip()]

    @model_validator(mode="after")
    def validate_production_secret(self) -> "Settings":
        if self.ENVIRONMENT.lower() == "production":
            if (
                self.SECRET_KEY.strip() in _PLACEHOLDER_SECRETS
                or len(self.SECRET_KEY.strip()) < 32
            ):
                raise ValueError(
                    "SECRET_KEY must be a random string of at least 32 characters in production."
                )
        return self

    @property
    def upload_dir_path(self) -> Path:
        configured = Path(self.UPLOAD_DIR)
        if configured.is_absolute():
            return configured
        return (BASE_DIR / configured).resolve()

    @property
    def max_upload_size_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024


settings = Settings()
