FROM python:3.12-slim

WORKDIR /app

# Model cache and database live in folders any user can write to, because
# some hosts (e.g. Hugging Face Spaces) run the container as a non-root user.
ENV HF_HOME=/app/.cache/huggingface \
    DATABASE_URL=sqlite:////app/data/shortlist.db \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Dependencies first: Docker caches this layer, so changing app code
# does not reinstall PyTorch on every build.
COPY requirements/ requirements/
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir -r requirements/ml.txt

# Download the model at build time so the first start is fast.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"

COPY app/ app/

RUN mkdir -p /app/data && chmod -R 777 /app/data /app/.cache

EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips='*'"]
