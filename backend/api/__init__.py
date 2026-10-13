from backend.api.documents import router as documents_router
from backend.api.ai import router as ai_router
from backend.api.analytics import router as analytics_router
from backend.api.export import router as export_router

__all__ = ["documents_router", "ai_router", "analytics_router", "export_router"]
