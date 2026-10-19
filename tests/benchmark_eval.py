import asyncio
import os
import sys
import time
from pathlib import Path
import httpx

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.main import app
from backend.services.langchain_ai import clear_session_history

BASE_URL = "http://127.0.0.1:8000"

async def check_live_server() -> bool:
    """Check if FastAPI server is actively running on 127.0.0.1:8000."""
    try:
        async with httpx.AsyncClient(timeout=1.0) as client:
            resp = await client.get(f"{BASE_URL}/api/health")
            return resp.status_code == 200
    except Exception:
        return False

async def send_chat_request(client: httpx.AsyncClient, message: str, session_id: str, mode: str, location=None):
    """Send chat request and record wall-clock latency."""
    start_time = time.time()
    payload = {"message": message, "session_id": session_id, "mode": mode}
    if location is not None:
        payload["location"] = location

    response = await client.post(
        f"{BASE_URL}/api/chat",
        json=payload,
        timeout=30.0,
    )
    latency = time.time() - start_time
    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}: {response.text}"
    data = response.json()
    reply = data.get("reply", "").strip()
    return reply, latency

async def run_benchmark():
    print("=" * 80)
    print("   RAKSHASAKHI AUTONOMOUS BENCHMARK EVALUATION SUITE")
    print("=" * 80)

    is_live = await check_live_server()
    if is_live:
        print("[INFO] Target: Live Uvicorn Server at http://127.0.0.1:8000")
        client_ctx = httpx.AsyncClient(base_url=BASE_URL, timeout=30.0)
    else:
        print("[INFO] Live server not detected on port 8000. Using in-process ASGITransport client.")
        client_ctx = httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url=BASE_URL, timeout=30.0)

    test_session_id = f"benchmark-session-{int(time.time())}"
    clear_session_history(test_session_id)

    turns_data = []
    failures = []

    async with client_ctx as client:
        # Step 0A: Mode A Casual / Happy Turn
        print("\n[STEP 0A] Mode A (Daily Wellness Persona) - Casual Outing (No Unsolicited Therapy)")
        step0a_msg = "aj mai khumne gayi thi"
        reply_0a, lat_0a = await send_chat_request(client, step0a_msg, test_session_id, mode="daily")
        turns_data.append({"turn": "0A", "input": step0a_msg, "reply": reply_0a, "latency": lat_0a, "mode": "daily"})
        print(f"User (Daily): {step0a_msg}")
        print(f"Bot (Daily):  {reply_0a}")
        print(f"Stats: Latency={lat_0a:.2f}s | Words={len(reply_0a.split())}\n")

        # Step 0B: Mode A Casual / Neutral Turn
        print("[STEP 0B] Mode A (Daily Wellness Persona) - Neutral/Relaxed Sharing (No Scripted Panic)")
        step0b_msg = "mind ma to kuch nhi chal raha sab thik tha"
        reply_0b, lat_0b = await send_chat_request(client, step0b_msg, test_session_id, mode="daily")
        turns_data.append({"turn": "0B", "input": step0b_msg, "reply": reply_0b, "latency": lat_0b, "mode": "daily"})
        print(f"User (Daily): {step0b_msg}")
        print(f"Bot (Daily):  {reply_0b}")
        print(f"Stats: Latency={lat_0b:.2f}s | Words={len(reply_0b.split())}\n")

        # Step 0C: Mode A Venting / Stress
        print("[STEP 0C] Mode A (Daily Wellness Persona) - Emotional Venting Flow")
        step0c_msg = "Yaar aaj ka din bilkul bekar tha, bahut anxious feel ho raha hai."
        reply_0c, lat_0c = await send_chat_request(client, step0c_msg, test_session_id, mode="daily")
        turns_data.append({"turn": "0C", "input": step0c_msg, "reply": reply_0c, "latency": lat_0c, "mode": "daily"})
        print(f"User (Daily): {step0c_msg}")
        print(f"Bot (Daily):  {reply_0c}")
        print(f"Stats: Latency={lat_0c:.2f}s | Words={len(reply_0c.split())}\n")

        # Step 0D: Mode A Health / Physical Discomfort
        print("[STEP 0D] Mode A (Daily Wellness Persona) - Physical Discomfort / Tiredness")
        step0d_msg = "sir durd ho raha hai"
        reply_0d, lat_0d = await send_chat_request(client, step0d_msg, test_session_id, mode="daily")
        turns_data.append({"turn": "0D", "input": step0d_msg, "reply": reply_0d, "latency": lat_0d, "mode": "daily"})
        print(f"User (Daily): {step0d_msg}")
        print(f"Bot (Daily):  {reply_0d}")
        print(f"Stats: Latency={lat_0d:.2f}s | Words={len(reply_0d.split())}\n")

        # Step 0E: Mode A Media / Entertainment
        print("[STEP 0E] Mode A (Daily Wellness Persona) - Entertainment / Kdrama Banter")
        step0e_msg = "kdrama dekh rahi thi"
        reply_0e, lat_0e = await send_chat_request(client, step0e_msg, test_session_id, mode="daily")
        turns_data.append({"turn": "0E", "input": step0e_msg, "reply": reply_0e, "latency": lat_0e, "mode": "daily"})
        print(f"User (Daily): {step0e_msg}")
        print(f"Bot (Daily):  {reply_0e}")
        print(f"Stats: Latency={lat_0e:.2f}s | Words={len(reply_0e.split())}\n")

        # Turn 1: Mode B SOS Trigger (Missing Location)
        print("[TURN 1] Mode B (Emergency SOS) - Missing Location Fallback")
        t1_msg = "I'm being followed, please help!"
        reply_1, lat_1 = await send_chat_request(client, t1_msg, test_session_id, mode="emergency")
        turns_data.append({"turn": "1", "input": t1_msg, "reply": reply_1, "latency": lat_1, "mode": "emergency"})
        print(f"User: {t1_msg}")
        print(f"Bot:  {reply_1}")
        print(f"Stats: Latency={lat_1:.2f}s | Words={len(reply_1.split())}\n")

        # Turn 2: Mode B Dynamic Specific Named Location Grounding
        print("[TURN 2] Mode B (Emergency SOS) - Dynamic Specific Named Location Grounding")
        t2_msg = "mai vikaspuri ma hu h block ma"
        reply_2, lat_2 = await send_chat_request(client, t2_msg, test_session_id, mode="emergency")
        turns_data.append({"turn": "2", "input": t2_msg, "reply": reply_2, "latency": lat_2, "mode": "emergency"})
        print(f"User: {t2_msg}")
        print(f"Bot:  {reply_2}")
        print(f"Stats: Latency={lat_2:.2f}s | Words={len(reply_2.split())}\n")

        # Turn 3: Mode B Lost/Unfamiliar Area (Visual Landmark Grounding)
        print("[TURN 3] Mode B (Emergency SOS) - Unfamiliar/Lost Visual Landmark Grounding")
        t3_msg = "mujhe ye area new hai mujhe nhi pata kaha jau"
        reply_3, lat_3 = await send_chat_request(client, t3_msg, test_session_id, mode="emergency")
        turns_data.append({"turn": "3", "input": t3_msg, "reply": reply_3, "latency": lat_3, "mode": "emergency"})
        print(f"User: {t3_msg}")
        print(f"Bot:  {reply_3}")
        print(f"Stats: Latency={lat_3:.2f}s | Words={len(reply_3.split())}\n")

        # Turn 4: Mode B Isolated / Nothing Around (Flexible matching)
        print("[TURN 4] Mode B (Emergency SOS) - Isolated / Nothing Nearby Dynamic Movement")
        t4_msg = "yaha aas pass kuch nhi hai"
        reply_4, lat_4 = await send_chat_request(client, t4_msg, test_session_id, mode="emergency")
        turns_data.append({"turn": "4", "input": t4_msg, "reply": reply_4, "latency": lat_4, "mode": "emergency"})
        print(f"User: {t4_msg}")
        print(f"Bot:  {reply_4}")
        print(f"Stats: Latency={lat_4:.2f}s | Words={len(reply_4.split())}\n")

        # Turn 5: Mode B Actionable Landmark Spotted (Shop/Counter)
        print("[TURN 5] Mode B (Emergency SOS) - Actionable Physical Instruction")
        t5_msg = "ek chemist shop dikh rahi hai"
        reply_5, lat_5 = await send_chat_request(client, t5_msg, test_session_id, mode="emergency")
        turns_data.append({"turn": "5", "input": t5_msg, "reply": reply_5, "latency": lat_5, "mode": "emergency"})
        print(f"User: {t5_msg}")
        print(f"Bot:  {reply_5}")
        print(f"Stats: Latency={lat_5:.2f}s | Words={len(reply_5.split())}\n")

    # =========================================================================
    # AUTOMATED ASSERTIONS & BENCHMARKS
    # =========================================================================
    print("=" * 80)
    print("   AUTOMATED BENCHMARK EVALUATION RESULTS")
    print("=" * 80)

    # 1. Repetition Rate == 0%
    repetition_found = False
    for i in range(1, len(turns_data)):
        prev_r = turns_data[i - 1]["reply"].lower().strip()
        curr_r = turns_data[i]["reply"].lower().strip()
        if prev_r == curr_r:
            repetition_found = True
            failures.append(f"Repetition Violation: Turn {turns_data[i]['turn']} is identical to Turn {turns_data[i-1]['turn']}")

    if not repetition_found:
        print("[PASS] Repetition Rate: 0% (No identical consecutive responses)")
    else:
        print("[FAIL] Repetition Rate: >0% (Identical consecutive responses detected)")

    # 2. Mode A Casual/Happy Turn (Step 0A): No "gehri saans" or therapy platitudes
    therapy_cliches = ["gehri saans", "saans lo", "batao kya chal raha hai mind me", "therapy"]
    has_cliche_0a = any(c in reply_0a.lower() for c in therapy_cliches)
    if not has_cliche_0a:
        print("[PASS] Step 0A (Casual Outing): Natural friend tone, NO forced breathing/therapy platitudes")
    else:
        msg = f"Step 0A Violation: Contained unsolicited therapy cliche in casual conversation ({reply_0a})"
        failures.append(msg)
        print(f"[FAIL] {msg}")

    # 3. Mode A Neutral Turn (Step 0B): No "gehri saans"
    has_cliche_0b = any(c in reply_0b.lower() for c in therapy_cliches)
    if not has_cliche_0b:
        print("[PASS] Step 0B (Neutral/Relaxed): Friendly conversational banter, NO forced breathing")
    else:
        msg = f"Step 0B Violation: Contained unsolicited therapy cliche in neutral conversation ({reply_0b})"
        failures.append(msg)
        print(f"[FAIL] {msg}")

    # 4. Mode A Venting Turn (Step 0C): Empathy, no location asking
    if not any(w in reply_0c.lower() for w in ["gps", "location", "coordinates"]):
        print("[PASS] Step 0C (Emotional Venting): Empathy validated, zero location inquiries")
    else:
        msg = "Step 0C Violation: Mode A should not ask for GPS/location"
        failures.append(msg)
        print(f"[FAIL] {msg}")

    # 5. Mode A Health / Physical Discomfort (Step 0D): Empathy, rest/care advice
    health_care_kws = ["dawai", "aaram", "rest", "dard", "screen", "paani", "let ja"]
    has_health_care = any(k in reply_0d.lower() for k in health_care_kws)
    if has_health_care:
        print("[PASS] Step 0D (Health/Tiredness): Empathetic care advice, suggests rest/medicine")
    else:
        msg = f"Step 0D Violation: Did not provide care/rest advice for headache/pain (Reply: {reply_0d})"
        failures.append(msg)
        print(f"[FAIL] {msg}")

    # 6. Mode A Entertainment (Step 0E): Friendly banter, curiosity
    media_kws = ["kaunsa", "dekh", "show", "series", "favorite", "mast", "kdrama", "drama", "episode"]
    has_media = any(k in reply_0e.lower() for k in media_kws)
    if has_media:
        print("[PASS] Step 0E (Kdrama/Entertainment): Friendly casual enthusiasm for shows")
    else:
        msg = f"Step 0E Violation: Did not respond with friendly curiosity for kdrama (Reply: {reply_0e})"
        failures.append(msg)
        print(f"[FAIL] {msg}")

    # 7. Location Fallback Triggered on Turn 1 (Missing Location)
    loc_keywords = ["kahan", "kaha", "colony", "road", "metro", "area", "gps", "location"]
    t1_reply_lower = reply_1.lower()
    has_loc_query = any(kw in t1_reply_lower for kw in loc_keywords)
    if has_loc_query:
        matched_loc_kws = [kw for kw in loc_keywords if kw in t1_reply_lower]
        print(f"[PASS] Location Fallback Triggered on Turn 1 (Matched: {matched_loc_kws})")
    else:
        msg = f"Turn 1 did not ask for location/area/road/metro (Expected at least one of: {loc_keywords})"
        failures.append(msg)
        print(f"[FAIL] {msg}")

    # 8. Dynamic Specific Location Grounding on Turn 2
    t2_reply_lower = reply_2.lower()
    has_grounding = "vikaspuri" in t2_reply_lower or ("block" in t2_reply_lower and "gate" in t2_reply_lower)
    if has_grounding:
        print(f"[PASS] Dynamic Named Location Grounding on Turn 2 (Grounded in Vikaspuri / Block)")
    else:
        msg = f"Turn 2 did not ground advice in user's named location (Reply: {reply_2})"
        failures.append(msg)
        print(f"[FAIL] {msg}")

    # 9. Visual Landmark Grounding on Turn 3 (Lost/New Area)
    landmark_keywords = ["landmark", "board", "light", "road"]
    t3_reply_lower = reply_3.lower()
    has_landmark = any(kw in t3_reply_lower for kw in landmark_keywords)
    if has_landmark:
        matched_kws = [kw for kw in landmark_keywords if kw in t3_reply_lower]
        print(f"[PASS] Landmark Grounding Triggered on Turn 3 (Matched: {matched_kws})")
    else:
        msg = f"Turn 3 did not trigger visual landmark grounding (Expected at least one of: {landmark_keywords})"
        failures.append(msg)
        print(f"[FAIL] {msg}")

    # 10. Isolated Movement Instruction on Turn 4 (Nothing Nearby)
    isolated_kws = ["rukna mat", "ruko mat", "phone kaan", "light", "society gate", "badho", "tez", "niklo"]
    t4_reply_lower = reply_4.lower()
    has_isolated_action = any(kw in t4_reply_lower for kw in isolated_kws)
    mentions_shop_or_petrol = any(kw in t4_reply_lower for kw in ["dukaan", "petrol pump", "open shop"])
    if has_isolated_action and not mentions_shop_or_petrol:
        matched_iso = [kw for kw in isolated_kws if kw in t4_reply_lower]
        print(f"[PASS] Isolated Movement Instruction on Turn 4 (Matched: {matched_iso}, NO non-existent shops)")
    else:
        msg = f"Turn 4 failed isolation handling (has_action={has_isolated_action}, mentions_shop={mentions_shop_or_petrol}, Reply: {reply_4})"
        failures.append(msg)
        print(f"[FAIL] {msg}")

    # 9. Actionable Shop Entry Instruction on Turn 5
    shop_keywords = ["shop", "chemist", "andar", "enter", "ghuso", "light", "counter"]
    t5_reply_lower = reply_5.lower()
    has_shop_action = any(kw in t5_reply_lower for kw in shop_keywords)
    if has_shop_action:
        matched_shop_kws = [kw for kw in shop_keywords if kw in t5_reply_lower]
        print(f"[PASS] Actionable Shop Entry Triggered on Turn 5 (Matched: {matched_shop_kws})")
    else:
        msg = f"Turn 5 did not instruct entering the shop/counter (Expected at least one of: {shop_keywords})"
        failures.append(msg)
        print(f"[FAIL] {msg}")

    # 10. Latency Benchmark: < 2.0s per turn for Mode B
    latency_pass = True
    for t in turns_data:
        if t["mode"] == "emergency":
            lat = t["latency"]
            if lat >= 2.0:
                latency_pass = False
                failures.append(f"Latency Exceeded: Turn {t['turn']} took {lat:.2f}s (Threshold: < 2.0s)")

    if latency_pass:
        max_b_lat = max(t['latency'] for t in turns_data if t['mode'] == 'emergency')
        print(f"[PASS] Latency Benchmark: All Mode B emergency turns completed in < 2.0s (Max: {max_b_lat:.2f}s)")
    else:
        print(f"[FAIL] Latency Benchmark: One or more Mode B turns exceeded 2.0s")

    # 11. Word Count Benchmark: <= 30 words for Mode B, <= 45 words for Mode A
    word_count_pass = True
    for t in turns_data:
        words = len(t["reply"].split())
        if t["mode"] == "emergency" and words > 30:
            word_count_pass = False
            failures.append(f"Word Count Exceeded: Turn {t['turn']} has {words} words (Threshold: <= 30 words)")
        elif t["mode"] == "daily" and words > 45:
            word_count_pass = False
            failures.append(f"Word Count Exceeded: Turn {t['turn']} has {words} words (Threshold: <= 45 words)")

    if word_count_pass:
        max_b_words = max(len(t['reply'].split()) for t in turns_data if t['mode'] == 'emergency')
        max_a_words = max(len(t['reply'].split()) for t in turns_data if t['mode'] == 'daily')
        print(f"[PASS] Word Count Benchmark: Mode B <= 30 words (Max: {max_b_words}), Mode A <= 45 words (Max: {max_a_words})")
    else:
        print(f"[FAIL] Word Count Benchmark: One or more turns exceeded word threshold")

    print("-" * 80)
    print(f"SUMMARY: Total Checks Evaluated. Total Failures: {len(failures)}")
    print("-" * 80)

    if failures:
        print("\nFAILURES DETAILED:")
        for f in failures:
            print(f"  - {f}")
        return False
    else:
        print("\nALL BENCHMARKS PASSED (100% COMPLIANCE)!")
        return True

if __name__ == "__main__":
    success = asyncio.run(run_benchmark())
    sys.exit(0 if success else 1)
