from google import genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def _call_gemini(prompt: str) -> str:
    """Single helper so we only write the API call once"""
    response = client.models.generate_content(
        model="gemini-1.5-flash-8b",
        contents=prompt
    )
    text = response.text.strip()
    # Remove markdown code blocks if Gemini adds them
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return text.strip()


def forge_task(task_description: str, deadline: str) -> dict:
    """Break a task into subtasks using Gemini"""
    prompt = f"""
You are a productivity expert AI. A user has this task: "{task_description}" with deadline: "{deadline}".

Break this into subtasks and return ONLY valid JSON, no markdown, no explanation:
{{
  "title": "main task title",
  "subtasks": [
    {{"title": "subtask name", "estimated_hours": 2, "priority": "high", "order": 1}},
    {{"title": "subtask name", "estimated_hours": 1, "priority": "medium", "order": 2}}
  ],
  "total_estimated_hours": 10,
  "difficulty": "medium",
  "strategy": "one sentence execution strategy"
}}
"""
    try:
        return json.loads(_call_gemini(prompt))
    except Exception as e:
        print(f"forge_task error: {e}")
        return {
            "title": task_description,
            "subtasks": [
                {"title": "Research and planning", "estimated_hours": 2, "priority": "high", "order": 1},
                {"title": "Core execution", "estimated_hours": 4, "priority": "high", "order": 2},
                {"title": "Review and finalize", "estimated_hours": 1, "priority": "medium", "order": 3}
            ],
            "total_estimated_hours": 7,
            "difficulty": "medium",
            "strategy": "Break work into focused sessions and start immediately."
        }


def get_risk_prediction(task_title: str, deadline: str, completed_subtasks: int, total_subtasks: int) -> dict:
    """Predict deadline risk using Gemini"""
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
    """Generate coaching insight using Gemini"""
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


def get_rescue_plan(task_title: str, deadline: str, remaining_subtasks: list) -> dict:
    """Generate emergency rescue plan using Gemini"""
    subtasks_text = ", ".join(remaining_subtasks) if remaining_subtasks else "all tasks"
    prompt = f"""
You are an emergency productivity rescue AI. User is in CRISIS:
- Task: "{task_title}"
- Deadline: "{deadline}" (URGENT)
- Remaining: {subtasks_text}

Generate an emergency plan. Return ONLY valid JSON:
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
        print(f"get_rescue_plan error: {e}")
        return {
            "emergency_message": "Code red! Drop everything and focus NOW.",
            "pomodoro_sessions": [
                {"session": 1, "duration_minutes": 25, "focus": "Most critical task", "break_minutes": 5},
                {"session": 2, "duration_minutes": 25, "focus": "Second priority", "break_minutes": 5}
            ],
            "must_do_now": ["Start immediately", "Eliminate all distractions", "Focus on core deliverables"],
            "can_skip": ["Nice-to-have features"],
            "survival_strategy": "Focus only on what's absolutely necessary to submit."
        }