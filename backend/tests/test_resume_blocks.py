import uuid
from datetime import UTC

import pytest
from pydantic import ValidationError

from models import Resume, ResumeBlock, ResumeBlockAssociation

VALID_CONTENT = {
    "work_experience": {"company": "Acme", "role": "Engineer"},
    "project": {"name": "Cool Project"},
    "education": {"institution": "State University"},
    "skills": {"groups": [{"label": "Languages", "items": ["Python"]}]},
    "summary": {"text": "A summary."},
    "custom": {"heading": "Awards", "body": "Won stuff."},
    "personal_info": {"full_name": "Jane Doe"},
}


async def _create_block(
    db_session, *, user_id: str, block_type: str = "work_experience", content: dict | None = None, title: str = "Title"
) -> ResumeBlock:
    block = ResumeBlock(
        user_id=user_id,
        block_type=block_type,
        title=title,
        content=content if content is not None else VALID_CONTENT[block_type],
    )
    db_session.add(block)
    await db_session.commit()
    await db_session.refresh(block)
    return block


@pytest.mark.parametrize("block_type", sorted(VALID_CONTENT.keys()))
async def test_create_block_each_type(client, block_type):
    response = await client.post(
        "/resume-blocks",
        json={"block_type": block_type, "title": "My Title", "content": VALID_CONTENT[block_type]},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["block_type"] == block_type
    assert body["title"] == "My Title"


async def test_create_block_invalid_type(client):
    response = await client.post(
        "/resume-blocks",
        json={"block_type": "not_a_type", "title": "Title", "content": {}},
    )

    assert response.status_code == 400


async def test_create_block_content_missing_required_field_raises(client):
    # work_experience requires `company` and `role` — omitting them means the
    # underlying pydantic.ValidationError propagates uncaught rather than
    # becoming a clean 4xx response. This test pins down that current (buggy)
    # behavior rather than fixing it.
    with pytest.raises(ValidationError):
        await client.post(
            "/resume-blocks",
            json={"block_type": "work_experience", "title": "Title", "content": {}},
        )


async def test_list_blocks_empty(client):
    response = await client.get("/resume-blocks")

    assert response.status_code == 200
    assert response.json() == []


async def test_list_blocks_only_returns_own(client, db_session, test_user_id):
    await _create_block(db_session, user_id=test_user_id)
    await _create_block(db_session, user_id="someone-else")

    response = await client.get("/resume-blocks")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["user_id"] == test_user_id


async def test_list_blocks_newest_first(client, db_session, test_user_id):
    # Postgres's now() is frozen for the whole test transaction, so set
    # created_at explicitly rather than relying on the column's server_default
    # to produce distinct timestamps across two commits in the same test.
    from datetime import datetime, timedelta

    first = await _create_block(db_session, user_id=test_user_id, title="First")
    first.created_at = datetime.now(UTC) - timedelta(seconds=10)
    second = await _create_block(db_session, user_id=test_user_id, title="Second")
    second.created_at = datetime.now(UTC)
    await db_session.commit()

    response = await client.get("/resume-blocks")

    body = response.json()
    ids = [b["id"] for b in body]
    assert ids.index(str(second.id)) < ids.index(str(first.id))


async def test_get_block(client, db_session, test_user_id):
    block = await _create_block(db_session, user_id=test_user_id)

    response = await client.get(f"/resume-blocks/{block.id}")

    assert response.status_code == 200
    assert response.json()["id"] == str(block.id)


async def test_get_block_not_found(client):
    response = await client.get(f"/resume-blocks/{uuid.uuid4()}")

    assert response.status_code == 404


async def test_get_block_wrong_user_not_found(client, db_session):
    block = await _create_block(db_session, user_id="someone-else")

    response = await client.get(f"/resume-blocks/{block.id}")

    assert response.status_code == 404


async def test_update_block_title_only(client, db_session, test_user_id):
    block = await _create_block(db_session, user_id=test_user_id, title="Old")

    response = await client.patch(f"/resume-blocks/{block.id}", json={"title": "New"})

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "New"
    assert body["content"] == VALID_CONTENT["work_experience"]


async def test_update_block_content_only(client, db_session, test_user_id):
    block = await _create_block(db_session, user_id=test_user_id)
    new_content = {"company": "NewCo", "role": "Staff Engineer"}

    response = await client.patch(f"/resume-blocks/{block.id}", json={"content": new_content})

    assert response.status_code == 200
    body = response.json()
    assert body["content"]["company"] == "NewCo"
    assert body["title"] == "Title"


async def test_update_block_neither_field_is_noop(client, db_session, test_user_id):
    block = await _create_block(db_session, user_id=test_user_id)

    response = await client.patch(f"/resume-blocks/{block.id}", json={})

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Title"
    assert body["content"] == VALID_CONTENT["work_experience"]


async def test_update_block_not_found(client):
    response = await client.patch(f"/resume-blocks/{uuid.uuid4()}", json={"title": "New"})

    assert response.status_code == 404


async def test_delete_block(client, db_session, test_user_id):
    block = await _create_block(db_session, user_id=test_user_id)

    response = await client.delete(f"/resume-blocks/{block.id}")
    assert response.status_code == 204

    follow_up = await client.get(f"/resume-blocks/{block.id}")
    assert follow_up.status_code == 404


async def test_delete_block_not_found(client):
    response = await client.delete(f"/resume-blocks/{uuid.uuid4()}")

    assert response.status_code == 404


async def test_delete_block_with_associations_requires_force(client, db_session, test_user_id):
    block = await _create_block(db_session, user_id=test_user_id)
    resume = Resume(user_id=test_user_id, filename="r", resume_type="builder")
    db_session.add(resume)
    await db_session.commit()
    await db_session.refresh(resume)
    assoc = ResumeBlockAssociation(resume_id=resume.id, block_id=block.id, position=0)
    db_session.add(assoc)
    await db_session.commit()

    response = await client.delete(f"/resume-blocks/{block.id}")

    assert response.status_code == 409
    assert "1" in response.json()["detail"]


async def test_delete_block_with_force_cascades_associations(client, db_session, test_user_id):
    block = await _create_block(db_session, user_id=test_user_id)
    resume = Resume(user_id=test_user_id, filename="r", resume_type="builder")
    db_session.add(resume)
    await db_session.commit()
    await db_session.refresh(resume)
    assoc = ResumeBlockAssociation(resume_id=resume.id, block_id=block.id, position=0)
    db_session.add(assoc)
    await db_session.commit()

    response = await client.delete(f"/resume-blocks/{block.id}?force=true")
    assert response.status_code == 204

    blocks_on_resume = await client.get(f"/resumes/{resume.id}/blocks")
    assert blocks_on_resume.json() == []


async def test_requires_authentication(unauthenticated_client):
    response = await unauthenticated_client.get("/resume-blocks")

    assert response.status_code == 401
