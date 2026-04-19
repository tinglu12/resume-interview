from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from .resume import Resume
    from .resume_block import ResumeBlock


class ResumeBlockAssociation(Base):
    __tablename__ = "resume_block_associations"
    __table_args__ = (UniqueConstraint("resume_id", "block_id", name="uq_resume_block"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resume_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("resumes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    block_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("resume_blocks.id", ondelete="CASCADE"),
        nullable=False,
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    title_override: Mapped[str | None] = mapped_column(Text, nullable=True)

    resume: Mapped[Resume] = relationship("Resume", back_populates="block_associations")
    block: Mapped[ResumeBlock] = relationship("ResumeBlock", back_populates="associations")
