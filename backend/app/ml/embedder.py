"""
Wrapper around the Sentence Transformer model.

You already know training: forward pass -> loss -> backward -> update.
Here we do ONLY the forward pass. The model is already trained by someone
else; we give it sentences and take the output vectors (embeddings).

    "Built dashboards in React"  ->  [0.03, -0.11, ..., 0.07]   (384 numbers)

Sentences with similar meaning get vectors that point in a similar
direction. That is the whole idea this project stands on.

Two ways to run the same model:

    torch   sentence-transformers + PyTorch. Needed for a fine-tuned model
            folder from training/. Uses ~480 MB of RAM.
    onnx    fastembed + ONNX Runtime. Same MiniLM weights, same vectors
            (cosine 1.0 against torch), ~220 MB of RAM, no PyTorch install.
            Used in production so the API fits on small free servers.

EMBEDDING_BACKEND=auto picks onnx when fastembed is installed and the
model is a Hugging Face name, and torch otherwise.
"""

import logging
import os
from functools import lru_cache

import numpy as np

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class TorchEmbedder:
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


class OnnxEmbedder:
    def __init__(self, model_name: str):
        from fastembed import TextEmbedding

        self._model = TextEmbedding(model_name, cache_dir=os.getenv("FASTEMBED_CACHE_PATH"))

    def encode(self, sentences: list[str]) -> np.ndarray:
        vectors = np.array(list(self._model.embed(sentences)), dtype=np.float32)
        # fastembed already normalises; doing it again is cheap and guarantees
        # the dot-product-equals-cosine rule matcher.py relies on.
        lengths = np.linalg.norm(vectors, axis=1, keepdims=True)
        return vectors / np.where(lengths == 0, 1, lengths)


def _pick_backend(choice: str, model_name: str) -> str:
    if choice in ("torch", "onnx"):
        return choice
    if os.path.isdir(model_name):          # a fine-tuned model folder
        return "torch"
    try:
        import fastembed  # noqa: F401
    except ImportError:
        return "torch"
    return "onnx"


# Kept so older imports (`from app.ml.embedder import Embedder`) still work.
Embedder = TorchEmbedder


@lru_cache
def get_embedder():
    # Loading the model takes a few seconds; lru_cache makes sure it is
    # loaded once, not on every request.
    settings = get_settings()
    backend = _pick_backend(settings.embedding_backend, settings.embedding_model)
    logger.info("embedding backend: %s", backend)
    if backend == "onnx":
        return OnnxEmbedder(settings.embedding_model)
    return TorchEmbedder(settings.embedding_model)
