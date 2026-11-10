from functools import lru_cache
from pathlib import Path
from pydantic import EmailStr, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    PROJECT_NAME: str = "Achados e Perdidos API"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = Field(
        default="change-me-to-a-secure-secret-key-123456", min_length=32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60, gt=0)

    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_HOST: str = "db"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "achados_perdidos"

    SMTP_HOST: str = "mailpit"
    SMTP_PORT: int = 1025
    SMTP_FROM_EMAIL: EmailStr = "noreply@achados.com"
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_USE_TLS: bool = True
    SMTP_TIMEOUT_SECONDS: int = 15

    BREVO_API_KEY: str = ""
    BREVO_API_URL: str = "https://api.brevo.com/v3"
    BREVO_SENDER_NAME: str = "Achados e Perdidos"
    BREVO_SENDER_EMAIL: EmailStr | str = "noreply@achados.com"

    DSGNER_API_BASE_URL: str = ""
    DSGNER_API_KEY: str = ""
    DSGNER_TIMEOUT_SECONDS: int = 30
    DSGNER_SIGNATURE_PATH: str = "/v1/signature-requests"
    DSGNER_STATUS_PATH: str = "/v1/signature-requests/{signature_id}"

    TWO_FACTOR_ISSUER: str = "Achados e Perdidos"
    TWO_FACTOR_WINDOW: int = 1

    UPLOAD_DIR: str = "/app/uploads"

    @property
    def ASYNC_DATABASE_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def UPLOAD_DIR_PATH(self) -> Path:
        return Path(self.UPLOAD_DIR).expanduser().resolve()


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
