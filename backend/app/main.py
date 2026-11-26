from typing import Annotated

from fastapi import Depends, FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.auth import router as auth_router
from app.api.flashcards import router as flashcards_router
from app.api.lectures import router as lectures_router
from app.api.progress import router as progress_router
from app.api.quizzes import router as quizzes_router
from app.api.tutor import router as tutor_router
from app.core.config import settings
from app.db.dependencies import get_db

app = FastAPI(
    title="Lecture-to-Life API",
    description="AI-powered lecture learning companion",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(lectures_router)
app.include_router(flashcards_router)
app.include_router(quizzes_router)
app.include_router(tutor_router)
app.include_router(progress_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to Lecture-to-Life API",
        "status": "running",
    }


@app.get("/health")
def health_check(db: Annotated[Session, Depends(get_db)]):
    """Verify API and database connectivity."""
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unhealthy"},
        )
    return {"status": "healthy"}
