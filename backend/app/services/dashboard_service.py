"""
Builds the numbers for the dashboard from a user's saved checks.

A pure function: list of records in, DashboardResponse out. The counting
is done in Python because the missing skills live inside the JSON column;
with a few hundred rows per user this is fast enough.
"""

from collections import Counter
from datetime import datetime, timedelta, timezone

from app.models.match_record import MatchRecord
from app.schemas.dashboard import (
    DashboardResponse,
    DashboardStats,
    ScorePoint,
    SkillCount,
    VerdictCount,
)
from app.schemas.match import MatchSummary

VERDICT_ORDER = ["Strong match", "Decent match", "Partial match", "Weak match"]
TREND_POINTS = 12
TOP_SKILLS = 6
RECENT_ROWS = 5


def _as_utc(value: datetime) -> datetime:
    # SQLite returns dates without a timezone; we always store UTC.
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def build_dashboard(records: list[MatchRecord]) -> DashboardResponse:
    """records must be ordered newest first."""
    scores = [record.overall_score for record in records]
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)

    stats = DashboardStats(
        total_checks=len(records),
        average_score=round(sum(scores) / len(scores), 1) if scores else None,
        best_score=max(scores) if scores else None,
        checks_last_7_days=sum(1 for r in records if _as_utc(r.created_at) >= week_ago),
    )

    # Take the newest 12, then reverse so the chart reads left to right in time.
    trend = [
        ScorePoint(
            id=record.id,
            created_at=_as_utc(record.created_at),
            job_title=record.job_title,
            overall_score=record.overall_score,
        )
        for record in reversed(records[:TREND_POINTS])
    ]

    verdict_counts = Counter(record.verdict for record in records)
    breakdown = [
        VerdictCount(verdict=verdict, count=verdict_counts.get(verdict, 0))
        for verdict in VERDICT_ORDER
    ]

    # How often each skill was missing, across all checks.
    skill_counts = Counter(
        skill for record in records for skill in record.result.get("missing_skills", [])
    )
    top_missing = [
        SkillCount(skill=skill, count=count)
        for skill, count in skill_counts.most_common(TOP_SKILLS)
    ]

    return DashboardResponse(
        stats=stats,
        score_trend=trend,
        verdict_breakdown=breakdown,
        top_missing_skills=top_missing,
        recent=[MatchSummary.model_validate(record) for record in records[:RECENT_ROWS]],
    )
