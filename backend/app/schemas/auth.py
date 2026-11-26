from typing import Annotated

from pydantic import BaseModel, BeforeValidator, ConfigDict, EmailStr, Field, field_validator

from app.core.security import MAX_BCRYPT_PASSWORD_BYTES

StrId = Annotated[str, BeforeValidator(str)]


class UserCreate(BaseModel):
    """Payload for registering a new user account."""

    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise ValueError("Name must be at least 2 characters.")
        return cleaned

    @field_validator("password")
    @classmethod
    def validate_password_bytes(cls, value: str) -> str:
        if len(value.encode("utf-8")) > MAX_BCRYPT_PASSWORD_BYTES:
            raise ValueError("Password must not exceed 72 UTF-8 bytes.")
        return value


class UserLogin(BaseModel):
    """Payload for JSON email/password sign-in."""

    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Public user profile returned by auth endpoints."""

    id: StrId
    name: str
    email: EmailStr
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)

    @field_validator("name", mode="before")
    @classmethod
    def coerce_nullable_name(cls, value: str | None) -> str:
        return value or ""


class TokenResponse(BaseModel):
    """JWT access token response paired with the authenticated user profile."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse
