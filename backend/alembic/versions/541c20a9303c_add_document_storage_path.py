"""add document storage path

Revision ID: 541c20a9303c
Revises: d1bafd458d05
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "541c20a9303c"
down_revision: Union[str, Sequence[str], None] = "d1bafd458d05"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add the column temporarily as nullable.
    op.add_column(
        "documents",
        sa.Column(
            "storage_path",
            sa.String(length=500),
            nullable=True,
        ),
    )

    # 2. Give existing records a placeholder path.
    op.execute(
        sa.text(
            """
            UPDATE documents
            SET storage_path = 'legacy/unknown'
            WHERE storage_path IS NULL
            """
        )
    )

    # 3. Make the column mandatory for future records.
    op.alter_column(
        "documents",
        "storage_path",
        existing_type=sa.String(length=500),
        nullable=False,
    )


def downgrade() -> None:
    op.drop_column("documents", "storage_path")