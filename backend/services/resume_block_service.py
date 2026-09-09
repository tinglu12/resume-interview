import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from models import Resume, ResumeBlock, ResumeBlockAssociation, ResumeSection
from repositories import ResumeBlockRepository, ResumeRepository
from schemas.resume_block import CONTENT_SCHEMA_MAP, VALID_BLOCK_TYPES
from services.errors import ServiceError
from services.parse_preview_cache import ParsePreviewCache, parse_preview_cache
from services.resume_section_service import SECTION_DEFAULT_NAMES
from services.resume_service import ResumeService


class ResumeBlockService:
    def __init__(
        self,
        db: AsyncSession,
        *,
        resume_service: ResumeService | None = None,
        cache: ParsePreviewCache | None = None,
    ):
        self._blocks = ResumeBlockRepository(db)
        self._resumes = ResumeRepository(db)
        self._db = db
        self._resume_service = resume_service or ResumeService(db)
        self._cache = cache or parse_preview_cache

    # ── Content validation ────────────────────────────────────────────────────

    def _validate_content(self, block_type: str, content: dict) -> dict:
        if block_type not in VALID_BLOCK_TYPES:
            raise ServiceError(
                400, f"Invalid block_type '{block_type}'. Must be one of: {', '.join(sorted(VALID_BLOCK_TYPES))}"
            )
        schema_cls = CONTENT_SCHEMA_MAP[block_type]
        validated = schema_cls.model_validate(content)
        return validated.model_dump()

    # ── Block CRUD ────────────────────────────────────────────────────────────

    async def create_block(
        self,
        *,
        user_id: str,
        block_type: str,
        title: str,
        content: dict,
    ) -> ResumeBlock:
        validated_content = self._validate_content(block_type, content)
        block = ResumeBlock(
            user_id=user_id,
            block_type=block_type,
            title=title,
            content=validated_content,
        )
        return await self._blocks.create(block)

    async def list_blocks(self, user_id: str) -> list[ResumeBlock]:
        return await self._blocks.list_for_user(user_id)

    async def get_block(self, block_id: uuid.UUID, user_id: str) -> ResumeBlock:
        block = await self._blocks.get_by_id_for_user(block_id, user_id)
        if not block:
            raise ServiceError(404, "Block not found")
        return block

    async def update_block(
        self,
        block_id: uuid.UUID,
        user_id: str,
        *,
        title: str | None = None,
        content: dict | None = None,
    ) -> ResumeBlock:
        block = await self._blocks.get_by_id_for_user(block_id, user_id)
        if not block:
            raise ServiceError(404, "Block not found")
        if title is not None:
            block.title = title
        if content is not None:
            block.content = self._validate_content(block.block_type, content)
        return await self._blocks.update(block)

    async def delete_block(self, block_id: uuid.UUID, user_id: str, *, force: bool = False) -> None:
        block = await self._blocks.get_by_id_for_user(block_id, user_id)
        if not block:
            raise ServiceError(404, "Block not found")
        count = await self._blocks.count_associations(block_id)
        if count > 0 and not force:
            raise ServiceError(
                409,
                f"This block is used by {count} assembled resume(s). "
                "Use ?force=true to delete it and remove it from all resumes.",
            )
        await self._blocks.delete(block_id)

    # ── Resume assembly ───────────────────────────────────────────────────────

    async def create_assembled_resume(self, user_id: str, display_name: str) -> Resume:
        resume = Resume(
            user_id=user_id,
            filename=display_name,
            resume_type="builder",
            display_name=display_name,
            resume_url=None,
            resume_text=None,
        )
        self._db.add(resume)
        await self._db.commit()
        await self._db.refresh(resume)
        return resume

    async def get_blocks_for_resume(self, resume_id: uuid.UUID, user_id: str) -> list[ResumeBlockAssociation]:
        resume = await self._resumes.get_by_id_for_user(resume_id, user_id)
        if not resume:
            raise ServiceError(404, "Resume not found")
        return await self._blocks.get_associations_for_resume(resume_id)

    async def attach_block(
        self, resume_id: uuid.UUID, user_id: str, block_id: uuid.UUID, position: int
    ) -> ResumeBlockAssociation:
        resume = await self._resumes.get_by_id_for_user(resume_id, user_id)
        if not resume:
            raise ServiceError(404, "Resume not found")
        if resume.resume_type != "builder":
            raise ServiceError(400, "Can only attach blocks to builder-type resumes")
        block = await self._blocks.get_by_id_for_user(block_id, user_id)
        if not block:
            raise ServiceError(404, "Block not found")
        existing = await self._blocks.get_association(resume_id, block_id)
        if existing:
            raise ServiceError(409, "Block is already attached to this resume")
        assoc = ResumeBlockAssociation(resume_id=resume_id, block_id=block_id, position=position)
        return await self._blocks.create_association(assoc)

    async def detach_block(self, resume_id: uuid.UUID, user_id: str, block_id: uuid.UUID) -> None:
        resume = await self._resumes.get_by_id_for_user(resume_id, user_id)
        if not resume:
            raise ServiceError(404, "Resume not found")
        existing = await self._blocks.get_association(resume_id, block_id)
        if not existing:
            raise ServiceError(404, "Block is not attached to this resume")
        await self._blocks.delete_association(resume_id, block_id)

    async def reorder_blocks(
        self,
        resume_id: uuid.UUID,
        user_id: str,
        reorder: list[tuple[uuid.UUID, int]],
    ) -> None:
        resume = await self._resumes.get_by_id_for_user(resume_id, user_id)
        if not resume:
            raise ServiceError(404, "Resume not found")
        updates = [(resume_id, block_id, position) for block_id, position in reorder]
        await self._blocks.bulk_update_positions(updates)

    # ── AI parse + save flow ──────────────────────────────────────────────────

    async def save_parsed_blocks(
        self,
        *,
        user_id: str,
        preview_token: str,
        display_name: str,
        blocks_data: list[dict],
    ) -> tuple[list[ResumeBlock], Resume]:
        """
        Finalize a previously-parsed (but not yet persisted) resume: upload
        the cached PDF to storage, create the single Resume row for it, save
        the AI-parsed blocks, and attach them to the resume in order.
        Returns (saved_blocks, resume).
        """
        entry = self._cache.pop(preview_token)
        if entry is None or entry["user_id"] != user_id:
            raise ServiceError(400, "Preview expired or not found, please re-upload your resume")

        resume_url = await self._resume_service.upload_resume_bytes(
            resume_bytes=entry["pdf_bytes"], content_type=entry["content_type"]
        )

        resume = Resume(
            user_id=user_id,
            filename=entry["filename"],
            resume_url=resume_url,
            resume_text=entry["resume_text"],
            resume_type="builder",
            display_name=display_name,
        )
        self._db.add(resume)
        await self._db.commit()
        await self._db.refresh(resume)

        # Validate and build block models
        block_models = []
        for data in blocks_data:
            block_type = data.get("block_type", "")
            title = data.get("title", "")
            content = data.get("content", {})
            validated_content = self._validate_content(block_type, content)
            block_models.append(
                ResumeBlock(
                    user_id=user_id,
                    block_type=block_type,
                    title=title,
                    content=validated_content,
                )
            )

        saved_blocks = await self._blocks.create_many(block_models) if block_models else []

        # Auto-create the pinned personal_info section, matching every other resume-creation path
        personal_info_section = ResumeSection(
            resume_id=resume.id,
            section_type="personal_info",
            display_name="Contact",
            position=0,
        )
        self._db.add(personal_info_section)

        # Group blocks by type (preserving first-appearance order) into one section per type,
        # so a parsed-and-saved resume shows up populated instead of blank in the editor.
        # Pre-seed with the pinned personal_info section so a parsed personal_info block
        # attaches into it instead of the loop below creating a duplicate section.
        sections_by_type: dict[str, ResumeSection] = {"personal_info": personal_info_section}
        assocs: list[ResumeBlockAssociation] = []
        next_position = 1
        for block in saved_blocks:
            section = sections_by_type.get(block.block_type)
            if section is None:
                default_name = block.block_type.replace("_", " ").title()
                section = ResumeSection(
                    resume_id=resume.id,
                    section_type=block.block_type,
                    display_name=SECTION_DEFAULT_NAMES.get(block.block_type, default_name),
                    position=next_position,
                )
                self._db.add(section)
                sections_by_type[block.block_type] = section
                next_position += 1

        if sections_by_type:
            await self._db.flush()  # assign section ids before building associations

        section_position: dict[str, int] = {}
        for block in saved_blocks:
            section = sections_by_type[block.block_type]
            position = section_position.get(block.block_type, 0)
            section_position[block.block_type] = position + 1
            assocs.append(
                ResumeBlockAssociation(
                    resume_id=resume.id,
                    block_id=block.id,
                    section_id=section.id,
                    position=position,
                )
            )

        if assocs:
            await self._blocks.create_associations(assocs)
        else:
            await self._db.commit()

        return saved_blocks, resume

    # ── Text rendering for job compatibility ──────────────────────────────────

    async def get_resume_text_for_assembled(self, resume_id: uuid.UUID, user_id: str) -> str:
        """
        Renders an assembled resume's blocks as plain text.
        Used to snapshot resume text when creating a job application.
        """
        associations = await self.get_blocks_for_resume(resume_id, user_id)
        if not associations:
            return ""
        parts: list[str] = []
        for assoc in associations:
            block = assoc.block
            parts.append(self._render_block_to_text(block))
        return "\n\n".join(parts)

    def _render_block_to_text(self, block: ResumeBlock) -> str:
        c = block.content
        bt = block.block_type

        if bt == "summary":
            return c.get("text", "")

        if bt == "work_experience":
            lines = [f"{c.get('role', '')} at {c.get('company', '')}"]
            dates = " - ".join(
                filter(None, [c.get("start_date"), c.get("end_date") or ("Present" if c.get("is_current") else "")])
            )
            if dates:
                lines.append(dates)
            for b in c.get("bullets", []):
                lines.append(f"• {b}")
            techs = c.get("technologies", [])
            if techs:
                lines.append("Technologies: " + ", ".join(techs))
            return "\n".join(lines)

        if bt == "project":
            lines = [c.get("name", "")]
            if c.get("description"):
                lines.append(c["description"])
            for b in c.get("bullets", []):
                lines.append(f"• {b}")
            techs = c.get("technologies", [])
            if techs:
                lines.append("Technologies: " + ", ".join(techs))
            return "\n".join(lines)

        if bt == "education":
            lines = [f"{c.get('degree', '')} in {c.get('field_of_study', '')} - {c.get('institution', '')}"]
            if c.get("gpa"):
                lines.append(f"GPA: {c['gpa']}")
            return "\n".join(lines)

        if bt == "skills":
            lines = []
            for group in c.get("groups", []):
                lines.append(f"{group.get('label', '')}: {', '.join(group.get('items', []))}")
            return "\n".join(lines)

        if bt == "custom":
            return f"{c.get('heading', '')}\n{c.get('body', '')}"

        return block.title
