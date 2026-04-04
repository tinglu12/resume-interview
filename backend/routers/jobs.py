import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from auth import verify_clerk_token
from database import get_db
from models import Job, Session as InterviewSession
from schemas import JobOut, JobSummary
from services import ai, pdf, storage

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

    if resume.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="Resume must be a PDF file")

    pdf_bytes = await resume.read()
    print(f"DEBUG pdf_bytes length: {len(pdf_bytes)}, header: {pdf_bytes[:5]}")

    # Verify it's actually a PDF
    if not pdf_bytes.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="File does not appear to be a valid PDF")

    # Upload PDF to R2
    key = f"resumes/{uuid.uuid4()}.pdf"
    resume_url = storage.upload_bytes(pdf_bytes, key, "application/pdf")

    # Extract text — fall back to GPT-4o Vision OCR for scanned PDFs
    resume_text = pdf.extract_text(pdf_bytes)
    if not resume_text.strip():
        print("DEBUG: text extraction empty, falling back to GPT-4o Vision OCR")
        try:
            page_images = pdf.pdf_pages_as_base64_images(pdf_bytes)
        except Exception as e:
            print(f"DEBUG: image render failed: {e}")
            page_images = []
        if not page_images:
            raise HTTPException(status_code=400, detail="Could not read this PDF. Please try re-saving or exporting it as a new PDF and uploading again.")
        resume_text = await ai.ocr_resume(page_images)
    if not resume_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from the PDF")

    # Generate questions via GPT-4o
    questions_raw = await ai.generate_questions(resume_text, job_description)

    job = Job(
        user_id=user_id,
        job_title=job_title,
        company=company,
        job_description=job_description,
        resume_url=resume_url,
        resume_text=resume_text,
        questions=questions_raw,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job


@router.get("", response_model=list[JobSummary])
async def list_jobs(
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(
            Job,
            func.count(InterviewSession.id).label("session_count"),
        )
        .outerjoin(InterviewSession, InterviewSession.job_id == Job.id)
        .where(Job.user_id == user_id)
        .group_by(Job.id)
        .order_by(Job.created_at.desc())
    )
    rows = result.all()
    summaries = []
    for job, session_count in rows:
        s = JobSummary.model_validate(job)
        s.session_count = session_count
        summaries.append(s)
    return summaries


@router.get("/{job_id}", response_model=JobOut)
async def get_job(
    job_id: uuid.UUID,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Job).where(Job.id == job_id, Job.user_id == user_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
