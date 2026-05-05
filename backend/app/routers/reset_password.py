from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_auth_service, get_repository
from app.repositories.user_repo import SQLAlchemyRepository
from app.schemas.password_recovery import ResetPasswordRequest
from app.services.auth.auth import AuthService

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/reset-password")
async def reset_password(
    payload: ResetPasswordRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    repository: Annotated[SQLAlchemyRepository, Depends(get_repository)],
) -> dict[str, str]:
    email = auth_service.verify_reset_token(payload.reset_token)
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Недействительный или истекший токен")

    hashed_password = auth_service.get_password_hash(payload.new_password)
    updated = repository.update_user_password_by_email(email=email, hashed_password=hashed_password)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    repository.delete_reset_codes_for_email(email)
    return {"message": "Пароль успешно обновлен"}
