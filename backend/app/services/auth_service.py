"""Sign up and log in."""

import logging

from app.core.config import Settings
from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, users: UserRepository, settings: Settings):
        self._users = users
        self._settings = settings

    def register(self, data: RegisterRequest) -> TokenResponse:
        email = data.email.lower()
        if self._users.get_by_email(email):
            raise ConflictError("An account with this email already exists. Log in instead.")

        user = self._users.add(
            User(name=data.name, email=email, password_hash=hash_password(data.password))
        )
        logger.info("user registered id=%s", user.id)
        return self._token_for(user)

    def login(self, data: LoginRequest) -> TokenResponse:
        user = self._users.get_by_email(data.email.lower())

        # Same message for "no such email" and "wrong password", so nobody
        # can use this endpoint to find out which emails have accounts.
        if user is None or not verify_password(data.password, user.password_hash):
            raise UnauthorizedError("Email or password is incorrect.")

        return self._token_for(user)

    def _token_for(self, user: User) -> TokenResponse:
        return TokenResponse(
            access_token=create_access_token(user.id, self._settings),
            user=UserOut.model_validate(user),
        )
