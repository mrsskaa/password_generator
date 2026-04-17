import logging
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status

from app.dependencies import get_repository
from app.repositories.user_repo import SQLAlchemyRepository
from app.schemas.password_recovery import ForgotPasswordRequest
from app.services.mailer import send_password_reset_code

logger = logging.getLogger(__name__)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
RATE_LIMIT_SECONDS = 60
CODE_EXPIRE_MINUTES = 10

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _create_reset_code(email: str, repository: SQLAlchemyRepository) -> str:
    latest_code = repository.get_latest_reset_code_for_email(email)
    if latest_code and (datetime.now(timezone.utc) - latest_code["created_at"]).total_seconds() < RATE_LIMIT_SECONDS:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many requests")

    code = str(secrets.randbelow(900000) + 100000)
    repository.create_password_reset_code(
        email=email,
        code=code,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=CODE_EXPIRE_MINUTES),
    )
    return code


def _validate_recovery_email(payload: ForgotPasswordRequest, repository: SQLAlchemyRepository) -> str:
    email = payload.email.strip().lower()

    if not EMAIL_RE.match(email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email")

    user = repository.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email not found")

    return email


@router.post("/forgot-password")
async def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    repository: Annotated[SQLAlchemyRepository, Depends(get_repository)],
) -> dict[str, str]:
    email = _validate_recovery_email(payload, repository)
    code = _create_reset_code(email, repository)
    background_tasks.add_task(send_password_reset_code, email, code)
    logger.info("Password recovery code scheduled for email=%s", email)
    return {"message": "Code sent"}


@router.post("/forgot-password/resend-code")
async def resend_forgot_password_code(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    repository: Annotated[SQLAlchemyRepository, Depends(get_repository)],
) -> dict[str, str]:
    email = _validate_recovery_email(payload, repository)
    code = _create_reset_code(email, repository)
    background_tasks.add_task(send_password_reset_code, email, code)
    logger.info("Password recovery resend scheduled for email=%s", email)
    return {"message": "Code sent"}
