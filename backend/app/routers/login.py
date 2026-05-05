import os
from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.dependencies import get_auth_service
from app.schemas.auth import AuthResponse, LoginRequest, UserPublic
from app.services.auth.auth import AuthService

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=AuthResponse)
async def login(
    payload: LoginRequest,
    response: Response,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> AuthResponse:
    user = auth_service.authenticate_user(payload.username, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль",
        )

    if not user.get("email_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Подтвердите email перед входом",
        )

    access_token = auth_service.create_access_token(
        data={"sub": user["username"], "role": user.get("role", "user")},
        expires_delta=timedelta(minutes=auth_service.access_token_expire_minutes),
    )

    secure_cookie = os.getenv("COOKIE_SECURE", "false").lower() == "true"
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=secure_cookie,
        samesite="lax",
        max_age=auth_service.access_token_expire_minutes * 60,
        path="/",
    )

    return AuthResponse(message="Вход выполнен", user=UserPublic(**user))


@router.post("/logout", response_model=AuthResponse)
async def logout(response: Response) -> AuthResponse:
    response.delete_cookie(key="access_token", path="/")
    return AuthResponse(message="Выход выполнен", user=None)
