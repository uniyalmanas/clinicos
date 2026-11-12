"""
JWT authentication dependency for FastAPI routes.

Uses the same JWT_SECRET_KEY (HS256) as the Next.js auth layer so that
tokens issued by the web frontend are accepted here.

Usage:
    @router.get("/endpoint")
    def my_route(current_user: dict = Depends(get_current_user)):
        require_clinic_access(clinic_id, current_user)
        ...
"""
from typing import Optional
from fastapi import Header, Cookie, HTTPException, status
import jwt

from apps.api.config import settings

ALGORITHM = "HS256"


async def get_current_user(
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
    clinicos_token: Optional[str] = Cookie(default=None, alias="clinicos_token"),
) -> dict:
    """
    Validates a Bearer JWT from the Authorization header or clinicos_token Cookie.
    Returns the decoded payload: {user_id, role, clinic_id, ...}
    Raises HTTP 401 if the token is missing, malformed or expired.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing authentication credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()
    elif clinicos_token:
        token = clinicos_token.strip()

    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("user_id") is None and payload.get("sub") is None:
            raise credentials_exception
        # Normalize: some tokens use 'sub' as user_id
        if "user_id" not in payload and "sub" in payload:
            payload["user_id"] = payload["sub"]
        return payload
    except jwt.PyJWTError:
        raise credentials_exception


def require_clinic_access(clinic_id: str, current_user: dict) -> None:
    """
    Ensures the authenticated user belongs to the specified clinic,
    or is a superadmin. Raises HTTP 403 otherwise.

    Args:
        clinic_id: The clinic UUID being accessed (from request path/body).
        current_user: Decoded JWT payload from get_current_user.
    """
    if current_user.get("role") == "superadmin":
        return
    user_clinic = current_user.get("clinic_id") or current_user.get("clinicId")
    if str(user_clinic) != str(clinic_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to access this clinic's data.",
        )
