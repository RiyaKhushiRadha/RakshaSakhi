from fastapi import APIRouter
from backend.models.schemas import ChatRequest
from backend.services.langchain_ai import generate_chat_response, get_welcome_greeting

router = APIRouter()

@router.get("/chat/welcome")
async def chat_welcome(mode: str = "daily", session_id: str = "default"):
    """
    Get proactive welcome message for the selected mode ('daily' or 'emergency').
    """
    reply = await get_welcome_greeting(mode=mode, session_id=session_id)
    return {"reply": reply}

@router.post("/chat")
async def chat_interaction(request: ChatRequest):
    """
    Process incoming chat messages and return Gemini AI response.
    """
    reply = await generate_chat_response(
        user_message=request.message,
        session_id=request.session_id or "default",
        mode=request.mode or "daily",
        location=request.location
    )
    return {
        "reply": reply,
        "mode": request.mode or "daily"
    }
