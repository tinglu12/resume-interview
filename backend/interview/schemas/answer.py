import uuid
from datetime import datetime

from pydantic import BaseModel


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
