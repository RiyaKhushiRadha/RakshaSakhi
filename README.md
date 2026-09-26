# RakshaSakhi

AI-Assisted Personal Safety Companion App.

## Setup

1. **Backend**:
   - Create a virtual environment: `python -m venv venv`
   - Activate it: `venv\Scripts\activate` (Windows)
   - Install dependencies: `pip install -r requirements.txt`
   - Copy `.env.example` to `.env` and fill in your API keys.
   - Run the server: `uvicorn backend.main:app --reload`

2. **Frontend**:
   - Serve the `frontend/` directory using any local web server (e.g., Live Server extension in VS Code).
