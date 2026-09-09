from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth import verify_clerk_token
from database import get_db
from schemas import (
    ParsedBlockPreview,
    ParseResumeResponse,
    ResumeBlockOut,
    SaveParsedBlocksRequest,
    SaveParsedBlocksResponse,
)
from services import AiService, ResumeBlockService, ResumeService
from services.parse_preview_cache import parse_preview_cache

router = APIRouter(prefix="/resume-blocks", tags=["resume-block-parsing"])


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


@router.post("/parse", response_model=ParseResumeResponse)
async def parse_resume(
    resume: UploadFile = File(...),
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> ParseResumeResponse:
    """Parse an uploaded resume into block previews. Does NOT save to DB or R2."""
    resume_bytes = await resume.read()
    svc = ResumeService(db)
    resume_text = await svc.extract_text_with_ocr_fallback(resume_bytes)

    raw_blocks = await AiService().parse_resume_into_blocks(resume_text)
    # Fill in missing titles so the response always validates
    for block in raw_blocks:
        if not block.get("title"):
            block["title"] = _fallback_title(block.get("block_type", "custom"), block.get("content", {}))

    preview_token = parse_preview_cache.put(
        {
            "user_id": user_id,
            "filename": resume.filename,
            "content_type": resume.content_type,
            "pdf_bytes": resume_bytes,
            "resume_text": resume_text,
        }
    )
    return ParseResumeResponse(
        blocks=[ParsedBlockPreview.model_validate(b) for b in raw_blocks],
        preview_token=preview_token,
    )


@router.post("/save-parsed", response_model=SaveParsedBlocksResponse, status_code=status.HTTP_201_CREATED)
async def save_parsed_blocks(
    body: SaveParsedBlocksRequest,
    user_id: str = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
) -> SaveParsedBlocksResponse:
    svc = ResumeBlockService(db)
    saved_blocks, resume = await svc.save_parsed_blocks(
        user_id=user_id,
        preview_token=body.preview_token,
        display_name=body.display_name,
        blocks_data=[b.model_dump() for b in body.blocks],
    )
    return SaveParsedBlocksResponse(
        blocks=[ResumeBlockOut.model_validate(b) for b in saved_blocks],
        resume_id=resume.id,
    )
