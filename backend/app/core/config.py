"""
All settings of the app live in this one file.

Why: if a value (model name, file size limit, score weights) is written
directly inside the logic, you have to hunt for it later. Here you change
it in one place, or override it from the .env file without touching code.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Shortlist API"
    log_level: str = "INFO"

    # Which frontend URLs are allowed to call this API (CORS).
    allowed_origins: list[str] = ["http://localhost:5173"]

    # SQLite is a single file, good for local work. Changing this one URL
    # to a PostgreSQL URL is enough to switch databases, because all
    # queries go through SQLAlchemy.
    database_url: str = "sqlite:///./shortlist.db"

    # Used to sign login tokens. Anyone who knows it can forge a login, so
    # set your own long random value in .env and never commit that file.
    secret_key: str = "dev-only-secret-change-me-in-dot-env-file"
    access_token_minutes: int = 60 * 24   # a login stays valid for one day

    # A Hugging Face model name, or a local folder that contains the model
    # fine-tuned by training/train.py.
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    max_file_size_mb: int = 5
    max_rank_files: int = 10
    min_text_chars: int = 50

    # Final score = semantic_weight * semantic score + skill_weight * skill score
    semantic_weight: float = 0.6
    skill_weight: float = 0.4

    # Cosine similarity between one JD line and its closest resume line:
    #   >= covered_threshold  -> resume clearly talks about it
    #   >= partial_threshold  -> resume talks about something related
    #   below                 -> nothing close in the resume
    covered_threshold: float = 0.55
    partial_threshold: float = 0.40

    # Raw cosine similarity of two related sentences is usually between
    # 0.2 and 0.7 with this model, almost never 0 or 1. So we stretch that
    # range to 0-100 to get a score a human can read.
    similarity_floor: float = 0.20
    similarity_ceiling: float = 0.70

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    # lru_cache = build the Settings object once and reuse the same one.
    return Settings()
