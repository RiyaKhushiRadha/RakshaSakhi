import asyncio
from unittest.mock import patch, MagicMock
import pytest
import httpx
from httpx import AsyncClient, ASGITransport, Response
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base, get_db, Contact
from backend.main import app
from backend.config.settings import settings


def test_contacts_crud_lifecycle():
    async def _run():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # 1. Initial GET should be empty
            res = await client.get("/api/contacts")
            assert res.status_code == 200
            assert res.json() == []

            # 2. POST create new emergency contact
            payload = {
                "name": "Aarav Sharma",
                "phone": "+919876543210",
                "telegram_chat_id": "123456789",
                "relationship": "Brother"
            }
            res = await client.post("/api/contacts", json=payload)
            assert res.status_code == 201
            contact_data = res.json()
            assert contact_data["name"] == "Aarav Sharma"
            assert contact_data["phone"] == "+919876543210"
            assert contact_data["telegram_chat_id"] == "123456789"
            assert contact_data["relationship"] == "Brother"
            assert contact_data["is_primary"] is True
            assert "id" in contact_data
            contact_id = contact_data["id"]

            # 3. GET should list the created contact
            res = await client.get("/api/contacts")
            assert res.status_code == 200
            contacts = res.json()
            assert len(contacts) == 1
            assert contacts[0]["id"] == contact_id

            # 4. POST contact without telegram_chat_id should fail with 422
            invalid_payload = {
                "name": "Diya Patel",
                "phone": "+919876543211",
                "relationship": "Friend"
            }
            res_invalid = await client.post("/api/contacts", json=invalid_payload)
            assert res_invalid.status_code == 422

            # POST another valid contact with telegram_chat_id
            payload2 = {
                "name": "Diya Patel",
                "phone": "+919876543211",
                "telegram_chat_id": "987654321",
                "relationship": "Friend"
            }
            res2 = await client.post("/api/contacts", json=payload2)
            assert res2.status_code == 201
            contact2_id = res2.json()["id"]

            res = await client.get("/api/contacts")
            assert len(res.json()) == 2

            # 5. DELETE the first contact
            del_res = await client.delete(f"/api/contacts/{contact_id}")
            assert del_res.status_code == 200
            assert del_res.json()["status"] == "deleted"

            # 6. Verify contact was removed
            res = await client.get("/api/contacts")
            contacts = res.json()
            assert len(contacts) == 1
            assert contacts[0]["id"] == contact2_id

            # 7. DELETE non-existent contact returns 404
            del_res404 = await client.delete(f"/api/contacts/999999")
            assert del_res404.status_code == 404

    asyncio.run(_run())


def test_telegram_broadcast_to_multiple_contacts():
    async def _run():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Seed 2 contacts with Telegram IDs
            await client.post("/api/contacts", json={
                "name": "Contact One",
                "phone": "1111111111",
                "telegram_chat_id": "111111111",
                "relationship": "Parent"
            })
            await client.post("/api/contacts", json={
                "name": "Contact Two",
                "phone": "2222222222",
                "telegram_chat_id": "222222222",
                "relationship": "Sibling"
            })

            dispatched_chats = []
            original_post = AsyncClient.post

            async def mock_post(self, url, *args, **kwargs):
                if "api.telegram.org" in str(url):
                    json_data = kwargs.get("json", {})
                    chat_id = json_data.get("chat_id")
                    dispatched_chats.append(chat_id)
                    # Return Telegram API ok response
                    return Response(
                        status_code=200,
                        json={"ok": True, "result": {"message_id": 1}},
                        request=httpx.Request("POST", str(url))
                    )
                return await original_post(self, url, *args, **kwargs)

            with patch("httpx.AsyncClient.post", new=mock_post):
                alert_payload = {
                    "type": "button",
                    "location": {"lat": 28.6139, "lon": 77.2090}
                }
                res = await client.post("/api/alert/telegram", json=alert_payload)
                assert res.status_code == 200
                data = res.json()
                assert data["status"] == "sent"
                # Broadcasts to BOTH settings.TELEGRAM_CHAT_ID and the 2 contacts
                assert data["recipients_sent"] == 3
                assert data["total_recipients"] == 3
                assert str(settings.TELEGRAM_CHAT_ID).strip() in dispatched_chats
                assert "111111111" in dispatched_chats
                assert "222222222" in dispatched_chats

    asyncio.run(_run())


def test_telegram_broadcast_fallback_to_settings():
    async def _run():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # No contacts saved in DB
            dispatched_chats = []
            original_post = AsyncClient.post

            async def mock_post(self, url, *args, **kwargs):
                if "api.telegram.org" in str(url):
                    json_data = kwargs.get("json", {})
                    dispatched_chats.append(json_data.get("chat_id"))
                    return Response(
                        status_code=200,
                        json={"ok": True, "result": {"message_id": 1}},
                        request=httpx.Request("POST", str(url))
                    )
                return await original_post(self, url, *args, **kwargs)

            with patch("httpx.AsyncClient.post", new=mock_post):
                res = await client.post("/api/alert/telegram", json={"type": "button"})
                assert res.status_code == 200
                data = res.json()
                assert data["status"] == "sent"
                assert data["recipients_sent"] == 1
                assert str(settings.TELEGRAM_CHAT_ID).strip() in dispatched_chats

    asyncio.run(_run())


def test_alert_status_with_contacts():
    async def _run():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Add a contact
            await client.post("/api/contacts", json={
                "name": "Status Test",
                "phone": "9999999999",
                "telegram_chat_id": "987654321",
                "relationship": "Friend"
            })

            res = await client.get("/api/alert/status")
            assert res.status_code == 200
            data = res.json()
            assert data["status"] == "healthy"
            assert data["telegram_configured"] is True
            assert data["contacts_with_telegram"] == 1

    asyncio.run(_run())


def test_contact_validation_missing_fields():
    async def _run():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Missing phone
            res = await client.post("/api/contacts", json={"name": "No Phone", "telegram_chat_id": "123"})
            assert res.status_code == 422

            # Missing name
            res2 = await client.post("/api/contacts", json={"phone": "1234567890", "telegram_chat_id": "123"})
            assert res2.status_code == 422

            # Missing telegram_chat_id
            res3 = await client.post("/api/contacts", json={"name": "Test", "phone": "1234567890"})
            assert res3.status_code == 422

            # Empty/whitespace telegram_chat_id
            res4 = await client.post("/api/contacts", json={"name": "Test", "phone": "1234567890", "telegram_chat_id": "   "})
            assert res4.status_code == 422

    asyncio.run(_run())


def test_static_frontend_contacts_markup():
    async def _run():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.get("/")
            assert res.status_code == 200
            html_text = res.text
            assert 'id="btn-menu"' in html_text
            assert 'id="contacts-modal"' in html_text
            assert 'class="modal-overlay hidden"' in html_text
            assert 'class="modal-container"' in html_text
            assert 'id="form-add-contact"' in html_text
            assert 'id="contacts-list"' in html_text
            # Interactive Telegram ID help badge & modal
            assert 'class="btn-id-help-badge"' in html_text
            assert 'id="btn-open-id-help"' in html_text
            assert 'id="id-help-modal"' in html_text
            assert 'https://t.me/userinfobot' in html_text
            # Success modal with WhatsApp & Telegram share
            assert 'id="contact-success-modal"' in html_text
            assert 'id="btn-share-whatsapp"' in html_text
            assert 'id="btn-share-telegram"' in html_text
            assert 'id="btn-copy-bot-link"' in html_text

    asyncio.run(_run())


def test_telegram_personalized_alert_and_html_escaping():
    async def _run():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            captured_requests = []
            original_post = AsyncClient.post

            async def mock_post(self, url, *args, **kwargs):
                if "api.telegram.org" in str(url):
                    captured_requests.append(kwargs.get("json", {}))
                    return Response(
                        status_code=200,
                        json={"ok": True, "result": {"message_id": 1}},
                        request=httpx.Request("POST", str(url))
                    )
                return await original_post(self, url, *args, **kwargs)

            with patch("httpx.AsyncClient.post", new=mock_post):
                # 1. Custom user name
                captured_requests.clear()
                res1 = await client.post("/api/alert/telegram", json={
                    "type": "button",
                    "user_name": "Priya Sharma",
                    "location": {"lat": 28.6139, "lon": 77.2090}
                })
                assert res1.status_code == 200
                assert len(captured_requests) >= 1
                req1 = captured_requests[0]
                assert req1["parse_mode"] == "HTML"
                assert "<b>Priya Sharma</b> has triggered an SOS alert." in req1["text"]
                assert "🚨 <b>EMERGENCY SOS ALERT!</b>" in req1["text"]
                assert "📍 Location: https://maps.google.com/?q=28.6139,77.209" in req1["text"]

                # 2. HTML escaping / XSS protection
                captured_requests.clear()
                res2 = await client.post("/api/alert/telegram", json={
                    "type": "button",
                    "user_name": "<script>alert('xss')</script> & \"Priya\""
                })
                assert res2.status_code == 200
                req2 = captured_requests[0]
                assert req2["parse_mode"] == "HTML"
                assert "&lt;script&gt;alert(" in req2["text"]
                assert "&amp; &quot;Priya&quot;" in req2["text"]
                assert "<script>" not in req2["text"]

                # 3. Whitespace-only name falls back to 'RakshaSakhi User'
                captured_requests.clear()
                res3 = await client.post("/api/alert/telegram", json={
                    "type": "button",
                    "user_name": "   "
                })
                assert res3.status_code == 200
                req3 = captured_requests[0]
                assert req3["parse_mode"] == "HTML"
                assert "<b>RakshaSakhi User</b> has triggered an SOS alert." in req3["text"]

                # 4. Default / omitted user_name
                captured_requests.clear()
                res4 = await client.post("/api/alert/telegram", json={
                    "type": "button"
                })
                assert res4.status_code == 200
                req4 = captured_requests[0]
                assert req4["parse_mode"] == "HTML"
                assert "<b>RakshaSakhi User</b> has triggered an SOS alert." in req4["text"]

    asyncio.run(_run())


def test_trigger_endpoint_with_user_name():
    async def _run():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Custom user_name
            res = await client.post("/api/trigger", json={
                "type": "button",
                "user_name": "Ananya Sen"
            })
            assert res.status_code == 200
            data = res.json()
            assert data["status"] == "triggered"
            assert data["user_name"] == "Ananya Sen"

            # Default user_name
            res_default = await client.post("/api/trigger", json={
                "type": "button"
            })
            assert res_default.status_code == 200
            data_default = res_default.json()
            assert data_default["status"] == "triggered"
            assert data_default["user_name"] == "RakshaSakhi User"

    asyncio.run(_run())


def test_static_frontend_onboarding_and_modals_markup():
    async def _run():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.get("/")
            assert res.status_code == 200
            html = res.text

            # Onboarding Wizard Overlay & Steps 1-6
            assert 'id="onboarding-wizard"' in html
            assert 'class="wizard-overlay hidden"' in html
            # Step 1: Full Name
            assert 'id="onboard-step-1"' in html
            assert 'id="onboard-name"' in html
            assert 'id="btn-onboard-next-1"' in html
            # Step 2: Date of Birth
            assert 'id="onboard-step-2"' in html
            assert 'id="onboard-dob"' in html
            assert 'id="btn-onboard-back-2"' in html
            assert 'id="btn-onboard-next-2"' in html
            # Step 3: Blood Group
            assert 'id="onboard-step-3"' in html
            assert 'id="onboard-blood-group"' in html
            assert 'id="btn-onboard-back-3"' in html
            assert 'id="btn-onboard-next-3"' in html
            # Step 4: Local Area
            assert 'id="onboard-step-4"' in html
            assert 'id="onboard-area"' in html
            assert 'id="btn-onboard-back-4"' in html
            assert 'id="btn-onboard-next-4"' in html
            # Step 5: Mandatory Emergency Contact Card
            assert 'id="onboard-step-5"' in html
            assert 'ADD NEW CONTACT' in html
            assert 'id="onboard-contact-name"' in html
            assert 'id="onboard-contact-phone"' in html
            assert 'id="onboard-contact-telegram"' in html
            assert 'id="link-find-telegram"' in html
            assert 'id="onboard-contact-relationship"' in html
            assert 'id="btn-onboard-back-5"' in html
            assert 'id="btn-onboard-add-contact"' in html
            # Step 6: Post-Contact Success
            assert 'id="onboard-step-6"' in html
            assert 'Contact Added Successfully!' in html
            assert 'id="btn-onboard-add-more"' in html
            assert 'id="btn-onboard-finish"' in html

            # Header Icons
            assert 'id="btn-menu"' in html
            assert 'id="btn-profile"' in html
            assert 'id="btn-info"' in html

            # User Profile Modal
            assert 'id="user-profile-modal"' in html
            assert 'id="btn-close-profile"' in html
            assert 'id="profile-name"' in html
            assert 'id="profile-dob"' in html
            assert 'id="profile-blood-group"' in html
            assert 'id="profile-area"' in html
            assert 'id="btn-revert-profile"' in html
            assert 'id="btn-save-profile"' in html

            # App Info Modal
            assert 'id="info-modal"' in html
            assert 'id="btn-close-info"' in html
            assert 'RakshaSakhi PWA' in html
            assert 'One-Tap Emergency SOS Broadcast' in html
            assert 'Offline Voice Keyword Detection' in html

    asyncio.run(_run())


def test_database_isolation_no_dev_db_pollution():
    import os
    import sqlite3

    async def _run():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Create a test contact through API
            payload = {
                "name": "Isolation Verification",
                "phone": "+919999900000",
                "telegram_chat_id": "999000111",
                "relationship": "Friend"
            }
            res = await client.post("/api/contacts", json=payload)
            assert res.status_code == 201

            # In-memory test db has the contact
            list_res = await client.get("/api/contacts")
            assert any(c["telegram_chat_id"] == "999000111" for c in list_res.json())

    asyncio.run(_run())

    # Check that development database 'rakshasakhi.db' on disk was NEVER written to by this test
    if os.path.exists("rakshasakhi.db"):
        conn = sqlite3.connect("rakshasakhi.db")
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='emergency_contacts'")
        table_exists = cursor.fetchone()
        if table_exists:
            cursor.execute("SELECT COUNT(*) FROM emergency_contacts WHERE telegram_chat_id = '999000111'")
            count = cursor.fetchone()[0]
            assert count == 0, "Dev database was polluted by test run!"
        conn.close()



