"""align lectures schema and indexes

Revision ID: 9c2e4f1a8b7d
Revises: 541c20a9303c
Create Date: 2026-11-27 03:05:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "9c2e4f1a8b7d"
down_revision: Union[str, Sequence[str], None] = "541c20a9303c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Align users and documents tables with v1 frontend lecture contracts."""
    op.alter_column(
        "users",
        "is_active",
        existing_type=sa.Boolean(),
        server_default=sa.text("true"),
        existing_nullable=False,
    )
    op.alter_column(
        "users",
        "created_at",
        existing_type=postgresql.TIMESTAMP(),
        type_=sa.DateTime(timezone=True),
        server_default=sa.text("now()"),
        existing_nullable=False,
    )

    op.add_column(
        "documents",
        sa.Column("title", sa.String(length=255), nullable=False, server_default=""),
    )
    op.add_column(
        "documents",
        sa.Column(
            "subject",
            sa.String(length=150),
            nullable=False,
            server_default="General",
        ),
    )
    op.add_column(
        "documents",
        sa.Column(
            "source_type",
            sa.String(length=20),
            nullable=False,
            server_default="pdf",
        ),
    )
    op.add_column(
        "documents",
        sa.Column(
            "duration",
            sa.String(length=50),
            nullable=False,
            server_default="—",
        ),
    )
    op.add_column(
        "documents",
        sa.Column(
            "progress",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )
    op.add_column(
        "documents",
        sa.Column("error_message", sa.Text(), nullable=True),
    )
    op.add_column(
        "documents",
        sa.Column(
            "targets",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    op.add_column(
        "documents",
        sa.Column("extracted_text", sa.Text(), nullable=True),
    )
    op.add_column(
        "documents",
        sa.Column("summary", sa.Text(), nullable=False, server_default=""),
    )
    op.add_column(
        "documents",
        sa.Column(
            "key_takeaways",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    op.add_column(
        "documents",
        sa.Column(
            "segments",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    op.add_column(
        "documents",
        sa.Column(
            "concept_nodes",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    op.add_column(
        "documents",
        sa.Column(
            "concept_edges",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    op.add_column(
        "documents",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    op.alter_column(
        "documents",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        server_default=sa.text("now()"),
        existing_nullable=False,
    )
    op.alter_column(
        "documents",
        "status",
        existing_type=sa.String(length=50),
        server_default="processing",
        existing_nullable=False,
    )

    # Backfill legacy rows so they display cleanly in the v1 lecture API.
    op.execute(
        sa.text(
            """
            UPDATE documents
            SET title = CASE WHEN title = '' THEN filename ELSE title END,
                status = CASE WHEN status = 'uploaded' THEN 'ready' ELSE status END,
                progress = CASE WHEN status = 'uploaded' THEN 100 ELSE progress END
            """
        )
    )

    op.create_index("ix_documents_user_id", "documents", ["user_id"], unique=False)


def downgrade() -> None:
    """Revert lecture metadata columns and index."""
    op.drop_index("ix_documents_user_id", table_name="documents")

    op.alter_column(
        "documents",
        "status",
        existing_type=sa.String(length=50),
        server_default=None,
        existing_nullable=False,
    )
    op.alter_column(
        "documents",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        server_default=None,
        existing_nullable=False,
    )

    for col in (
        "updated_at",
        "concept_edges",
        "concept_nodes",
        "segments",
        "key_takeaways",
        "summary",
        "extracted_text",
        "targets",
        "error_message",
        "progress",
        "duration",
        "source_type",
        "subject",
        "title",
    ):
        op.drop_column("documents", col)

    op.alter_column(
        "users",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        type_=postgresql.TIMESTAMP(),
        server_default=None,
        existing_nullable=False,
    )
    op.alter_column(
        "users",
        "is_active",
        existing_type=sa.Boolean(),
        server_default=None,
        existing_nullable=False,
    )
