from fastapi import FastAPI

from app.api.auth import router as auth_router


app = FastAPI(
    title="Lecture-to-Life API",
    description="AI-powered lecture learning companion",
    version="0.1.0",
)


app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to Lecture-to-Life API",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
    }