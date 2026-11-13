"""
Metric helpers for evaluate.py. Pure functions, so they are unit tested.

Two questions we ask about a model:
1. Ranking  - do better-fitting pairs get higher scores?  (Spearman)
2. Decision - if we say "fit" above a threshold, how often are we right?
              (accuracy, precision, recall, F1)
"""

import numpy as np
from scipy.stats import spearmanr
from sklearn.metrics import accuracy_score, precision_recall_fscore_support


def rank_correlation(scores, fit_scores) -> float:
    """Spearman correlation: +1 means perfect ordering, 0 means random."""
    value = spearmanr(scores, fit_scores).correlation
    return 0.0 if np.isnan(value) else float(value)


def best_threshold(scores, is_fit) -> float:
    """
    Try every whole-number threshold from 0 to 100 and keep the one with
    the best F1. This must be run on the VALIDATION set only. Picking the
    threshold on the test set would leak test information into the model.
    """
    scores = np.asarray(scores)
    is_fit = np.asarray(is_fit).astype(bool)

    best_value, best_f1 = 50.0, -1.0
    for threshold in range(0, 101):
        predicted = scores >= threshold
        _, _, f1, _ = precision_recall_fscore_support(
            is_fit, predicted, average="binary", zero_division=0
        )
        if f1 > best_f1:
            best_value, best_f1 = float(threshold), f1
    return best_value


def classification_metrics(scores, is_fit, threshold: float) -> dict[str, float]:
    is_fit = np.asarray(is_fit).astype(bool)
    predicted = np.asarray(scores) >= threshold
    precision, recall, f1, _ = precision_recall_fscore_support(
        is_fit, predicted, average="binary", zero_division=0
    )
    return {
        "accuracy": float(accuracy_score(is_fit, predicted)),
        "precision": float(precision),
        "recall": float(recall),
        "f1": float(f1),
    }
