"""
Skill statistics across all of a user's saved checks.

A pure function like build_dashboard: records in, response out. A skill
counts as "asked" in a check when it is either matched or missing there.
"""

from collections import Counter

from app.models.match_record import MatchRecord
from app.schemas.insights import ExtraSkill, SkillInsightsResponse, SkillStat

TOP_SKILLS = 40
TOP_EXTRAS = 15


def _percent(part: int, whole: int) -> float:
    return round(100 * part / whole, 1) if whole else 0.0


def build_skill_insights(records: list[MatchRecord]) -> SkillInsightsResponse:
    matched = Counter()
    missing = Counter()
    extras = Counter()

    for record in records:
        result = record.result or {}
        matched.update(set(result.get("matched_skills", [])))
        missing.update(set(result.get("missing_skills", [])))
        extras.update(set(result.get("extra_skills", [])))

    asked = matched + missing
    skills = [
        SkillStat(
            skill=skill,
            asked=count,
            matched=matched[skill],
            missing=missing[skill],
            coverage=_percent(matched[skill], count),
        )
        # most asked first; among equals, the ones missed more often first
        for skill, count in sorted(asked.items(), key=lambda item: (-item[1], -missing[item[0]], item[0]))
    ][:TOP_SKILLS]

    total_asked = sum(asked.values())
    return SkillInsightsResponse(
        total_checks=len(records),
        unique_skills=len(asked),
        overall_coverage=_percent(sum(matched.values()), total_asked) if total_asked else None,
        skills=skills,
        extras=[ExtraSkill(skill=s, count=c) for s, c in extras.most_common(TOP_EXTRAS)],
    )
