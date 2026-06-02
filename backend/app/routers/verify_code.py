import re
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_auth_service, get_repository
from app.repositories.user_repo import SQLAlchemyRepository
from app.schemas.password_recovery import VerifyCodeRequest
from app.services.auth.auth import AuthService

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
CODE_RE = re.compile(r"^\d{6}$")

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/verify-code")
async def verify_code(
    payload: VerifyCodeRequest,
    repository: Annotated[SQLAlchemyRepository, Depends(get_repository)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, str]:
    email = payload.email.strip().lower()
    code = payload.code.strip()

    if not EMAIL_RE.match(email) or not CODE_RE.match(code):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Некорректный формат email или кода")
    
    code_row = repository.get_password_reset_code(email=email, code=code)
    if not code_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Код подтверждения неверный")

    if code_row["used_at"] is not None or datetime.now(timezone.utc) > code_row["expires_at"]:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Код истек или уже использован")

    repository.mark_password_reset_code_used(code_row["id"])
    reset_token = auth_service.create_reset_token(email=email)

    return {"message": "Код подтвержден", "reset_token": reset_token}
