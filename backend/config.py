from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    supabase_url: str = "https://your-project.supabase.co"
    supabase_key: str = "your-anon-key"
    database_url: str = "postgresql://postgres:postgres@localhost:5432/osint_db"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_workers: int = 4

    # Security
    secret_key: str = "dev-secret-key-change-in-production"
    debug: bool = True

    # OSINT
    mock_mode: bool = True
    breach_db_api_key: str = "demo"
    social_api_key: str = "demo"

    # Celery
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/0"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
