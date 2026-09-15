from fastapi import FastAPI

app=FastAPI(
    title="Lecture-to-Life API",
    description="AI powered lecture learning companion",
    version="0.1.0",
)

@app.get("/")
def root():
    return{
        "message": "Welcome to lecture to life API",
        "status": "running",
    }

@app.get("/health")
def health_check():
    return{
        "status": "healthy",
    }