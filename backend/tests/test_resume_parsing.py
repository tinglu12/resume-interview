from unittest.mock import AsyncMock, Mock

import pytest
from sqlalchemy import select

from models import Resume
from services.ai import AiService
from services.pdf import PdfService
from services.storage import StorageService

PDF_BYTES = b"%PDF-1.4\n%fake pdf content for tests\n"


@pytest.fixture
def mock_parse(monkeypatch):
    def _mock_parse(return_value):
        mock = AsyncMock(return_value=return_value)
        monkeypatch.setattr(AiService, "parse_resume_into_blocks", mock)
        return mock

    return _mock_parse


@pytest.fixture
def mock_extract_text(monkeypatch):
    def _mock_extract_text(return_value: str = "Some resume text"):
        mock = Mock(return_value=return_value)
        monkeypatch.setattr(PdfService, "extract_text", mock)
        return mock

    return _mock_extract_text


@pytest.fixture
def mock_pdf_to_images(monkeypatch):
    def _mock(return_value: list[str] | None = None):
        mock = Mock(return_value=return_value if return_value is not None else [])
        monkeypatch.setattr(PdfService, "pdf_pages_as_base64_images", mock)
        return mock

    return _mock


@pytest.fixture(autouse=True)
def mock_storage(monkeypatch):
    """Uploads to R2 must not happen for real in tests."""

    def _fake_upload(self, data: bytes, key: str, content_type: str) -> str:
        return f"https://fake.example/{key}"

    monkeypatch.setattr(StorageService, "upload_bytes", _fake_upload)


async def _parse(client, mock_extract_text, mock_parse, blocks, resume_text: str = "Some resume text"):
    mock_extract_text(resume_text)
    mock_parse(blocks)
    return await client.post(
        "/resume-blocks/parse",
        files={"resume": ("resume.pdf", PDF_BYTES, "application/pdf")},
    )


async def test_parse_happy_path(client, mock_extract_text, mock_parse):
    response = await _parse(
        client,
        mock_extract_text,
        mock_parse,
        [
            {
                "block_type": "work_experience",
                "title": "Engineer @ Acme",
                "content": {"company": "Acme", "role": "Engineer"},
            }
        ],
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["blocks"]) == 1
    assert body["blocks"][0]["title"] == "Engineer @ Acme"
    assert body["preview_token"]


@pytest.mark.parametrize(
    "block_type,content,expected_title",
    [
        ("work_experience", {"role": "Engineer", "company": "Acme"}, "Engineer @ Acme"),
        ("work_experience", {"role": "Engineer"}, "Engineer"),
        ("work_experience", {}, "Work Experience"),
        ("project", {"name": "Cool Project"}, "Cool Project"),
        ("project", {}, "Project"),
        ("education", {"degree": "BS", "institution": "MIT"}, "BS – MIT"),
        ("education", {"degree": "BS"}, "BS"),
        ("education", {}, "Education"),
        ("skills", {"groups": [{"label": "Languages"}, {"label": "Tools"}]}, "Skills: Languages, Tools"),
        ("skills", {}, "Skills"),
        ("summary", {"text": "short"}, "short"),
        ("summary", {}, "Summary"),
        ("custom", {"heading": "Awards"}, "Awards"),
        ("custom", {}, "Custom Section"),
        ("personal_info", {"full_name": "Jane Doe"}, "Jane Doe"),
        ("personal_info", {}, "Personal Info"),
        ("mystery_type", {}, "Mystery Type"),
    ],
)
async def test_parse_fallback_titles(
    client, mock_extract_text, mock_parse, block_type, content, expected_title
):
    response = await _parse(
        client, mock_extract_text, mock_parse, [{"block_type": block_type, "title": "", "content": content}]
    )

    assert response.status_code == 200
    assert response.json()["blocks"][0]["title"] == expected_title


async def test_parse_summary_title_truncates_long_text(client, mock_extract_text, mock_parse):
    long_text = "x" * 100
    response = await _parse(
        client, mock_extract_text, mock_parse, [{"block_type": "summary", "title": "", "content": {"text": long_text}}]
    )

    title = response.json()["blocks"][0]["title"]
    assert title.endswith("…")
    assert len(title) <= 61


async def test_parse_no_extractable_text_and_no_ocr_fallback(
    client, mock_extract_text, mock_pdf_to_images, mock_parse
):
    """When the PDF has no text layer and page-image rendering also fails,
    the parse endpoint should surface the same 400 as upload_resume does."""
    mock_extract_text("")
    mock_pdf_to_images([])
    mock_parse([])

    response = await client.post(
        "/resume-blocks/parse",
        files={"resume": ("resume.pdf", PDF_BYTES, "application/pdf")},
    )

    assert response.status_code == 400


async def test_parse_invalid_pdf_bytes(client, mock_extract_text, mock_parse):
    mock_extract_text("some text")
    mock_parse([])

    response = await client.post(
        "/resume-blocks/parse",
        files={"resume": ("resume.pdf", b"not a pdf", "application/pdf")},
    )

    assert response.status_code == 400


async def test_save_parsed_happy_path(client, mock_extract_text, mock_parse, db_session, test_user_id):
    parse_response = await _parse(
        client,
        mock_extract_text,
        mock_parse,
        [
            {
                "block_type": "work_experience",
                "title": "Engineer @ Acme",
                "content": {"company": "Acme", "role": "Engineer"},
            },
            {
                "block_type": "summary",
                "title": "Summary",
                "content": {"text": "A great summary."},
            },
        ],
    )
    preview_token = parse_response.json()["preview_token"]

    response = await client.post(
        "/resume-blocks/save-parsed",
        json={
            "preview_token": preview_token,
            "display_name": "Assembled",
            "blocks": [
                {
                    "block_type": "work_experience",
                    "title": "Engineer @ Acme",
                    "content": {"company": "Acme", "role": "Engineer"},
                },
                {
                    "block_type": "summary",
                    "title": "Summary",
                    "content": {"text": "A great summary."},
                },
            ],
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert len(body["blocks"]) == 2
    resume_id = body["resume_id"]

    result = await db_session.execute(select(Resume).where(Resume.user_id == test_user_id))
    resumes = result.scalars().all()
    assert len(resumes) == 1
    resume = resumes[0]
    assert str(resume.id) == resume_id
    assert resume.resume_type == "builder"
    assert resume.resume_url is not None and resume.resume_url.startswith("https://fake.example/resumes/")
    assert resume.resume_text == "Some resume text"


async def test_save_parsed_auto_creates_sections_for_parsed_blocks(client, mock_extract_text, mock_parse):
    parse_response = await _parse(
        client,
        mock_extract_text,
        mock_parse,
        [{"block_type": "summary", "title": "Summary", "content": {"text": "Hi"}}],
    )
    preview_token = parse_response.json()["preview_token"]

    response = await client.post(
        "/resume-blocks/save-parsed",
        json={
            "preview_token": preview_token,
            "display_name": "Assembled",
            "blocks": [{"block_type": "summary", "title": "Summary", "content": {"text": "Hi"}}],
        },
    )

    resume_id = response.json()["resume_id"]
    sections_response = await client.get(f"/resumes/{resume_id}/sections")
    sections = sections_response.json()

    # Pinned personal_info section always exists at position 0, matching every other
    # resume-creation path, plus one section per distinct parsed block_type.
    assert [s["section_type"] for s in sections] == ["personal_info", "summary"]
    personal_info, summary_section = sections
    assert personal_info["position"] == 0
    assert personal_info["blocks"] == []
    assert summary_section["position"] == 1
    assert len(summary_section["blocks"]) == 1
    assert summary_section["blocks"][0]["block"]["block_type"] == "summary"


async def test_save_parsed_personal_info_block_merges_into_pinned_section(client, mock_extract_text, mock_parse):
    parse_response = await _parse(
        client,
        mock_extract_text,
        mock_parse,
        [{"block_type": "personal_info", "title": "Jane Doe", "content": {"full_name": "Jane Doe"}}],
    )
    preview_token = parse_response.json()["preview_token"]

    response = await client.post(
        "/resume-blocks/save-parsed",
        json={
            "preview_token": preview_token,
            "display_name": "Assembled",
            "blocks": [
                {"block_type": "personal_info", "title": "Jane Doe", "content": {"full_name": "Jane Doe"}}
            ],
        },
    )

    resume_id = response.json()["resume_id"]
    sections_response = await client.get(f"/resumes/{resume_id}/sections")
    sections = sections_response.json()

    # Must NOT create a second/duplicate personal_info section — the parsed
    # personal_info block should merge into the single pinned section at position 0.
    assert [s["section_type"] for s in sections] == ["personal_info"]
    personal_info_section = sections[0]
    assert personal_info_section["position"] == 0
    assert len(personal_info_section["blocks"]) == 1
    assert personal_info_section["blocks"][0]["block"]["content"]["full_name"] == "Jane Doe"


async def test_save_parsed_invalid_preview_token(client):
    response = await client.post(
        "/resume-blocks/save-parsed",
        json={"preview_token": "not-a-real-token", "display_name": "Assembled", "blocks": []},
    )

    assert response.status_code == 400


async def test_save_parsed_invalid_block_type(client, mock_extract_text, mock_parse):
    parse_response = await _parse(client, mock_extract_text, mock_parse, [])
    preview_token = parse_response.json()["preview_token"]

    response = await client.post(
        "/resume-blocks/save-parsed",
        json={
            "preview_token": preview_token,
            "display_name": "Assembled",
            "blocks": [{"block_type": "not_a_type", "title": "X", "content": {}}],
        },
    )

    assert response.status_code == 400


async def test_save_parsed_empty_blocks_accepted(client, mock_extract_text, mock_parse):
    parse_response = await _parse(client, mock_extract_text, mock_parse, [])
    preview_token = parse_response.json()["preview_token"]

    response = await client.post(
        "/resume-blocks/save-parsed",
        json={"preview_token": preview_token, "display_name": "Assembled", "blocks": []},
    )

    assert response.status_code == 201
    assert response.json()["blocks"] == []
