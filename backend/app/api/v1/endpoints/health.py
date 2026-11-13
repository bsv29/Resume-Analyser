from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health():
    """Tells hosting platforms and the frontend that the server is up."""
    return {"status": "ok"}
