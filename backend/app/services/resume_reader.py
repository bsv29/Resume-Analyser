"""
Gets the resume text, whether it arrived as an uploaded PDF or as pasted text.

The endpoint converts FastAPI's UploadFile into the small ResumeFile class
below, so this module (and the rest of services/) stays free of FastAPI.
"""

from dataclasses import dataclass

from app.core.config import Settings
from app.core.exceptions import AppError, FileTooLargeError
from app.services.pdf_parser import extract_text_from_pdf


@dataclass
class ResumeFile:
    filename: str
    content: bytes


def read_resume_file(file: ResumeFile, settings: Settings) -> str:
    if not file.filename.lower().endswith(".pdf"):
        raise AppError("Only PDF files are supported.")

    if len(file.content) > settings.max_file_size_mb * 1024 * 1024:
        raise FileTooLargeError(f"File is larger than {settings.max_file_size_mb} MB.")

    return extract_text_from_pdf(file.content)


def read_resume(
    file: ResumeFile | None,
    pasted_text: str | None,
    settings: Settings,
) -> tuple[str, str]:
    """Returns (resume text, display name)."""
    if file is not None:
        return read_resume_file(file, settings), file.filename

    if pasted_text and len(pasted_text.strip()) >= settings.min_text_chars:
        return pasted_text, "Pasted text"

    raise AppError("Upload a resume PDF or paste the resume text.")


def check_job_description(jd_text: str, settings: Settings) -> None:
    if len(jd_text.strip()) < settings.min_text_chars:
        raise AppError("The job description is too short to compare.")
