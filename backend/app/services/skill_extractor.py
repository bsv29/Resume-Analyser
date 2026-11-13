"""
Finds known skills in a piece of text.

This part is NOT machine learning. It is a dictionary lookup:
data/skills.json maps a skill name to the different ways people write it,
for example  "React": ["react", "reactjs", "react.js"].

Why not let the model do this too? Embeddings are good at meaning
("built web pages" ~ "frontend development") but a recruiter also checks
exact keywords. A simple lookup is accurate for that and easy to explain.
"""

import json
import re
from functools import lru_cache
from pathlib import Path

_SKILLS_FILE = Path(__file__).resolve().parent.parent / "data" / "skills.json"


@lru_cache
def _load_patterns() -> dict[str, re.Pattern]:
    """Read skills.json once and build one regex per skill."""
    with open(_SKILLS_FILE, encoding="utf-8") as file:
        skills: dict[str, list[str]] = json.load(file)

    patterns = {}
    for skill_name, aliases in skills.items():
        # re.escape is needed because of names like "c++" and "node.js",
        # where + and . have a special meaning in regex.
        options = "|".join(re.escape(alias) for alias in aliases)

        # The two brackets around the options mean: "the character before
        # and after must not be a letter or digit". Without this, "java"
        # would be found inside "javascript" and "sql" inside "mysql".
        patterns[skill_name] = re.compile(
            rf"(?<![a-z0-9+#.])(?:{options})(?![a-z0-9+#])"
        )
    return patterns


def extract_skills(text: str) -> set[str]:
    """Return the names of all known skills that appear in the text."""
    normalised = re.sub(r"\s+", " ", text.lower())
    return {
        skill_name
        for skill_name, pattern in _load_patterns().items()
        if pattern.search(normalised)
    }
