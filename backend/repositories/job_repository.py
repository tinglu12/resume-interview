import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Job, Session


class JobRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, job: Job) -> Job:
        self.db.add(job)
        await self.db.commit()
        await self.db.refresh(job)
        return job

    async def list_with_session_counts(self, user_id: str) -> list[tuple[Job, int]]:
        result = await self.db.execute(
            select(Job, func.count(Session.id).label("session_count"))
            .outerjoin(Session, Session.job_id == Job.id)
            .where(Job.user_id == user_id)
            .group_by(Job.id)
            .order_by(Job.created_at.desc())
        )
        rows = result.all()
        return [(job, int(count)) for job, count in rows]

    async def get_by_id_for_user(self, job_id: uuid.UUID, user_id: str) -> Job | None:
        result = await self.db.execute(select(Job).where(Job.id == job_id, Job.user_id == user_id))
        return result.scalar_one_or_none()
