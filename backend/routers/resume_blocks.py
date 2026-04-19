import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth import verify_clerk_token
from database import get_db
from schemas import (
    ParseResumeRequest,
    ParseResumeResponse,
    AssembledResumeCreate,
    AttachBlockRequest,
    BlockOnResumeOut,
    ReorderBlocksRequest,
    ResumeBlockCreate,
    ResumeBlockOut,
    ResumeBlockUpdate,
    ResumeOut,
    SaveParsedBlocksRequest,
    SaveParsedBlocksResponse,
)
from services import AiService, ResumeBlockService, ResumeService

router = APIRouter(tags=["resume-blocks"])


# ── Block CRUD ────────────────────────────────────────────────────────────────

@router.post("/resume-blocks", response_model=ResumeBlockOut, status_code=status.HTTP_201_CREATED)
async def create_block(
    body: ResumeBlockCreate,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> ResumeBlockOut:
    return await ResumeBlockService(db).create_block(
        user_id=user_id,
        block_type=body.block_type,
        title=body.title,
        content=body.content,
    )


@router.get("/resume-blocks", response_model=list[ResumeBlockOut])
async def list_blocks(
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> list[ResumeBlockOut]:
    return await ResumeBlockService(db).list_blocks(user_id)


@router.get("/resume-blocks/{block_id}", response_model=ResumeBlockOut)
async def get_block(
    block_id: uuid.UUID,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> ResumeBlockOut:
    return await ResumeBlockService(db).get_block(block_id, user_id)


@router.patch("/resume-blocks/{block_id}", response_model=ResumeBlockOut)
async def update_block(
    block_id: uuid.UUID,
    body: ResumeBlockUpdate,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> ResumeBlockOut:
    return await ResumeBlockService(db).update_block(
        block_id,
        user_id,
        title=body.title,
        content=body.content,
    )


@router.delete("/resume-blocks/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_block(
    block_id: uuid.UUID,
    force: bool = Query(default=False),
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> None:
    await ResumeBlockService(db).delete_block(block_id, user_id, force=force)


# ── AI parse flow ─────────────────────────────────────────────────────────────

def _fallback_title(block_type: str, content: dict) -> str:
    """Generate a human-readable title from block content when GPT omits one."""
    if block_type == "work_experience":
        role = content.get("role", "")
        company = content.get("company", "")
        if role and company:
            return f"{role} @ {company}"
        return role or company or "Work Experience"
    if block_type == "project":
        return content.get("name", "") or "Project"
    if block_type == "education":
        institution = content.get("institution", "")
        degree = content.get("degree", "")
        return f"{degree} – {institution}".strip(" –") if degree or institution else "Education"
    if block_type == "skills":
        groups = content.get("groups", [])
        if groups:
            return "Skills: " + ", ".join(g.get("label", "") for g in groups[:3] if g.get("label"))
        return "Skills"
    if block_type == "summary":
        text = content.get("text", "")
        return text[:60].rstrip() + ("…" if len(text) > 60 else "") if text else "Summary"
    if block_type == "custom":
        return content.get("heading", "") or "Custom Section"
    return block_type.replace("_", " ").title()


@router.post("/resume-blocks/parse", response_model=ParseResumeResponse)
async def parse_resume(
    body: ParseResumeRequest,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> ParseResumeResponse:
    """Parse an uploaded resume into block previews. Does NOT save to DB."""
    resume = await ResumeService(db).get_resume(body.resume_id, user_id)
    if not resume.resume_text:
        from services.errors import ServiceError
        raise ServiceError(400, "Resume has no extracted text to parse")
    raw_blocks = await AiService().parse_resume_into_blocks(resume.resume_text)
    # Fill in missing titles so the response always validates
    for block in raw_blocks:
        if not block.get("title"):
            block["title"] = _fallback_title(block.get("block_type", "custom"), block.get("content", {}))
    return ParseResumeResponse(blocks=raw_blocks)


@router.post("/resume-blocks/save-parsed", response_model=SaveParsedBlocksResponse, status_code=status.HTTP_201_CREATED)
async def save_parsed_blocks(
    body: SaveParsedBlocksRequest,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> SaveParsedBlocksResponse:
    svc = ResumeBlockService(db)
    saved_blocks, assembled = await svc.save_parsed_blocks(
        user_id=user_id,
        source_resume_id=body.resume_id,
        display_name=body.display_name,
        blocks_data=[b.model_dump() for b in body.blocks],
    )
    return SaveParsedBlocksResponse(
        blocks=[ResumeBlockOut.model_validate(b) for b in saved_blocks],
        assembled_resume_id=assembled.id,
    )


# ── Resume assembly ───────────────────────────────────────────────────────────

@router.post("/resumes/builder", response_model=ResumeOut, status_code=status.HTTP_201_CREATED)
async def create_assembled_resume(
    body: AssembledResumeCreate,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> ResumeOut:
    return await ResumeBlockService(db).create_assembled_resume(user_id, body.display_name)


@router.get("/resumes/{resume_id}/blocks", response_model=list[BlockOnResumeOut])
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


@router.post("/resumes/{resume_id}/blocks", response_model=BlockOnResumeOut, status_code=status.HTTP_201_CREATED)
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


@router.delete("/resumes/{resume_id}/blocks/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
async def detach_block(
    resume_id: uuid.UUID,
    block_id: uuid.UUID,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> None:
    await ResumeBlockService(db).detach_block(resume_id, user_id, block_id)


@router.patch("/resumes/{resume_id}/blocks/reorder", status_code=status.HTTP_204_NO_CONTENT)
async def reorder_blocks(
    resume_id: uuid.UUID,
    body: ReorderBlocksRequest,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> None:
    reorder = [(item.block_id, item.position) for item in body.blocks]
    await ResumeBlockService(db).reorder_blocks(resume_id, user_id, reorder)
