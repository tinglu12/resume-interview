import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from models import Session
from repositories import JobRepository, SessionRepository
from services.errors import ServiceError


class SessionService:
    def __init__(self, db: AsyncSession):
        self._jobs = JobRepository(db)
        self._sessions = SessionRepository(db)

    async def create_session(self, job_id: uuid.UUID, user_id: str) -> Session:
        if not await self._jobs.get_by_id_for_user(job_id, user_id):
            raise ServiceError(404, "Job not found")
        return await self._sessions.create(job_id)

    async def list_sessions(self, job_id: uuid.UUID, user_id: str) -> list[Session]:
        if not await self._jobs.get_by_id_for_user(job_id, user_id):
            raise ServiceError(404, "Job not found")
        return await self._sessions.list_for_job(job_id)

    async def get_session(self, session_id: uuid.UUID, user_id: str) -> Session:
        session = await self._sessions.get_with_job_and_answers(session_id)
        if not session or session.job.user_id != user_id:
            raise ServiceError(404, "Session not found")
        return session
