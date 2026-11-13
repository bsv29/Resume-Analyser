"""
Reads the text out of an uploaded PDF resume.
"""

from io import BytesIO

from pypdf import PdfReader

from app.core.exceptions import UnprocessableError


def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        # BytesIO lets pypdf read the uploaded bytes as if they were a file
        # on disk. We never save the resume anywhere.
        reader = PdfReader(BytesIO(file_bytes))
        pages = [page.extract_text() or "" for page in reader.pages]
    except Exception as error:
        raise UnprocessableError("This file could not be read as a PDF.") from error

    text = "\n".join(pages).strip()

    # A scanned resume is just an image inside a PDF, so there is no text.
    if len(text) < 50:
        raise UnprocessableError(
            "No text found in this PDF. It may be a scanned image. "
            "Paste the resume text instead."
        )
    return text
