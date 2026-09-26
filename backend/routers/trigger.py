from fastapi import APIRouter
from backend.models.schemas import TriggerRequest
from datetime import datetime, timezone

router = APIRouter()

@router.post("/trigger")
async def handle_trigger(request: TriggerRequest):
    return {
        "status": "triggered",
        "mode": request.type,
        "message": "Emergency sequence initiated",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
