import uuid

from models import Resume


async def _create_resume(db_session, *, user_id: str, filename: str = "resume.pdf") -> Resume:
    resume = Resume(user_id=user_id, filename=filename, resume_text="hello world")
    db_session.add(resume)
    await db_session.commit()
    await db_session.refresh(resume)
    return resume


async def test_list_resumes_empty(client):
    response = await client.get("/resumes")

    assert response.status_code == 200
    assert response.json() == []


async def test_list_resumes_only_returns_own(client, db_session, test_user_id):
    await _create_resume(db_session, user_id=test_user_id)
    await _create_resume(db_session, user_id="someone-else")

    response = await client.get("/resumes")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["filename"] == "resume.pdf"


async def test_get_resume(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)

    response = await client.get(f"/resumes/{resume.id}")

    assert response.status_code == 200
    assert response.json()["id"] == str(resume.id)


async def test_get_resume_not_found(client):
    response = await client.get(f"/resumes/{uuid.uuid4()}")

    assert response.status_code == 404


async def test_get_resume_wrong_user_not_found(client, db_session):
    resume = await _create_resume(db_session, user_id="someone-else")

    response = await client.get(f"/resumes/{resume.id}")

    assert response.status_code == 404


async def test_delete_resume(client, db_session, test_user_id):
    resume = await _create_resume(db_session, user_id=test_user_id)

    response = await client.delete(f"/resumes/{resume.id}")
    assert response.status_code == 204

    follow_up = await client.get(f"/resumes/{resume.id}")
    assert follow_up.status_code == 404


async def test_requires_authentication(unauthenticated_client):
    response = await unauthenticated_client.get("/resumes")

    assert response.status_code == 401
