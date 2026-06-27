# backend/services/gemini.py
# MOCK VERSION - replace with real Gemini calls once API key is working

import json
import os
import time
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
USE_MOCK = True  # Set to False once your API key works


def _try_gemini(prompt: str) -> str | None:
    """Try real Gemini call, return None if quota exceeded."""
    if not GEMINI_API_KEY or USE_MOCK:
        return None
    try:
        from google import genai
        client = genai.Client(api_key=GEMINI_API_KEY)
        r = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        return r.text
    except Exception as e:
        print(f"Gemini API failed, using mock: {e}")
        return None


def clean_json_response(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines).strip()
    return text


# ─── 1. Task Breakdown ────────────────────────────────────

def forge_task(title: str, deadline_days: int, user_history: dict = None) -> dict:
    prompt = f"""
You are ProdForge AI. Break this task into subtasks.
Task: "{title}"
Days until deadline: {deadline_days}
Return ONLY valid JSON:
{{
  "subtasks": [{{"title": str, "estimated_minutes": int, "day": int, "priority": str}}],
  "total_estimated_hours": float,
  "risk_score": float,
  "completion_probability": float,
  "risk_level": str,
  "advice": str,
  "rescue_needed": bool
}}
"""
    raw = _try_gemini(prompt)
    if raw:
        return json.loads(clean_json_response(raw))

    # Mock response based on deadline
    risk = max(0.1, min(0.95, 1.0 - (deadline_days * 0.12)))
    return {
        "subtasks": [
            {"title": f"Research and plan: {title}", "estimated_minutes": 45, "day": 1, "priority": "high"},
            {"title": "Set up environment and tools", "estimated_minutes": 30, "day": 1, "priority": "high"},
            {"title": "Core implementation - Part 1", "estimated_minutes": 90, "day": 2, "priority": "high"},
            {"title": "Core implementation - Part 2", "estimated_minutes": 90, "day": 3, "priority": "high"},
            {"title": "Testing and debugging", "estimated_minutes": 60, "day": 4, "priority": "medium"},
            {"title": "Documentation and final review", "estimated_minutes": 45, "day": deadline_days, "priority": "medium"},
        ],
        "total_estimated_hours": 6.0,
        "risk_score": round(risk, 2),
        "completion_probability": round(1.0 - risk, 2),
        "risk_level": "critical" if risk > 0.8 else "high" if risk > 0.6 else "medium" if risk > 0.3 else "low",
        "advice": f"You have {deadline_days} days. Start with the highest priority items today to stay on track.",
        "rescue_needed": risk > 0.75
    }


# ─── 2. Risk Analysis ─────────────────────────────────────

def analyze_risk(task_title: str, deadline_days: int, subtasks_done: int,
                 total_subtasks: int, user_completion_rate: float = 0.7) -> dict:
    prompt = f"Analyze risk for task: {task_title}, {deadline_days} days left, {subtasks_done}/{total_subtasks} done. Return JSON."
    raw = _try_gemini(prompt)
    if raw:
        return json.loads(clean_json_response(raw))

    progress = subtasks_done / total_subtasks if total_subtasks > 0 else 0
    expected = 1.0 - (deadline_days / max(deadline_days + 1, 7))
    behind = max(0, expected - progress)
    risk = min(0.95, behind + (1 - user_completion_rate) * 0.3)

    return {
        "risk_score": round(risk, 2),
        "miss_probability": round(risk * 0.9, 2),
        "confidence": 0.82,
        "risk_level": "critical" if risk > 0.8 else "high" if risk > 0.6 else "medium" if risk > 0.3 else "low",
        "intervention_message": f"You've completed {subtasks_done}/{total_subtasks} subtasks with {deadline_days} days left. {'You need to pick up the pace!' if risk > 0.5 else 'You are on track!'}",
        "recommended_action": "Focus on completing the next subtask before anything else."
    }


# ─── 3. Emergency Rescue Plan ─────────────────────────────

def generate_rescue_plan(task_title: str, deadline_hours: int,
                         remaining_subtasks: list) -> dict:
    raw = _try_gemini(f"Emergency rescue plan for: {task_title}, {deadline_hours} hours left")
    if raw:
        return json.loads(clean_json_response(raw))

    sessions = []
    for i, subtask in enumerate(remaining_subtasks[:6], 1):
        sessions.append({
            "session_number": i,
            "focus_task": subtask,
            "duration_minutes": 25,
            "break_minutes": 5,
            "goal": f"Complete: {subtask}"
        })

    return {
        "rescue_message": f"🚨 Emergency mode activated! You have {deadline_hours} hours. Follow this battle plan exactly.",
        "total_pomodoros": len(sessions),
        "sessions": sessions,
        "survival_tips": [
            "Close all social media and distractions right now",
            "Put your phone in another room",
            "Work in 25-minute focused sprints",
            "Done is better than perfect — submit something"
        ],
        "minimum_viable_completion": f"Complete at least the first {min(3, len(remaining_subtasks))} subtasks for a passing submission."
    }


# ─── 4. AI Coach Daily Insight ────────────────────────────

def get_coaching_insight(user_name: str, tasks_completed: int,
                         tasks_missed: int, streak: int,
                         pending_tasks: list) -> dict:
    raw = _try_gemini(f"Coach insight for {user_name}: {tasks_completed} done, {tasks_missed} missed")
    if raw:
        return json.loads(clean_json_response(raw))

    total = tasks_completed + tasks_missed
    rate = tasks_completed / total if total > 0 else 0.7
    score = int(rate * 100)

    quotes = [
        "Small progress is still progress.",
        "The secret of getting ahead is getting started.",
        "Focus on progress, not perfection.",
        "Every expert was once a beginner.",
    ]

    return {
        "greeting": f"Good work, {user_name}! 👋",
        "insight": f"You've completed {tasks_completed} tasks with a {score}% success rate. {'Great momentum!' if score > 70 else 'There is room to improve — lets focus today.'}",
        "pattern_detected": "You tend to be most productive in the first half of the day." if streak > 2 else "Building a streak will boost your productivity significantly.",
        "todays_focus": f"You have {len(pending_tasks)} pending tasks. Pick the most important one and finish it completely before moving on.",
        "motivation_score": score,
        "quote": quotes[tasks_completed % len(quotes)]
    }


# ─── 5. Digital Twin Simulation ───────────────────────────

def simulate_delay(task_title: str, current_probability: float,
                   delay_days: int, deadline_days: int) -> dict:
    raw = _try_gemini(f"Simulate delay of {delay_days} days for task: {task_title}")
    if raw:
        return json.loads(clean_json_response(raw))

    drop = min(0.5, delay_days * 0.08 + (delay_days / max(deadline_days, 1)) * 0.3)
    delayed = max(0.05, current_probability - drop)
    new_risk = 1.0 - delayed

    return {
        "current_probability": round(current_probability, 2),
        "delayed_probability": round(delayed, 2),
        "probability_drop": round(drop, 2),
        "new_risk_level": "critical" if new_risk > 0.8 else "high" if new_risk > 0.6 else "medium",
        "warning_message": f"Delaying by {delay_days} day{'s' if delay_days > 1 else ''} drops your success chance from {int(current_probability*100)}% to {int(delayed*100)}%.",
        "recovery_possible": delayed > 0.2,
        "recovery_strategy": f"You would need to work {round(delay_days * 1.5, 1)} extra hours per day to recover the lost time."
    }


# ─── Quick test ───────────────────────────────────────────

if __name__ == "__main__":
    print("Testing Gemini service (mock mode)...\n")
    result = forge_task("Complete my machine learning project", deadline_days=5)
    print(json.dumps(result, indent=2))