from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import TIMESTAMP, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from .resume_block_association import ResumeBlockAssociation


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    filename: Mapped[str] = mapped_column(Text, nullable=False)
    resume_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    resume_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    # "upload" = raw PDF | "builder" = assembled from blocks
    resume_type: Mapped[str] = mapped_column(Text, nullable=False, server_default="upload")
    # Human-readable name for assembled resumes (e.g. "Backend SWE Resume")
    display_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    # For uploaded resumes: FK to the assembled resume auto-created during import
    assembled_resume_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("resumes.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Ordered associations to blocks (only populated for resume_type="builder")
    block_associations: Mapped[list[ResumeBlockAssociation]] = relationship(
        "ResumeBlockAssociation",
        back_populates="resume",
        order_by="ResumeBlockAssociation.position",
        cascade="all, delete-orphan",
    )
