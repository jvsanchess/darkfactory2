from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "DarkFactory API"
    app_version: str = "0.2.0"
    environment: str = "development"
    api_prefix: str = "/api/v1"
    database_url: str = (
        "postgresql+psycopg://darkfactory:darkfactory@localhost:5432/darkfactory"
    )
    redis_url: str = "redis://localhost:6379/0"
    queue_name: str = "darkfactory"
    queue_enabled: bool = False
    auto_create_schema: bool = False
    seed_demo_data: bool = True
    cors_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:3000,http://localhost:4173,"
        "https://darkfactory-studio.joaovitosanches.chatgpt.site"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="DARKFACTORY_",
        extra="ignore",
    )

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
