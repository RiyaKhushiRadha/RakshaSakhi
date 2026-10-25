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

# Test in-memory database setup
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_and_teardown_db():
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=test_engine)
    app.dependency_overrides.clear()


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
                "telegram_chat_id": "CHAT_111",
                "relationship": "Parent"
            })
            await client.post("/api/contacts", json={
                "name": "Contact Two",
                "phone": "2222222222",
                "telegram_chat_id": "CHAT_222",
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
                assert "CHAT_111" in dispatched_chats
                assert "CHAT_222" in dispatched_chats

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
                "telegram_chat_id": "TEST_CHAT",
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

