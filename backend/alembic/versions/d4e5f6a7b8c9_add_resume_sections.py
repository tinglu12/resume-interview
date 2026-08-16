"""add resume sections

Revision ID: d4e5f6a7b8c9
Revises: c3f1a2b4d5e6
Create Date: 2026-04-19 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, Sequence[str], None] = "c3f1a2b4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "resume_sections",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("resume_id", sa.UUID(), nullable=False),
        sa.Column("section_type", sa.Text(), nullable=False),
        sa.Column("display_name", sa.Text(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["resume_id"], ["resumes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_resume_sections_resume_id", "resume_sections", ["resume_id"])

    op.add_column(
        "resume_block_associations",
        sa.Column("section_id", sa.UUID(), nullable=True),
    )
    op.create_foreign_key(
        "fk_rba_section_id",
        "resume_block_associations", "resume_sections",
        ["section_id"], ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_rba_section_id", "resume_block_associations", ["section_id"])


def downgrade() -> None:
    op.drop_index("ix_rba_section_id", table_name="resume_block_associations")
    op.drop_constraint("fk_rba_section_id", "resume_block_associations", type_="foreignkey")
    op.drop_column("resume_block_associations", "section_id")

    op.drop_index("ix_resume_sections_resume_id", table_name="resume_sections")
    op.drop_table("resume_sections")
