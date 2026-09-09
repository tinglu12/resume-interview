"""drop resume_blocks.source_resume_id and resumes.assembled_resume_id

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-09-09 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, Sequence[str], None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("resume_blocks_source_resume_id_fkey", "resume_blocks", type_="foreignkey")
    op.drop_column("resume_blocks", "source_resume_id")
    op.drop_constraint("fk_resumes_assembled_resume_id", "resumes", type_="foreignkey")
    op.drop_column("resumes", "assembled_resume_id")


def downgrade() -> None:
    op.add_column("resumes", sa.Column("assembled_resume_id", sa.UUID(), nullable=True))
    op.create_foreign_key(
        "fk_resumes_assembled_resume_id",
        "resumes", "resumes",
        ["assembled_resume_id"], ["id"],
        ondelete="SET NULL",
    )
    op.add_column("resume_blocks", sa.Column("source_resume_id", sa.UUID(), nullable=True))
    op.create_foreign_key(
        "resume_blocks_source_resume_id_fkey",
        "resume_blocks", "resumes",
        ["source_resume_id"], ["id"],
        ondelete="SET NULL",
    )
