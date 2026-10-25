from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from backend.config.settings import settings
from backend.database import init_db
from backend.routers import trigger, chatbot, alerts, contacts


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on app startup
    init_db()
    yield


app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG, lifespan=lifespan)

# Ensure tables exist on load
init_db()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(trigger.router, prefix="/api", tags=["Trigger"])
app.include_router(chatbot.router, prefix="/api", tags=["Chatbot"])
app.include_router(alerts.router, prefix="/api", tags=["Alerts"])
app.include_router(contacts.router, prefix="/api", tags=["Contacts"])

# Health Check
@app.get("/api/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME}

# Mount static frontend
frontend_path = Path(__file__).parent.parent / "frontend"
if frontend_path.exists():
    app.mount("/", StaticFiles(directory=str(frontend_path), html=True), name="frontend")
