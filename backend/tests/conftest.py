"""
Shared test setup.

Two things are replaced so tests are fast and need nothing installed:

1. The model -> FakeEmbedder, a bag-of-words vector. Sentences that share
   words get a high similarity. Enough to test OUR code (splitting,
   scoring, saving, validation). It says nothing about model quality;
   training/evaluate.py measures that.
2. The database -> a fresh SQLite database in memory for every test.
"""

import re
import zlib

import numpy as np
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401  (registers tables on Base)
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.ml.embedder import get_embedder

RESUME = """
Built reusable React components and dashboards for an HR product.
Created REST APIs with FastAPI and stored data in PostgreSQL.
Fine-tuned a DistilBERT model for text classification using PyTorch.
"""

JD = """
Junior ML Engineer
- Build reusable React components and dashboards
- Create REST APIs with FastAPI
- Experience with Docker and Kubernetes for deployment
"""


class FakeEmbedder:
    size = 256

    def encode(self, sentences: list[str]) -> np.ndarray:
        vectors = np.zeros((len(sentences), self.size))
        for row, sentence in enumerate(sentences):
            for word in re.findall(r"[a-z0-9+#.]+", sentence.lower()):
                vectors[row, zlib.crc32(word.encode()) % self.size] += 1
        lengths = np.linalg.norm(vectors, axis=1, keepdims=True)
        return vectors / np.where(lengths == 0, 1, lengths)


@pytest.fixture
def fake_embedder():
    return FakeEmbedder()


@pytest.fixture
def client(fake_embedder):
    # StaticPool keeps the single in-memory connection alive for the test.
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    def override_get_db():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_embedder] = lambda: fake_embedder

    # Not using "with TestClient(app)" so the real startup (model load) is skipped.
    yield TestClient(app)

    app.dependency_overrides.clear()


def register(client, email="asha@example.com", name="Asha Rao", password="correct-horse-9"):
    """Create an account and return the response."""
    return client.post(
        "/api/v1/auth/register",
        json={"name": name, "email": email, "password": password},
    )


@pytest.fixture
def auth_client(client):
    """A client that is already logged in: the token is sent with every request."""
    token = register(client).json()["access_token"]
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client
