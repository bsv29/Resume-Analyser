"""
A saved resume-vs-JD check.

Columns that we filter or sort by (owner, date, score) are real columns.
The detailed result (requirement list, skills, suggestions) is stored as
one JSON column, because it is always read and written as a whole.
"""

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _new_id() -> str:
    return uuid4().hex


def _now() -> datetime:
    return datetime.now(timezone.utc)


class MatchRecord(Base):
    __tablename__ = "match_records"

    # A random id instead of 1, 2, 3 so ids cannot be guessed.
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_new_id)

    # Who owns this check. Every query filters on it, so it has an index.
    user_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, index=True
    )
    job_title: Mapped[str] = mapped_column(String(120))
    resume_name: Mapped[str] = mapped_column(String(255))
    overall_score: Mapped[float] = mapped_column(Float)
    verdict: Mapped[str] = mapped_column(String(40))
    result: Mapped[dict] = mapped_column(JSON)
