import uuid
from datetime import datetime

from pydantic import BaseModel


# ── Per-type content schemas ──────────────────────────────────────────────────

class WorkExperienceContent(BaseModel):
    company: str
    role: str
    location: str = ""
    start_date: str = ""
    end_date: str = ""
    is_current: bool = False
    bullets: list[str] = []
    technologies: list[str] = []
    notes: str = ""


class ProjectContent(BaseModel):
    name: str
    url: str = ""
    start_date: str = ""
    end_date: str = ""
    is_current: bool = False
    description: str = ""
    bullets: list[str] = []
    technologies: list[str] = []
    notes: str = ""


class EducationContent(BaseModel):
    institution: str
    degree: str = ""
    field_of_study: str = ""
    location: str = ""
    start_date: str = ""
    end_date: str = ""
    gpa: str = ""
    relevant_courses: list[str] = []
    honors: list[str] = []
    notes: str = ""


class SkillGroup(BaseModel):
    label: str
    items: list[str]


class SkillsContent(BaseModel):
    groups: list[SkillGroup] = []
    notes: str = ""


class SummaryContent(BaseModel):
    text: str
    notes: str = ""


class CustomContent(BaseModel):
    heading: str
    body: str
    notes: str = ""


class PersonalInfoContent(BaseModel):
    full_name: str = ""
    email: str = ""
    phone: str = ""
    linkedin: str = ""
    github: str = ""
    website: str = ""
    location: str = ""
    notes: str = ""


# Maps block_type string → content schema class for validation
CONTENT_SCHEMA_MAP: dict[str, type[BaseModel]] = {
    "work_experience": WorkExperienceContent,
    "project": ProjectContent,
    "education": EducationContent,
    "skills": SkillsContent,
    "summary": SummaryContent,
    "custom": CustomContent,
    "personal_info": PersonalInfoContent,
}

VALID_BLOCK_TYPES = set(CONTENT_SCHEMA_MAP.keys())


# ── Request / Response schemas ────────────────────────────────────────────────

class ResumeBlockCreate(BaseModel):
    block_type: str
    title: str
    content: dict


class ResumeBlockUpdate(BaseModel):
    title: str | None = None
    content: dict | None = None


class ResumeBlockOut(BaseModel):
    id: uuid.UUID
    user_id: str
    block_type: str
    title: str
    content: dict
    source_resume_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Parse flow schemas ────────────────────────────────────────────────────────

class ParseResumeRequest(BaseModel):
    resume_id: uuid.UUID


class ParsedBlockPreview(BaseModel):
    block_type: str
    title: str = ""
    content: dict


class ParseResumeResponse(BaseModel):
    blocks: list[ParsedBlockPreview]


class SaveParsedBlocksRequest(BaseModel):
    resume_id: uuid.UUID
    display_name: str
    blocks: list[ResumeBlockCreate]


class SaveParsedBlocksResponse(BaseModel):
    blocks: list[ResumeBlockOut]
    assembled_resume_id: uuid.UUID


# ── Assembly schemas ──────────────────────────────────────────────────────────

class AssembledResumeCreate(BaseModel):
    display_name: str


class AttachBlockRequest(BaseModel):
    block_id: uuid.UUID
    position: int


class ReorderBlocksRequest(BaseModel):
    blocks: list[AttachBlockRequest]


class BlockOnResumeOut(BaseModel):
    association_id: uuid.UUID
    position: int
    title_override: str | None
    block: ResumeBlockOut

    model_config = {"from_attributes": True}
