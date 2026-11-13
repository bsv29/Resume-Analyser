"""
Wrapper around the Sentence Transformer model.

You already know training: forward pass -> loss -> backward -> update.
Here we do ONLY the forward pass. The model is already trained by someone
else; we give it sentences and take the output vectors (embeddings).

    "Built dashboards in React"  ->  [0.03, -0.11, ..., 0.07]   (384 numbers)

Sentences with similar meaning get vectors that point in a similar
direction. That is the whole idea this project stands on.
"""

from functools import lru_cache

import numpy as np

from app.core.config import get_settings


class Embedder:
    def __init__(self, model_name: str):
        # Imported here, not at the top of the file, because this import is
        # slow (it loads PyTorch). The tests use a fake embedder, so they
        # never pay this cost and do not need the model downloaded.
        from sentence_transformers import SentenceTransformer

        self._model = SentenceTransformer(model_name)

    def encode(self, sentences: list[str]) -> np.ndarray:
        """
        Returns an array of shape (number_of_sentences, 384).

        normalize_embeddings=True makes every vector length 1. After that,
        cosine similarity of two vectors is just their dot product, which
        keeps the maths in matcher.py to a single line.
        """
        return self._model.encode(
            sentences,
            normalize_embeddings=True,
            convert_to_numpy=True,
            show_progress_bar=False,
        )


@lru_cache
def get_embedder() -> Embedder:
    # Loading the model takes a few seconds and ~100 MB of RAM.
    # lru_cache makes sure it is loaded once, not on every request.
    return Embedder(get_settings().embedding_model)
