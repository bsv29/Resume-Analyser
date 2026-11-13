"""
Logging setup. Called once when the server starts.

Use logging instead of print(): every line gets a time and a level, and
in production the same lines can be sent to a file or a log service.
"""

import logging


def setup_logging(level: str = "INFO") -> None:
    logging.basicConfig(
        level=level.upper(),
        format="%(asctime)s  %(levelname)-7s  %(name)s  %(message)s",
        datefmt="%H:%M:%S",
    )
    # these two are very chatty at INFO level
    logging.getLogger("sentence_transformers").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
