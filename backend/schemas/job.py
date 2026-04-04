import uuid
from datetime import datetime

from pydantic import BaseModel


class QuestionItem(BaseModel):
    question: str
    resume_excerpt: str


class JobCreate(BaseModel):
    job_title: str | None = None
    company: str | None = None
    job_description: str


class JobOut(BaseModel):
    id: uuid.UUID
    job_title: str | None
    company: str | None
    job_description: str
    resume_url: str
    resume_text: str
    questions: list[QuestionItem]
    created_at: datetime

    model_config = {"from_attributes": True}


class JobSummary(BaseModel):
    id: uuid.UUID
    job_title: str | None
    company: str | None
    created_at: datetime
    session_count: int = 0

    model_config = {"from_attributes": True}
