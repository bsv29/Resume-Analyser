"""
Step 2 of 3. Fine-tune the sentence embedding model on resume/JD pairs.

    python -m training.train --epochs 2

What is being learned:
    The model embeds the resume and the JD separately (two forward passes
    through the SAME network, so it is called a siamese / bi-encoder setup).
    CosineSimilarityLoss then compares
        cosine(resume_vector, jd_vector)   with   fit_score (0, 0.5 or 1)
    using mean squared error, and backpropagates. So "good fit" pairs are
    pulled together in vector space and "no fit" pairs are pushed apart.

Note on length: the model reads at most --max-seq-length tokens, so only
the first part of a long resume is seen during training. The app itself
does not have this limit because it embeds line by line.

Needs a GPU to finish in reasonable time. On Colab (T4) two epochs take
roughly a few minutes to tens of minutes depending on batch size.
"""

import argparse
from pathlib import Path

import pandas as pd
from sentence_transformers import InputExample, SentenceTransformer, losses
from sentence_transformers.evaluation import EmbeddingSimilarityEvaluator
from torch.utils.data import DataLoader

TRAINING_DIR = Path(__file__).resolve().parent
DATA_DIR = TRAINING_DIR / "data"
DEFAULT_OUTPUT = TRAINING_DIR / "output" / "finetuned-model"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-model", default="sentence-transformers/all-MiniLM-L6-v2")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT))
    parser.add_argument("--epochs", type=int, default=2)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--learning-rate", type=float, default=2e-5)
    parser.add_argument("--max-seq-length", type=int, default=256)
    args = parser.parse_args()

    train = pd.read_csv(DATA_DIR / "train.csv")
    val = pd.read_csv(DATA_DIR / "val.csv")

    model = SentenceTransformer(args.base_model)
    model.max_seq_length = args.max_seq_length

    # One training example = (resume, jd) with its target similarity.
    examples = [
        InputExample(texts=[row.resume, row.jd], label=float(row.fit_score))
        for row in train.itertuples()
    ]
    loader = DataLoader(examples, shuffle=True, batch_size=args.batch_size)
    loss = losses.CosineSimilarityLoss(model)

    # After each epoch: embed the validation pairs and report how well the
    # cosine similarity ranks them (Spearman correlation with fit_score).
    # The best epoch by this number is the one that gets saved.
    evaluator = EmbeddingSimilarityEvaluator(
        val["resume"].tolist(),
        val["jd"].tolist(),
        val["fit_score"].tolist(),
        name="val",
    )

    total_steps = len(loader) * args.epochs
    model.fit(
        train_objectives=[(loader, loss)],
        evaluator=evaluator,
        epochs=args.epochs,
        warmup_steps=int(0.1 * total_steps),   # small learning rate at the start
        optimizer_params={"lr": args.learning_rate},
        output_path=args.output,
        save_best_model=True,
        show_progress_bar=True,
    )
    print(f"Saved fine-tuned model to {args.output}")
    print(f'To use it in the app, set EMBEDDING_MODEL="{args.output}" in backend/.env')


if __name__ == "__main__":
    main()
