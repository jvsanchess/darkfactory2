"""Create contents and pipeline jobs.

Revision ID: 0001
Revises:
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "contents",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("format", sa.String(length=80), nullable=False),
        sa.Column("duration", sa.String(length=12), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("stage", sa.String(length=60), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("source", sa.String(length=160), nullable=False),
        sa.Column("updated", sa.String(length=40), nullable=False),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_contents_stage", "contents", ["stage"])
    op.create_index("ix_contents_status", "contents", ["status"])

    op.create_table(
        "pipeline_jobs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("content_id", sa.Integer(), nullable=False),
        sa.Column("external_task_id", sa.String(length=80), nullable=True),
        sa.Column("task_name", sa.String(length=80), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("current_stage", sa.String(length=60), nullable=False),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["content_id"], ["contents.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("external_task_id"),
    )
    op.create_index("ix_pipeline_jobs_content_id", "pipeline_jobs", ["content_id"])
    op.create_index(
        "ix_pipeline_jobs_content_created",
        "pipeline_jobs",
        ["content_id", "created_at"],
    )
    op.create_index("ix_pipeline_jobs_status", "pipeline_jobs", ["status"])


def downgrade() -> None:
    op.drop_index("ix_pipeline_jobs_status", table_name="pipeline_jobs")
    op.drop_index("ix_pipeline_jobs_content_created", table_name="pipeline_jobs")
    op.drop_index("ix_pipeline_jobs_content_id", table_name="pipeline_jobs")
    op.drop_table("pipeline_jobs")
    op.drop_index("ix_contents_status", table_name="contents")
    op.drop_index("ix_contents_stage", table_name="contents")
    op.drop_table("contents")
