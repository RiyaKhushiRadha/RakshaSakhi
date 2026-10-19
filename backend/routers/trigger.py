from fastapi import APIRouter
from backend.models.schemas import TriggerRequest
from datetime import datetime, timezone

router = APIRouter()

@router.post("/trigger")
async def handle_trigger(request: TriggerRequest):
    response = {
        "status": "triggered",
        "mode": request.type,
        "message": "Emergency sequence initiated",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    if request.location:
        response["location"] = request.location
    return response
