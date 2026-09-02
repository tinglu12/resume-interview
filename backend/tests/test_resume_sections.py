import uuid

from models import Resume, ResumeBlock, ResumeSection


async def _create_resume(db_session, *, user_id: str, resume_type: str = "builder", filename: str = "resume") -> Resume:
    resume = Resume(user_id=user_id, filename=filename, resume_type=resume_type)
    db_session.add(resume)
    await db_session.commit()
    await db_session.refresh(resume)
    return resume


async def _create_section(
    db_session,
    *,
    resume_id: uuid.UUID,
    section_type: str = "work_experience",
    display_name: str = "Work",
    position: int = 1,
) -> ResumeSection:
    section = ResumeSection(
        resume_id=resume_id, section_type=section_type, display_name=display_name, position=position
    )
    db_session.add(section)
    await db_session.commit()
    await db_session.refresh(section)
    return section


async def _create_block(db_session, *, user_id: str, block_type: str = "work_experience") -> ResumeBlock:
    content = {"work_experience": {"company": "Acme", "role": "Engineer"}}.get(block_type, {})
    block = ResumeBlock(user_id=user_id, block_type=block_type, title="Title", content=content)
    db_session.add(block)
    await db_session.commit()
    await db_session.refresh(block)
    return block


# ── create_section ──────────────────────────────────────────────────────────


async def test_create_section_happy_path(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)

    response = await client.post(
        f"/resumes/{resume.id}/sections",
        json={"section_type": "work_experience", "display_name": "Work Experience", "position": 1},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["section_type"] == "work_experience"
    assert body["blocks"] == []


async def test_create_section_invalid_type(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)

    response = await client.post(
        f"/resumes/{resume.id}/sections",
        json={"section_type": "not_a_type", "display_name": "X", "position": 1},
    )

    assert response.status_code == 400


async def test_create_section_rejects_personal_info(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)

    response = await client.post(
        f"/resumes/{resume.id}/sections",
        json={"section_type": "personal_info", "display_name": "Contact", "position": 0},
    )

    assert response.status_code == 400


async def test_create_section_resume_not_found(client):
    response = await client.post(
        f"/resumes/{uuid.uuid4()}/sections",
        json={"section_type": "work_experience", "display_name": "Work", "position": 1},
    )

    assert response.status_code == 404


# ── get sections ─────────────────────────────────────────────────────────────


async def test_get_sections_empty(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)

    response = await client.get(f"/resumes/{resume.id}/sections")

    assert response.status_code == 200
    assert response.json() == []


async def test_get_sections_not_found(client):
    response = await client.get(f"/resumes/{uuid.uuid4()}/sections")

    assert response.status_code == 404


async def test_get_sections_ordering_and_nested_blocks(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)
    section_a = await _create_section(db_session, resume_id=resume.id, position=1, display_name="A")
    section_b = await _create_section(db_session, resume_id=resume.id, position=0, display_name="B")
    block = await _create_block(db_session, user_id=test_user_id)
    await client.post(
        f"/resumes/{resume.id}/sections/{section_b.id}/blocks",
        json={"block_id": str(block.id), "position": 0},
    )

    response = await client.get(f"/resumes/{resume.id}/sections")

    body = response.json()
    assert [s["id"] for s in body] == [str(section_b.id), str(section_a.id)]
    assert len(body[0]["blocks"]) == 1
    assert body[0]["blocks"][0]["block"]["id"] == str(block.id)


# ── update_section ───────────────────────────────────────────────────────────


async def test_update_section_display_name_only(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)
    section = await _create_section(db_session, resume_id=resume.id)

    response = await client.patch(f"/resumes/{resume.id}/sections/{section.id}", json={"display_name": "New Name"})

    assert response.status_code == 200
    assert response.json()["display_name"] == "New Name"


async def test_update_section_position_only(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)
    section = await _create_section(db_session, resume_id=resume.id, position=1)

    response = await client.patch(f"/resumes/{resume.id}/sections/{section.id}", json={"position": 5})

    assert response.status_code == 200
    assert response.json()["position"] == 5


async def test_update_section_resume_not_found(client):
    response = await client.patch(f"/resumes/{uuid.uuid4()}/sections/{uuid.uuid4()}", json={"position": 1})

    assert response.status_code == 404


async def test_update_section_wrong_resume_not_found(client, db_session, test_user_id):
    resume_a = await _create_resume(db_session, user_id=test_user_id, filename="a")
    resume_b = await _create_resume(db_session, user_id=test_user_id, filename="b")
    section_on_b = await _create_section(db_session, resume_id=resume_b.id)

    response = await client.patch(f"/resumes/{resume_a.id}/sections/{section_on_b.id}", json={"position": 5})

    assert response.status_code == 404


async def test_update_section_personal_info_cannot_move(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)
    section = await _create_section(db_session, resume_id=resume.id, section_type="personal_info", position=0)

    response = await client.patch(f"/resumes/{resume.id}/sections/{section.id}", json={"position": 3})

    assert response.status_code == 422


# ── delete_section ───────────────────────────────────────────────────────────


async def test_delete_section_happy_path_cascades_associations(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)
    section = await _create_section(db_session, resume_id=resume.id)
    block = await _create_block(db_session, user_id=test_user_id)
    await client.post(
        f"/resumes/{resume.id}/sections/{section.id}/blocks",
        json={"block_id": str(block.id), "position": 0},
    )

    response = await client.delete(f"/resumes/{resume.id}/sections/{section.id}")
    assert response.status_code == 204

    remaining_blocks = await client.get(f"/resumes/{resume.id}/blocks")
    assert remaining_blocks.json() == []


async def test_delete_section_resume_not_found(client):
    response = await client.delete(f"/resumes/{uuid.uuid4()}/sections/{uuid.uuid4()}")

    assert response.status_code == 404


async def test_delete_section_not_found(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)

    response = await client.delete(f"/resumes/{resume.id}/sections/{uuid.uuid4()}")

    assert response.status_code == 404


async def test_delete_section_personal_info_forbidden(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)
    section = await _create_section(db_session, resume_id=resume.id, section_type="personal_info", position=0)

    response = await client.delete(f"/resumes/{resume.id}/sections/{section.id}")

    assert response.status_code == 403


# ── reorder_sections ─────────────────────────────────────────────────────────


async def test_reorder_sections_happy_path(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)
    section_a = await _create_section(db_session, resume_id=resume.id, position=0, display_name="A")
    section_b = await _create_section(db_session, resume_id=resume.id, position=1, display_name="B")

    response = await client.patch(
        f"/resumes/{resume.id}/sections/reorder",
        json={
            "sections": [
                {"section_id": str(section_a.id), "position": 1},
                {"section_id": str(section_b.id), "position": 0},
            ]
        },
    )
    assert response.status_code == 204

    sections = (await client.get(f"/resumes/{resume.id}/sections")).json()
    by_id = {s["id"]: s["position"] for s in sections}
    assert by_id[str(section_a.id)] == 1
    assert by_id[str(section_b.id)] == 0


async def test_reorder_sections_resume_not_found(client):
    response = await client.patch(f"/resumes/{uuid.uuid4()}/sections/reorder", json={"sections": []})

    assert response.status_code == 404


async def test_reorder_sections_personal_info_cannot_move(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)
    personal_info = await _create_section(db_session, resume_id=resume.id, section_type="personal_info", position=0)

    response = await client.patch(
        f"/resumes/{resume.id}/sections/reorder",
        json={"sections": [{"section_id": str(personal_info.id), "position": 2}]},
    )

    assert response.status_code == 422


async def test_reorder_sections_does_not_leak_across_resumes(client, db_session, test_user_id):
    """Regression test: reordering resume A's sections must not be able to move
    a section that belongs to resume B, even if its id is included in the
    request body (previously ResumeSectionRepository.bulk_update_positions
    looked sections up by id only, with no resume_id scoping)."""
    resume_a = await _create_resume(db_session, user_id=test_user_id, filename="a")
    resume_b = await _create_resume(db_session, user_id="someone-else", filename="b")
    section_on_a = await _create_section(db_session, resume_id=resume_a.id, position=0, display_name="A")
    section_on_b = await _create_section(db_session, resume_id=resume_b.id, position=0, display_name="B")

    await client.patch(
        f"/resumes/{resume_a.id}/sections/reorder",
        json={
            "sections": [
                {"section_id": str(section_on_a.id), "position": 1},
                {"section_id": str(section_on_b.id), "position": 9},
            ]
        },
    )

    await db_session.refresh(section_on_b)
    assert section_on_b.position == 0


# ── attach_block_to_section / detach / reorder ───────────────────────────────


async def test_attach_block_to_section_happy_path(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)
    section = await _create_section(db_session, resume_id=resume.id, section_type="work_experience")
    block = await _create_block(db_session, user_id=test_user_id, block_type="work_experience")

    response = await client.post(
        f"/resumes/{resume.id}/sections/{section.id}/blocks",
        json={"block_id": str(block.id), "position": 0},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["blocks"][0]["block"]["id"] == str(block.id)


async def test_attach_block_to_section_resume_not_found(client, db_session, test_user_id):
    block = await _create_block(db_session, user_id=test_user_id)

    response = await client.post(
        f"/resumes/{uuid.uuid4()}/sections/{uuid.uuid4()}/blocks",
        json={"block_id": str(block.id), "position": 0},
    )

    assert response.status_code == 404


async def test_attach_block_to_section_section_not_found(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)
    block = await _create_block(db_session, user_id=test_user_id)

    response = await client.post(
        f"/resumes/{resume.id}/sections/{uuid.uuid4()}/blocks",
        json={"block_id": str(block.id), "position": 0},
    )

    assert response.status_code == 404


async def test_attach_block_to_section_block_not_found(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)
    section = await _create_section(db_session, resume_id=resume.id)

    response = await client.post(
        f"/resumes/{resume.id}/sections/{section.id}/blocks",
        json={"block_id": str(uuid.uuid4()), "position": 0},
    )

    assert response.status_code == 404


async def test_attach_block_to_section_type_mismatch(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)
    section = await _create_section(db_session, resume_id=resume.id, section_type="work_experience")
    block = await _create_block(db_session, user_id=test_user_id, block_type="project")

    response = await client.post(
        f"/resumes/{resume.id}/sections/{section.id}/blocks",
        json={"block_id": str(block.id), "position": 0},
    )

    assert response.status_code == 422


async def test_attach_block_to_section_duplicate(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)
    section = await _create_section(db_session, resume_id=resume.id, section_type="work_experience")
    block = await _create_block(db_session, user_id=test_user_id)
    await client.post(
        f"/resumes/{resume.id}/sections/{section.id}/blocks",
        json={"block_id": str(block.id), "position": 0},
    )

    response = await client.post(
        f"/resumes/{resume.id}/sections/{section.id}/blocks",
        json={"block_id": str(block.id), "position": 1},
    )

    assert response.status_code == 409


async def test_attach_block_to_section_duplicate_via_unsectioned_attach(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)
    section = await _create_section(db_session, resume_id=resume.id, section_type="work_experience")
    block = await _create_block(db_session, user_id=test_user_id)
    await client.post(f"/resumes/{resume.id}/blocks", json={"block_id": str(block.id), "position": 0})

    response = await client.post(
        f"/resumes/{resume.id}/sections/{section.id}/blocks",
        json={"block_id": str(block.id), "position": 0},
    )

    assert response.status_code == 409


async def test_detach_block_from_section_happy_path(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)
    section = await _create_section(db_session, resume_id=resume.id, section_type="work_experience")
    block = await _create_block(db_session, user_id=test_user_id)
    await client.post(
        f"/resumes/{resume.id}/sections/{section.id}/blocks",
        json={"block_id": str(block.id), "position": 0},
    )

    response = await client.delete(f"/resumes/{resume.id}/sections/{section.id}/blocks/{block.id}")

    assert response.status_code == 204


async def test_detach_block_from_section_not_attached(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)
    section = await _create_section(db_session, resume_id=resume.id)

    response = await client.delete(f"/resumes/{resume.id}/sections/{section.id}/blocks/{uuid.uuid4()}")

    assert response.status_code == 404


async def test_reorder_section_blocks_happy_path(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)
    section = await _create_section(db_session, resume_id=resume.id, section_type="work_experience")
    block_a = await _create_block(db_session, user_id=test_user_id)
    block_b = await _create_block(db_session, user_id=test_user_id)
    await client.post(
        f"/resumes/{resume.id}/sections/{section.id}/blocks",
        json={"block_id": str(block_a.id), "position": 0},
    )
    await client.post(
        f"/resumes/{resume.id}/sections/{section.id}/blocks",
        json={"block_id": str(block_b.id), "position": 1},
    )

    response = await client.patch(
        f"/resumes/{resume.id}/sections/{section.id}/blocks/reorder",
        json={"blocks": [{"block_id": str(block_a.id), "position": 1}, {"block_id": str(block_b.id), "position": 0}]},
    )

    assert response.status_code == 204


async def test_reorder_section_blocks_resume_not_found(client):
    response = await client.patch(
        f"/resumes/{uuid.uuid4()}/sections/{uuid.uuid4()}/blocks/reorder", json={"blocks": []}
    )

    assert response.status_code == 404


async def test_requires_authentication(unauthenticated_client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)

    response = await unauthenticated_client.get(f"/resumes/{resume.id}/sections")

    assert response.status_code == 401
