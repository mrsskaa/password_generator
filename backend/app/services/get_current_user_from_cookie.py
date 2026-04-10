from typing import Annotated,Optional
from fastapi import HTTPException,Cookie
from backend.app.services.auth.auth import AuthService
from backend.app.repositories.user_repo import SQLAlchemyRepository
repository = SQLAlchemyRepository()
auth_service = AuthService(repository)

async def get_current_user_from_cookie(
        access_token: Annotated[Optional[str], Cookie()] = None
):
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = auth_service.verify_token(access_token)  # используем тот же auth_service
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    username = payload["sub"]
    user = auth_service.repository.get_user_by_username(username)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user