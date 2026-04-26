import logging
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Response, status
from app.dependencies import get_auth_service
from app.schemas.auth import LoginRequest, UserPublic
from app.services.auth.auth import AuthService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
async def login(
    payload: LoginRequest,
    response: Response,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict:
    user = auth_service.authenticate_user(payload.username, payload.password)

    if not user:
        logger.warning("Login failed for username=%s", payload.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
        )

    if user.get("email") and not user.get("email_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Подтвердите email перед входом в аккаунт",
        )

    token_data = {"sub": user["username"], "role": user.get("role", "user")}
    access_token = auth_service.create_access_token(data=token_data)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=auth_service.access_token_expire_minutes * 60,
    )

    logger.info("Успешный вход username=%s", payload.username)
    return {
        "message": "Вход выполнен",
        "user": UserPublic(**{k: user[k] for k in ["id", "username", "email", "role", "created_at"]}).model_dump(),
    }


@router.post("/logout")
async def logout(response: Response) -> dict[str, str]:
    response.delete_cookie("access_token")
    return {"message": "Выход выполнен"}
