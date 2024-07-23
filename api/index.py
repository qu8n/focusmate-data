
from typing import Annotated

from pydantic import BaseModel
from api_helpers.metric import calculate_max_daily_streak, \
    calculate_curr_streak, get_duration_pie_data, get_punctuality_pie_data, prep_chart_data_by_time, \
    prepare_heatmap_data, prepare_history_data, prep_chart_data_by_range
from api_helpers.supabase import get_weekly_goal, update_daily_streak
from api_helpers.time import get_end_of_week, get_start_of_week, \
    ms_to_h, get_start_of_prev_week
from api_helpers.request import get_access_token, get_session_id
from api_helpers.focusmate import fetch_focusmate_profile, get_data
import os
from fastapi import Depends, FastAPI
from dotenv import load_dotenv
from cachetools import TTLCache
from cachetools.keys import hashkey
import ssl
ssl._create_default_https_context = ssl._create_stdlib_context


app = FastAPI()
load_dotenv()
cache = TTLCache(maxsize=100, ttl=60)


fm_api_profile_endpoint = os.getenv("NEXT_PUBLIC_FM_API_PROFILE_ENDPOINT")
fm_api_sessions_endpoint = os.getenv("NEXT_PUBLIC_FM_API_SESSIONS_ENDPOINT")

SessionIdDep = Annotated[str, Depends(get_session_id)]


@app.get("/api/py/streak")
async def streak(session_id: SessionIdDep):
    profile, sessions = await get_data(session_id, cache)

    all_sessions = sessions.copy()
    sessions = sessions[sessions['completed'] == True]
    local_timezone: str = profile.get("timeZone")

    daily_streak = calculate_curr_streak(sessions, "D", local_timezone)
    update_daily_streak(profile.get("userId"), daily_streak)

    return {
        "daily_streak": daily_streak,
        "weekly_streak": calculate_curr_streak(sessions, "W", local_timezone),
        "monthly_streak": calculate_curr_streak(sessions, "M", local_timezone),
        "max_daily_streak": calculate_max_daily_streak(sessions),
        "heatmap_data": prepare_heatmap_data(sessions),
        "history_data": prepare_history_data(all_sessions, head=3)
    }


@app.get("/api/py/goal")
async def goal(session_id: SessionIdDep):
    profile: dict = cache.get(
        hashkey('profile', session_id))

    if profile is None:
        access_token = get_access_token(session_id)
        profile = fetch_focusmate_profile(
            fm_api_profile_endpoint, access_token).get("user")

    return get_weekly_goal(profile.get("userId"))


@app.get("/api/py/weekly")
async def weekly(session_id: SessionIdDep):
    profile, sessions = await get_data(session_id, cache)
    sessions = sessions[sessions['completed'] == True]
    local_timezone: str = profile.get("timeZone")

    start_of_week = get_start_of_week(local_timezone)
    start_of_prev_week = get_start_of_prev_week(local_timezone)
    end_of_week = get_end_of_week(start_of_week)

    curr_week_sessions = sessions[sessions['start_time'] >= start_of_week]
    prev_week_sessions = sessions[
        (sessions['start_time'] >= start_of_prev_week) &
        (sessions['start_time'] < start_of_week)
    ]

    partner_session_counts = curr_week_sessions['partner_id'].value_counts()
    total_repeat_partners = len(
        partner_session_counts[partner_session_counts > 1])

    return {
        "total": {
            "sessions": len(curr_week_sessions),
            "hours": ms_to_h(curr_week_sessions['duration'].sum()),
            "partners": len(curr_week_sessions['partner_id'].unique()),
            "repeat_partners": total_repeat_partners
        },
        "prev_period_delta": {
            "sessions": len(curr_week_sessions) - len(prev_week_sessions),
            "hours": ms_to_h(curr_week_sessions['duration'].sum() -
                             prev_week_sessions['duration'].sum())
        },
        "chart": {
            "range": prep_chart_data_by_range(
                curr_week_sessions, start_of_week, end_of_week),
            "time": prep_chart_data_by_time(curr_week_sessions),
            "pie": get_duration_pie_data(curr_week_sessions),
            "punctuality": get_punctuality_pie_data(curr_week_sessions)
        }
    }


class Item(BaseModel):
    page_index: int
    page_size: int


@app.post("/api/py/history")
async def streak(session_id: SessionIdDep, item: Item):
    _, sessions = await get_data(session_id, cache)
    data = prepare_history_data(sessions)
    return {
        "rows": data[item.page_index * item.page_size:
                     (item.page_index + 1) * item.page_size],
        "row_count": len(data)
    }


@app.get("/api/py/history-all")
async def streak(session_id: SessionIdDep):
    _, sessions = await get_data(session_id, cache)
    return prepare_history_data(sessions)
