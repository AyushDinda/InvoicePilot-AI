from fastapi import APIRouter
from backend.schemas.ai import AIStatusResponse
from backend.services.ai_service import check_ollama_status, MOCK_AI_ENV
import backend.services.ai_service as ai_service

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.get("/status", response_model=AIStatusResponse)
async def get_ai_status():
    """
    Returns the real-time connectivity status of local Ollama,
    whether the configured model is installed, and if Mock Mode is active.
    """
    return await check_ollama_status()


@router.post("/toggle-mock")
def toggle_mock_mode():
    """
    Allows developers / evaluators to toggle Mock AI mode during testing without Ollama.
    """
    ai_service.MOCK_AI_ENV = not ai_service.MOCK_AI_ENV
    return {
        "mock_mode": ai_service.MOCK_AI_ENV,
        "message": f"Mock AI mode is now {'ENABLED' if ai_service.MOCK_AI_ENV else 'DISABLED'}",
    }
