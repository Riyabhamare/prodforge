from google import genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def _call_gemini(prompt: str) -> str:
    response = client.models.generate_content(
        model="models/gemini-2.0-flash-lite",
        contents=prompt
    )
    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return text.strip()


def forge_task(task_description: str, deadline: any, user_history: dict = None) -> dict:
    prompt = f"""
You are a productivity expert AI. A user has this task: "{task_description}" with deadline: "{deadline}".
Break this into subtasks and return ONLY valid JSON, no markdown, no explanation:
{{
  "title": "main task title",
  "subtasks": [
    {{"title": "subtask name", "estimated_minutes": 120, "priority": "high", "order": 1}},
    {{"title": "subtask name", "estimated_minutes": 60, "priority": "medium", "order": 2}}
  ],
  "total_estimated_hours": 10,
  "difficulty": "medium",
  "strategy": "one sentence execution strategy",
  "risk_score": 60,
  "completion_probability": 0.72,
  "risk_level": "medium",
  "rescue_needed": false,
  "advice": "specific actionable advice"
}}
"""
    try:
        return json.loads(_call_gemini(prompt))
    except Exception as e:
        print(f"forge_task error: {e}")
        return {
            "title": task_description,
            "subtasks": [
                {"title": "Research and planning", "estimated_minutes": 120, "priority": "high", "order": 1},
                {"title": "Core execution", "estimated_minutes": 240, "priority": "high", "order": 2},
                {"title": "Review and finalize", "estimated_minutes": 60, "priority": "medium", "order": 3}
            ],
            "total_estimated_hours": 7,
            "difficulty": "medium",
            "strategy": "Break work into focused sessions and start immediately.",
            "risk_score": 60,
            "completion_probability": 0.72,
            "risk_level": "medium",
            "rescue_needed": False,
            "advice": "Start immediately and focus on the most critical subtasks first."
        }


def analyze_risk(task_title: str, deadline_days: int, user_history: dict) -> dict:
    completion_rate = user_history.get("completion_rate", 70)
    prompt = f"""
You are a deadline risk analyst AI. Analyze this task:
- Task: "{task_title}"
- Days until deadline: {deadline_days}
- User completion rate: {completion_rate}%

Return ONLY valid JSON:
{{
  "risk_score": 65,
  "completion_probability": 0.72,
  "risk_level": "medium",
  "rescue_needed": false,
  "advice": "specific actionable advice",
  "subtasks": [
    {{"title": "subtask name", "estimated_minutes": 60, "priority": "high", "order": 1}},
    {{"title": "subtask name", "estimated_minutes": 45, "priority": "medium", "order": 2}}
  ],
  "total_estimated_hours": 8
}}
"""
    try:
        return json.loads(_call_gemini(prompt))
    except Exception as e:
        print(f"analyze_risk error: {e}")
        risk = "critical" if deadline_days <= 1 else "high" if deadline_days <= 3 else "medium" if deadline_days <= 7 else "low"
        return {
            "risk_score": 80 if deadline_days <= 2 else 60 if deadline_days <= 5 else 40,
            "completion_probability": 0.4 if deadline_days <= 2 else 0.65 if deadline_days <= 5 else 0.82,
            "risk_level": risk,
            "rescue_needed": deadline_days <= 1,
            "advice": "Start immediately and focus on the most critical subtasks first.",
            "subtasks": [
                {"title": "Research and planning", "estimated_minutes": 120, "priority": "high", "order": 1},
                {"title": "Core implementation", "estimated_minutes": 240, "priority": "high", "order": 2},
                {"title": "Testing and review", "estimated_minutes": 60, "priority": "medium", "order": 3},
                {"title": "Final submission", "estimated_minutes": 30, "priority": "high", "order": 4}
            ],
            "total_estimated_hours": 7.5
        }


def get_risk_prediction(task_title: str, deadline: str, completed_subtasks: int, total_subtasks: int) -> dict:
    prompt = f"""
You are a deadline risk analyst AI. Analyze this task:
- Task: "{task_title}"
- Deadline: "{deadline}"
- Progress: {completed_subtasks}/{total_subtasks} subtasks done

Return ONLY valid JSON:
{{
  "risk_score": 72,
  "completion_probability": 45,
  "risk_level": "high",
  "message": "specific warning message",
  "recommendation": "specific action to take now",
  "if_delayed_message": "what happens if user delays 1 more day"
}}
"""
    try:
        return json.loads(_call_gemini(prompt))
    except Exception as e:
        print(f"get_risk_prediction error: {e}")
        return {
            "risk_score": 60,
            "completion_probability": 50,
            "risk_level": "medium",
            "message": "Moderate risk detected. Stay on track.",
            "recommendation": "Complete at least 2 subtasks today.",
            "if_delayed_message": "Delaying further will increase risk significantly."
        }


def get_coach_insight(completed_tasks: int, missed_tasks: int, avg_completion_time: float) -> dict:
    prompt = f"""
You are a personal productivity coach AI. User stats:
- Completed tasks: {completed_tasks}
- Missed deadlines: {missed_tasks}
- Avg completion time: {avg_completion_time} hours

Return ONLY valid JSON:
{{
  "insight": "personalized insight about their productivity pattern",
  "pattern": "one key behavioral pattern observed",
  "tip": "one specific actionable tip",
  "score": 78,
  "burnout_risk": "low"
}}
"""
    try:
        return json.loads(_call_gemini(prompt))
    except Exception as e:
        print(f"get_coach_insight error: {e}")
        return {
            "insight": "You're making steady progress. Keep going!",
            "pattern": "Consistent effort with room for improvement",
            "tip": "Start your hardest task first thing in the morning.",
            "score": 70,
            "burnout_risk": "low"
        }


def generate_rescue_plan(task_title: str, deadline_hours: int, remaining_subtasks: list) -> dict:
    subtasks_text = ", ".join(remaining_subtasks) if remaining_subtasks else "all tasks"
    prompt = f"""
You are an emergency productivity rescue AI. User is in CRISIS:
- Task: "{task_title}"
- Hours remaining: {deadline_hours}
- Remaining work: {subtasks_text}

Return ONLY valid JSON:
{{
  "emergency_message": "urgent motivating message",
  "pomodoro_sessions": [
    {{"session": 1, "duration_minutes": 25, "focus": "what to do", "break_minutes": 5}},
    {{"session": 2, "duration_minutes": 25, "focus": "what to do", "break_minutes": 5}}
  ],
  "must_do_now": ["action 1", "action 2", "action 3"],
  "can_skip": ["thing that can be skipped"],
  "survival_strategy": "one key strategy to survive this deadline"
}}
"""
    try:
        return json.loads(_call_gemini(prompt))
    except Exception as e:
        print(f"generate_rescue_plan error: {e}")
        return {
            "emergency_message": "Code red! Drop everything and focus NOW.",
            "pomodoro_sessions": [
                {"session": 1, "duration_minutes": 25, "focus": "Most critical task", "break_minutes": 5},
                {"session": 2, "duration_minutes": 25, "focus": "Second priority", "break_minutes": 5},
                {"session": 3, "duration_minutes": 25, "focus": "Final review", "break_minutes": 5}
            ],
            "must_do_now": ["Start immediately", "Eliminate all distractions", "Focus on core deliverables"],
            "can_skip": ["Nice-to-have features", "Perfect formatting"],
            "survival_strategy": "Focus only on what is absolutely necessary to submit."
        }


def get_rescue_plan(task_title: str, deadline: str, remaining_subtasks: list) -> dict:
    return generate_rescue_plan(task_title, 24, remaining_subtasks)


def simulate_delay(task_title: str, current_probability: float, delay_days: int, days_remaining: int) -> dict:
    prompt = f"""
You are a productivity digital twin AI. Simulate delay impact:
- Task: "{task_title}"
- Current completion probability: {current_probability * 100:.0f}%
- Days remaining: {days_remaining}
- Proposed delay: {delay_days} days

Return ONLY valid JSON:
{{
  "current_probability": {int(current_probability * 100)},
  "after_delay_probability": 45,
  "probability_drop": 25,
  "warning": "specific warning about this delay",
  "recommendation": "what to do instead"
}}
"""
    try:
        return json.loads(_call_gemini(prompt))
    except Exception as e:
        print(f"simulate_delay error: {e}")
        drop = min(40, delay_days * 10)
        new_prob = max(5, int(current_probability * 100) - drop)
        return {
            "current_probability": int(current_probability * 100),
            "after_delay_probability": new_prob,
            "probability_drop": drop,
            "warning": f"Delaying {delay_days} day(s) significantly reduces your chances of completion.",
            "recommendation": "Start now instead of delaying. Even 30 minutes of work helps."
        }


get_coaching_insight = get_coach_insight  # ← at module level