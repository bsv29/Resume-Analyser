from tests.conftest import JD
from tests.pdf_factory import make_pdf

URL = "/api/v1/rankings"

STRONG = make_pdf([
    "Built reusable React components and dashboards for internal tools.",
    "Created REST APIs with FastAPI for a reporting product.",
    "Deployed services with Docker and Kubernetes.",
])
WEAK = make_pdf([
    "Managed the college cultural fest with a team of twenty volunteers.",
    "Handled sponsorship outreach and vendor negotiations.",
    "Organised weekly photography club meetings on campus.",
])


def _pdf(name, content):
    return ("resume_files", (name, content, "application/pdf"))


def test_resumes_come_back_ordered_by_score(auth_client):
    response = auth_client.post(
        URL,
        data={"jd_text": JD},
        files=[_pdf("weak.pdf", WEAK), _pdf("strong.pdf", STRONG)],
    )
    body = response.json()

    assert response.status_code == 200
    assert [item["resume_name"] for item in body["ranked"]] == ["strong.pdf", "weak.pdf"]
    assert [item["rank"] for item in body["ranked"]] == [1, 2]
    assert body["ranked"][0]["overall_score"] > body["ranked"][1]["overall_score"]


def test_unreadable_file_is_skipped_and_the_rest_are_ranked(auth_client):
    response = auth_client.post(
        URL,
        data={"jd_text": JD},
        files=[_pdf("strong.pdf", STRONG), _pdf("broken.pdf", b"not a pdf"), _pdf("weak.pdf", WEAK)],
    )
    body = response.json()

    assert response.status_code == 200
    assert len(body["ranked"]) == 2
    assert body["skipped"][0]["resume_name"] == "broken.pdf"


def test_single_resume_is_rejected(auth_client):
    response = auth_client.post(URL, data={"jd_text": JD}, files=[_pdf("strong.pdf", STRONG)])
    assert response.status_code == 400


def test_pdf_upload_works_for_a_single_check(auth_client):
    response = auth_client.post(
        "/api/v1/matches",
        data={"jd_text": JD},
        files={"resume_file": ("strong.pdf", STRONG, "application/pdf")},
    )
    assert response.status_code == 201
    assert response.json()["resume_name"] == "strong.pdf"
