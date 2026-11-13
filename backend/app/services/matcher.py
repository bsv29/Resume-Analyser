"""
The scoring logic. A pure function: text in, MatchResult out.
It does not know about HTTP, files or the database, which is why the
training/evaluate.py script can reuse it unchanged.

Steps:
  1. Cut resume and JD into lines.
  2. Turn every line into a vector (embedding).
  3. For each JD line, find the resume line with the highest cosine similarity.
  4. Compare skills by keyword.
  5. Mix both into one score.
"""

import numpy as np

from app.core.config import Settings
from app.core.exceptions import UnprocessableError
from app.schemas.match import MatchResult, RequirementMatch
from app.services.skill_extractor import extract_skills
from app.services.suggestions import build_suggestions
from app.services.text_processing import split_into_lines


def _status_for(similarity: float, settings: Settings) -> str:
    if similarity >= settings.covered_threshold:
        return "covered"
    if similarity >= settings.partial_threshold:
        return "partial"
    return "missing"


def _to_percent(similarity: float, settings: Settings) -> float:
    """
    Stretch a raw cosine similarity onto 0-100.

    With floor=0.20 and ceiling=0.70:
        0.20 or less -> 0
        0.45         -> 50
        0.70 or more -> 100
    Same idea as min-max scaling of a feature.
    """
    span = settings.similarity_ceiling - settings.similarity_floor
    scaled = (similarity - settings.similarity_floor) / span
    return float(np.clip(scaled, 0.0, 1.0) * 100)


def _verdict_for(score: float) -> str:
    if score >= 75:
        return "Strong match"
    if score >= 55:
        return "Decent match"
    if score >= 35:
        return "Partial match"
    return "Weak match"


def match_resume_to_jd(
    resume_text: str,
    jd_text: str,
    embedder,
    settings: Settings,
) -> MatchResult:
    # ---- 1. cut both documents into lines --------------------------------
    resume_lines = split_into_lines(resume_text, min_words=3)
    # min_words=4 for the JD so short headings ("About the role") are skipped
    jd_lines = split_into_lines(jd_text, min_words=4)

    if not resume_lines:
        raise UnprocessableError("The resume has no readable sentences.")
    if not jd_lines:
        raise UnprocessableError("The job description has no readable sentences.")

    # ---- 2. embeddings ----------------------------------------------------
    resume_vectors = embedder.encode(resume_lines)   # shape (R, 384)
    jd_vectors = embedder.encode(jd_lines)           # shape (J, 384)

    # ---- 3. similarity of every JD line with every resume line -------------
    # Vectors have length 1, so dot product == cosine similarity.
    # Result shape is (J, R): row = one JD line, column = one resume line.
    similarity = jd_vectors @ resume_vectors.T

    best_resume_index = similarity.argmax(axis=1)    # best column for each row
    best_similarity = similarity.max(axis=1)         # the value at that column

    requirements = []
    for row, jd_line in enumerate(jd_lines):
        score = float(best_similarity[row])
        status = _status_for(score, settings)
        requirements.append(
            RequirementMatch(
                requirement=jd_line,
                # For "missing" we show no resume line: the closest one is
                # not really related, and showing it would confuse the user.
                best_resume_line=(
                    None if status == "missing"
                    else resume_lines[int(best_resume_index[row])]
                ),
                similarity=round(score, 3),
                status=status,
            )
        )

    # Average of "how well is each JD line covered", stretched to 0-100.
    semantic_score = _to_percent(float(best_similarity.mean()), settings)

    # ---- 4. skills ----------------------------------------------------------
    jd_skills = extract_skills(jd_text)
    resume_skills = extract_skills(resume_text)

    matched_skills = sorted(jd_skills & resume_skills)    # & = in both sets
    missing_skills = sorted(jd_skills - resume_skills)    # - = only in JD
    extra_skills = sorted(resume_skills - jd_skills)

    # ---- 5. final score -------------------------------------------------------
    if jd_skills:
        skill_score = len(matched_skills) / len(jd_skills) * 100
        overall = (
            settings.semantic_weight * semantic_score
            + settings.skill_weight * skill_score
        )
    else:
        # JD mentions no skill from our list, so we cannot judge skills.
        # Use the semantic score alone instead of punishing the resume.
        skill_score = None
        overall = semantic_score

    return MatchResult(
        overall_score=round(overall, 1),
        semantic_score=round(semantic_score, 1),
        skill_score=None if skill_score is None else round(skill_score, 1),
        verdict=_verdict_for(overall),
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        extra_skills=extra_skills,
        requirements=requirements,
        suggestions=build_suggestions(missing_skills, requirements, len(resume_lines)),
    )
