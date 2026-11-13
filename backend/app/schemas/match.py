"""
Shape of the JSON for a single resume-vs-JD check.

FastAPI validates responses against these classes and builds /docs from
them. The frontend reads exactly these field names.
"""

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, field_validator


class RequirementMatch(BaseModel):
    requirement: str                 # one line from the job description
    best_resume_line: str | None     # the resume line closest in meaning
    similarity: float                # cosine similarity, roughly 0 to 1
    status: Literal["covered", "partial", "missing"]


class MatchResult(BaseModel):
    """What the matcher computes. Stored as JSON inside MatchRecord.result."""

    overall_score: float             # 0-100, the final number
    semantic_score: float            # 0-100, from sentence embeddings
    skill_score: float | None        # 0-100, None if the JD names no known skill
    verdict: str                     # "Strong match", "Decent match", ...

    matched_skills: list[str]        # in JD and in resume
    missing_skills: list[str]        # in JD but not in resume
    extra_skills: list[str]          # in resume but JD did not ask

    requirements: list[RequirementMatch]
    suggestions: list[str]


class _SavedRecord(BaseModel):
    # from_attributes lets pydantic read straight from a SQLAlchemy object.
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    job_title: str
    resume_name: str

    @field_validator("created_at")
    @classmethod
    def _mark_as_utc(cls, value: datetime) -> datetime:
        # SQLite returns dates without a timezone. We always store UTC, so
        # we label it here; otherwise the browser would read it as local time.
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


class MatchSummary(_SavedRecord):
    """One row of the history list. Small on purpose."""

    overall_score: float
    verdict: str


class MatchDetail(_SavedRecord):
    """A saved check with its full result."""

    result: MatchResult
