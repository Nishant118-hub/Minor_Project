from fastapi import FastAPI

from .api.routes import router
from .config import settings

app = FastAPI(
    title="Cyber Awareness AI Service",
    version="0.1.0",
    description="Internal AI microservice for cyber-awareness and defensive metaverse security analysis.",
)
app.include_router(router)


@app.get("/health")
def health_check() -> dict[str, str | int]:
    """Return service availability without exposing model or user data."""
    return {"service": "ai-service", "status": "ok", "port": settings.port}
