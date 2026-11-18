import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from apps.api.config import settings
from apps.api.database import engine, Base
from apps.api.routers import ws_audio, consultations, companion, reports, patient_memory

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("clinicos_api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing ClinicOS AI Clinical Companion backend...")
    # Ensure tables exist (synced with alembic/sql)
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified.")
    except Exception as e:
        logger.warning(f"Database initialization notice: {e}")
    yield
    logger.info("Shutting down ClinicOS AI Clinical Companion backend.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Production-Oriented AI Clinical Companion for ClinicOS with LangGraph & WebSocket Audio Gateway",
    lifespan=lifespan,
)

# CORS — origins are locked to known app hosts.
# Configured via CORS_ORIGINS in config.py / .env.local
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# Register Routers
app.include_router(ws_audio.router)
app.include_router(consultations.router)
app.include_router(companion.router)
app.include_router(reports.router)
app.include_router(patient_memory.router)


@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ClinicOS AI Clinical Companion Backend",
        "transcription_provider": "Groq Whisper" if settings.GROQ_API_KEY else "Fallback / Local",
        "orchestration": "LangGraph",
        "llm_provider": settings.LLM_PROVIDER or "auto",
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "groq_configured": bool(settings.GROQ_API_KEY),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("apps.api.main:app", host=settings.HOST, port=settings.PORT, reload=True)
