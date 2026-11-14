# Shortlist API

FastAPI backend for Shortlist (resume vs job description analyser).
See the main `README.md` for local setup and the deploy guide.

`Dockerfile` builds the production image. It runs the MiniLM model with
ONNX Runtime (`requirements/deploy.txt`) instead of PyTorch: the vectors
are the same, and the server needs ~240 MB of RAM, so it fits on free
512 MB hosts such as Render.

Environment variables:

| Name | Example |
|---|---|
| `SECRET_KEY` | output of `python -c "import secrets; print(secrets.token_hex(32))"` |
| `ALLOWED_ORIGINS` | `["https://your-site.netlify.app"]` |
| `DATABASE_URL` | `postgresql+psycopg://user:pass@host/db?sslmode=require` |
| `EMBEDDING_BACKEND` | `auto` (default), `onnx` or `torch` |

API docs on a running server: `/docs`
