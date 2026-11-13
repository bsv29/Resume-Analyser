"""
Error types of the application.

Services raise these. They know nothing about HTTP. main.py catches
AppError in one place and turns it into a JSON response, using the
status_code stored on the error.
"""


class AppError(Exception):
    status_code = 400

    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code


class NotFoundError(AppError):
    status_code = 404


class UnprocessableError(AppError):
    """The request is well formed but its content cannot be used."""

    status_code = 422


class FileTooLargeError(AppError):
    status_code = 413


class UnauthorizedError(AppError):
    """Not logged in, or the token is wrong or expired."""

    status_code = 401


class ConflictError(AppError):
    """The thing already exists, e.g. an account with this email."""

    status_code = 409
