"""JSON shape for the Skills Insights page."""

from pydantic import BaseModel


class SkillStat(BaseModel):
    skill: str
    asked: int          # how many job descriptions named this skill
    matched: int        # ...and the resume had it
    missing: int        # ...and the resume did not
    coverage: float     # matched / asked, 0-100


class ExtraSkill(BaseModel):
    skill: str
    count: int          # resume had it, the job did not ask for it


class SkillInsightsResponse(BaseModel):
    total_checks: int
    unique_skills: int              # distinct skills asked for across all checks
    overall_coverage: float | None  # all matched / all asked, 0-100
    skills: list[SkillStat]         # most asked first
    extras: list[ExtraSkill]        # most frequent first
