"""
    POST /rankings    one job description + several resume PDFs -> ranked list
"""

from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.api.deps import get_current_user, to_resume_file
from app.core.config import Settings, get_settings
from app.ml.embedder import get_embedder
from app.models.user import User
from app.schemas.ranking import RankingResponse
from app.services.ranking_service import rank_resumes

router = APIRouter(prefix="/rankings")


@router.post("", response_model=RankingResponse)
def create_ranking(
    jd_text: str = Form(...),
    resume_files: list[UploadFile] = File(...),
    embedder=Depends(get_embedder),
    settings: Settings = Depends(get_settings),
    user: User = Depends(get_current_user),   # only here to require a login
):
    files = [to_resume_file(upload) for upload in resume_files]
    files = [file for file in files if file is not None]
    return rank_resumes(jd_text, files, embedder, settings)
