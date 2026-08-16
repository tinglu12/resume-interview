import uuid
from datetime import datetime

from pydantic import BaseModel

from .answer import AnswerOut


class SessionOut(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class SessionWithAnswers(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    created_at: datetime
    answers: list[AnswerOut]

    model_config = {"from_attributes": True}
