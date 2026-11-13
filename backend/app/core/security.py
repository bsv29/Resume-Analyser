"""
Passwords and login tokens.

Passwords: we never store the password itself, only a bcrypt hash of it.
A hash cannot be turned back into the password. At login we hash what the
user typed and compare.

Tokens: after login the server gives the browser a JWT. It is a small
signed text that says "this is user X, valid until time T". The browser
sends it with every request, and the server checks the signature using
SECRET_KEY. No session table is needed.
"""

from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import Settings

_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def create_access_token(user_id: str, settings: Settings) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_minutes)
    # "sub" (subject) and "exp" (expiry) are standard JWT field names.
    payload = {"sub": user_id, "exp": expires_at}
    return jwt.encode(payload, settings.secret_key, algorithm=_ALGORITHM)


def read_access_token(token: str, settings: Settings) -> str | None:
    """Return the user id inside the token, or None if it is invalid or expired."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[_ALGORITHM])
    except jwt.PyJWTError:
        return None
    return payload.get("sub")
