import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings

# Attempt to load from root .env.local or apps/web/.env.local
def _load_env_files():
    root = Path(__file__).resolve().parent.parent.parent
    for env_path in [root / ".env.local", root / "apps" / "web" / ".env.local", root / ".env"]:
        if env_path.exists():
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        if k not in os.environ:
                            os.environ[k] = v

_load_env_files()


def _normalize_db_url(raw: str) -> str:
    raw = (raw or "").strip().replace("\r", "").replace("\n", "").strip('"').strip("'")
    if not raw:
        return ""
    if raw.startswith("postgres://[SENSITIVE]"):
        return ""
    if raw.startswith("postgres://"):
        raw = "postgresql://" + raw[len("postgres://"):]
    return raw


class Settings(BaseSettings):
    PROJECT_NAME: str = "ClinicOS AI Clinical Companion"
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    DATABASE_URL: str = _normalize_db_url(os.getenv("DATABASE_URL", ""))
    DIRECT_DATABASE_URL: str = _normalize_db_url(os.getenv("DIRECT_DATABASE_URL", ""))
    
    # AI Keys & Models
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GROQ_CHAT_MODEL: str = os.getenv("GROQ_CHAT_MODEL", "llama-3.3-70b-versatile")
    OPENAI_CHAT_MODEL: str = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o")

    # Sprint 3: Provider Abstraction & Local Fallback
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "groq")  # "groq" or "ollama"
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
    EMBEDDING_PROVIDER: str = os.getenv("EMBEDDING_PROVIDER", "local")  # "local", "ollama", "openai"
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")
    STT_PROVIDER: str = os.getenv("STT_PROVIDER", "groq")  # "groq" or "local"
    
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "clinicos-secret-key-development")
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]


settings = Settings()
