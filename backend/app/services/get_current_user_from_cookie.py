from collections.abc import Callable
from typing import Annotated, Any, Optional
from fastapi import Cookie, Depends, HTTPException, status
from backend.app.dependencies import get_auth_service
from backend.app.services.auth.auth import AuthService


async def get_current_user_from_cookie(
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    access_token: Annotated[Optional[str], Cookie()] = None,
) -> dict[str, Any]:
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    payload = auth_service.verify_token(access_token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    username = payload["sub"]
    user = auth_service.repository.get_user_by_username(username)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user


def require_role(required_role: str) -> Callable[[dict[str, Any]], dict[str, Any]]:
    async def role_checker(
        current_user: Annotated[dict[str, Any], Depends(get_current_user_from_cookie)]
    ) -> dict[str, Any]:
        user_role = current_user.get("role", "user")
        if user_role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{required_role}' is required",
            )
        return current_user

    return role_checker
