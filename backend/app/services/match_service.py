"""
Use cases for single checks: create one, list them, open one, delete one.

A service method is the full story of one user action. For "create":
read the resume -> score it -> save it -> return the saved record.
The endpoint above it only translates HTTP, the repository below it only
talks to the database.

The service is built for ONE logged-in user (see api/deps.py), so every
method automatically works only on that user's checks.
"""

import logging
import time

from app.core.config import Settings
from app.core.exceptions import NotFoundError
from app.models.match_record import MatchRecord
from app.models.user import User
from app.repositories.match_repository import MatchRepository
from app.schemas.dashboard import DashboardResponse
from app.schemas.insights import SkillInsightsResponse
from app.services.dashboard_service import build_dashboard
from app.services.insights_service import build_skill_insights
from app.services.matcher import match_resume_to_jd
from app.services.resume_reader import ResumeFile, check_job_description, read_resume
from app.services.text_processing import first_line

logger = logging.getLogger(__name__)

_DASHBOARD_ROWS = 500


class MatchService:
    def __init__(self, repository: MatchRepository, embedder, settings: Settings, user: User):
        self._repository = repository
        self._embedder = embedder
        self._settings = settings
        self._user = user

    def create(
        self,
        jd_text: str,
        resume_file: ResumeFile | None = None,
        resume_text: str | None = None,
    ) -> MatchRecord:
        check_job_description(jd_text, self._settings)
        resume, resume_name = read_resume(resume_file, resume_text, self._settings)

        started = time.perf_counter()
        result = match_resume_to_jd(resume, jd_text, self._embedder, self._settings)
        took_ms = (time.perf_counter() - started) * 1000

        record = self._repository.add(
            MatchRecord(
                user_id=self._user.id,
                job_title=first_line(jd_text),
                resume_name=resume_name[:255],
                overall_score=result.overall_score,
                verdict=result.verdict,
                # model_dump() turns the pydantic object into a plain dict,
                # which is what a JSON column stores.
                result=result.model_dump(),
            )
        )
        logger.info(
            "match saved id=%s user=%s score=%.1f took=%.0fms",
            record.id, self._user.id, result.overall_score, took_ms,
        )
        return record

    def list_recent(self, limit: int, offset: int) -> list[MatchRecord]:
        return self._repository.list_for_user(self._user.id, limit, offset)

    def get(self, record_id: str) -> MatchRecord:
        record = self._repository.get_for_user(record_id, self._user.id)
        if record is None:
            # Also the answer when the check belongs to someone else: we do
            # not reveal that it exists.
            raise NotFoundError("This analysis does not exist. It may have been deleted.")
        return record

    def delete(self, record_id: str) -> None:
        self._repository.delete(self.get(record_id))
        logger.info("match deleted id=%s", record_id)

    def dashboard(self) -> DashboardResponse:
        records = self._repository.list_for_user(self._user.id, limit=_DASHBOARD_ROWS)
        return build_dashboard(records)

    def skill_insights(self) -> SkillInsightsResponse:
        records = self._repository.list_for_user(self._user.id, limit=_DASHBOARD_ROWS)
        return build_skill_insights(records)
