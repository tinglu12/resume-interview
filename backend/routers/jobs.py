import uuid

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth import verify_clerk_token
from database import get_db
from schemas import JobOut, JobSummary
from services import JobService

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_title: str | None = Form(None),
    company: str | None = Form(None),
    job_description: str = Form(...),
    resume: UploadFile = File(...),
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    print(f"DEBUG content_type: {resume.content_type!r}")
    pdf_bytes = await resume.read()
    print(f"DEBUG pdf_bytes length: {len(pdf_bytes)}, header: {pdf_bytes[:5]}")
    return await JobService(db).create_job(
        user_id=user_id,
        job_title=job_title,
        company=company,
        job_description=job_description,
        resume_bytes=pdf_bytes,
        resume_content_type=resume.content_type,
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
