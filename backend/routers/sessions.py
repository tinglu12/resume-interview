import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth import verify_clerk_token
from database import get_db
from schemas import SessionOut, SessionWithAnswers
from services import SessionService

router = APIRouter(tags=["sessions"])


@router.post("/jobs/{job_id}/sessions", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
async def create_session(
    job_id: uuid.UUID,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    return await SessionService(db).create_session(job_id, user_id)


@router.get("/jobs/{job_id}/sessions", response_model=list[SessionOut])
async def list_sessions(
    job_id: uuid.UUID,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    return await SessionService(db).list_sessions(job_id, user_id)


@router.get("/sessions/{session_id}", response_model=SessionWithAnswers)
async def get_session(
    session_id: uuid.UUID,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    return await SessionService(db).get_session(session_id, user_id)
