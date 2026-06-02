import logging
import os
from typing import Annotated, Any

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status

from app.dependencies import get_auth_service
from app.schemas.auth import LoginRequest, UserPublic
from app.services.auth.auth import AuthService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

ACCESS_TOKEN_COOKIE = "access_token"
REFRESH_TOKEN_COOKIE = "refresh_token"
COOKIE_SAMESITE = "lax"
COOKIE_SECURE = os.getenv("AUTH_COOKIE_SECURE", "false").lower() == "true"


def _service_int(auth_service: AuthService, attr: str, default: int) -> int:
    value = getattr(auth_service, attr, default)
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _token_data_for_user(user: dict[str, Any]) -> dict[str, Any]:
    return {
        "sub": user["email"],
        "session_version": int(user.get("session_version", 0)),
    }


def _public_user(user: dict[str, Any]) -> dict[str, Any]:
    return UserPublic(**{k: user[k] for k in ["id", "email", "created_at"]}).model_dump()


def _set_auth_cookies(response: Response, auth_service: AuthService, user: dict[str, Any]) -> None:
    token_data = _token_data_for_user(user)
    access_token = auth_service.create_access_token(data=token_data)
    refresh_token = auth_service.create_refresh_token(data=token_data)

    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE,
        value=str(access_token),
        httponly=True,
        samesite=COOKIE_SAMESITE,
        secure=COOKIE_SECURE,
        max_age=_service_int(auth_service, "access_token_expire_minutes", 30) * 60,
    )
    response.set_cookie(
        key=REFRESH_TOKEN_COOKIE,
        value=str(refresh_token),
        httponly=True,
        samesite=COOKIE_SAMESITE,
        secure=COOKIE_SECURE,
        max_age=_service_int(auth_service, "refresh_token_expire_days", 14) * 24 * 60 * 60,
    )


def _delete_auth_cookies(response: Response) -> None:
    response.delete_cookie(ACCESS_TOKEN_COOKIE)
    response.delete_cookie(REFRESH_TOKEN_COOKIE)


@router.post("/login")
async def login(
    payload: LoginRequest,
    response: Response,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict:
    user = auth_service.authenticate_user(payload.email, payload.password)

    if not user:
        logger.warning("Неудачная попытка входа email=%s", payload.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
        )

    if user.get("email") and user.get("email_verified") is False:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Подтвердите email перед входом в аккаунт",
        )

    _set_auth_cookies(response, auth_service, user)

    logger.info("Успешный вход email=%s", payload.email)
    return {
        "message": "Вход выполнен",
        "user": _public_user(user),
    }


@router.post("/refresh")
async def refresh(
    response: Response,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    refresh_token: Annotated[str | None, Cookie()] = None,
) -> dict[str, Any]:
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Требуется повторный вход")

    payload = auth_service.verify_refresh_token(refresh_token)
    if not payload:
        _delete_auth_cookies(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Недействительный refresh-токен")

    email = payload.get("sub")
    if not isinstance(email, str):
        _delete_auth_cookies(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Недействительный refresh-токен")

    user = auth_service.repository.get_user_by_email(email)
    if not user or not auth_service.user_matches_token_session(user, payload):
        _delete_auth_cookies(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Сессия истекла. Войдите снова")

    _set_auth_cookies(response, auth_service, user)
    return {"message": "Сессия обновлена", "user": _public_user(user)}


@router.post("/logout")
async def logout(response: Response) -> dict[str, str]:
    _delete_auth_cookies(response)
    return {"message": "Выход выполнен"}
