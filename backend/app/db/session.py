"""
Database connection.

engine        = the connection to the database file/server
SessionLocal  = a factory; each request gets its own short-lived session
get_db        = FastAPI dependency that opens a session and always closes it
"""

from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.db.base import Base

_settings = get_settings()

if _settings.database_url.startswith("sqlite"):
    # SQLite by default refuses to be used from more than one thread.
    # FastAPI runs requests in a thread pool, so we switch that check off.
    engine = create_engine(_settings.database_url, connect_args={"check_same_thread": False})
else:
    # Hosted PostgreSQL (e.g. Neon) closes idle connections and may pause
    # the whole database when nobody uses it. pool_pre_ping tests each
    # pooled connection before use and replaces a dead one instead of
    # failing the request; pool_recycle drops connections after 5 minutes.
    # prepare_threshold=None turns off server-side prepared statements,
    # which connection poolers in transaction mode do not keep.
    engine = create_engine(
        _settings.database_url,
        pool_pre_ping=True,
        pool_recycle=300,
        connect_args={"prepare_threshold": None},
    )
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create tables that do not exist yet. Safe to call on every start."""
    # The import registers the table classes on Base before create_all runs.
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
