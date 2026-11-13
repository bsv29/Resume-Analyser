from tests.conftest import JD, RESUME, register

LOGIN = "/api/v1/auth/login"
ME = "/api/v1/auth/me"
MATCHES = "/api/v1/matches"


def test_register_returns_a_token_and_the_user_without_password(client):
    response = register(client)
    body = response.json()

    assert response.status_code == 201
    assert body["access_token"]
    assert body["user"]["email"] == "asha@example.com"
    assert "password" not in str(body).lower()


def test_same_email_cannot_register_twice(client):
    register(client)
    assert register(client).status_code == 409


def test_short_password_is_rejected_with_a_readable_message(client):
    response = register(client, password="short")
    assert response.status_code == 422
    assert response.json()["detail"].startswith("Password")


def test_login_works_with_the_right_password_only(client):
    register(client)

    good = client.post(LOGIN, json={"email": "asha@example.com", "password": "correct-horse-9"})
    bad = client.post(LOGIN, json={"email": "asha@example.com", "password": "wrong-password"})
    unknown = client.post(LOGIN, json={"email": "nobody@example.com", "password": "whatever-123"})

    assert good.status_code == 200
    assert bad.status_code == 401
    # same answer for a wrong password and an unknown email
    assert unknown.json() == bad.json()


def test_me_needs_a_valid_token(client):
    assert client.get(ME).status_code == 401
    assert client.get(ME, headers={"Authorization": "Bearer not-a-token"}).status_code == 401

    token = register(client).json()["access_token"]
    response = client.get(ME, headers={"Authorization": f"Bearer {token}"})
    assert response.json()["name"] == "Asha Rao"


def test_protected_endpoints_reject_anonymous_requests(client):
    assert client.get(MATCHES).status_code == 401
    assert client.post(MATCHES, data={"jd_text": JD, "resume_text": RESUME}).status_code == 401
    assert client.get("/api/v1/dashboard").status_code == 401


def test_one_user_cannot_see_or_delete_another_users_check(client):
    asha = {"Authorization": f"Bearer {register(client).json()['access_token']}"}
    ravi_token = register(client, email="ravi@example.com", name="Ravi K").json()["access_token"]
    ravi = {"Authorization": f"Bearer {ravi_token}"}

    created = client.post(MATCHES, data={"jd_text": JD, "resume_text": RESUME}, headers=asha).json()

    assert client.get(MATCHES, headers=ravi).json() == []
    assert client.get(f"{MATCHES}/{created['id']}", headers=ravi).status_code == 404
    assert client.delete(f"{MATCHES}/{created['id']}", headers=ravi).status_code == 404
    assert client.get(f"{MATCHES}/{created['id']}", headers=asha).status_code == 200
