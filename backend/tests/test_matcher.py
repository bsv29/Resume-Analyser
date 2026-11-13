from app.core.config import get_settings
from app.services.matcher import match_resume_to_jd
from tests.conftest import JD, RESUME


def test_matcher_separates_matched_and_missing_skills(fake_embedder):
    result = match_resume_to_jd(RESUME, JD, fake_embedder, get_settings())

    assert {"React", "FastAPI", "REST APIs"} <= set(result.matched_skills)
    assert {"Docker", "Kubernetes"} <= set(result.missing_skills)
    assert 0 <= result.overall_score <= 100


def test_matcher_marks_each_requirement(fake_embedder):
    result = match_resume_to_jd(RESUME, JD, fake_embedder, get_settings())
    by_text = {item.requirement: item for item in result.requirements}

    covered = by_text["Build reusable React components and dashboards"]
    missing = by_text["Experience with Docker and Kubernetes for deployment"]

    assert covered.status == "covered"
    assert covered.best_resume_line.startswith("Built reusable React")
    assert missing.status == "missing"
    assert missing.best_resume_line is None
