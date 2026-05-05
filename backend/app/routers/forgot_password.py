import os
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status

from app.dependencies import get_repository
from app.repositories.user_repo import SQLAlchemyRepository
from app.schemas.password_recovery import ForgotPasswordRequest
from app.services.mailer import send_password_reset_code

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
CODE_RE = re.compile(r"^\d{6}$")
RATE_LIMIT_SECONDS = 60
CODE_EXPIRE_MINUTES = 10

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _with_debug_code_message(message: str, code: str) -> str:
    if os.getenv("DEBUG_RESET_CODE_IN_RESPONSE", "false").lower() == "true":
        return f"{message} (debug_code={code})"
    return message


def _validate_email(email: str) -> str:
    normalized_email = email.strip().lower()
    if not EMAIL_RE.match(normalized_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Некорректный формат email",
        )
    return normalized_email


def _create_reset_code(email: str, repository: SQLAlchemyRepository) -> dict[str, str]:
    latest_code = repository.get_latest_reset_code_for_email(email)
    if latest_code and (datetime.now(timezone.utc) - latest_code["created_at"]).total_seconds() < RATE_LIMIT_SECONDS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Слишком много запросов. Попробуйте через минуту.",
        )

    code = f"{secrets.randbelow(1_000_000):06d}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=CODE_EXPIRE_MINUTES)
    return repository.create_password_reset_code(email=email, code=code, expires_at=expires_at)


@router.post("/forgot-password")
async def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    repository: Annotated[SQLAlchemyRepository, Depends(get_repository)],
) -> dict[str, str]:
    email = _validate_email(payload.email)
    user = repository.get_user_by_email(email)
    if not user:
        # Не раскрываем, существует ли email.
        return {"message": "Если email существует, код восстановления скоро придет."}

    code_row = _create_reset_code(email=email, repository=repository)
    if not CODE_RE.match(code_row["code"]):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ошибка генерации кода")

    background_tasks.add_task(send_password_reset_code, to_email=email, code=code_row["code"])
    message = _with_debug_code_message("Код восстановления скоро придет на email.", code_row["code"])
    return {"message": message}


@router.post("/forgot-password/resend-code")
async def resend_forgot_password_code(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    repository: Annotated[SQLAlchemyRepository, Depends(get_repository)],
) -> dict[str, str]:
    return await forgot_password(payload=payload, background_tasks=background_tasks, repository=repository)
