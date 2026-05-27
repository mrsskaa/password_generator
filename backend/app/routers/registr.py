import logging
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated, Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError

from app.dependencies import get_auth_service, get_repository
from app.repositories.user_repo import SQLAlchemyRepository
from app.schemas.auth import AuthResponse, RegisterRequest
from app.schemas.password_recovery import ForgotPasswordRequest, VerifyCodeRequest
from app.services.auth.auth import AuthService
from app.services.mailer import send_registration_code_email, send_welcome_email

logger = logging.getLogger(__name__)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
CODE_RE = re.compile(r"^\d{6}$")
RATE_LIMIT_SECONDS = 60
CODE_EXPIRE_MINUTES = 10

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _validate_email(email: str) -> str:
    normalized_email = email.strip().lower()
    if not EMAIL_RE.match(normalized_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Некорректный формат email",
        )
    return normalized_email


def _create_registration_code(email: str, repository: SQLAlchemyRepository) -> dict[str, Any]:
    latest_code = repository.get_latest_registration_code_for_email(email)
    if latest_code and (datetime.now(timezone.utc) - latest_code["created_at"]).total_seconds() < RATE_LIMIT_SECONDS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Слишком много запросов. Попробуйте через минуту",
        )

    code = str(secrets.randbelow(900000) + 100000)
    return repository.create_registration_code(
        email=email,
        code=code,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=CODE_EXPIRE_MINUTES),
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    background_tasks: BackgroundTasks,
    repository: Annotated[SQLAlchemyRepository, Depends(get_repository)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> AuthResponse:
    if not payload.email:
        raise HTTPException(status_code=400, detail="Для регистрации необходимо указать email")

    email = _validate_email(payload.email)
    # Во фронте логин = email
    username = email
    hashed_password = auth_service.get_password_hash(payload.password)

    existing = repository.get_user_by_email(email)
    if existing and existing.get("email_verified"):
        raise HTTPException(status_code=400, detail="Пользователь с таким именем уже существует")

    if existing and not existing.get("email_verified"):
        repository.delete_user_by_id(existing["id"])

    repository.upsert_pending_registration(email, username, hashed_password)
    repository.delete_registration_codes_for_email(email)

    registration_code = _create_registration_code(email, repository)
    background_tasks.add_task(send_registration_code_email, to_email=email, code=registration_code["code"])
    logger.info("Заявка на регистрацию: email=%s (аккаунт в БД создастся после подтверждения кода)", email)

    return AuthResponse(
        message="Код подтверждения скоро придет на email. Аккаунт будет создан после ввода кода.",
        user=None,
    )


@router.post("/register/resend-code")
async def resend_registration_code(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    repository: Annotated[SQLAlchemyRepository, Depends(get_repository)],
) -> dict[str, str]:
    email = _validate_email(payload.email)

    user = repository.get_user_by_email(email)
    if user and user.get("email_verified"):
        return {"message": "Email уже подтвержден"}

    pending = repository.get_pending_registration(email)
    if not pending and user and not user.get("email_verified"):
        repository.migrate_legacy_unverified_user_to_pending(email)
        pending = repository.get_pending_registration(email)

    if not pending:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь с таким email не найден",
        )

    code_row = _create_registration_code(email, repository)
    background_tasks.add_task(send_registration_code_email, to_email=email, code=code_row["code"])
    return {"message": "Код подтверждения скоро придет"}


@router.post("/register/verify-code")
async def verify_registration_code(
    payload: VerifyCodeRequest,
    background_tasks: BackgroundTasks,
    repository: Annotated[SQLAlchemyRepository, Depends(get_repository)],
) -> dict[str, str]:
    email = _validate_email(payload.email)
    code = payload.code.strip()

    if not CODE_RE.match(code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Код должен состоять из 6 цифр",
        )

    code_row = repository.get_registration_code(email=email, code=code)
    if not code_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Код подтверждения не найден",
        )

    if code_row["used_at"] is not None or datetime.now(timezone.utc) > code_row["expires_at"]:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Код подтверждения истек или уже использован",
        )

    pending = repository.get_pending_registration(email)
    if not pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Заявка на регистрацию не найдена или устарела. Пройдите регистрацию заново.",
        )

    try:
        created_user = repository.create_user(
            username=pending["username"],
            hashed_password=pending["hashed_password"],
            email=email,
            email_verified=True,
        )
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким именем уже существует",
        ) from None

    repository.mark_registration_code_used(code_row["id"])
    repository.delete_pending_registration(email)
    repository.delete_registration_codes_for_email(email)

    background_tasks.add_task(
        send_welcome_email,
        to_email=created_user.get("email"),
        username=created_user["username"],
    )
    logger.info("Аккаунт создан после подтверждения email: username=%s", created_user["username"])

    return {"message": "Email успешно подтвержден"}
