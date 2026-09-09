import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth import verify_clerk_token
from database import get_db
from schemas import ResumeOut
from services import ResumeService

router = APIRouter(prefix="/resumes", tags=["resumes"])


@router.get("/{resume_id}", response_model=ResumeOut)
async def get_resume(
    resume_id: uuid.UUID,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> ResumeOut:
    resume = await ResumeService(db).get_resume(resume_id, user_id)
    return ResumeOut.model_validate(resume)


@router.get("", response_model=list[ResumeOut])
async def list_resumes(
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> list[ResumeOut]:
    resumes = await ResumeService(db).list_resumes(user_id)
    return [ResumeOut.model_validate(r) for r in resumes]


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(
    resume_id: uuid.UUID,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> None:
    await ResumeService(db).delete_resume(resume_id, user_id)
