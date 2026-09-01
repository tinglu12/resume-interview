import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth import verify_clerk_token
from database import get_db
from schemas import ResumeBlockCreate, ResumeBlockOut, ResumeBlockUpdate
from services import ResumeBlockService

router = APIRouter(prefix="/resume-blocks", tags=["resume-blocks"])


@router.post("", response_model=ResumeBlockOut, status_code=status.HTTP_201_CREATED)
async def create_block(
    body: ResumeBlockCreate,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> ResumeBlockOut:
    block = await ResumeBlockService(db).create_block(
        user_id=user_id,
        block_type=body.block_type,
        title=body.title,
        content=body.content,
    )
    return ResumeBlockOut.model_validate(block)


@router.get("", response_model=list[ResumeBlockOut])
async def list_blocks(
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> list[ResumeBlockOut]:
    blocks = await ResumeBlockService(db).list_blocks(user_id)
    return [ResumeBlockOut.model_validate(b) for b in blocks]


@router.get("/{block_id}", response_model=ResumeBlockOut)
async def get_block(
    block_id: uuid.UUID,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> ResumeBlockOut:
    block = await ResumeBlockService(db).get_block(block_id, user_id)
    return ResumeBlockOut.model_validate(block)


@router.patch("/{block_id}", response_model=ResumeBlockOut)
async def update_block(
    block_id: uuid.UUID,
    body: ResumeBlockUpdate,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> ResumeBlockOut:
    block = await ResumeBlockService(db).update_block(
        block_id,
        user_id,
        title=body.title,
        content=body.content,
    )
    return ResumeBlockOut.model_validate(block)


@router.delete("/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_block(
    block_id: uuid.UUID,
    force: bool = Query(default=False),
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> None:
    await ResumeBlockService(db).delete_block(block_id, user_id, force=force)
