import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import ResumeBlock, ResumeBlockAssociation


class ResumeBlockRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Block CRUD ────────────────────────────────────────────────────────────

    async def create(self, block: ResumeBlock) -> ResumeBlock:
        self.db.add(block)
        await self.db.commit()
        await self.db.refresh(block)
        return block

    async def create_many(self, blocks: list[ResumeBlock]) -> list[ResumeBlock]:
        for block in blocks:
            self.db.add(block)
        await self.db.commit()
        for block in blocks:
            await self.db.refresh(block)
        return blocks

    async def get_by_id_for_user(self, block_id: uuid.UUID, user_id: str) -> ResumeBlock | None:
        result = await self.db.execute(
            select(ResumeBlock).where(
                ResumeBlock.id == block_id,
                ResumeBlock.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_for_user(self, user_id: str) -> list[ResumeBlock]:
        result = await self.db.execute(
            select(ResumeBlock)
            .where(ResumeBlock.user_id == user_id)
            .order_by(ResumeBlock.created_at.desc())
        )
        return list(result.scalars().all())

    async def update(self, block: ResumeBlock) -> ResumeBlock:
        await self.db.commit()
        await self.db.refresh(block)
        return block

    async def delete(self, block_id: uuid.UUID) -> None:
        await self.db.execute(delete(ResumeBlock).where(ResumeBlock.id == block_id))
        await self.db.commit()

    # ── Association queries ───────────────────────────────────────────────────

    async def count_associations(self, block_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(ResumeBlockAssociation).where(ResumeBlockAssociation.block_id == block_id)
        )
        return len(result.scalars().all())

    async def get_associations_for_resume(
        self, resume_id: uuid.UUID
    ) -> list[ResumeBlockAssociation]:
        result = await self.db.execute(
            select(ResumeBlockAssociation)
            .where(ResumeBlockAssociation.resume_id == resume_id)
            .order_by(ResumeBlockAssociation.position)
            .options(selectinload(ResumeBlockAssociation.block))
        )
        return list(result.scalars().all())

    async def get_association(
        self, resume_id: uuid.UUID, block_id: uuid.UUID
    ) -> ResumeBlockAssociation | None:
        result = await self.db.execute(
            select(ResumeBlockAssociation).where(
                ResumeBlockAssociation.resume_id == resume_id,
                ResumeBlockAssociation.block_id == block_id,
            )
        )
        return result.scalar_one_or_none()

    async def create_association(self, assoc: ResumeBlockAssociation) -> ResumeBlockAssociation:
        self.db.add(assoc)
        await self.db.commit()
        await self.db.refresh(assoc)
        return assoc

    async def create_associations(
        self, assocs: list[ResumeBlockAssociation]
    ) -> list[ResumeBlockAssociation]:
        for assoc in assocs:
            self.db.add(assoc)
        await self.db.commit()
        for assoc in assocs:
            await self.db.refresh(assoc)
        return assocs

    async def delete_association(self, resume_id: uuid.UUID, block_id: uuid.UUID) -> None:
        await self.db.execute(
            delete(ResumeBlockAssociation).where(
                ResumeBlockAssociation.resume_id == resume_id,
                ResumeBlockAssociation.block_id == block_id,
            )
        )
        await self.db.commit()

    async def bulk_update_positions(
        self, updates: list[tuple[uuid.UUID, uuid.UUID, int]]
    ) -> None:
        """Update positions for multiple (resume_id, block_id) pairs."""
        for resume_id, block_id, position in updates:
            result = await self.db.execute(
                select(ResumeBlockAssociation).where(
                    ResumeBlockAssociation.resume_id == resume_id,
                    ResumeBlockAssociation.block_id == block_id,
                )
            )
            assoc = result.scalar_one_or_none()
            if assoc:
                assoc.position = position
        await self.db.commit()
