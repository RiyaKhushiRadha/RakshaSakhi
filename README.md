# 🛡️ RakshaSakhi (रक्षासखी)

An AI-assisted personal safety Progressive Web App (PWA) built to ensure rapid emergency response, seamless onboarding, automated Telegram alerts, and hands-free voice triggering.

---

## 🌟 Key Features

* **Interactive Onboarding Flow**: A multi-step wizard capturing user profile details (Name, DOB, Blood Group, and Local Area) with strict human lifespan validation.
* **Emergency Contacts & Loop**: Save and manage emergency contacts with strict 9-14 digit Telegram Chat ID validation and an infinite contact loop experience.
* **Voice-Activated SOS Trigger**: Hands-free voice trigger ("help" keyword detection using TensorFlow.js Speech-Commands) that instantly initiates the emergency SOS pipeline.
* **Instant SOS Trigger**: Dedicated SOS button (with press-and-hold or instant trigger support) that immediately activates a siren and fetches live GPS coordinates.
* **Telegram Bot Integration**: Automatically broadcasts emergency alerts with user identification and live location coordinates directly to configured Telegram contacts via the `@RakshaSakhi_Alert_Bot`.
* **Sakhi Multi-Lingual Chatbot**: AI-powered companion supporting English, Hindi, and Hinglish modes to provide mental health support, safety guidance, and emergency triage.
* **Web Audio Siren**: Built-in sound synthesis and audio playback capabilities for immediate deterrence during emergencies.

---

## 🛠️ Tech Stack

* **Backend**: Python, FastAPI, Uvicorn, LangChain LLM orchestration.
* **Frontend**: HTML5, Modern CSS3, JavaScript, TensorFlow.js (Voice Detection PWA architecture).
* **Alerts & Location**: Telegram Bot API, HTML5 Geolocation API.
* **Testing & Quality**: Pytest framework for comprehensive automated test suites.

---

## 🚀 Getting Started Locally

1. **Clone the Repository**:
   ```bash
   git clone [https://github.com/RiyaKhushiRadha/RakshaSakhi.git](https://github.com/RiyaKhushiRadha/RakshaSakhi.git)
   cd RakshaSakhi

## Set up Virtual Environment & Dependencies:
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt

## Run the FastAPI Backend:
cd backend
uvicorn main:app --reload
