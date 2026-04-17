import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from app.dependencies import get_auth_service, get_repository
from app.schemas.auth import AuthResponse, RegisterRequest, UserPublic
from app.services.auth.auth import AuthService
from app.services.mailer import send_welcome_email
from app.repositories.user_repo import SQLAlchemyRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    repository: Annotated[SQLAlchemyRepository, Depends(get_repository)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> AuthResponse:
    existing = repository.get_user_by_username(payload.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_password = auth_service.get_password_hash(payload.password)

    try:
        created_user = repository.create_user(
            username=payload.username,
            hashed_password=hashed_password,
            email=payload.email,
            role="user",
        )
    except IntegrityError:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    send_welcome_email(to_email=created_user.get("email"), username=created_user["username"])
    logger.info("User registered: username=%s", created_user["username"])

    return AuthResponse(message="User created", user=UserPublic(**created_user))
