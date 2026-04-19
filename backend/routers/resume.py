import uuid

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth import verify_clerk_token
from database import get_db
from schemas import ResumeOut
from services import ResumeService

router = APIRouter(prefix="/resumes", tags=["resumes"])


@router.post("", response_model=ResumeOut, status_code=status.HTTP_201_CREATED)
async def create_resume(
    resume: UploadFile = File(...),
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> ResumeOut:
    resume_bytes = await resume.read()
    return await ResumeService(db).upload_resume(
        user_id=user_id,
        filename=resume.filename,
        resume_bytes=resume_bytes,
        content_type=resume.content_type,
    )


@router.get("/{resume_id}", response_model=ResumeOut)
async def get_resume(
    resume_id: uuid.UUID,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> ResumeOut:
    return await ResumeService(db).get_resume(resume_id, user_id)


@router.get("", response_model=list[ResumeOut])
async def list_resumes(
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> list[ResumeOut]:
    return await ResumeService(db).list_resumes(user_id)


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(
    resume_id: uuid.UUID,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> None:
    await ResumeService(db).delete_resume(resume_id, user_id)
