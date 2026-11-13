"""
Ranks several resumes against one job description.

One bad file must not fail the whole batch. A resume that cannot be read
(scanned PDF, wrong type, too large) goes into "skipped" with the reason,
and the others are still ranked.
"""

import logging

from app.core.config import Settings
from app.core.exceptions import AppError
from app.schemas.ranking import RankedResume, RankingResponse, SkippedResume
from app.services.matcher import match_resume_to_jd
from app.services.resume_reader import ResumeFile, check_job_description, read_resume_file
from app.services.text_processing import first_line

logger = logging.getLogger(__name__)


def rank_resumes(
    jd_text: str,
    files: list[ResumeFile],
    embedder,
    settings: Settings,
) -> RankingResponse:
    check_job_description(jd_text, settings)

    if len(files) < 2:
        raise AppError("Upload at least two resumes to rank.")
    if len(files) > settings.max_rank_files:
        raise AppError(f"Upload at most {settings.max_rank_files} resumes at a time.")

    scored = []
    skipped = []

    for file in files:
        try:
            resume_text = read_resume_file(file, settings)
            result = match_resume_to_jd(resume_text, jd_text, embedder, settings)
        except AppError as error:
            skipped.append(SkippedResume(resume_name=file.filename, reason=error.message))
            continue
        scored.append((file.filename, result))

    # Highest overall score first.
    scored.sort(key=lambda pair: pair[1].overall_score, reverse=True)

    ranked = [
        RankedResume(
            rank=position,
            resume_name=name,
            overall_score=result.overall_score,
            semantic_score=result.semantic_score,
            skill_score=result.skill_score,
            verdict=result.verdict,
            matched_skills=result.matched_skills,
            missing_skills=result.missing_skills,
        )
        for position, (name, result) in enumerate(scored, start=1)
    ]
    logger.info("ranking done ranked=%d skipped=%d", len(ranked), len(skipped))

    return RankingResponse(job_title=first_line(jd_text), ranked=ranked, skipped=skipped)
