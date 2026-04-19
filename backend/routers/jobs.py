import uuid

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from auth import verify_clerk_token
from database import get_db
from schemas import JobOut, JobSummary
from services import JobService, ServiceError

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_description: str = Form(...),
    user_id: str = Depends(verify_clerk_token),
    job_title: str | None = Form(default=None),
    company: str | None = Form(default=None),
    resume: UploadFile | None = File(default=None),
    resume_id: uuid.UUID | None = Form(default=None),
    save_resume: bool = Form(default=True),
    db: AsyncSession = Depends(get_db),
):
    if resume_id and resume:
        raise ServiceError(400, "Cannot provide both a resume file and a resume_id")
    if not resume_id and not resume:
        raise ServiceError(400, "Either a resume file or a resume_id is required")

    resume_bytes: bytes | None = None
    resume_content_type: str | None = None
    resume_filename: str | None = None

    if resume:
        resume_bytes = await resume.read()
        resume_content_type = resume.content_type
        resume_filename = resume.filename

    return await JobService(db).create_job(
        user_id=user_id,
        job_title=job_title,
        company=company,
        job_description=job_description,
        resume_bytes=resume_bytes,
        resume_content_type=resume_content_type,
        resume_filename=resume_filename,
        save_resume=save_resume,
        resume_id=resume_id,
    )


@router.get("", response_model=list[JobSummary])
async def list_jobs(
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    return await JobService(db).list_jobs(user_id)


@router.get("/{job_id}", response_model=JobOut)
async def get_job(
    job_id: uuid.UUID,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    return await JobService(db).get_job(job_id, user_id)
