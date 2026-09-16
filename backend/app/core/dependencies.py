from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import session
from app.core.security import decode_access_token
from app.db.dependencies import get_db
from app.models.user import User

oauth2_scheme=OAuth2PasswordBearer(
    tokenUrl="/api/auth/login"
)

def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[session, Depends(get_db)],
)->User:
    credentials_exception=HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload=decode_access_token(token)

    if payload is None:
        raise credentials_exception

    user_id=payload.get("sub")

    if user_id is None:
        raise credentials_exception

    try:
        user_id=int(user_id)
    except(TypeError, ValueError):
        raise credentials_exception

    user=db.get(User, user_id)

    if user is None or not user.is_active:
        raise credentials_exception

    return user