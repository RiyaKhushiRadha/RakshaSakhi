import logging
import os
import re
from collections import defaultdict
from typing import Optional, Union, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage, AIMessage
from backend.config.settings import settings, ENV_PATH

logger = logging.getLogger(__name__)

# Fetch API Key from settings or environment
api_key: Optional[str] = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")

# Initialize LLM configurations
daily_llm: Optional[ChatGoogleGenerativeAI] = None
emergency_llm: Optional[ChatGoogleGenerativeAI] = None

if not api_key or api_key == "your_gemini_api_key_here":
    logger.warning(f"GEMINI_API_KEY is not set or invalid. (Checked path: {ENV_PATH})")
else:
    try:
        # Mode A (Daily Wellness): Warm, conversational friend/sister
        daily_llm = ChatGoogleGenerativeAI(
            model="gemini-flash-lite-latest",
            google_api_key=api_key,
            temperature=0.7,
            max_output_tokens=300,
            max_retries=1,
        )
        # Mode B (Emergency SOS): Low latency, deterministic, practical crisis guide
        emergency_llm = ChatGoogleGenerativeAI(
            model="gemini-flash-lite-latest",
            google_api_key=api_key,
            temperature=0.3,
            max_output_tokens=300,
            max_retries=1,
        )
    except Exception as e:
        logger.error(f"Failed to initialize ChatGoogleGenerativeAI: {e}", exc_info=True)
        daily_llm = None
        emergency_llm = None

# Backward compatibility alias
llm = daily_llm

def get_llm(mode: str) -> Optional[ChatGoogleGenerativeAI]:
    """Retrieve the specialized LLM instance based on operational mode without permanent lockout."""
    if mode == "emergency":
        return emergency_llm
    return daily_llm

# Multi-Turn In-Memory Storage (Last 6 turns = up to 12 messages per session)
MAX_HISTORY_MESSAGES = 12
session_store: dict[str, list[BaseMessage]] = defaultdict(list)
session_locations: dict[str, Any] = {}

def get_session_history(session_id: str) -> list[BaseMessage]:
    """Retrieve recent message history for a given session."""
    return list(session_store.get(session_id, []))

def append_session_message(session_id: str, message: BaseMessage):
    """Append a message to the session's sliding window history."""
    if session_id not in session_store:
        session_store[session_id] = []
    session_store[session_id].append(message)
    if len(session_store[session_id]) > MAX_HISTORY_MESSAGES:
        session_store[session_id] = session_store[session_id][-MAX_HISTORY_MESSAGES:]

def clear_session_history(session_id: str):
    """Clear memory history and location for a session."""
    if session_id in session_store:
        del session_store[session_id]
    if session_id in session_locations:
        del session_locations[session_id]

def extract_named_location(text: str) -> Optional[str]:
    """
    Extract specific colony, sector, block, or area names from user text.
    Handles phrases like 'mai vikaspuri ma hu h block ma' -> 'vikaspuri h block'.
    """
    cleaned = text.strip()
    lower = cleaned.lower()

    # Explicit exclusions of non-location statements (isolation, emptiness, panic)
    if re.search(r"(kuch.*nhi|kuch.*nahi|sunsan|sunsaan|andhera|koi.*nhi|koi.*nahi)", lower):
        return None

    loc_keywords = [
        "block", "sector", "colony", "road", "nagar", "vihar", "puri", 
        "enclave", "marg", "chowk", "society", "gate", "station", "market", "park"
    ]
    delhi_areas = [
        "vikaspuri", "rohini", "janakpuri", "dwarka", "noida", "gurgaon", 
        "saket", "hauz khas", "pitampura", "karol bagh", "connaught place",
        "lajpat nagar", "mayur vihar", "malviya nagar", "uttam nagar"
    ]
    
    has_loc = any(k in lower for k in loc_keywords) or any(a in lower for a in delhi_areas)
    
    if not has_loc:
        m = re.search(r"([a-zA-Z0-9\s]+?)\s+(?:me|ma|mein|pe|par)\s+(?:hu|hoon)", cleaned, re.IGNORECASE)
        if m:
            cand = m.group(1).strip()
            cand = re.sub(r"^(mai|main|hum|abhi|yr|yaar)\s+", "", cand, flags=re.IGNORECASE).strip()
            if len(cand) > 2 and not any(neg in cand.lower() for neg in ["kuch", "nhi", "nahi", "tension", "stress", "area new"]):
                return cand
        return None
        
    t = re.sub(r"^(mai|main|hum|abhi|yr|yaar)\s+", "", cleaned, flags=re.IGNORECASE)
    t_clean = re.sub(r"\b(ma|me|mein|pe|par)\s+(hu|hoon)\b", "", t, flags=re.IGNORECASE)
    t_clean = re.sub(r"\b(ma|me|mein|pe|par|hu|hoon)\b", "", t_clean, flags=re.IGNORECASE)
    t_clean = re.sub(r"\s+", " ", t_clean).strip()
    return t_clean if len(t_clean) > 2 else None

def extract_response_text(content: Any) -> str:
    """Extract clean string text from LangChain response content (handles str or list of parts)."""
    if isinstance(content, list):
        text_parts = []
        for part in content:
            if isinstance(part, dict):
                text_parts.append(part.get("text", ""))
            elif hasattr(part, "text"):
                text_parts.append(part.text)
            else:
                text_parts.append(str(part))
        return "".join(text_parts).strip()
    return str(content).strip()

# System prompt instructions
SYSTEM_PROMPTS = {
    "daily": (
        "You are RakshaSakhi, an empathetic, caring, and supportive close friend/sister chatting casually on WhatsApp. "
        "Follow these rules strictly:\n"
        "- AUTHENTIC FRIEND PERSONA: Talk like an authentic best friend texting on WhatsApp. "
        "When the user shares casual day-to-day moments (outings, food, friends, boredom, 'sab theek tha', 'ghoomne gayi thi', kdramas, series), "
        "respond with natural excitement, gentle humor, or casual banter (e.g., 'Arey waah! Kahan gayi thi? Kuch achha khaya ya bas chill kiya?').\n"
        "- HEALTH & TIREDNESS: If the user mentions physical discomfort, pain, headache ('sir durd', 'pain', 'thak gayi', 'tabiyat'), "
        "respond with gentle care: 'Arey, dawai li koi? Thoda aaram karo aur screen band karke let jao.'\n"
        "- NO UNSOLICITED THERAPY: Strictly DO NOT suggest deep breathing ('Ek gehri saans lo'), clinical therapy platitudes, "
        "or treat normal casual sharing like medical panic unless the user explicitly mentions feeling anxious, panicked, crying, or heavy distress.\n"
        "- NATURAL VENTING FLOW: The user is talking about everyday stress, bad days, feelings, overthinking, or friendships. "
        "Strictly NEVER ask for user location, GPS, or coordinates in Daily mode—just be a loving, supportive active listener.\n"
        "- LENGTH: Keep replies very concise—strictly 2 to 3 short sentences (under 40-45 words total). Never write essays.\n"
        "- NO LISTS: Never use bullet points, numbered lists (1., 2.), bold headings, or lecture-style breakdowns.\n"
        "- CASUAL EVERYDAY LANGUAGE: Reply in natural, modern conversational Hinglish (or simple English if user writes in English). "
        "Strictly avoid heavy or poetic Urdu words (do NOT use words like 'kashish', 'ehsaas', 'shukrguzar', 'khwahish', 'tashweesh') "
        "and avoid overly formal pure Hindi. Use simple everyday words like 'feeling', 'tension', 'normal', 'samajh sakti hu', 'relax'.\n"
        "- PACING & MEMORY: Acknowledge their emotion or activity warmly and ask one gentle follow-up question. "
        "Remember any people (friends, parents), feelings, or situations they share."
    ),
    "emergency": (
        "You are RakshaSakhi, a sharp, protective, and calm real-time emergency safety guide. "
        "Follow these rules strictly:\n"
        "- LENGTH & SPEED: Maximum 1 to 2 short sentences (strictly under 25 words total). Never write essays or filler prefixes.\n"
        "- NO REPETITIVE PLATITUDES: Strictly NEVER repeat previous advice or consecutive replies verbatim. Do not say 'Feel your feet on the ground' or 'alerts are active'. Reassure in 3 words or less, then give ONE immediate physical action.\n"
        "- SMART LOCATION HIERARCHY & DYNAMIC GROUNDING:\n"
        "  1. If user reports being followed / panic AND no GPS/location coordinates are known yet:\n"
        "     Ask directly in 1 short panic-friendly line: 'GPS nahi mil raha. Abhi kahan par ho? Kisi colony, road ya metro ka naam batao jaldi.'\n"
        "  2. If user provides a specific location (colony, sector, block, or area name like 'vikaspuri h block'):\n"
        "     Explicitly ground your advice using that named location: '[Named Location] ke kisi residential society gate par guard ke paas khadi ho jao, ya lighted main road ki taraf niklo. Main yahin hoon.'\n"
        "  3. If user replies that the area is new/unfamiliar ('area new hai', 'lost', 'kaha jau'):\n"
        "     Immediately switch to visual physical landmarks: 'Aas-pass dekho--kya koi board, light, road ya landmark dikh raha hai? Lighted main road ki taraf chalo.'\n"
        "  4. If user identifies an open place, shop, or landmark ('chemist shop', 'store', 'shop dikh rahi hai'):\n"
        "     Instruct them to enter immediately: 'Turant us shop ke andar ghuso aur counter par khadi ho jao. Main yahin hoon.'\n"
        "  5. If user says nothing is around / isolated ('yaha aas pass kuch nhi hai', 'sunsaan', 'andhera'):\n"
        "     NEVER suggest open shops or petrol pumps. Instruct dynamically: 'Rukna mat, phone kaan par lagao jaise live call par ho, aur tezi se kisi light ya society gate ki taraf badho.'\n"
        "- TONE: Crisp, commanding, protective, and immediate."
    ),
}

FALLBACK_MESSAGES = {
    "daily_welcome": "Hey! Main RakshaSakhi hoon. Aaj ka din kaisa raha aapka? Sab theek?",
    "emergency_welcome": "SOS alert active. Turant kisi safe, lighted area ya guard ke paas move karein.",
    "daily_error": "Connection mein thodi dikkat aa rahi hai. Kripya thodi der baad dobara koshish karein.",
    "emergency_error": "Connection error: Agar aap kisi khatre mein hain, turant 112 par call karein ya aas-paas help maangein.",
}

async def get_welcome_greeting(mode: str = "daily", session_id: str = "default") -> str:
    """
    Generate an initial proactive welcome message based on the active mode.
    """
    active_llm = get_llm(mode)
    history = get_session_history(session_id)

    if active_llm is None:
        logger.warning("LLM not initialized when generating welcome greeting.")
        fallback = FALLBACK_MESSAGES["emergency_welcome"] if mode == "emergency" else FALLBACK_MESSAGES["daily_welcome"]
        append_session_message(session_id, AIMessage(content=fallback))
        return fallback

    system_instruction = SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS["daily"])

    if mode == "emergency":
        user_prompt = (
            "The user just pressed the emergency SOS button. In strictly 1 short sentence (under 15 words) "
            "in natural Hinglish or simple English, confirm alerts are sent and tell them to immediately move to a lit, crowded place or open shop."
        )
    else:
        user_prompt = (
            "The user just opened the chat. Send a quick, warm 1-2 sentence WhatsApp greeting (under 25 words) "
            "in natural Hinglish or simple English, asking how their day was or how they're feeling right now."
        )

    try:
        messages = [
            SystemMessage(content=system_instruction),
            *history,
            HumanMessage(content=user_prompt),
        ]
        response = await active_llm.ainvoke(messages)
        reply = extract_response_text(response.content)
        append_session_message(session_id, AIMessage(content=reply))
        return reply
    except Exception as e:
        import traceback
        print(">>> GEMINI WELCOME CALL FAILED WITH ERROR:", repr(e), flush=True)
        traceback.print_exc()
        logger.error(f"Gemini API failure in get_welcome_greeting: {e}", exc_info=True)
        fallback = FALLBACK_MESSAGES["emergency_welcome"] if mode == "emergency" else FALLBACK_MESSAGES["daily_welcome"]
        append_session_message(session_id, AIMessage(content=fallback))
        return fallback

async def generate_chat_response(
    user_message: str,
    session_id: str = "default",
    mode: str = "daily",
    location: Optional[Union[dict, str, Any]] = None,
) -> str:
    """
    Generate a direct chat response using Gemini based on the active mode with multi-turn memory
    and smart location hierarchy.
    """
    active_llm = get_llm(mode)
    history = get_session_history(session_id)

    # Save session location if provided in request or extracted from user message
    extracted_loc = extract_named_location(user_message) if mode == "emergency" else None
    if location:
        session_locations[session_id] = location
    elif extracted_loc:
        session_locations[session_id] = extracted_loc

    has_location = bool(session_locations.get(session_id) or location or extracted_loc)

    print(f"\n>>> ATTEMPTING GEMINI CALL with message: {user_message}", flush=True)
    with open("backend/debug_trace.log", "a", encoding="utf-8") as f:
        f.write(f"\n--- NEW REQUEST ---\nmessage: {user_message}\nmode: {mode}\nactive_llm: {active_llm}\n")

    if active_llm is None:
        err_msg = f">>> GEMINI CALL FAILED WITH ERROR: active_llm is None (api_key is {repr(api_key)})"
        print(err_msg, flush=True)
        with open("backend/debug_trace.log", "a", encoding="utf-8") as f:
            f.write(err_msg + "\n")
        fallback = FALLBACK_MESSAGES["emergency_error"] if mode == "emergency" else FALLBACK_MESSAGES["daily_error"]
        append_session_message(session_id, HumanMessage(content=user_message))
        append_session_message(session_id, AIMessage(content=fallback))
        return fallback

    system_instruction = SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS["daily"])

    # If location is available, inject into system context seamlessly for emergency mode
    if mode == "emergency" and has_location:
        loc_str = str(session_locations.get(session_id) or location or extracted_loc)
        system_instruction += f"\n[User Live Location Context: {loc_str}]"

    try:
        messages = [
            SystemMessage(content=system_instruction),
            *history,
            HumanMessage(content=user_message),
        ]
        print(">>> CALLING active_llm.ainvoke...", flush=True)
        response = await active_llm.ainvoke(messages)
        reply = extract_response_text(response.content)
        print(f">>> GEMINI CALL SUCCEEDED! Response: {reply!r}", flush=True)
        with open("backend/debug_trace.log", "a", encoding="utf-8") as f:
            f.write(f"SUCCESS: {reply}\n")

        # Save turn to multi-turn memory
        append_session_message(session_id, HumanMessage(content=user_message))
        append_session_message(session_id, AIMessage(content=reply))
        return reply

    except Exception as e:
        import traceback
        err_msg = f">>> GEMINI CALL FAILED WITH ERROR: {repr(e)}"
        print(err_msg, flush=True)
        traceback.print_exc()
        with open("backend/debug_trace.log", "a", encoding="utf-8") as f:
            f.write(err_msg + "\n" + traceback.format_exc() + "\n")
        logger.error(f"Gemini API failure in generate_chat_response: {e}", exc_info=True)
        fallback = FALLBACK_MESSAGES["emergency_error"] if mode == "emergency" else FALLBACK_MESSAGES["daily_error"]
        append_session_message(session_id, HumanMessage(content=user_message))
        append_session_message(session_id, AIMessage(content=fallback))
        return fallback
