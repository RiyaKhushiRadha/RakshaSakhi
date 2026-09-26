from fastapi import APIRouter
from backend.models.schemas import ChatRequest

router = APIRouter()

@router.post("/chat")
async def chat_interaction(request: ChatRequest):
    return {
        "reply": "Deep breaths. Stay calm, help is being notified. Where are you right now?"
    }
