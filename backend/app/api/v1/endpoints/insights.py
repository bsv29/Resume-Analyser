"""
    GET /insights/skills    how often each skill was asked, matched and missed
"""

from fastapi import APIRouter, Depends

from app.api.deps import get_match_service
from app.schemas.insights import SkillInsightsResponse
from app.services.match_service import MatchService

router = APIRouter(prefix="/insights")


@router.get("/skills", response_model=SkillInsightsResponse)
def get_skill_insights(service: MatchService = Depends(get_match_service)):
    return service.skill_insights()
