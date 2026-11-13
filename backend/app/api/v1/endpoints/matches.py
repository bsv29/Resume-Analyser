"""
Endpoints for single checks.

    POST   /matches          create a check and save it
    GET    /matches          list saved checks, newest first
    GET    /matches/{id}     open one saved check
    DELETE /matches/{id}     delete it

These are plain "def", not "async def", on purpose: model.encode() is
heavy CPU work and SQLAlchemy calls block. FastAPI runs "def" endpoints in
a thread pool, so the server keeps answering other requests meanwhile.
"""

from fastapi import APIRouter, Depends, File, Form, Query, Response, UploadFile, status

from app.api.deps import get_match_service, to_resume_file
from app.schemas.match import MatchDetail, MatchSummary
from app.services.match_service import MatchService

router = APIRouter(prefix="/matches")


@router.post("", response_model=MatchDetail, status_code=status.HTTP_201_CREATED)
def create_match(
    jd_text: str = Form(...),
    resume_text: str | None = Form(None),
    resume_file: UploadFile | None = File(None),
    service: MatchService = Depends(get_match_service),
):
    return service.create(
        jd_text=jd_text,
        resume_file=to_resume_file(resume_file),
        resume_text=resume_text,
    )


@router.get("", response_model=list[MatchSummary])
def list_matches(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: MatchService = Depends(get_match_service),
):
    return service.list_recent(limit, offset)


@router.get("/{match_id}", response_model=MatchDetail)
def get_match(match_id: str, service: MatchService = Depends(get_match_service)):
    return service.get(match_id)


@router.delete("/{match_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_match(match_id: str, service: MatchService = Depends(get_match_service)):
    service.delete(match_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
