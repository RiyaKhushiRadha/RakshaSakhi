from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from backend.config.settings import settings
from backend.routers import trigger, chatbot, alerts

app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)

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

# Health Check
@app.get("/api/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME}

# Mount static frontend
frontend_path = Path(__file__).parent.parent / "frontend"
if frontend_path.exists():
    app.mount("/", StaticFiles(directory=str(frontend_path), html=True), name="frontend")
