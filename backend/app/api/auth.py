from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.rate_limit import enforce_auth_rate_limit
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.db.dependencies import get_db
from app.models.user import User
from app.schemas.auth import (
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"],
)


def _authenticate_user(db: Session, email: str, password: str) -> User:
    """Validate credentials and active status, raising HTTP errors on failure."""
    normalized_email = email.strip().lower()
    user = db.scalar(select(User).where(User.email == normalized_email))

    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return user


def _build_token_response(user: User) -> TokenResponse:
    """Issue a Bearer JWT and wrap it with the user profile."""
    access_token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(enforce_auth_rate_limit)],
)
def register(
    user_data: UserCreate,
    db: Annotated[Session, Depends(get_db)],
):
    """Create a new user account and immediately issue a Bearer access token."""
    normalized_email = user_data.email.strip().lower()
    existing_user = db.scalar(select(User).where(User.email == normalized_email))

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    user = User(
        name=user_data.name,
        email=normalized_email,
        password_hash=hash_password(user_data.password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return _build_token_response(user)


@router.post(
    "/login",
    response_model=TokenResponse,
    dependencies=[Depends(enforce_auth_rate_limit)],
)
def login(
    credentials: UserLogin,
    db: Annotated[Session, Depends(get_db)],
):
    """Authenticate with JSON email and password (used by the web frontend)."""
    user = _authenticate_user(db, credentials.email, credentials.password)
    return _build_token_response(user)


@router.post(
    "/token",
    response_model=TokenResponse,
    dependencies=[Depends(enforce_auth_rate_limit)],
)
def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[Session, Depends(get_db)],
):
    """OAuth2 form-encoded login endpoint for Swagger UI Authorize flow."""
    user = _authenticate_user(db, form_data.username, form_data.password)
    return _build_token_response(user)


@router.get("/profile", response_model=UserResponse)
def profile(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Return the currently authenticated user's profile."""
    return current_user
