---
title: Shortlist API
emoji: 📄
colorFrom: indigo
colorTo: blue
sdk: docker
app_port: 8000
pinned: false
---

# Shortlist API

FastAPI backend for Shortlist (resume vs job description analyser).
The header above is read by Hugging Face Spaces, which builds `Dockerfile`
in this folder. See the main `README.md` for local setup and the full
deployment guide.

Settings come from environment variables (Space → Settings → Variables and secrets):

| Name | Example |
|---|---|
| `SECRET_KEY` (secret) | output of `python -c "import secrets; print(secrets.token_hex(32))"` |
| `ALLOWED_ORIGINS` | `["https://your-site.netlify.app"]` |
| `DATABASE_URL` (secret, optional) | `postgresql+psycopg://user:pass@host/db?sslmode=require` |

API docs: `https://<your-space>.hf.space/docs`
