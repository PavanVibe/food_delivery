from functools import lru_cache
from typing import Literal

from psycopg.conninfo import make_conninfo
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str | None = None
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "foodhub"
    db_user: str = "postgres"
    db_password: str = "postgres"

    embedding_provider: Literal["huggingface", "fake"] = "huggingface"
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    llm_provider: Literal["gemini", "none"] = "gemini"
    llm_model: str = "gemini-3.5-flash-lite"
    llm_thinking_level: Literal["minimal", "low", "medium", "high"] = "minimal"
    llm_timeout_seconds: float = 20
    gemini_api_key: str | None = None

    index_dir: str = "indexes/menu"
    retrieval_k: int = 8
    internal_api_key: str = "dev-internal-key"

    @property
    def conninfo(self) -> str:
        if self.database_url:
            return self.database_url
        return make_conninfo(
            host=self.db_host,
            port=self.db_port,
            dbname=self.db_name,
            user=self.db_user,
            password=self.db_password,
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
