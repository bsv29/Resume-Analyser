import pytest

from app.core.config import Settings

SITE = "https://resume-analysers.netlify.app"


@pytest.mark.parametrize(
    "raw",
    [
        f'["{SITE}"]',          # JSON list
        SITE,                   # plain URL
        f"{SITE}/",             # trailing slash
        f"[{SITE}]",            # brackets without quotes
        f"“{SITE}”",            # smart quotes pasted from a document
    ],
)
def test_allowed_origins_accepts_common_formats(monkeypatch, raw):
    monkeypatch.setenv("ALLOWED_ORIGINS", raw)
    assert Settings(_env_file=None).allowed_origins == [SITE]


def test_allowed_origins_comma_separated(monkeypatch):
    monkeypatch.setenv("ALLOWED_ORIGINS", f"{SITE}, http://localhost:5173")
    assert Settings(_env_file=None).allowed_origins == [SITE, "http://localhost:5173"]
