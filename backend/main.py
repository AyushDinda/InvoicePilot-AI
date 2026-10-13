import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database.session import init_db
from backend.services.storage_service import get_absolute_storage_dir
from backend.api.documents import router as documents_router
from backend.api.ai import router as ai_router
from backend.api.analytics import router as analytics_router
from backend.api.export import router as export_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-initialize SQLite database tables on startup
    init_db()
    # Ensure local storage folder exists
    get_absolute_storage_dir()
    yield


app = FastAPI(
    title="InvoicePilot AI API",
    description="Privacy-focused, local-first AI financial document organizer for freelancers and small businesses.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
raw_cors = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
origins = [origin.strip() for origin in raw_cors.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(documents_router)
app.include_router(ai_router)
app.include_router(analytics_router)
app.include_router(export_router)


@app.get("/api/health", tags=["health"])
def health_check():
    """
    Health check endpoint for container probes, uptime monitoring, and tests.
    """
    return {
        "status": "healthy",
        "app": "InvoicePilot AI",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
    }


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("backend.main:app", host=host, port=port, reload=True)
