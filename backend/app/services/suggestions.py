"""
Turns the numbers into a few plain sentences for the user.
Simple if/else rules. No model is involved.
"""

from app.schemas.match import RequirementMatch


def build_suggestions(
    missing_skills: list[str],
    requirements: list[RequirementMatch],
    resume_line_count: int,
) -> list[str]:
    suggestions: list[str] = []

    if resume_line_count < 8:
        suggestions.append(
            "Very little text was read from the resume. If it is a PDF with "
            "columns or icons, paste the text instead and check again."
        )

    if missing_skills:
        names = ", ".join(missing_skills[:6])
        suggestions.append(
            f"The job description names {names}, and the resume does not. "
            "Add the ones you have actually worked with."
        )

    missing = [r for r in requirements if r.status == "missing"]
    partial = [r for r in requirements if r.status == "partial"]

    if missing:
        suggestions.append(
            f"{len(missing)} requirement(s) have nothing close in the resume. "
            "If you have that experience, write one clear line about it."
        )
    if partial:
        suggestions.append(
            f"{len(partial)} requirement(s) are only loosely covered. Reword "
            "those resume lines so they use the terms from the job description."
        )

    if not suggestions:
        suggestions.append(
            "The resume already covers this job description well. "
            "Check that your strongest matching project is near the top."
        )
    return suggestions
