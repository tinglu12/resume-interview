import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import ResumeBlockAssociation, ResumeSection


class ResumeSectionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, section: ResumeSection) -> ResumeSection:
        self.db.add(section)
        await self.db.commit()
        await self.db.refresh(section)
        return section

    async def get_by_id(self, section_id: uuid.UUID, resume_id: uuid.UUID) -> ResumeSection | None:
        result = await self.db.execute(
            select(ResumeSection).where(
                ResumeSection.id == section_id,
                ResumeSection.resume_id == resume_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_sections_for_resume(self, resume_id: uuid.UUID) -> list[ResumeSection]:
        result = await self.db.execute(
            select(ResumeSection)
            .where(ResumeSection.resume_id == resume_id)
            .order_by(ResumeSection.position)
            .options(
                selectinload(ResumeSection.block_associations).selectinload(
                    ResumeBlockAssociation.block
                )
            )
        )
        return list(result.scalars().all())

    async def update(self, section: ResumeSection) -> ResumeSection:
        await self.db.commit()
        await self.db.refresh(section)
        return section

    async def delete(self, section_id: uuid.UUID) -> None:
        await self.db.execute(delete(ResumeSection).where(ResumeSection.id == section_id))
        await self.db.commit()

    async def bulk_update_positions(self, updates: list[tuple[uuid.UUID, int]]) -> None:
        for section_id, position in updates:
            result = await self.db.execute(
                select(ResumeSection).where(ResumeSection.id == section_id)
            )
            section = result.scalar_one_or_none()
            if section:
                section.position = position
        await self.db.commit()

    async def get_association_in_section(
        self, section_id: uuid.UUID, block_id: uuid.UUID
    ) -> ResumeBlockAssociation | None:
        result = await self.db.execute(
            select(ResumeBlockAssociation).where(
                ResumeBlockAssociation.section_id == section_id,
                ResumeBlockAssociation.block_id == block_id,
            )
        )
        return result.scalar_one_or_none()

    async def create_association(self, assoc: ResumeBlockAssociation) -> ResumeBlockAssociation:
        self.db.add(assoc)
        await self.db.commit()
        await self.db.refresh(assoc)
        return assoc

    async def delete_association(self, section_id: uuid.UUID, block_id: uuid.UUID) -> None:
        await self.db.execute(
            delete(ResumeBlockAssociation).where(
                ResumeBlockAssociation.section_id == section_id,
                ResumeBlockAssociation.block_id == block_id,
            )
        )
        await self.db.commit()

    async def bulk_update_section_block_positions(
        self, section_id: uuid.UUID, updates: list[tuple[uuid.UUID, int]]
    ) -> None:
        for block_id, position in updates:
            result = await self.db.execute(
                select(ResumeBlockAssociation).where(
                    ResumeBlockAssociation.section_id == section_id,
                    ResumeBlockAssociation.block_id == block_id,
                )
            )
            assoc = result.scalar_one_or_none()
            if assoc:
                assoc.position = position
        await self.db.commit()
