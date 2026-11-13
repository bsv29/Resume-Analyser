from tests.conftest import JD, RESUME

URL = "/api/v1/insights/skills"


def test_empty_insights_for_a_new_user(auth_client):
    body = auth_client.get(URL).json()

    assert body == {
        "total_checks": 0,
        "unique_skills": 0,
        "overall_coverage": None,
        "skills": [],
        "extras": [],
    }


def test_insights_count_matched_and_missing_skills(auth_client):
    for _ in range(2):
        auth_client.post("/api/v1/matches", data={"jd_text": JD, "resume_text": RESUME})

    body = auth_client.get(URL).json()
    skills = {item["skill"]: item for item in body["skills"]}

    assert body["total_checks"] == 2
    assert skills["Docker"] == {
        "skill": "Docker", "asked": 2, "matched": 0, "missing": 2, "coverage": 0.0
    }
    assert skills["React"]["matched"] == 2 and skills["React"]["coverage"] == 100.0
    assert 0 < body["overall_coverage"] < 100
    assert {item["skill"] for item in body["extras"]} >= {"PyTorch"}


def test_insights_need_login(client):
    assert client.get(URL).status_code == 401
