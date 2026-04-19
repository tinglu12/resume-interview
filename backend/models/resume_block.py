from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import TIMESTAMP, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from .resume_block_association import ResumeBlockAssociation


class ResumeBlock(Base):
    __tablename__ = "resume_blocks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    block_type: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    # work_experience | project | education | skills | summary | custom
    title: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[dict] = mapped_column(JSONB, nullable=False)
    # Which uploaded PDF this block was parsed from (nullable for manually created blocks)
    source_resume_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("resumes.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    associations: Mapped[list[ResumeBlockAssociation]] = relationship(
        "ResumeBlockAssociation", back_populates="block", cascade="all, delete-orphan"
    )
