import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import Session


class SessionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, job_id: uuid.UUID) -> Session:
        session = Session(job_id=job_id)
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session

    async def list_for_job(self, job_id: uuid.UUID) -> list[Session]:
        result = await self.db.execute(
            select(Session)
            .where(Session.job_id == job_id)
            .order_by(Session.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_with_job(self, session_id: uuid.UUID) -> Session | None:
        result = await self.db.execute(
            select(Session).options(selectinload(Session.job)).where(Session.id == session_id)
        )
        return result.scalar_one_or_none()

    async def get_with_job_and_answers(self, session_id: uuid.UUID) -> Session | None:
        result = await self.db.execute(
            select(Session)
            .options(selectinload(Session.job), selectinload(Session.answers))
            .where(Session.id == session_id)
        )
        return result.scalar_one_or_none()
