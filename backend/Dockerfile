FROM python:3.12-slim

WORKDIR /app

# Model cache and database live in folders any user can write to, because
# some hosts run the container as a non-root user.
ENV FASTEMBED_CACHE_PATH=/app/.cache/fastembed \
    HF_HOME=/app/.cache/huggingface \
    DATABASE_URL=sqlite:////app/data/shortlist.db \
    EMBEDDING_BACKEND=onnx \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Dependencies first: Docker caches this layer, so changing app code does
# not reinstall them. deploy.txt uses ONNX Runtime instead of PyTorch, so
# the image is small and the server fits in 512 MB of RAM.
COPY requirements/ requirements/
RUN pip install --no-cache-dir -r requirements/deploy.txt

# Download the model at build time so the first start is fast.
RUN python -c "import os; from fastembed import TextEmbedding; TextEmbedding('sentence-transformers/all-MiniLM-L6-v2', cache_dir=os.environ['FASTEMBED_CACHE_PATH'])"

COPY app/ app/

RUN mkdir -p /app/data && chmod -R 777 /app/data /app/.cache

EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips='*'"]
