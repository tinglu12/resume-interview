import uuid

from main import app


async def test_service_error_handler_response_shape(client):
    response = await client.get(f"/resumes/{uuid.uuid4()}")

    assert response.status_code == 404
    assert response.json() == {"detail": "Resume not found"}


async def test_cors_allows_configured_origin(client):
    response = await client.options(
        "/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"


async def test_cors_rejects_other_origin(client):
    response = await client.options(
        "/health",
        headers={
            "Origin": "http://evil.example.com",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert "access-control-allow-origin" not in response.headers


def test_interview_routes_not_mounted_by_default():
    interview_paths = {"/jobs", "/sessions"}
    mounted_paths = {getattr(route, "path", None) for route in app.routes}

    assert interview_paths.isdisjoint(mounted_paths)
