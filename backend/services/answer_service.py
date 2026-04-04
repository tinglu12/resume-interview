import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from models import Answer
from repositories import AnswerRepository, SessionRepository
from services.ai import AiService
from services.errors import ServiceError
from services.storage import StorageService
from services.transcription import TranscriptionService


class AnswerService:
    def __init__(
        self,
        db: AsyncSession,
        *,
        storage: StorageService | None = None,
        transcription: TranscriptionService | None = None,
        ai: AiService | None = None,
    ):
        self._sessions = SessionRepository(db)
        self._answers = AnswerRepository(db)
        self._storage = storage or StorageService()
        self._transcription = transcription or TranscriptionService()
        self._ai = ai or AiService()

    async def submit_answer(
        self,
        session_id: uuid.UUID,
        user_id: str,
        question_index: int,
        answer_text: str | None,
        audio_bytes: bytes | None,
    ) -> Answer:
        session = await self._sessions.get_with_job(session_id)
        if not session or session.job.user_id != user_id:
            raise ServiceError(404, "Session not found")

        job = session.job
        if question_index < 0 or question_index >= len(job.questions):
            raise ServiceError(400, "Invalid question index")

        audio_url: str | None = None
        if audio_bytes is not None:
            key = f"audio/{uuid.uuid4()}.webm"
            audio_url = self._storage.upload_bytes(audio_bytes, key, "audio/webm")
            final_text = await self._transcription.transcribe_audio(audio_bytes)
        elif answer_text:
            final_text = answer_text
        else:
            raise ServiceError(400, "Provide either answer_text or audio")

        question_item = job.questions[question_index]
        feedback = await self._ai.evaluate_answer(
            question=question_item["question"],
            job_description=job.job_description,
            answer_text=final_text,
        )

        answer = Answer(
            session_id=session_id,
            question_index=question_index,
            answer_text=final_text,
            audio_url=audio_url,
            feedback=feedback,
        )
        return await self._answers.create(answer)
