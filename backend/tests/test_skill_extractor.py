from app.services.skill_extractor import extract_skills


def test_finds_skills_written_in_different_ways():
    found = extract_skills("Worked with ReactJS, node.js and Postgres")
    assert {"React", "Node.js", "PostgreSQL"} <= found


def test_does_not_find_a_skill_inside_another_word():
    found = extract_skills("Strong in JavaScript and MySQL")
    assert "Java" not in found
    assert "SQL" not in found
    assert {"JavaScript", "MySQL"} <= found
