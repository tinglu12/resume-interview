import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from models import Job
from repositories import JobRepository
from schemas import JobSummary
from services.ai import AiService
from services.errors import ServiceError
from services.pdf import PdfService
from services.storage import StorageService


class JobService:
    def __init__(
        self,
        db: AsyncSession,
        *,
        pdf: PdfService | None = None,
        storage: StorageService | None = None,
        ai: AiService | None = None,
    ):
        self._jobs = JobRepository(db)
        self._pdf = pdf or PdfService()
        self._storage = storage or StorageService()
        self._ai = ai or AiService()

    async def create_job(
        self,
        *,
        user_id: str,
        job_title: str | None,
        company: str | None,
        job_description: str,
        resume_bytes: bytes,
        resume_content_type: str | None,
    ) -> Job:
        if resume_content_type not in ("application/pdf", "application/octet-stream"):
            raise ServiceError(400, "Resume must be a PDF file")

        if not resume_bytes.startswith(b"%PDF"):
            raise ServiceError(400, "File does not appear to be a valid PDF")

        key = f"resumes/{uuid.uuid4()}.pdf"
        resume_url = self._storage.upload_bytes(resume_bytes, key, "application/pdf")

        resume_text = self._pdf.extract_text(resume_bytes)
        if not resume_text.strip():
            try:
                page_images = self._pdf.pdf_pages_as_base64_images(resume_bytes)
            except Exception as e:
                print(f"DEBUG: image render failed: {e}")
                page_images = []
            if not page_images:
                raise ServiceError(
                    400,
                    "Could not read this PDF. Please try re-saving or exporting it as a new PDF and uploading again.",
                )
            resume_text = await self._ai.ocr_resume(page_images)
        if not resume_text.strip():
            raise ServiceError(400, "Could not extract text from the PDF")

        questions_raw = await self._ai.generate_questions(resume_text, job_description)

        job = Job(
            user_id=user_id,
            job_title=job_title,
            company=company,
            job_description=job_description,
            resume_url=resume_url,
            resume_text=resume_text,
            questions=questions_raw,
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
