import time
from unittest.mock import AsyncMock

import httpx
import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

import auth


async def _verify(token: str):
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    return await auth.verify_clerk_token(credentials)


@pytest.fixture(autouse=True)
def _mock_jwks_fetch(monkeypatch, jwks):
    """By default, serve the test JWKS without any real HTTP call."""
    response = httpx.Response(200, json=jwks, request=httpx.Request("GET", "http://jwks.test"))
    mock_get = AsyncMock(return_value=response)
    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)
    return mock_get


async def test_valid_token_returns_sub(make_jwt):
    token = make_jwt(sub="user-abc")

    user_id = await _verify(token)

    assert user_id == "user-abc"


async def test_missing_kid_in_jwks(make_jwt):
    token = make_jwt(kid="unknown-kid")

    with pytest.raises(HTTPException) as exc_info:
        await _verify(token)

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Key not found"


async def test_malformed_token():
    with pytest.raises(HTTPException) as exc_info:
        await _verify("not-a-jwt")

    assert exc_info.value.status_code == 401


async def test_expired_token(make_jwt):
    token = make_jwt(exp=int(time.time()) - 3600)

    with pytest.raises(HTTPException) as exc_info:
        await _verify(token)

    assert exc_info.value.status_code == 401


async def test_missing_sub_claim(make_jwt):
    token = make_jwt(sub="")

    with pytest.raises(HTTPException) as exc_info:
        await _verify(token)

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Invalid token"


async def test_wrong_algorithm_rejected():
    from jose import jwt as jose_jwt

    # Signed with HS256 instead of RS256 — should never be accepted since
    # verify_clerk_token pins algorithms=["RS256"].
    token = jose_jwt.encode(
        {"sub": "user-abc", "exp": int(time.time()) + 3600},
        "some-hmac-secret",
        algorithm="HS256",
        headers={"kid": "test-kid"},
    )

    with pytest.raises(HTTPException) as exc_info:
        await _verify(token)

    assert exc_info.value.status_code == 401


async def test_jwks_is_cached_across_calls(make_jwt, _mock_jwks_fetch):
    token = make_jwt()

    await _verify(token)
    await _verify(token)

    assert _mock_jwks_fetch.call_count == 1


async def test_jwks_fetch_error_returns_401_not_500(monkeypatch, make_jwt):
    async def raise_error(*args, **kwargs):
        raise httpx.HTTPStatusError("boom", request=httpx.Request("GET", "http://jwks"), response=httpx.Response(500))

    monkeypatch.setattr(httpx.AsyncClient, "get", raise_error)
    token = make_jwt()

    with pytest.raises(HTTPException) as exc_info:
        await _verify(token)

    assert exc_info.value.status_code == 401
