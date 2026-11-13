"""JSON shape for the dashboard page. One request returns everything it shows."""

from datetime import datetime

from pydantic import BaseModel

from app.schemas.match import MatchSummary


class DashboardStats(BaseModel):
    total_checks: int
    average_score: float | None      # None when there are no checks yet
    best_score: float | None
    checks_last_7_days: int


class ScorePoint(BaseModel):
    id: str
    created_at: datetime
    job_title: str
    overall_score: float


class VerdictCount(BaseModel):
    verdict: str
    count: int


class SkillCount(BaseModel):
    skill: str
    count: int


class DashboardResponse(BaseModel):
    stats: DashboardStats
    score_trend: list[ScorePoint]            # oldest first, for the line chart
    verdict_breakdown: list[VerdictCount]
    top_missing_skills: list[SkillCount]
    recent: list[MatchSummary]
