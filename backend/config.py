from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str
    clerk_jwks_url: str
    openai_api_key: str
    r2_account_id: str = ""
    r2_access_key_id: str
    r2_secret_access_key: str
    r2_bucket_name: str
    r2_endpoint: str = ""
    r2_public_url: str = ""


settings = Settings()
