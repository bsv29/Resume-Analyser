import pandas as pd

from app.core.config import get_settings
from training.evaluate import evaluate_model, to_markdown
from training.metrics import best_threshold, classification_metrics, rank_correlation


def test_best_threshold_separates_two_clear_groups():
    scores = [10, 20, 30, 70, 80, 90]
    is_fit = [0, 0, 0, 1, 1, 1]

    threshold = best_threshold(scores, is_fit)

    assert 30 < threshold <= 70
    assert classification_metrics(scores, is_fit, threshold)["f1"] == 1.0


def test_rank_correlation_is_one_for_perfect_ordering():
    assert rank_correlation([10, 50, 90], [0.0, 0.5, 1.0]) == 1.0


def test_evaluate_model_runs_the_app_matcher_end_to_end(fake_embedder):
    matching = "Built REST APIs with FastAPI and React dashboards for analytics."
    unrelated = "Organised the college cultural fest and handled sponsorship outreach."
    jd = "We need someone to build REST APIs with FastAPI and React dashboards."
    frame = pd.DataFrame(
        {
            "resume": [matching, unrelated] * 3,
            "jd": [jd] * 6,
            "fit_score": [1.0, 0.0] * 3,
        }
    )

    metrics = evaluate_model(fake_embedder, frame, frame, get_settings())

    assert metrics["pairs"] == 6
    assert metrics["f1"] == 1.0
    assert "| Fake |" in to_markdown({"Fake": metrics})
