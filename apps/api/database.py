from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from apps.api.config import settings

# For psycopg2 connection URL
db_url = settings.DATABASE_URL or settings.DIRECT_DATABASE_URL or "postgresql://postgres@127.0.0.1:55432/clinicos"
# Strip sslmode if localhost/loopback
is_loopback = "127.0.0.1" in db_url or "localhost" in db_url

connect_args = {}
if is_loopback:
    connect_args["sslmode"] = "disable"

engine = create_engine(
    db_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
