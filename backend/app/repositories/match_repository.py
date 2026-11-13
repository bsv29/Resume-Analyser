"""
Database access for MatchRecord.

Every read takes user_id. That is how one user is prevented from seeing
another user's checks: the filter is in the query itself, not left to
the caller to remember.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.match_record import MatchRecord


class MatchRepository:
    def __init__(self, db: Session):
        self._db = db

    def add(self, record: MatchRecord) -> MatchRecord:
        self._db.add(record)
        self._db.commit()
        self._db.refresh(record)   # reload so id and created_at are filled in
        return record

    def get_for_user(self, record_id: str, user_id: str) -> MatchRecord | None:
        query = select(MatchRecord).where(
            MatchRecord.id == record_id,
            MatchRecord.user_id == user_id,
        )
        return self._db.scalar(query)

    def list_for_user(self, user_id: str, limit: int, offset: int = 0) -> list[MatchRecord]:
        # SELECT * FROM match_records WHERE user_id = ?
        # ORDER BY created_at DESC LIMIT ? OFFSET ?
        query = (
            select(MatchRecord)
            .where(MatchRecord.user_id == user_id)
            .order_by(MatchRecord.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(self._db.scalars(query))

    def delete(self, record: MatchRecord) -> None:
        self._db.delete(record)
        self._db.commit()
