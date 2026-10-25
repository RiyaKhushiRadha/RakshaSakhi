import asyncio
import logging
from typing import Optional, Union, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import httpx

from backend.config.settings import settings
from backend.database import get_db, Contact
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
async def send_telegram_alert(
    payload: Optional[AlertRequest] = None,
    db: Session = Depends(get_db)
):
    """
    Send an emergency SOS alert to all saved contacts with Telegram Chat IDs (concurrent broadcast),
    falling back to settings.TELEGRAM_CHAT_ID if no contacts with Telegram IDs exist.
    """
    bot_token = settings.TELEGRAM_BOT_TOKEN

    if not bot_token:
        logger.error("Telegram alert failed: Missing TELEGRAM_BOT_TOKEN.")
        return {
            "status": "error",
            "message": "Telegram bot token is not configured.",
            "channel": "telegram"
        }

    # 1. Collect target chat IDs: settings.TELEGRAM_CHAT_ID (if set) + all active contacts from DB
    target_chat_ids = []
    if settings.TELEGRAM_CHAT_ID and str(settings.TELEGRAM_CHAT_ID).strip():
        target_chat_ids.append(str(settings.TELEGRAM_CHAT_ID).strip())

    contacts_with_telegram = (
        db.query(Contact)
        .filter(Contact.telegram_chat_id.isnot(None), Contact.telegram_chat_id != "")
        .all()
    )
    for c in contacts_with_telegram:
        if c.telegram_chat_id and c.telegram_chat_id.strip():
            target_chat_ids.append(c.telegram_chat_id.strip())

    # Deduplicate while preserving order
    target_chat_ids = list(dict.fromkeys(target_chat_ids))

    if not target_chat_ids:
        logger.error("Telegram alert failed: No emergency contacts with Telegram ID and no settings.TELEGRAM_CHAT_ID configured.")
        return {
            "status": "error",
            "message": "No emergency contacts with Telegram Chat ID found and fallback TELEGRAM_CHAT_ID is not configured.",
            "channel": "telegram"
        }

    # 3. Prepare message payload
    loc_str = format_location_string(payload.location if payload else None)
    message_text = (
        "🚨 *EMERGENCY SOS ALERT!*\n\n"
        "RakshaSakhi user has triggered an SOS alert. Please check immediately or call them!\n\n"
        f"{loc_str}"
    )

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"

    # 4. Helper for individual chat dispatch
    async def _send_to_chat(client: httpx.AsyncClient, chat_id: str) -> dict:
        body = {
            "chat_id": chat_id,
            "text": message_text,
            "parse_mode": "Markdown"
        }
        try:
            response = await client.post(url, json=body)
            if response.status_code >= 400:
                logger.error(f"Telegram HTTP error {response.status_code} for chat {chat_id}: {response.text}")
                return {"chat_id": chat_id, "success": False, "error": f"HTTP error {response.status_code}"}
            data = response.json()
            if not data.get("ok"):
                error_desc = data.get("description", "Unknown Telegram API error")
                logger.error(f"Telegram API returned error for chat {chat_id}: {error_desc}")
                return {"chat_id": chat_id, "success": False, "error": error_desc}
            return {"chat_id": chat_id, "success": True}
        except Exception as exc:
            logger.error(f"Telegram alert exception for chat {chat_id}: {exc}")
            return {"chat_id": chat_id, "success": False, "error": str(exc)}

    # 5. Concurrent broadcast using asyncio.gather
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            tasks = [_send_to_chat(client, cid) for cid in target_chat_ids]
            results = await asyncio.gather(*tasks)

        successful_sends = [r for r in results if r.get("success")]
        if successful_sends:
            logger.info(f"Telegram SOS broadcast sent successfully to {len(successful_sends)}/{len(target_chat_ids)} recipients.")
            return {
                "status": "sent",
                "channel": "telegram",
                "recipients_sent": len(successful_sends),
                "total_recipients": len(target_chat_ids)
            }
        else:
            errors = [r.get("error") for r in results]
            return {
                "status": "error",
                "message": f"Broadcast failed for all recipients: {'; '.join(filter(None, errors))}",
                "channel": "telegram"
            }
    except Exception as exc:
        logger.error(f"Telegram broadcast exception: {exc}")
        return {
            "status": "error",
            "message": f"Failed to send broadcast alert: {str(exc)}",
            "channel": "telegram"
        }


@router.get("/alert/status")
async def alert_status(db: Session = Depends(get_db)):
    """
    Check if alert channels (Telegram) are configured properly.
    """
    has_bot_token = bool(settings.TELEGRAM_BOT_TOKEN and str(settings.TELEGRAM_BOT_TOKEN).strip())
    has_fallback_chat = bool(settings.TELEGRAM_CHAT_ID and str(settings.TELEGRAM_CHAT_ID).strip())

    # Check if there are any contacts with telegram_chat_id in DB
    contacts_count = (
        db.query(Contact)
        .filter(Contact.telegram_chat_id.isnot(None), Contact.telegram_chat_id != "")
        .count()
    )

    telegram_configured = has_bot_token and (has_fallback_chat or contacts_count > 0)

    return {
        "status": "healthy" if telegram_configured else "unconfigured",
        "telegram_configured": telegram_configured,
        "contacts_with_telegram": contacts_count,
        "message": "Alert system is operational" if telegram_configured else "Telegram credentials are not configured"
    }
