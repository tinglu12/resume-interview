import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from auth import verify_clerk_token
from database import get_db
from models import Job, Session as InterviewSession
from schemas import SessionOut, SessionWithAnswers

router = APIRouter(tags=["sessions"])


@router.post("/jobs/{job_id}/sessions", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
async def create_session(
    job_id: uuid.UUID,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Job).where(Job.id == job_id, Job.user_id == user_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    session = InterviewSession(job_id=job_id)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("/jobs/{job_id}/sessions", response_model=list[SessionOut])
async def list_sessions(
    job_id: uuid.UUID,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Job).where(Job.id == job_id, Job.user_id == user_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Job not found")

    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.job_id == job_id)
        .order_by(InterviewSession.created_at.desc())
    )
    return result.scalars().all()


@router.get("/sessions/{session_id}", response_model=SessionWithAnswers)
async def get_session(
    session_id: uuid.UUID,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(InterviewSession)
        .options(selectinload(InterviewSession.job), selectinload(InterviewSession.answers))
        .where(InterviewSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session or session.job.user_id != user_id:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
