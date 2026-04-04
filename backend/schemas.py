import uuid
from datetime import datetime

from pydantic import BaseModel


# ── Jobs ──────────────────────────────────────────────────────────────────────

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


# ── Sessions ──────────────────────────────────────────────────────────────────

class SessionOut(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Answers ───────────────────────────────────────────────────────────────────

class FeedbackOut(BaseModel):
    score: int
    strengths: str
    improvements: str
    example_answer: str


class AnswerOut(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    question_index: int
    answer_text: str
    audio_url: str | None
    feedback: FeedbackOut | None
    created_at: datetime

    model_config = {"from_attributes": True}


class SessionWithAnswers(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    created_at: datetime
    answers: list[AnswerOut]

    model_config = {"from_attributes": True}
