"""
    GET /dashboard    stats, score trend, verdict split, top missing skills, recent checks
"""

from fastapi import APIRouter, Depends

from app.api.deps import get_match_service
from app.schemas.dashboard import DashboardResponse
from app.services.match_service import MatchService

router = APIRouter(prefix="/dashboard")


@router.get("", response_model=DashboardResponse)
def get_dashboard(service: MatchService = Depends(get_match_service)):
    return service.dashboard()
