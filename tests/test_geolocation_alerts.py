import asyncio
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.routers.alerts import format_location_string


def test_format_location_string():
    # Scenario A: Valid lat/lon dict
    loc = {"lat": 28.6139, "lon": 77.2090}
    res = format_location_string(loc)
    assert res == "📍 Location: https://maps.google.com/?q=28.6139,77.209"

    # Scenario B: latitude / longitude keys
    loc_alt = {"latitude": 19.0760, "longitude": 72.8777}
    res_alt = format_location_string(loc_alt)
    assert res_alt == "📍 Location: https://maps.google.com/?q=19.076,72.8777"

    # Scenario C: None / Empty dict
    assert format_location_string(None) == "📍 Location: GPS unavailable / permission denied"
    assert format_location_string({}) == "📍 Location: GPS unavailable / permission denied"

    # Scenario D: Invalid types
    assert format_location_string("somewhere") == "📍 Location: GPS unavailable / permission denied"
    assert format_location_string({"lat": "invalid", "lon": "invalid"}) == "📍 Location: GPS unavailable / permission denied"


def test_api_trigger_with_location():
    async def _run():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            payload = {
                "type": "button",
                "trigger_type": "button",
                "location": {"lat": 28.6139, "lon": 77.2090, "accuracy": 15.0}
            }
            response = await client.post("/api/trigger", json=payload)
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "triggered"
            assert data["location"]["lat"] == 28.6139
            assert data["location"]["lon"] == 77.2090

    asyncio.run(_run())


def test_api_alert_telegram_with_location():
    async def _run():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Alert with live GPS coordinates
            payload = {
                "type": "button",
                "location": {"lat": 28.6139, "lon": 77.2090}
            }
            response = await client.post("/api/alert/telegram", json=payload)
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "sent"
            assert data["channel"] == "telegram"

    asyncio.run(_run())


def test_api_alert_telegram_fallback_location():
    async def _run():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Alert without location (permission denied / GPS unavailable)
            payload = {
                "type": "button",
                "location": None
            }
            response = await client.post("/api/alert/telegram", json=payload)
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "sent"
            assert data["channel"] == "telegram"

    asyncio.run(_run())


def test_api_alert_status():
    async def _run():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/alert/status")
            assert response.status_code == 200
            data = response.json()
            assert data["telegram_configured"] is True
            assert data["status"] == "healthy"

    asyncio.run(_run())
