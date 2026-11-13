"""Collects every v1 endpoint under one router. main.py mounts it at /api/v1."""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, dashboard, health, insights, matches, rankings

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(dashboard.router, tags=["dashboard"])
api_router.include_router(insights.router, tags=["insights"])
api_router.include_router(matches.router, tags=["matches"])
api_router.include_router(rankings.router, tags=["rankings"])
