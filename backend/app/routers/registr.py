import logging
from fastapi import APIRouter, HTTPException, status
from sqlalchemy.exc import IntegrityError
from backend.app.repositories.user_repo import SQLAlchemyRepository
from backend.app.schemas.auth import AuthResponse, RegisterRequest, UserPublic
from backend.app.services.auth.auth import AuthService
from backend.app.services.mailer import send_welcome_email

logger = logging.getLogger(__name__)

repository = SQLAlchemyRepository()
auth_service = AuthService(repository)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest) -> AuthResponse:
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
