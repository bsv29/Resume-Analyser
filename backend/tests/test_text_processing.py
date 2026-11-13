from app.services.text_processing import split_into_lines


def test_bullets_and_headings_are_removed():
    text = "Requirements:\n- 2 years of React experience\n• Good with REST APIs\n1. Knows Git well"
    assert split_into_lines(text) == [
        "2 years of React experience",
        "Good with REST APIs",
        "Knows Git well",
    ]


def test_leading_numbers_that_are_not_bullets_are_kept():
    assert split_into_lines("3 years of Python experience") == ["3 years of Python experience"]


def test_duplicate_lines_are_kept_once():
    assert split_into_lines("Built a dashboard\nbuilt a dashboard") == ["Built a dashboard"]
