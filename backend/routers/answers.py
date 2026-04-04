import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from auth import verify_clerk_token
from database import get_db
from models import Answer, Session as InterviewSession
from schemas import AnswerOut
from services import ai, storage, transcription

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
    # Load session + job (for ownership check and question data)
    result = await db.execute(
        select(InterviewSession)
        .options(selectinload(InterviewSession.job))
        .where(InterviewSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session or session.job.user_id != user_id:
        raise HTTPException(status_code=404, detail="Session not found")

    job = session.job
    if question_index < 0 or question_index >= len(job.questions):
        raise HTTPException(status_code=400, detail="Invalid question index")

    audio_url: str | None = None
    final_text: str

    if audio is not None:
        audio_bytes = await audio.read()
        # Upload audio to R2
        key = f"audio/{uuid.uuid4()}.webm"
        audio_url = storage.upload_bytes(audio_bytes, key, "audio/webm")
        # Transcribe
        final_text = await transcription.transcribe_audio(audio_bytes)
    elif answer_text:
        final_text = answer_text
    else:
        raise HTTPException(status_code=400, detail="Provide either answer_text or audio")

    # Get feedback from GPT-4o
    question_item = job.questions[question_index]
    feedback = await ai.evaluate_answer(
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
    db.add(answer)
    await db.commit()
    await db.refresh(answer)
    return answer
