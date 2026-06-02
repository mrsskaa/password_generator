import logging
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated, Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status

from app.dependencies import get_repository
from app.repositories.user_repo import SQLAlchemyRepository
from app.schemas.password_recovery import ForgotPasswordRequest
from app.services.mailer import send_password_reset_code

logger = logging.getLogger(__name__)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
RATE_LIMIT_SECONDS = 60
RATE_LIMIT_WINDOW_SECONDS = 60 * 60
RATE_LIMIT_MAX_REQUESTS = 3
CODE_EXPIRE_MINUTES = 10

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _ensure_aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def _enforce_reset_rate_limit(email: str, repository: SQLAlchemyRepository) -> None:
    now = datetime.now(timezone.utc)
    latest_code = repository.get_latest_reset_code_for_email(email)
    if latest_code:
        created_at = _ensure_aware(latest_code["created_at"])
        if (now - created_at).total_seconds() < RATE_LIMIT_SECONDS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Слишком много запросов. Попробуйте через минуту",
            )

    window_start = now - timedelta(seconds=RATE_LIMIT_WINDOW_SECONDS)
    requests_in_window = repository.count_password_reset_codes_for_email_since(email, window_start)
    if requests_in_window >= RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Слишком много запросов. Можно запросить код восстановления максимум 3 раза в час",
        )


def _create_reset_code(email: str, repository: SQLAlchemyRepository) -> dict[str, Any]:
    _enforce_reset_rate_limit(email, repository)

    code = str(secrets.randbelow(900000) + 100000)
    return repository.create_password_reset_code(
        email=email,
        code=code,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=CODE_EXPIRE_MINUTES),
    )


def _validate_recovery_email(payload: ForgotPasswordRequest, repository: SQLAlchemyRepository) -> str:
    email = payload.email.strip().lower()

    if not EMAIL_RE.match(email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Некорректный email")

    user = repository.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь с таким email не найден")

    return email


@router.post("/forgot-password")
async def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    repository: Annotated[SQLAlchemyRepository, Depends(get_repository)],
) -> dict[str, str]:
    email = _validate_recovery_email(payload, repository)
    code_row = _create_reset_code(email, repository)
    background_tasks.add_task(send_password_reset_code, email, code_row["code"])

    logger.info("Password recovery code sent for email=%s", email)
    return {"message": "Код скоро придет"}


@router.post("/forgot-password/resend-code")
async def resend_forgot_password_code(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    repository: Annotated[SQLAlchemyRepository, Depends(get_repository)],
) -> dict[str, str]:
    email = _validate_recovery_email(payload, repository)
    code_row = _create_reset_code(email, repository)
    background_tasks.add_task(send_password_reset_code, email, code_row["code"])

    logger.info("Password recovery resend sent for email=%s", email)
    return {"message": "Код скоро придет"}
