import uuid
from datetime import datetime
from pydantic import BaseModel


class ResumeOut(BaseModel):
    id: uuid.UUID
    filename: str
    resume_url: str | None = None
    resume_type: str = "upload"
    display_name: str | None = None
    assembled_resume_id: uuid.UUID | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ResumeCreate(BaseModel):
    filename: str
    resume_bytes: bytes
    content_type: str
