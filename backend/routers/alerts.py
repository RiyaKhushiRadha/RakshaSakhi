from fastapi import APIRouter

router = APIRouter()

@router.post("/alert/telegram")
async def send_telegram_alert():
    return {
        "status": "mock_sent",
        "channel": "telegram"
    }

@router.get("/alert/status")
async def alert_status():
    return {
        "status": "healthy",
        "message": "Alert system is operational"
    }
