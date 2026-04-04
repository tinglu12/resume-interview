import uuid

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth import verify_clerk_token
from database import get_db
from schemas import AnswerOut
from services import AnswerService

router = APIRouter(prefix="/sessions", tags=["answers"])


@router.post("/{session_id}/answers", response_model=AnswerOut, status_code=status.HTTP_201_CREATED)
async def submit_answer(
    session_id: uuid.UUID,
    question_index: int = Form(...),
    answer_text: str | None = Form(None),
    audio: UploadFile | None = File(None),
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    audio_bytes = await audio.read() if audio is not None else None
    return await AnswerService(db).submit_answer(
        session_id=session_id,
        user_id=user_id,
        question_index=question_index,
        answer_text=answer_text,
        audio_bytes=audio_bytes,
    )
