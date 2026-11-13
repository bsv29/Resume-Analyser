from tests.conftest import JD, RESUME

URL = "/api/v1/dashboard"


def test_empty_dashboard_for_a_new_user(auth_client):
    body = auth_client.get(URL).json()

    assert body["stats"] == {
        "total_checks": 0,
        "average_score": None,
        "best_score": None,
        "checks_last_7_days": 0,
    }
    assert body["score_trend"] == []
    assert body["recent"] == []
    assert [item["count"] for item in body["verdict_breakdown"]] == [0, 0, 0, 0]


def test_dashboard_counts_checks_and_missing_skills(auth_client):
    for _ in range(2):
        auth_client.post("/api/v1/matches", data={"jd_text": JD, "resume_text": RESUME})

    body = auth_client.get(URL).json()

    assert body["stats"]["total_checks"] == 2
    assert body["stats"]["checks_last_7_days"] == 2
    assert body["stats"]["average_score"] == body["stats"]["best_score"]
    assert len(body["score_trend"]) == 2
    assert len(body["recent"]) == 2
    assert sum(item["count"] for item in body["verdict_breakdown"]) == 2
    # Docker and Kubernetes are in the JD and not in the resume, in both checks
    missing = {item["skill"]: item["count"] for item in body["top_missing_skills"]}
    assert missing["Docker"] == 2 and missing["Kubernetes"] == 2
