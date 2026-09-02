from database import _clean_url


def test_strips_sslmode():
    url = "postgresql+asyncpg://user:pass@host/db?sslmode=require"
    assert _clean_url(url) == "postgresql+asyncpg://user:pass@host/db"


def test_strips_channel_binding():
    url = "postgresql+asyncpg://user:pass@host/db?channel_binding=require"
    assert _clean_url(url) == "postgresql+asyncpg://user:pass@host/db"


def test_strips_both_together():
    url = "postgresql+asyncpg://user:pass@host/db?sslmode=require&channel_binding=require"
    assert _clean_url(url) == "postgresql+asyncpg://user:pass@host/db"


def test_preserves_unrelated_query_params():
    url = "postgresql+asyncpg://user:pass@host/db?foo=bar&sslmode=require"
    assert _clean_url(url) == "postgresql+asyncpg://user:pass@host/db?foo=bar"


def test_no_query_string_is_noop():
    url = "postgresql+asyncpg://user:pass@host/db"
    assert _clean_url(url) == url


def test_repeated_key_keeps_only_first_value():
    url = "postgresql+asyncpg://user:pass@host/db?foo=first&foo=second"
    assert _clean_url(url) == "postgresql+asyncpg://user:pass@host/db?foo=first"


def test_credentials_host_and_path_untouched():
    url = "postgresql+asyncpg://user:pass@host:5433/mydb?sslmode=require"
    cleaned = _clean_url(url)
    assert cleaned.startswith("postgresql+asyncpg://user:pass@host:5433/mydb")


def test_idempotent():
    url = "postgresql+asyncpg://user:pass@host/db?sslmode=require&foo=bar"
    once = _clean_url(url)
    twice = _clean_url(once)
    assert once == twice
