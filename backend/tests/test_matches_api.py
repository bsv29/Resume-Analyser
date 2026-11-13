from tests.conftest import JD, RESUME

URL = "/api/v1/matches"


def _create(client):
    return client.post(URL, data={"jd_text": JD, "resume_text": RESUME})


def test_create_saves_the_check_and_returns_it(auth_client):
    response = _create(auth_client)
    body = response.json()

    assert response.status_code == 201
    assert body["job_title"] == "Junior ML Engineer"
    assert body["resume_name"] == "Pasted text"
    assert 0 <= body["result"]["overall_score"] <= 100


def test_saved_check_can_be_listed_and_opened(auth_client):
    created = _create(auth_client).json()

    listed = auth_client.get(URL).json()
    assert [item["id"] for item in listed] == [created["id"]]
    assert "result" not in listed[0]          # the list stays small

    opened = auth_client.get(f"{URL}/{created['id']}").json()
    assert opened["result"] == created["result"]


def test_delete_removes_the_check(auth_client):
    created = _create(auth_client).json()

    assert auth_client.delete(f"{URL}/{created['id']}").status_code == 204
    assert auth_client.get(f"{URL}/{created['id']}").status_code == 404
    assert auth_client.get(URL).json() == []


def test_unknown_id_returns_404(auth_client):
    assert auth_client.get(f"{URL}/does-not-exist").status_code == 404


def test_create_without_resume_is_rejected(auth_client):
    response = auth_client.post(URL, data={"jd_text": JD})
    assert response.status_code == 400
    assert "resume" in response.json()["detail"].lower()


def test_create_with_short_job_description_is_rejected(auth_client):
    response = auth_client.post(URL, data={"jd_text": "React dev", "resume_text": RESUME})
    assert response.status_code == 400


def test_non_pdf_upload_is_rejected(auth_client):
    response = auth_client.post(
        URL,
        data={"jd_text": JD},
        files={"resume_file": ("resume.docx", b"hello", "application/octet-stream")},
    )
    assert response.status_code == 400
    assert "pdf" in response.json()["detail"].lower()
