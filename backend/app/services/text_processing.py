"""
Plain text helpers. No ML here.

The model compares SENTENCES, not whole documents. So before we embed
anything we must cut the resume and the JD into small, clean lines.
"""

import re

# Matches the bullet at the start of a line: "-", "*", "•", "1.", "2)" ...
_BULLET = re.compile(r"^\s*(?:[-*•●▪–]+|\d+[.)])\s*")

# Splits a long paragraph into sentences: break after . ! or ?
_SENTENCE_END = re.compile(r"(?<=[.!?])\s+")

_MAX_LINE_CHARS = 200


def clean_text(text: str) -> str:
    """Remove odd characters that PDFs leave behind and tidy the spaces."""
    text = text.replace("\x00", " ").replace("\u00a0", " ")
    text = re.sub(r"[ \t]+", " ", text)          # many spaces -> one space
    text = re.sub(r"\n\s*\n+", "\n", text)       # blank lines -> one newline
    return text.strip()


def split_into_lines(text: str, min_words: int = 3) -> list[str]:
    """
    Turn a document into a list of short lines.

    Example input:
        "Requirements:\n- 2 years of React\n- Good with REST APIs"
    Output (min_words=3):
        ["2 years of React", "Good with REST APIs"]

    "Requirements:" is dropped because it has only one word. Headings like
    that carry no meaning, and they would pull the score down for no reason.
    """
    lines: list[str] = []
    seen: set[str] = set()

    for raw_line in clean_text(text).split("\n"):
        line = _BULLET.sub("", raw_line).strip()
        if not line:
            continue

        # A paragraph is too much for one vector, so cut it into sentences.
        pieces = _SENTENCE_END.split(line) if len(line) > _MAX_LINE_CHARS else [line]

        for piece in pieces:
            piece = piece.strip()
            key = piece.lower()
            if len(piece.split()) < min_words or key in seen:
                continue
            seen.add(key)
            lines.append(piece)

    return lines


def first_line(text: str, limit: int = 80) -> str:
    """First non-empty line of a document, shortened. Used as the job title."""
    for line in clean_text(text).split("\n"):
        line = _BULLET.sub("", line).strip()
        if line:
            return line if len(line) <= limit else line[: limit - 1].rstrip() + "…"
    return "Untitled job description"
