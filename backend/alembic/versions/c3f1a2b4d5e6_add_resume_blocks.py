"""add resume blocks

Revision ID: c3f1a2b4d5e6
Revises: ba1cac34bb1f
Create Date: 2026-04-15 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "c3f1a2b4d5e6"
down_revision: Union[str, Sequence[str], None] = "ba1cac34bb1f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns to resumes table
    op.add_column("resumes", sa.Column("resume_type", sa.Text(), nullable=False, server_default="upload"))
    op.add_column("resumes", sa.Column("display_name", sa.Text(), nullable=True))
    op.add_column("resumes", sa.Column("assembled_resume_id", sa.UUID(), nullable=True))
    op.create_foreign_key(
        "fk_resumes_assembled_resume_id",
        "resumes", "resumes",
        ["assembled_resume_id"], ["id"],
        ondelete="SET NULL",
    )

    # Make resume_url and resume_text nullable (builder resumes may not have these initially)
    op.alter_column("resumes", "resume_url", existing_type=sa.Text(), nullable=True)
    op.alter_column("resumes", "resume_text", existing_type=sa.Text(), nullable=True)

    # Create resume_blocks table
    op.create_table(
        "resume_blocks",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.Text(), nullable=False),
        sa.Column("block_type", sa.Text(), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("content", JSONB(), nullable=False),
        sa.Column("source_resume_id", sa.UUID(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["source_resume_id"], ["resumes.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_resume_blocks_user_id", "resume_blocks", ["user_id"])
    op.create_index("ix_resume_blocks_block_type", "resume_blocks", ["block_type"])

    # Create resume_block_associations table
    op.create_table(
        "resume_block_associations",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("resume_id", sa.UUID(), nullable=False),
        sa.Column("block_id", sa.UUID(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("title_override", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["block_id"], ["resume_blocks.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["resume_id"], ["resumes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("resume_id", "block_id", name="uq_resume_block"),
    )
    op.create_index("ix_resume_block_associations_resume_id", "resume_block_associations", ["resume_id"])


def downgrade() -> None:
    op.drop_index("ix_resume_block_associations_resume_id", table_name="resume_block_associations")
    op.drop_table("resume_block_associations")
    op.drop_index("ix_resume_blocks_block_type", table_name="resume_blocks")
    op.drop_index("ix_resume_blocks_user_id", table_name="resume_blocks")
    op.drop_table("resume_blocks")
    op.drop_constraint("fk_resumes_assembled_resume_id", "resumes", type_="foreignkey")
    op.drop_column("resumes", "assembled_resume_id")
    op.drop_column("resumes", "display_name")
    op.drop_column("resumes", "resume_type")
    op.alter_column("resumes", "resume_url", existing_type=sa.Text(), nullable=False)
    op.alter_column("resumes", "resume_text", existing_type=sa.Text(), nullable=False)
