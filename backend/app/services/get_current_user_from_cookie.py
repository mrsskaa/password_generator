from typing import Annotated, Any, Optional
from fastapi import Cookie, Depends, HTTPException, status
from app.dependencies import get_auth_service
from app.services.auth.auth import AuthService


async def get_current_user_from_cookie(
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    access_token: Annotated[Optional[str], Cookie()] = None,
) -> dict[str, Any]:
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Требуется авторизация")

    payload = auth_service.verify_token(access_token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Недействительный токен")

    email = payload["sub"]
    user = auth_service.repository.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Пользователь не найден")

    return user
