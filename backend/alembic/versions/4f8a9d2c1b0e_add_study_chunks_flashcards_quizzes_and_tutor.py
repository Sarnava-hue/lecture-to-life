"""add lecture chunks, flashcards, quizzes, tutor messages, and study logs

Revision ID: 4f8a9d2c1b0e
Revises: 9c2e4f1a8b7d
Create Date: 2026-11-27 03:35:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "4f8a9d2c1b0e"
down_revision: Union[str, Sequence[str], None] = "9c2e4f1a8b7d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create tables for RAG chunks, flashcards, quizzes, tutor messages, and analytics."""
    op.create_table(
        "lecture_chunks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("document_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("segment_id", sa.String(length=100), nullable=False),
        sa.Column("label", sa.String(length=255), nullable=False),
        sa.Column("reference", sa.String(length=255), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("embedding", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["document_id"],
            ["documents.id"],
            name=op.f("fk_lecture_chunks_document_id_documents"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_lecture_chunks_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_lecture_chunks")),
    )
    op.create_index(
        op.f("ix_lecture_chunks_document_id"),
        "lecture_chunks",
        ["document_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_lecture_chunks_id"), "lecture_chunks", ["id"], unique=False
    )
    op.create_index(
        op.f("ix_lecture_chunks_user_id"), "lecture_chunks", ["user_id"], unique=False
    )

    op.create_table(
        "flashcards",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("document_id", sa.Integer(), nullable=False),
        sa.Column("front", sa.Text(), nullable=False),
        sa.Column("back", sa.Text(), nullable=False),
        sa.Column("hint", sa.Text(), nullable=True),
        sa.Column(
            "mastery",
            sa.String(length=20),
            server_default="new",
            nullable=False,
        ),
        sa.Column(
            "ease_factor",
            sa.Float(),
            server_default="2.5",
            nullable=False,
        ),
        sa.Column(
            "interval_days",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
        sa.Column(
            "repetitions",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
        sa.Column("next_review_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "next_review_label",
            sa.String(length=50),
            server_default="New card",
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["document_id"],
            ["documents.id"],
            name=op.f("fk_flashcards_document_id_documents"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_flashcards_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_flashcards")),
    )
    op.create_index(
        op.f("ix_flashcards_document_id"), "flashcards", ["document_id"], unique=False
    )
    op.create_index(op.f("ix_flashcards_id"), "flashcards", ["id"], unique=False)
    op.create_index(
        op.f("ix_flashcards_user_id"), "flashcards", ["user_id"], unique=False
    )

    op.create_table(
        "quizzes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("document_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column(
            "difficulty",
            sa.String(length=20),
            server_default="Medium",
            nullable=False,
        ),
        sa.Column(
            "estimated_minutes",
            sa.Integer(),
            server_default="5",
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["document_id"],
            ["documents.id"],
            name=op.f("fk_quizzes_document_id_documents"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_quizzes_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_quizzes")),
    )
    op.create_index(
        op.f("ix_quizzes_document_id"), "quizzes", ["document_id"], unique=False
    )
    op.create_index(op.f("ix_quizzes_id"), "quizzes", ["id"], unique=False)
    op.create_index(op.f("ix_quizzes_user_id"), "quizzes", ["user_id"], unique=False)

    op.create_table(
        "quiz_questions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("quiz_id", sa.Integer(), nullable=False),
        sa.Column("question_index", sa.Integer(), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column(
            "options",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column("correct_index", sa.Integer(), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=False),
        sa.Column("source_ref", sa.String(length=255), nullable=False),
        sa.ForeignKeyConstraint(
            ["quiz_id"],
            ["quizzes.id"],
            name=op.f("fk_quiz_questions_quiz_id_quizzes"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_quiz_questions")),
    )
    op.create_index(
        op.f("ix_quiz_questions_id"), "quiz_questions", ["id"], unique=False
    )
    op.create_index(
        op.f("ix_quiz_questions_quiz_id"), "quiz_questions", ["quiz_id"], unique=False
    )

    op.create_table(
        "quiz_attempts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("quiz_id", sa.Integer(), nullable=False),
        sa.Column(
            "answers",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column("correct_count", sa.Integer(), nullable=False),
        sa.Column("total_questions", sa.Integer(), nullable=False),
        sa.Column("score_percent", sa.Integer(), nullable=False),
        sa.Column("elapsed_seconds", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["quiz_id"],
            ["quizzes.id"],
            name=op.f("fk_quiz_attempts_quiz_id_quizzes"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_quiz_attempts_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_quiz_attempts")),
    )
    op.create_index(
        op.f("ix_quiz_attempts_id"), "quiz_attempts", ["id"], unique=False
    )
    op.create_index(
        op.f("ix_quiz_attempts_quiz_id"), "quiz_attempts", ["quiz_id"], unique=False
    )
    op.create_index(
        op.f("ix_quiz_attempts_user_id"), "quiz_attempts", ["user_id"], unique=False
    )

    op.create_table(
        "tutor_messages",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("document_id", sa.Integer(), nullable=True),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "citations",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["document_id"],
            ["documents.id"],
            name=op.f("fk_tutor_messages_document_id_documents"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_tutor_messages_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_tutor_messages")),
    )
    op.create_index(
        op.f("ix_tutor_messages_document_id"),
        "tutor_messages",
        ["document_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_tutor_messages_id"), "tutor_messages", ["id"], unique=False
    )
    op.create_index(
        op.f("ix_tutor_messages_user_id"), "tutor_messages", ["user_id"], unique=False
    )

    op.create_table(
        "study_activity_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("document_id", sa.Integer(), nullable=True),
        sa.Column("activity_type", sa.String(length=40), nullable=False),
        sa.Column(
            "duration_seconds",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
        sa.Column(
            "cards_count",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["document_id"],
            ["documents.id"],
            name=op.f("fk_study_activity_logs_document_id_documents"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_study_activity_logs_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_study_activity_logs")),
    )
    op.create_index(
        op.f("ix_study_activity_logs_document_id"),
        "study_activity_logs",
        ["document_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_study_activity_logs_id"),
        "study_activity_logs",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_study_activity_logs_user_id"),
        "study_activity_logs",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    """Drop RAG, flashcard, quiz, tutor, and analytics tables."""
    for table_name in (
        "study_activity_logs",
        "tutor_messages",
        "quiz_attempts",
        "quiz_questions",
        "quizzes",
        "flashcards",
        "lecture_chunks",
    ):
        op.drop_table(table_name)
