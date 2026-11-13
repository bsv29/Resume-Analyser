"""
Step 1 of 3. Download the labelled dataset and write train/val/test CSV files.

    python -m training.prepare_data

Dataset: cnamuangtoun/resume-job-description-fit (Hugging Face)
    resume_text | job_description_text | label
    label is one of: "No Fit", "Potential Fit", "Good Fit"

We turn the label into a number the model can learn as a target
similarity:  No Fit -> 0.0,  Potential Fit -> 0.5,  Good Fit -> 1.0
"""

import argparse
from pathlib import Path

import pandas as pd
from datasets import load_dataset
from sklearn.model_selection import train_test_split

DATASET_NAME = "cnamuangtoun/resume-job-description-fit"
DATA_DIR = Path(__file__).resolve().parent / "data"

FIT_SCORES = {"no fit": 0.0, "potential fit": 0.5, "good fit": 1.0}


def to_frame(split) -> pd.DataFrame:
    frame = split.to_pandas()
    frame = frame.rename(columns={"resume_text": "resume", "job_description_text": "jd"})
    frame["fit_score"] = frame["label"].str.strip().str.lower().map(FIT_SCORES)

    # Drop rows with a label we do not know or with empty text.
    frame = frame.dropna(subset=["resume", "jd", "fit_score"])
    return frame[["resume", "jd", "fit_score"]].reset_index(drop=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--val-size", type=float, default=0.1)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    dataset = load_dataset(DATASET_NAME)
    train_full = to_frame(dataset["train"])
    test = to_frame(dataset["test"])

    # The dataset has no validation split, so we cut one out of train.
    # stratify keeps the same share of each label in both parts.
    train, val = train_test_split(
        train_full,
        test_size=args.val_size,
        random_state=args.seed,
        stratify=train_full["fit_score"],
    )

    DATA_DIR.mkdir(exist_ok=True)
    for name, frame in [("train", train), ("val", val), ("test", test)]:
        frame.to_csv(DATA_DIR / f"{name}.csv", index=False)
        counts = frame["fit_score"].value_counts().sort_index().to_dict()
        print(f"{name:5s} rows={len(frame):5d}  per label={counts}")


if __name__ == "__main__":
    main()
