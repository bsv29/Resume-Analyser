# Shortlist: Resume and Job Analyser

A full-stack app that checks how well a resume fits a job description.

- **Accounts:** sign up and log in (bcrypt password hashing, JWT). Each user sees only their own data.
- **Dashboard:** analyses run, average and best score, score trend chart,
  match-quality split, and the skills the user misses most often.

- **Single check:** marks every line of the job description as covered,
  loosely covered or missing, shows the resume line it was matched with,
  and lists missing skills. Every check is saved and can be reopened.
- **Skills insights:** every skill the jobs asked for, how often the resume
  had it, strengths, focus areas and bonus skills.
- **Compare:** two saved analyses side by side with score deltas and skill differences.
- **Reports:** score distribution, activity, verdict split, best/worst matches,
  date ranges, CSV export and print.
- **Settings and Help:** profile, light/dark/system theme, score grading, data export,
  and a guide to how scoring works.
- **Ranking:** upload up to 10 resumes for one job description and get
  them ordered by fit.
- **Model:** a Sentence Transformer (MiniLM) that can be fine-tuned on
  labelled resume/JD pairs with the scripts in `backend/training/`, and
  evaluated against the pretrained model.

Stack: FastAPI, SQLAlchemy, JWT, Sentence Transformers, PyTorch, React, React Router, Recharts, Vite, Docker, GitHub Actions.

## Results

Run the three training steps below, then paste `backend/training/results.md` here.

| Model | Test pairs | Threshold | Spearman | Accuracy | Precision | Recall | F1 |
|---|---|---|---|---|---|---|---|
| Pretrained MiniLM | | | | | | | |
| Fine-tuned MiniLM | | | | | | | |

## Run it

Backend (Python 3.10 or newer):

    cd backend
    python -m venv .venv
    .venv\Scripts\activate          # Windows.  Mac/Linux: source .venv/bin/activate
    pip install -r requirements.txt
    uvicorn app.main:app --reload

The first start downloads the model (about 90 MB). API docs: http://localhost:8000/docs

Before running, copy `.env.example` to `.env` and set your own `SECRET_KEY`.
If you ran an older version of this project, delete `backend/shortlist.db`
once: the tables changed (users were added).

Frontend (Node 18 or newer), in a second terminal:

    cd frontend
    npm install
    npm run dev

Open http://localhost:5173 and create an account.

Or run the API in Docker: `docker compose up --build`

Tests (no model download needed):

    cd backend
    pip install -r requirements/dev.txt
    pytest

## Train and evaluate the model

Use a machine with a GPU (Google Colab works). From `backend/`:

    pip install -r requirements/train.txt
    python -m training.prepare_data          # 1. download dataset, write train/val/test CSVs
    python -m training.train --epochs 2      # 2. fine-tune, saves to training/output/finetuned-model
    python -m training.evaluate --limit 300  # 3. compare pretrained vs fine-tuned, writes results.md

To serve the fine-tuned model, set in `backend/.env`:

    EMBEDDING_MODEL=training/output/finetuned-model

Dataset: [cnamuangtoun/resume-job-description-fit](https://huggingface.co/datasets/cnamuangtoun/resume-job-description-fit)
(about 8k labelled pairs: No Fit, Potential Fit, Good Fit).

`evaluate.py` scores pairs with the app's own `match_resume_to_jd()`, so
the reported numbers describe what the API actually returns. The decision
threshold is chosen on the validation split and reported on the test split.

## How the matching works

1. Both documents are cut into short lines (`services/text_processing.py`).
2. Each line becomes a 384-number vector (`ml/embedder.py`).
3. For each job description line, the resume line with the highest cosine
   similarity is picked (`services/matcher.py`).
   0.55 and above is covered, 0.40 and above is loosely covered, below is missing.
4. Skills are found with a keyword dictionary (`services/skill_extractor.py`).
5. Final score = 60% meaning score + 40% skill score.

## Backend structure

    backend/
      app/
        main.py                    startup, CORS, error handlers
        api/
          deps.py                  dependency injection: current user, services
          v1/
            router.py              mounts all v1 endpoints
            endpoints/
              auth.py              POST /auth/register, /auth/login, GET /auth/me
              dashboard.py         GET /dashboard
              matches.py           POST/GET/DELETE /matches
              rankings.py          POST /rankings
              health.py            GET /health
        core/
          config.py                all settings, overridable from .env
          security.py              password hashing, JWT create/read
          exceptions.py            AppError and its subclasses
          logging.py
        db/
          base.py                  SQLAlchemy Base
          session.py               engine, session, get_db
        models/
          user.py                  users table
          match_record.py          match_records table (belongs to a user)
        repositories/
          user_repository.py
          match_repository.py      every query filters by user_id
        schemas/
          auth.py, match.py, dashboard.py, ranking.py
        services/
          auth_service.py          register, login
          match_service.py         create / list / get / delete, scoped to one user
          dashboard_service.py     stats from a user's saved analyses
          ranking_service.py       rank several resumes
          matcher.py               scoring logic (pure function)
          resume_reader.py, pdf_parser.py, text_processing.py,
          skill_extractor.py, suggestions.py
        ml/
          embedder.py              loads the model, sentences to vectors
        data/skills.json
      training/
        prepare_data.py, train.py, evaluate.py, metrics.py
      tests/                       30 tests, no model download needed
      requirements/                base, ml, dev, train
      Dockerfile

## Frontend structure

    frontend/src/
      api/client.js                every backend call; attaches the login token
      context/AuthContext.jsx      current user, login, register, logout
      context/ThemeContext.jsx     light / dark / system theme
      hooks/useApi.js              loading / error / data for a request
      components/
        ProtectedRoute.jsx         route guards
        layout/                    AppLayout, Sidebar, Topbar
        charts/                    ScoreTrendChart, VerdictDonut, SkillBars
        ui/                        StatCard, ScoreRing, ScoreBadge, PageMessage
        FileDrop, ResumeListInput, MarkedDescription, ScoreSummary, SkillGroup
      pages/
        auth/                      LoginPage, RegisterPage
        DashboardPage, AnalyzePage, ResultPage, RankPage, HistoryPage,
        SkillsPage, ComparePage, ReportsPage, SettingsPage, HelpPage
      styles/global.css            design tokens and shared classes

Each layer only talks to the one below it:

    endpoint  ->  service  ->  repository  ->  database
                     |
                     +----->  matcher  ->  embedder (model)

- **Endpoints** translate HTTP. No logic.
- **Services** hold the logic. No FastAPI imports, so they are testable on their own.
- **Repositories** hold the SQL. Switching SQLite to PostgreSQL is a one-line `DATABASE_URL` change.

The `__init__.py` files mark folders as Python packages; that is why they
contain only a one-line description.

## API

| Method | Path                    | Login | What it does                                   |
|--------|-------------------------|-------|------------------------------------------------|
| POST   | `/api/v1/auth/register` | no    | Create an account, returns a token             |
| POST   | `/api/v1/auth/login`    | no    | Returns a token                                |
| GET    | `/api/v1/auth/me`       | yes   | The logged-in user                             |
| GET    | `/api/v1/dashboard`     | yes   | Stats, score trend, top missing skills         |
| GET    | `/api/v1/insights/skills` | yes | Per-skill asked / matched / missing counts     |
| POST   | `/api/v1/matches`       | yes   | Score a resume (PDF or text) against a JD, save it |
| GET    | `/api/v1/matches`       | yes   | The user's saved analyses, newest first        |
| GET    | `/api/v1/matches/{id}`  | yes   | One saved analysis with full result            |
| DELETE | `/api/v1/matches/{id}`  | yes   | Delete a saved analysis                        |
| POST   | `/api/v1/rankings`      | yes   | Rank 2 to 10 resume PDFs against a JD          |
| GET    | `/api/v1/health`        | no    | Liveness check                                 |

Protected endpoints expect `Authorization: Bearer <token>`.

Errors are always `{"detail": "message"}` with a matching status code (400, 401, 404, 409, 413, 422).

## Known limits

- Scanned PDFs have no text and are rejected (or skipped in a ranking).
- Two-column resumes can come out of the PDF with lines in mixed order.
- A skill is found only if it is listed in `data/skills.json`.
- Tables are created on startup with `create_all`. A project with changing
  tables should add Alembic migrations.
- The login token is kept in the browser's localStorage and lasts one day. There is no refresh token, password reset or email verification.
- No rate limiting on login.
- Training reads only the first 256 tokens of each document.
