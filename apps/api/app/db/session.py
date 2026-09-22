import os
from pathlib import Path
from urllib.parse import parse_qsl, quote, unquote, urlencode, urlsplit, urlunsplit
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


def _normalize_database_url(raw_url: str) -> str:
    if not raw_url:
        return raw_url

    url = raw_url.strip().strip('"')
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    parsed_url = urlsplit(url)
    query_params = [
        (key, value) for key, value in parse_qsl(parsed_url.query, keep_blank_values=True)
        if key.lower() != "pgbouncer"
    ]

    if parsed_url.scheme in {"postgresql", "postgres"} and "sslmode" not in {key.lower() for key, _ in query_params}:
        query_params.append(("sslmode", "require"))

    encoded_user = quote(unquote(parsed_url.username or ""), safe="")
    encoded_password = quote(unquote(parsed_url.password or ""), safe="")
    encoded_host = parsed_url.hostname or ""
    if ":" in encoded_host and not encoded_host.startswith("["):
        encoded_host = f"[{encoded_host}]"
    if parsed_url.port:
        encoded_host = f"{encoded_host}:{parsed_url.port}"

    encoded_netloc = encoded_user
    if parsed_url.password is not None:
        encoded_netloc = f"{encoded_netloc}:{encoded_password}"
    encoded_netloc = f"{encoded_netloc}@{encoded_host}"

    return urlunsplit(parsed_url._replace(
        netloc=encoded_netloc,
        query=urlencode(query_params)
    ))

# Explicitly load .env from apps/api/.env or current working directory
env_file = Path(__file__).resolve().parents[2] / ".env"
if env_file.exists():
    load_dotenv(dotenv_path=env_file, override=True)
else:
    load_dotenv(override=True)

# Database URL configuration (Supports Supabase PostgreSQL & local SQLite fallback)
env_db_url = os.getenv("DATABASE_URL", "").strip()

if env_db_url:
    DATABASE_URL = _normalize_database_url(env_db_url)
    connect_args = {}
    if DATABASE_URL.startswith("postgresql"):
        connect_args = {"sslmode": "require"}

    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        connect_args=connect_args
    )
else:
    # SQLite database file stored in apps/api directory for zero-friction local persistence
    DB_DIR = os.path.dirname(os.path.abspath(__file__))
    DB_FILE = os.path.join(os.path.dirname(DB_DIR), "clinicos.db")
    DATABASE_URL = f"sqlite:///{DB_FILE}"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
