"""
Entry point. Run with:   uvicorn app.main:app --reload

This file only wires things together: startup, CORS, routes, error handling.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.logging import setup_logging
from app.db.session import init_db
from app.ml.embedder import get_embedder

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Everything before "yield" runs once, when the server starts.
    settings = get_settings()
    setup_logging(settings.log_level)

    init_db()
    logger.info("database ready")

    # Load the model now so the first user does not wait for it.
    get_embedder()
    logger.info("model loaded: %s", settings.embedding_model)

    yield
    # Code after "yield" would run on shutdown. Nothing to clean up here.


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)

    # The browser blocks a page on localhost:5173 from calling localhost:8000
    # unless the API says that origin is allowed. This is that permission.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_methods=["GET", "POST", "DELETE"],
        allow_headers=["*"],
    )

    # Any AppError raised in a service becomes {"detail": "..."} with its status code.
    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, error: AppError):
        return JSONResponse(status_code=error.status_code, content={"detail": error.message})

    # Anything we did not expect: log the full error, tell the client nothing internal.
    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, error: Exception):
        logger.exception("unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=500,
            content={"detail": "Something went wrong on the server. Try again."},
        )

    # FastAPI's own validation errors are a list of objects. We turn them
    # into the same {"detail": "one sentence"} shape as every other error,
    # so the frontend has a single format to handle.
    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(request: Request, error: RequestValidationError):
        first = error.errors()[0]
        field = str(first["loc"][-1]).replace("_", " ")
        message = first["msg"].removeprefix("Value error, ")
        return JSONResponse(status_code=422, content={"detail": f"{field.capitalize()}: {message}"})

    app.include_router(api_router, prefix="/api/v1")
    return app


app = create_app()
