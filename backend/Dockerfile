FROM python:3.12-slim

WORKDIR /app

# Dependencies first: Docker caches this layer, so changing app code
# does not reinstall PyTorch on every build.
COPY requirements/ requirements/
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir -r requirements/ml.txt

COPY app/ app/

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
