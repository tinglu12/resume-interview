import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from models import Resume
from repositories import ResumeRepository
from services.ai import AiService
from services.errors import ServiceError
from services.pdf import PdfService
from services.storage import StorageService


class ResumeService:
    def __init__(
        self,
        db: AsyncSession,
        *,
        storage: StorageService | None = None,
        ai: AiService | None = None,
        pdf: PdfService | None = None,
    ):
        self._resumes = ResumeRepository(db)
        self._storage = storage or StorageService()
        self._ai = ai or AiService()
        self._pdf = pdf or PdfService()

    async def list_resumes(self, user_id: str) -> list[Resume]:
        return await self._resumes.list_for_user(user_id)

    async def get_resume(self, resume_id: uuid.UUID, user_id: str) -> Resume:
        resume = await self._resumes.get_by_id_for_user(resume_id, user_id)
        if not resume:
            raise ServiceError(404, "Resume not found")
        return resume

    async def delete_resume(self, resume_id: uuid.UUID, user_id: str) -> None:
        resume = await self._resumes.get_by_id_for_user(resume_id, user_id)
        if not resume:
            raise ServiceError(404, "Resume not found")
        await self._resumes.delete(resume_id)

    async def upload_resume(
        self,
        *,
        user_id: str,
        filename: str | None,
        resume_bytes: bytes | None,
        content_type: str | None,
        save_resume: bool = True,
    ) -> Resume:
        if not filename or not filename.strip():
            raise ServiceError(400, "Resume filename is required")
        if not resume_bytes:
            raise ServiceError(400, "Resume bytes are required")
        if not content_type or not str(content_type).strip():
            raise ServiceError(400, "Resume content type is required")

        resume_url = await self.upload_resume_bytes(resume_bytes=resume_bytes, content_type=content_type)
        resume_text = await self.extract_resume_text(resume_bytes=resume_bytes)

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

        resume = Resume(
            user_id=user_id,
            filename=filename,
            resume_url=resume_url,
            resume_text=resume_text,
            resume_type="upload",
        )
        if save_resume:
            return await self._resumes.create(resume)
        return resume

    async def upload_resume_bytes(self, *, resume_bytes: bytes, content_type: str) -> str:
        if content_type not in ("application/pdf", "application/octet-stream"):
            raise ServiceError(400, "Resume must be a PDF file")
        if not resume_bytes:
            raise ServiceError(400, "Resume bytes are required")
        if not resume_bytes.startswith(b"%PDF"):
            raise ServiceError(400, "File does not appear to be a valid PDF")

        key = f"resumes/{uuid.uuid4()}.pdf"
        return self._storage.upload_bytes(resume_bytes, key, "application/pdf")

    async def extract_resume_text(self, *, resume_bytes: bytes) -> str:
        if not resume_bytes:
            raise ServiceError(400, "Resume bytes are required")
        if not resume_bytes.startswith(b"%PDF"):
            raise ServiceError(400, "File does not appear to be a valid PDF")
        return self._pdf.extract_text(resume_bytes)
