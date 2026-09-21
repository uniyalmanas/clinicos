import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Database URL configuration (Supports Supabase PostgreSQL & local SQLite fallback)
env_db_url = os.getenv("DATABASE_URL", "").strip()

if env_db_url:
    # Normalize postgres:// to postgresql:// for SQLAlchemy compatibility
    if env_db_url.startswith("postgres://"):
        env_db_url = env_db_url.replace("postgres://", "postgresql://", 1)
    
    DATABASE_URL = env_db_url
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
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
