from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_user
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
    prefix="/api/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    user_data: UserCreate,
    db: Annotated[Session, Depends(get_db)],
):
    existing_user = db.scalar(
        select(User).where(
            User.email == user_data.email.lower()
        )
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    user = User(
        name=user_data.name,
        email=user_data.email.lower(),
        password_hash=hash_password(user_data.password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    user_data: UserLogin,
    db: Annotated[Session, Depends(get_db)],
):
    user = db.scalar(
        select(User).where(
            User.email == user_data.email.lower()
        )
    )

    if user is None or not verify_password(
        user_data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        ),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.get(
    "/profile",
    response_model=UserResponse,
)
def profile(
    current_user: Annotated[User, Depends(get_current_user)],
):
    return current_user