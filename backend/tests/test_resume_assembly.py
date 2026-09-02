import uuid

from models import Resume, ResumeBlock


async def _create_block(db_session, *, user_id: str, block_type: str = "work_experience") -> ResumeBlock:
    content = {"work_experience": {"company": "Acme", "role": "Engineer"}}.get(block_type, {})
    block = ResumeBlock(user_id=user_id, block_type=block_type, title="Title", content=content)
    db_session.add(block)
    await db_session.commit()
    await db_session.refresh(block)
    return block


async def _create_resume(db_session, *, user_id: str, resume_type: str = "builder", filename: str = "resume") -> Resume:
    resume = Resume(user_id=user_id, filename=filename, resume_type=resume_type)
    db_session.add(resume)
    await db_session.commit()
    await db_session.refresh(resume)
    return resume


async def test_create_assembled_resume(client):
    response = await client.post("/resumes/builder", json={"display_name": "My Resume"})

    assert response.status_code == 201
    body = response.json()
    assert body["resume_type"] == "builder"
    assert body["display_name"] == "My Resume"


async def test_create_assembled_resume_auto_creates_personal_info_section(client):
    response = await client.post("/resumes/builder", json={"display_name": "My Resume"})
    resume_id = response.json()["id"]

    sections = await client.get(f"/resumes/{resume_id}/sections")

    assert sections.status_code == 200
    body = sections.json()
    assert len(body) == 1
    assert body[0]["section_type"] == "personal_info"
    assert body[0]["display_name"] == "Contact"
    assert body[0]["position"] == 0


async def test_get_resume_blocks_empty(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)

    response = await client.get(f"/resumes/{resume.id}/blocks")

    assert response.status_code == 200
    assert response.json() == []


async def test_get_resume_blocks_not_found(client):
    response = await client.get(f"/resumes/{uuid.uuid4()}/blocks")

    assert response.status_code == 404


async def test_get_resume_blocks_works_on_upload_type(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id, resume_type="upload")

    response = await client.get(f"/resumes/{resume.id}/blocks")

    assert response.status_code == 200
    assert response.json() == []


async def test_attach_block_happy_path(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)
    block = await _create_block(db_session, user_id=test_user_id)

    response = await client.post(f"/resumes/{resume.id}/blocks", json={"block_id": str(block.id), "position": 0})

    assert response.status_code == 201
    body = response.json()
    assert body["block"]["id"] == str(block.id)
    assert body["position"] == 0


async def test_attach_block_resume_not_found(client, db_session, test_user_id):
    block = await _create_block(db_session, user_id=test_user_id)

    response = await client.post(f"/resumes/{uuid.uuid4()}/blocks", json={"block_id": str(block.id), "position": 0})

    assert response.status_code == 404


async def test_attach_block_to_non_builder_resume(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id, resume_type="upload")
    block = await _create_block(db_session, user_id=test_user_id)

    response = await client.post(f"/resumes/{resume.id}/blocks", json={"block_id": str(block.id), "position": 0})

    assert response.status_code == 400


async def test_attach_block_not_found(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)

    response = await client.post(f"/resumes/{resume.id}/blocks", json={"block_id": str(uuid.uuid4()), "position": 0})

    assert response.status_code == 404


async def test_attach_block_owned_by_another_user(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)
    block = await _create_block(db_session, user_id="someone-else")

    response = await client.post(f"/resumes/{resume.id}/blocks", json={"block_id": str(block.id), "position": 0})

    assert response.status_code == 404


async def test_attach_block_duplicate(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)
    block = await _create_block(db_session, user_id=test_user_id)
    await client.post(f"/resumes/{resume.id}/blocks", json={"block_id": str(block.id), "position": 0})

    response = await client.post(f"/resumes/{resume.id}/blocks", json={"block_id": str(block.id), "position": 1})

    assert response.status_code == 409


async def test_attach_same_block_to_two_resumes_succeeds(client, db_session, test_user_id):
    resume_a = await _create_resume(db_session, user_id=test_user_id, filename="a")
    resume_b = await _create_resume(db_session, user_id=test_user_id, filename="b")
    block = await _create_block(db_session, user_id=test_user_id)

    first = await client.post(f"/resumes/{resume_a.id}/blocks", json={"block_id": str(block.id), "position": 0})
    second = await client.post(f"/resumes/{resume_b.id}/blocks", json={"block_id": str(block.id), "position": 0})

    assert first.status_code == 201
    assert second.status_code == 201


async def test_detach_block_happy_path(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)
    block = await _create_block(db_session, user_id=test_user_id)
    await client.post(f"/resumes/{resume.id}/blocks", json={"block_id": str(block.id), "position": 0})

    response = await client.delete(f"/resumes/{resume.id}/blocks/{block.id}")
    assert response.status_code == 204

    remaining = await client.get(f"/resumes/{resume.id}/blocks")
    assert remaining.json() == []


async def test_detach_block_resume_not_found(client):
    response = await client.delete(f"/resumes/{uuid.uuid4()}/blocks/{uuid.uuid4()}")

    assert response.status_code == 404


async def test_detach_block_not_attached(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)

    response = await client.delete(f"/resumes/{resume.id}/blocks/{uuid.uuid4()}")

    assert response.status_code == 404


async def test_reorder_blocks_happy_path(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)
    block_a = await _create_block(db_session, user_id=test_user_id)
    block_b = await _create_block(db_session, user_id=test_user_id)
    await client.post(f"/resumes/{resume.id}/blocks", json={"block_id": str(block_a.id), "position": 0})
    await client.post(f"/resumes/{resume.id}/blocks", json={"block_id": str(block_b.id), "position": 1})

    response = await client.patch(
        f"/resumes/{resume.id}/blocks/reorder",
        json={"blocks": [{"block_id": str(block_a.id), "position": 1}, {"block_id": str(block_b.id), "position": 0}]},
    )
    assert response.status_code == 204

    blocks = (await client.get(f"/resumes/{resume.id}/blocks")).json()
    by_id = {b["block"]["id"]: b["position"] for b in blocks}
    assert by_id[str(block_a.id)] == 1
    assert by_id[str(block_b.id)] == 0


async def test_reorder_blocks_resume_not_found(client):
    response = await client.patch(f"/resumes/{uuid.uuid4()}/blocks/reorder", json={"blocks": []})

    assert response.status_code == 404


async def test_reorder_blocks_ignores_unattached_block(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)

    response = await client.patch(
        f"/resumes/{resume.id}/blocks/reorder",
        json={"blocks": [{"block_id": str(uuid.uuid4()), "position": 5}]},
    )

    assert response.status_code == 204
