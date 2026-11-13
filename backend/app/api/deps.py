"""
Dependencies shared by the endpoints.

"Depends(get_match_service)" in an endpoint means: before calling the
endpoint, FastAPI
  1. opens a DB session,
  2. reads the login token and loads the user (get_current_user),
  3. takes the loaded model and the settings,
and builds a MatchService from them. If step 2 fails the request stops
with 401 and the endpoint never runs. So an endpoint that asks for
get_match_service or get_current_user is protected automatically.

Tests replace get_db and get_embedder with test versions (tests/conftest.py).
"""

from fastapi import Depends, UploadFile
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.exceptions import UnauthorizedError
from app.core.security import read_access_token
from app.db.session import get_db
from app.ml.embedder import get_embedder
from app.models.user import User
from app.repositories.match_repository import MatchRepository
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.services.match_service import MatchService
from app.services.resume_reader import ResumeFile

# Reads the "Authorization: Bearer <token>" header. auto_error=False lets
# us raise our own error with our own message.
_bearer = HTTPBearer(auto_error=False)


def get_auth_service(
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AuthService:
    return AuthService(UserRepository(db), settings)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> User:
    if credentials is None:
        raise UnauthorizedError("Log in to continue.")

    user_id = read_access_token(credentials.credentials, settings)
    user = UserRepository(db).get(user_id) if user_id else None
    if user is None:
        raise UnauthorizedError("Your session has expired. Log in again.")
    return user


def get_match_service(
    db: Session = Depends(get_db),
    embedder=Depends(get_embedder),
    settings: Settings = Depends(get_settings),
    user: User = Depends(get_current_user),
) -> MatchService:
    return MatchService(MatchRepository(db), embedder, settings, user)


def to_resume_file(upload: UploadFile | None) -> ResumeFile | None:
    """Convert FastAPI's upload object into the plain class services expect."""
    if upload is None or not upload.filename:
        return None
    return ResumeFile(filename=upload.filename, content=upload.file.read())
