from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


from app.models import User, Document

__all__ = [
    "Base",
    "User",
    "Document",
]