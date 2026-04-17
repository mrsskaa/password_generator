from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.dependencies import get_auth_service, get_repository
from app.repositories.user_repo import SQLAlchemyRepository
from app.schemas.password_recovery import ResetPasswordRequest
from app.services.auth.auth import AuthService

bearer_scheme = HTTPBearer(auto_error=False)
router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/reset-password")
async def reset_password(
    payload: ResetPasswordRequest,
    repository: Annotated[SQLAlchemyRepository, Depends(get_repository)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, str]:
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password too short")

    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid reset token")

    email = auth_service.verify_reset_token(credentials.credentials)
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid reset token")

    hashed_password = auth_service.get_password_hash(payload.new_password)
    updated = repository.update_user_password_by_email(email=email, hashed_password=hashed_password)
    if not updated:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid reset token")

    repository.delete_reset_codes_for_email(email)
    return {"message": "Password updated"}
