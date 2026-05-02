import logging
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated, Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError

from app.dependencies import get_auth_service, get_repository
from app.repositories.user_repo import SQLAlchemyRepository
from app.schemas.auth import AuthResponse, RegisterRequest, UserPublic
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
    hashed_password = auth_service.get_password_hash(payload.password)

    existing_by_email = repository.get_user_by_email(email)
    if existing_by_email:
        if existing_by_email.get("email_verified"):
            raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")
        other_username = repository.get_user_by_username(payload.username)
        if other_username and other_username["id"] != existing_by_email["id"]:
            raise HTTPException(status_code=400, detail="Пользователь с таким именем уже существует")
        updated = repository.update_unverified_user_credentials(
            existing_by_email["id"],
            payload.username,
            hashed_password,
        )
        if not updated:
            raise HTTPException(status_code=400, detail="Не удалось обновить данные регистрации")
        created_user = updated
    else:
        existing_by_username = repository.get_user_by_username(payload.username)
        if existing_by_username:
            raise HTTPException(status_code=400, detail="Пользователь с таким именем уже существует")
        try:
            created_user = repository.create_user(
                username=payload.username,
                hashed_password=hashed_password,
                email=email,
                email_verified=False,
                role="user",
            )
        except IntegrityError:
            raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")

    registration_code = _create_registration_code(email, repository)
    registration_code_sent = True
    try:
        send_registration_code_email(to_email=email, code=registration_code["code"])
    except Exception:
        registration_code_sent = False
        repository.delete_registration_code_by_id(registration_code["id"])
        logger.exception("Не удалось отправить код подтверждения регистрации username=%s", payload.username)

    background_tasks.add_task(
        send_welcome_email,
        to_email=created_user.get("email"),
        username=created_user["username"],
    )
    logger.info("Пользователь зарегистрирован: username=%s", created_user["username"])

    message = "Пользователь зарегистрирован. Код подтверждения отправлен на email."
    if not registration_code_sent:
        message = (
            "Пользователь зарегистрирован. Не удалось отправить код подтверждения, "
            "запросите повторную отправку."
        )
    return AuthResponse(message=message, user=UserPublic(**created_user))


@router.post("/register/resend-code")
async def resend_registration_code(
    payload: ForgotPasswordRequest,
    repository: Annotated[SQLAlchemyRepository, Depends(get_repository)],
) -> dict[str, str]:
    email = _validate_email(payload.email)

    user = repository.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь с таким email не найден")
    if user.get("email_verified"):
        return {"message": "Email уже подтвержден"}

    code_row = _create_registration_code(email, repository)
    try:
        send_registration_code_email(to_email=email, code=code_row["code"])
    except Exception as exc:
        repository.delete_registration_code_by_id(code_row["id"])
        logger.exception("Не удалось повторно отправить код регистрации для email=%s", email)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Не удалось отправить письмо с кодом подтверждения",
        ) from exc

    return {"message": "Код подтверждения отправлен"}


@router.post("/register/verify-code")
async def verify_registration_code(
    payload: VerifyCodeRequest,
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

    repository.mark_registration_code_used(code_row["id"])
    repository.set_user_email_verified(email, True)
    repository.delete_registration_codes_for_email(email)

    return {"message": "Email успешно подтвержден"}
