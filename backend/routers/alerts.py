import logging
from typing import Optional, Union, Any
from fastapi import APIRouter
import httpx
from backend.config.settings import settings
from backend.models.schemas import AlertRequest

logger = logging.getLogger(__name__)

router = APIRouter()


def format_location_string(location: Optional[Union[dict, str, Any]]) -> str:
    """
    Format location object into a clickable Google Maps link or fallback message.
    """
    if isinstance(location, dict):
        lat = location.get("lat")
        if lat is None:
            lat = location.get("latitude")

        lon = location.get("lon")
        if lon is None:
            lon = location.get("lng")
        if lon is None:
            lon = location.get("longitude")

        if lat is not None and lon is not None:
            try:
                lat_f = float(lat)
                lon_f = float(lon)
                return f"📍 Location: https://maps.google.com/?q={lat_f},{lon_f}"
            except (ValueError, TypeError):
                pass

    return "📍 Location: GPS unavailable / permission denied"


@router.post("/alert/telegram")
async def send_telegram_alert(payload: Optional[AlertRequest] = None):
    """
    Send an emergency SOS alert to the configured Telegram chat with live location.
    """
    bot_token = settings.TELEGRAM_BOT_TOKEN
    chat_id = settings.TELEGRAM_CHAT_ID

    if not bot_token or not chat_id:
        logger.error("Telegram alert failed: Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID.")
        return {
            "status": "error",
            "message": "Telegram bot token or chat ID is not configured.",
            "channel": "telegram"
        }

    loc_str = format_location_string(payload.location if payload else None)
    message_text = (
        "🚨 *EMERGENCY SOS ALERT!*\n\n"
        "RakshaSakhi user has triggered an SOS alert. Please check immediately or call them!\n\n"
        f"{loc_str}"
    )

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    body = {
        "chat_id": chat_id,
        "text": message_text,
        "parse_mode": "Markdown"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=body)
            response.raise_for_status()
            data = response.json()

            if not data.get("ok"):
                error_desc = data.get("description", "Unknown Telegram API error")
                logger.error(f"Telegram API returned error: {error_desc}")
                return {
                    "status": "error",
                    "message": f"Telegram API error: {error_desc}",
                    "channel": "telegram"
                }

        logger.info(f"Telegram emergency alert sent successfully to chat_id: {chat_id}")
        return {
            "status": "sent",
            "channel": "telegram"
        }
    except httpx.HTTPStatusError as exc:
        logger.error(f"Telegram HTTP error: {exc.response.text}")
        return {
            "status": "error",
            "message": f"Telegram HTTP error: {exc.response.text}",
            "channel": "telegram"
        }
    except Exception as exc:
        logger.error(f"Telegram alert exception: {exc}")
        return {
            "status": "error",
            "message": f"Failed to send alert: {str(exc)}",
            "channel": "telegram"
        }


@router.get("/alert/status")
async def alert_status():
    """
    Check if alert channels (Telegram) are configured properly.
    """
    telegram_configured = bool(
        settings.TELEGRAM_BOT_TOKEN
        and str(settings.TELEGRAM_BOT_TOKEN).strip()
        and settings.TELEGRAM_CHAT_ID
        and str(settings.TELEGRAM_CHAT_ID).strip()
    )

    return {
        "status": "healthy" if telegram_configured else "unconfigured",
        "telegram_configured": telegram_configured,
        "message": "Alert system is operational" if telegram_configured else "Telegram credentials are not configured"
    }
