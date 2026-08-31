import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth import verify_clerk_token
from database import get_db
from schemas import (
    AttachBlockToSectionRequest,
    BlockOnResumeOut,
    ReorderSectionBlocksRequest,
    ReorderSectionsRequest,
    ResumeBlockOut,
    ResumeSectionCreate,
    ResumeSectionOut,
    ResumeSectionUpdate,
)
from services import ResumeSectionService

router = APIRouter(prefix="/resumes", tags=["resume-sections"])


def _section_to_out(section) -> ResumeSectionOut:
    return ResumeSectionOut(
        id=section.id,
        resume_id=section.resume_id,
        section_type=section.section_type,
        display_name=section.display_name,
        position=section.position,
        blocks=[
            BlockOnResumeOut(
                association_id=a.id,
                position=a.position,
                title_override=a.title_override,
                section_id=a.section_id,
                block=ResumeBlockOut.model_validate(a.block),
            )
            for a in section.block_associations
        ],
    )


@router.post(
    "/{resume_id}/sections",
    response_model=ResumeSectionOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_section(
    resume_id: uuid.UUID,
    body: ResumeSectionCreate,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> ResumeSectionOut:
    svc = ResumeSectionService(db)
    section = await svc.create_section(
        resume_id, user_id, body.section_type, body.display_name, body.position
    )
    return _section_to_out(await svc.get_section_with_blocks(section.id, resume_id))


@router.get("/{resume_id}/sections", response_model=list[ResumeSectionOut])
async def get_resume_sections(
    resume_id: uuid.UUID,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> list[ResumeSectionOut]:
    sections = await ResumeSectionService(db).get_sections_for_resume(resume_id, user_id)
    return [_section_to_out(s) for s in sections]


@router.patch("/{resume_id}/sections/reorder", status_code=status.HTTP_204_NO_CONTENT)
async def reorder_sections(
    resume_id: uuid.UUID,
    body: ReorderSectionsRequest,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> None:
    reorder = [(item.section_id, item.position) for item in body.sections]
    await ResumeSectionService(db).reorder_sections(resume_id, user_id, reorder)


@router.patch("/{resume_id}/sections/{section_id}", response_model=ResumeSectionOut)
async def update_section(
    resume_id: uuid.UUID,
    section_id: uuid.UUID,
    body: ResumeSectionUpdate,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> ResumeSectionOut:
    svc = ResumeSectionService(db)
    await svc.update_section(
        section_id, resume_id, user_id,
        display_name=body.display_name,
        position=body.position,
    )
    return _section_to_out(await svc.get_section_with_blocks(section_id, resume_id))


@router.delete(
    "/{resume_id}/sections/{section_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_section(
    resume_id: uuid.UUID,
    section_id: uuid.UUID,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> None:
    await ResumeSectionService(db).delete_section(section_id, resume_id, user_id)


@router.post(
    "/{resume_id}/sections/{section_id}/blocks",
    response_model=ResumeSectionOut,
    status_code=status.HTTP_201_CREATED,
)
async def attach_block_to_section(
    resume_id: uuid.UUID,
    section_id: uuid.UUID,
    body: AttachBlockToSectionRequest,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> ResumeSectionOut:
    svc = ResumeSectionService(db)
    await svc.attach_block_to_section(
        section_id, resume_id, user_id, body.block_id, body.position
    )
    return _section_to_out(await svc.get_section_with_blocks(section_id, resume_id))


@router.delete(
    "/{resume_id}/sections/{section_id}/blocks/{block_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def detach_block_from_section(
    resume_id: uuid.UUID,
    section_id: uuid.UUID,
    block_id: uuid.UUID,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> None:
    await ResumeSectionService(db).detach_block_from_section(
        section_id, resume_id, user_id, block_id
    )


@router.patch(
    "/{resume_id}/sections/{section_id}/blocks/reorder",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def reorder_section_blocks(
    resume_id: uuid.UUID,
    section_id: uuid.UUID,
    body: ReorderSectionBlocksRequest,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> None:
    reorder = [(item.block_id, item.position) for item in body.blocks]
    await ResumeSectionService(db).reorder_section_blocks(section_id, resume_id, user_id, reorder)
