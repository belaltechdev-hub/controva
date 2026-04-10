from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database import get_db
from models import User, Client
from auth import verify_token


def _access_token_from_request(request: Request) -> str | None:
    """Extract Bearer token from Authorization header."""
    auth = request.headers.get("Authorization") or request.headers.get(
        "authorization"
    )
    if auth and auth.lower().startswith("bearer "):
        return auth[7:].strip() or None
    return None


# ======================================
# GET CURRENT USER
# ======================================

def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
):

    token = _access_token_from_request(request)

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )

    payload = verify_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    if payload.get("role") != "owner":
        raise HTTPException(
            status_code=401,
            detail="Not an owner token"
        )

    user = db.query(User).filter(User.id == payload.get("user_id")).first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user


# ======================================
# REQUIRE OWNER
# ======================================

def require_owner(user: User = Depends(get_current_user)):

    if user.role != "owner":
        raise HTTPException(
            status_code=403,
            detail="Owner access required"
        )

    return user


# ======================================
# CLIENT AUTH
# ======================================

def get_current_client(
    request: Request,
    db: Session = Depends(get_db)
):

    token = _access_token_from_request(request)

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )

    payload = verify_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    if payload.get("role") != "client":
        raise HTTPException(
            status_code=401,
            detail="Not a client token"
        )

    client = db.query(Client).filter(
        Client.id == payload.get("client_id")
    ).first()

    if client is None:
        raise HTTPException(
            status_code=401,
            detail="Client not found"
        )

    return client