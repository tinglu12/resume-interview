import uuid
from unittest.mock import AsyncMock

import pytest

from models import Resume
from services.ai import AiService


async def _create_resume(db_session, *, user_id: str, resume_text: str | None = "Some resume text") -> Resume:
    resume = Resume(user_id=user_id, filename="resume.pdf", resume_text=resume_text)
    db_session.add(resume)
    await db_session.commit()
    await db_session.refresh(resume)
    return resume


@pytest.fixture
def mock_parse(monkeypatch):
    def _mock_parse(return_value):
        mock = AsyncMock(return_value=return_value)
        monkeypatch.setattr(AiService, "parse_resume_into_blocks", mock)
        return mock

    return _mock_parse


async def test_parse_happy_path(client, db_session, test_user_id, mock_parse):
    resume = await _create_resume(db_session, user_id=test_user_id)
    mock_parse(
        [
            {
                "block_type": "work_experience",
                "title": "Engineer @ Acme",
                "content": {"company": "Acme", "role": "Engineer"},
            }
        ]
    )

    response = await client.post("/resume-blocks/parse", json={"resume_id": str(resume.id)})

    assert response.status_code == 200
    body = response.json()
    assert len(body["blocks"]) == 1
    assert body["blocks"][0]["title"] == "Engineer @ Acme"


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
        ("mystery_type", {}, "Mystery Type"),
    ],
)
async def test_parse_fallback_titles(client, db_session, test_user_id, mock_parse, block_type, content, expected_title):
    resume = await _create_resume(db_session, user_id=test_user_id)
    mock_parse([{"block_type": block_type, "title": "", "content": content}])

    response = await client.post("/resume-blocks/parse", json={"resume_id": str(resume.id)})

    assert response.status_code == 200
    assert response.json()["blocks"][0]["title"] == expected_title


async def test_parse_summary_title_truncates_long_text(client, db_session, test_user_id, mock_parse):
    resume = await _create_resume(db_session, user_id=test_user_id)
    long_text = "x" * 100
    mock_parse([{"block_type": "summary", "title": "", "content": {"text": long_text}}])

    response = await client.post("/resume-blocks/parse", json={"resume_id": str(resume.id)})

    title = response.json()["blocks"][0]["title"]
    assert title.endswith("…")
    assert len(title) <= 61


async def test_parse_no_resume_text(client, db_session, test_user_id, mock_parse):
    resume = await _create_resume(db_session, user_id=test_user_id, resume_text=None)
    mock_parse([])

    response = await client.post("/resume-blocks/parse", json={"resume_id": str(resume.id)})

    assert response.status_code == 400


async def test_parse_resume_not_found(client, mock_parse):
    mock_parse([])

    response = await client.post("/resume-blocks/parse", json={"resume_id": str(uuid.uuid4())})

    assert response.status_code == 404


async def test_parse_resume_owned_by_another_user(client, db_session, mock_parse):
    resume = await _create_resume(db_session, user_id="someone-else")
    mock_parse([])

    response = await client.post("/resume-blocks/parse", json={"resume_id": str(resume.id)})

    assert response.status_code == 404


async def test_save_parsed_happy_path(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)

    response = await client.post(
        "/resume-blocks/save-parsed",
        json={
            "resume_id": str(resume.id),
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
    assembled_id = body["assembled_resume_id"]

    await db_session.refresh(resume)
    assert str(resume.assembled_resume_id) == assembled_id


async def test_save_parsed_does_not_auto_create_personal_info_section(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)

    response = await client.post(
        "/resume-blocks/save-parsed",
        json={
            "resume_id": str(resume.id),
            "display_name": "Assembled",
            "blocks": [{"block_type": "summary", "title": "Summary", "content": {"text": "Hi"}}],
        },
    )

    assembled_id = response.json()["assembled_resume_id"]
    sections = await client.get(f"/resumes/{assembled_id}/sections")

    assert sections.json() == []


async def test_save_parsed_source_resume_not_found(client):
    response = await client.post(
        "/resume-blocks/save-parsed",
        json={"resume_id": str(uuid.uuid4()), "display_name": "Assembled", "blocks": []},
    )

    assert response.status_code == 404


async def test_save_parsed_invalid_block_type(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)

    response = await client.post(
        "/resume-blocks/save-parsed",
        json={
            "resume_id": str(resume.id),
            "display_name": "Assembled",
            "blocks": [{"block_type": "not_a_type", "title": "X", "content": {}}],
        },
    )

    assert response.status_code == 400


async def test_save_parsed_empty_blocks_accepted(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)

    response = await client.post(
        "/resume-blocks/save-parsed",
        json={"resume_id": str(resume.id), "display_name": "Assembled", "blocks": []},
    )

    assert response.status_code == 201
    assert response.json()["blocks"] == []
