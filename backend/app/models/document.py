from datetime import datetime, timezone
from typing import Any

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

JSONVariant = JSON().with_variant(JSONB(), "postgresql")


class Document(Base):
    """Uploaded lecture document or recording and its extracted study artifacts."""

    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="",
        server_default="",
    )

    subject: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        default="General",
        server_default="General",
    )

    filename: Mapped[str] = mapped_column(String(255), nullable=False)

    content_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    source_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pdf",
        server_default="pdf",
    )

    duration: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="—",
        server_default="—",
    )

    file_size: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    storage_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="processing",
        server_default="processing",
        nullable=False,
    )

    progress: Mapped[int] = mapped_column(
        Integer,
        default=0,
        server_default="0",
        nullable=False,
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    targets: Mapped[list[str]] = mapped_column(
        JSONVariant,
        default=list,
        nullable=False,
    )

    extracted_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    summary: Mapped[str] = mapped_column(
        Text,
        default="",
        server_default="",
        nullable=False,
    )

    key_takeaways: Mapped[list[str]] = mapped_column(
        JSONVariant,
        default=list,
        nullable=False,
    )

    segments: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONVariant,
        default=list,
        nullable=False,
    )

    concept_nodes: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONVariant,
        default=list,
        nullable=False,
    )

    concept_edges: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONVariant,
        default=list,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship(
        "User",
        back_populates="documents",
    )
