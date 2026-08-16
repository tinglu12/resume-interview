import uuid

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from models import ResumeBlockAssociation, ResumeSection
from repositories import ResumeSectionRepository, ResumeBlockRepository, ResumeRepository
from schemas.resume_block import VALID_BLOCK_TYPES
from services.errors import ServiceError

SECTION_DEFAULT_NAMES: dict[str, str] = {
    "personal_info": "Contact",
    "work_experience": "Work Experience",
    "project": "Projects",
    "education": "Education",
    "skills": "Technical Skills",
    "summary": "Summary",
    "custom": "Custom Section",
}


class ResumeSectionService:
    def __init__(self, db: AsyncSession):
        self._sections = ResumeSectionRepository(db)
        self._blocks = ResumeBlockRepository(db)
        self._resumes = ResumeRepository(db)
        self._db = db

    async def _require_resume(self, resume_id: uuid.UUID, user_id: str):
        resume = await self._resumes.get_by_id_for_user(resume_id, user_id)
        if not resume:
            raise ServiceError(404, "Resume not found")
        return resume

    async def _require_section(self, section_id: uuid.UUID, resume_id: uuid.UUID):
        section = await self._sections.get_by_id(section_id, resume_id)
        if not section:
            raise ServiceError(404, "Section not found")
        return section

    async def create_section(
        self,
        resume_id: uuid.UUID,
        user_id: str,
        section_type: str,
        display_name: str,
        position: int,
    ) -> ResumeSection:
        if section_type not in VALID_BLOCK_TYPES:
            raise ServiceError(400, f"Invalid section_type '{section_type}'")
        if section_type == "personal_info":
            raise ServiceError(400, "personal_info section is created automatically and cannot be added manually")
        await self._require_resume(resume_id, user_id)
        section = ResumeSection(
            resume_id=resume_id,
            section_type=section_type,
            display_name=display_name,
            position=position,
        )
        return await self._sections.create(section)

    async def create_personal_info_section(
        self, resume_id: uuid.UUID
    ) -> ResumeSection:
        """Auto-create the pinned personal_info section at position 0."""
        section = ResumeSection(
            resume_id=resume_id,
            section_type="personal_info",
            display_name="Contact",
            position=0,
        )
        return await self._sections.create(section)

    async def get_sections_for_resume(
        self, resume_id: uuid.UUID, user_id: str
    ) -> list[ResumeSection]:
        await self._require_resume(resume_id, user_id)
        return await self._sections.get_sections_for_resume(resume_id)

    async def update_section(
        self,
        section_id: uuid.UUID,
        resume_id: uuid.UUID,
        user_id: str,
        *,
        display_name: str | None = None,
        position: int | None = None,
    ) -> ResumeSection:
        await self._require_resume(resume_id, user_id)
        section = await self._require_section(section_id, resume_id)
        if display_name is not None:
            section.display_name = display_name
        if position is not None:
            if section.section_type == "personal_info" and position != 0:
                raise ServiceError(422, "The personal_info section must remain at position 0")
            section.position = position
        return await self._sections.update(section)

    async def delete_section(
        self, section_id: uuid.UUID, resume_id: uuid.UUID, user_id: str
    ) -> None:
        await self._require_resume(resume_id, user_id)
        section = await self._require_section(section_id, resume_id)
        if section.section_type == "personal_info":
            raise ServiceError(403, "The personal_info section cannot be deleted")
        await self._sections.delete(section_id)

    async def reorder_sections(
        self,
        resume_id: uuid.UUID,
        user_id: str,
        reorder: list[tuple[uuid.UUID, int]],
    ) -> None:
        await self._require_resume(resume_id, user_id)
        sections = await self._sections.get_sections_for_resume(resume_id)
        section_map = {s.id: s for s in sections}
        for section_id, position in reorder:
            section = section_map.get(section_id)
            if section and section.section_type == "personal_info" and position != 0:
                raise ServiceError(422, "The personal_info section must remain at position 0")
        await self._sections.bulk_update_positions(reorder)

    async def attach_block_to_section(
        self,
        section_id: uuid.UUID,
        resume_id: uuid.UUID,
        user_id: str,
        block_id: uuid.UUID,
        position: int,
    ) -> ResumeBlockAssociation:
        await self._require_resume(resume_id, user_id)
        section = await self._require_section(section_id, resume_id)
        block = await self._blocks.get_by_id_for_user(block_id, user_id)
        if not block:
            raise ServiceError(404, "Block not found")
        if block.block_type != section.section_type:
            raise ServiceError(
                422,
                f"Block type '{block.block_type}' does not match section type '{section.section_type}'",
            )
        existing = await self._blocks.get_association(resume_id, block_id)
        if existing:
            raise ServiceError(409, "Block is already attached to this resume")
        assoc = ResumeBlockAssociation(
            resume_id=resume_id,
            block_id=block_id,
            section_id=section_id,
            position=position,
        )
        try:
            return await self._sections.create_association(assoc)
        except IntegrityError:
            raise ServiceError(409, "Block is already attached to this resume")

    async def detach_block_from_section(
        self,
        section_id: uuid.UUID,
        resume_id: uuid.UUID,
        user_id: str,
        block_id: uuid.UUID,
    ) -> None:
        await self._require_resume(resume_id, user_id)
        await self._require_section(section_id, resume_id)
        existing = await self._sections.get_association_in_section(section_id, block_id)
        if not existing:
            raise ServiceError(404, "Block is not attached to this section")
        await self._sections.delete_association(section_id, block_id)

    async def reorder_section_blocks(
        self,
        section_id: uuid.UUID,
        resume_id: uuid.UUID,
        user_id: str,
        reorder: list[tuple[uuid.UUID, int]],
    ) -> None:
        await self._require_resume(resume_id, user_id)
        await self._require_section(section_id, resume_id)
        await self._sections.bulk_update_section_block_positions(section_id, reorder)

    async def get_section_with_blocks(
        self, section_id: uuid.UUID, resume_id: uuid.UUID
    ) -> ResumeSection:
        sections = await self._sections.get_sections_for_resume(resume_id)
        for s in sections:
            if s.id == section_id:
                return s
        raise ServiceError(404, "Section not found")
