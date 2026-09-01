import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth import verify_clerk_token
from database import get_db
from schemas import (
    AssembledResumeCreate,
    AttachBlockRequest,
    BlockOnResumeOut,
    ReorderBlocksRequest,
    ResumeBlockOut,
    ResumeOut,
)
from services import ResumeBlockService, ResumeSectionService

router = APIRouter(prefix="/resumes", tags=["resume-assembly"])


@router.post("/builder", response_model=ResumeOut, status_code=status.HTTP_201_CREATED)
async def create_assembled_resume(
    body: AssembledResumeCreate,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> ResumeOut:
    resume = await ResumeBlockService(db).create_assembled_resume(user_id, body.display_name)
    await ResumeSectionService(db).create_personal_info_section(resume.id)
    return ResumeOut.model_validate(resume)


@router.get("/{resume_id}/blocks", response_model=list[BlockOnResumeOut])
async def get_resume_blocks(
    resume_id: uuid.UUID,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> list[BlockOnResumeOut]:
    assocs = await ResumeBlockService(db).get_blocks_for_resume(resume_id, user_id)
    return [
        BlockOnResumeOut(
            association_id=a.id,
            position=a.position,
            title_override=a.title_override,
            block=ResumeBlockOut.model_validate(a.block),
        )
        for a in assocs
    ]


@router.post("/{resume_id}/blocks", response_model=BlockOnResumeOut, status_code=status.HTTP_201_CREATED)
async def attach_block(
    resume_id: uuid.UUID,
    body: AttachBlockRequest,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> BlockOnResumeOut:
    svc = ResumeBlockService(db)
    assoc = await svc.attach_block(resume_id, user_id, body.block_id, body.position)
    # Reload with block eager-loaded
    assocs = await svc.get_blocks_for_resume(resume_id, user_id)
    target = next(a for a in assocs if a.id == assoc.id)
    return BlockOnResumeOut(
        association_id=target.id,
        position=target.position,
        title_override=target.title_override,
        block=ResumeBlockOut.model_validate(target.block),
    )


@router.delete("/{resume_id}/blocks/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
async def detach_block(
    resume_id: uuid.UUID,
    block_id: uuid.UUID,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> None:
    await ResumeBlockService(db).detach_block(resume_id, user_id, block_id)


@router.patch("/{resume_id}/blocks/reorder", status_code=status.HTTP_204_NO_CONTENT)
async def reorder_blocks(
    resume_id: uuid.UUID,
    body: ReorderBlocksRequest,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> None:
    reorder = [(item.block_id, item.position) for item in body.blocks]
    await ResumeBlockService(db).reorder_blocks(resume_id, user_id, reorder)
