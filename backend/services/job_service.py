import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from models import Job
from repositories import JobRepository
from schemas import JobSummary
from services.ai import AiService
from services.errors import ServiceError
from services.pdf import PdfService
from services.resume_block_service import ResumeBlockService
from services.resume_service import ResumeService
from services.storage import StorageService


class JobService:
    def __init__(
        self,
        db: AsyncSession,
        *,
        pdf: PdfService | None = None,
        storage: StorageService | None = None,
        ai: AiService | None = None,
        resume_service: ResumeService | None = None,
    ):
        self._db = db
        self._jobs = JobRepository(db)
        self._pdf = pdf or PdfService()
        self._storage = storage or StorageService()
        self._ai = ai or AiService()
        self._resume_service = resume_service or ResumeService(
            db, storage=self._storage, pdf=self._pdf, ai=self._ai
        )

    async def create_job(
        self,
        *,
        user_id: str,
        job_title: str | None,
        company: str | None,
        job_description: str,
        resume_bytes: bytes | None,
        resume_content_type: str | None,
        resume_filename: str | None,
        save_resume: bool = True,
        resume_id: uuid.UUID | None = None,
    ) -> Job:
        if resume_id:
            resume = await self._resume_service.get_resume(resume_id, user_id)
            job_resume_id = resume.id

            # For builder-type resumes, generate text from blocks
            if resume.resume_type == "builder":
                block_svc = ResumeBlockService(self._db)
                resume_text = await block_svc.get_resume_text_for_assembled(resume_id, user_id)
                resume_url = resume.resume_url or ""
            else:
                resume_text = resume.resume_text or ""
                resume_url = resume.resume_url or ""

            if not resume_text.strip():
                raise ServiceError(400, "Selected resume has no content to generate questions from")
        else:
            resume = await self._resume_service.upload_resume(
                user_id=user_id,
                filename=resume_filename,
                resume_bytes=resume_bytes,
                content_type=resume_content_type,
                save_resume=save_resume,
            )
            job_resume_id = resume.id if save_resume else None
            resume_text = resume.resume_text or ""
            resume_url = resume.resume_url or ""

        questions_raw = await self._ai.generate_questions(resume_text, job_description)

        job = Job(
            user_id=user_id,
            job_title=job_title,
            company=company,
            job_description=job_description,
            resume_url=resume_url,
            resume_text=resume_text,
            questions=questions_raw,
            resume_id=job_resume_id,
        )
        return await self._jobs.create(job)

    async def list_jobs(self, user_id: str) -> list[JobSummary]:
        rows = await self._jobs.list_with_session_counts(user_id)
        summaries: list[JobSummary] = []
        for job, session_count in rows:
            s = JobSummary.model_validate(job)
            s.session_count = session_count
            summaries.append(s)
        return summaries

    async def get_job(self, job_id: uuid.UUID, user_id: str) -> Job:
        job = await self._jobs.get_by_id_for_user(job_id, user_id)
        if not job:
            raise ServiceError(404, "Job not found")
        return job
