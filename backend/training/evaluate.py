"""
Step 3 of 3. Compare the pretrained model with the fine-tuned one.

    python -m training.evaluate --limit 300

Important: this does not score with a separate script. It calls the app's
own match_resume_to_jd(), so the numbers describe what a user of the app
actually gets.

For each model:
  1. score the validation pairs, pick the "fit" threshold with the best F1
  2. score the test pairs, report metrics using that threshold
Results are printed and written to training/results.md.
"""

import argparse
from pathlib import Path

import pandas as pd

from app.core.config import Settings, get_settings
from app.core.exceptions import AppError
from app.services.matcher import match_resume_to_jd
from training.metrics import best_threshold, classification_metrics, rank_correlation

TRAINING_DIR = Path(__file__).resolve().parent
DATA_DIR = TRAINING_DIR / "data"
DEFAULT_FINETUNED = TRAINING_DIR / "output" / "finetuned-model"
RESULTS_FILE = TRAINING_DIR / "results.md"


def score_pairs(frame: pd.DataFrame, embedder, settings: Settings) -> pd.DataFrame:
    """Add a 'score' column (0-100) using the app's matcher."""
    scores = []
    for row in frame.itertuples():
        try:
            result = match_resume_to_jd(row.resume, row.jd, embedder, settings)
            scores.append(result.overall_score)
        except AppError:
            scores.append(None)        # text too short to split into lines

    scored = frame.assign(score=scores).dropna(subset=["score"])
    # "Potential Fit" (0.5) and "Good Fit" (1.0) both count as a fit.
    return scored.assign(is_fit=scored["fit_score"] >= 0.5)


def evaluate_model(embedder, val: pd.DataFrame, test: pd.DataFrame, settings: Settings) -> dict:
    val_scored = score_pairs(val, embedder, settings)
    test_scored = score_pairs(test, embedder, settings)

    threshold = best_threshold(val_scored["score"], val_scored["is_fit"])
    metrics = classification_metrics(test_scored["score"], test_scored["is_fit"], threshold)

    return {
        "pairs": len(test_scored),
        "threshold": threshold,
        "spearman": rank_correlation(test_scored["score"], test_scored["fit_score"]),
        **metrics,
    }


def to_markdown(rows: dict[str, dict]) -> str:
    lines = [
        "| Model | Test pairs | Threshold | Spearman | Accuracy | Precision | Recall | F1 |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for name, m in rows.items():
        lines.append(
            f"| {name} | {m['pairs']} | {m['threshold']:.0f} | {m['spearman']:.3f} | "
            f"{m['accuracy']:.3f} | {m['precision']:.3f} | {m['recall']:.3f} | {m['f1']:.3f} |"
        )
    return "\n".join(lines)


def main() -> None:
    # Imported here because it loads PyTorch; the tests import this file
    # for evaluate_model() and should not need PyTorch installed.
    from app.ml.embedder import Embedder

    parser = argparse.ArgumentParser()
    parser.add_argument("--finetuned", default=str(DEFAULT_FINETUNED))
    parser.add_argument("--limit", type=int, default=300, help="pairs per split, to keep it fast")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    settings = get_settings()
    val = pd.read_csv(DATA_DIR / "val.csv")
    test = pd.read_csv(DATA_DIR / "test.csv")
    val = val.sample(min(args.limit, len(val)), random_state=args.seed)
    test = test.sample(min(args.limit, len(test)), random_state=args.seed)

    models = {"Pretrained MiniLM": "sentence-transformers/all-MiniLM-L6-v2"}
    if Path(args.finetuned).exists():
        models["Fine-tuned MiniLM"] = args.finetuned
    else:
        print(f"No fine-tuned model at {args.finetuned}. Evaluating the pretrained model only.")

    rows = {}
    for name, model_path in models.items():
        print(f"Scoring with {name} ...")
        rows[name] = evaluate_model(Embedder(model_path), val, test, settings)

    table = to_markdown(rows)
    print("\n" + table)
    RESULTS_FILE.write_text(table + "\n", encoding="utf-8")
    print(f"\nWritten to {RESULTS_FILE}")


if __name__ == "__main__":
    main()
