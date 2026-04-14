from typing import Annotated, Any
from fastapi import APIRouter, Depends
from backend.app.schemas.auth import UserPublic
from backend.app.services.get_current_user_from_cookie import (
    get_current_user_from_cookie,
    require_role,
)

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserPublic)
async def read_current_user(
    current_user: Annotated[dict[str, Any], Depends(get_current_user_from_cookie)],
) -> UserPublic:
    return UserPublic(**current_user)


@router.get("/admin/ping")
async def admin_ping(
    _: Annotated[dict[str, Any], Depends(require_role("admin"))],
) -> dict[str, str]:
    return {"message": "Admin access granted"}
