"""Shape of the JSON for ranking several resumes against one JD."""

from pydantic import BaseModel


class RankedResume(BaseModel):
    rank: int
    resume_name: str
    overall_score: float
    semantic_score: float
    skill_score: float | None
    verdict: str
    matched_skills: list[str]
    missing_skills: list[str]


class SkippedResume(BaseModel):
    resume_name: str
    reason: str          # why it could not be scored, e.g. scanned PDF


class RankingResponse(BaseModel):
    job_title: str
    ranked: list[RankedResume]
    skipped: list[SkippedResume]
