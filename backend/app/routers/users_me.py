from typing import Annotated, Any
from fastapi import APIRouter, Depends
from app.schemas.auth import UserPublic
from app.services.get_current_user_from_cookie import (
    get_current_user_from_cookie,
)

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserPublic)
async def read_current_user(
    current_user: Annotated[dict[str, Any], Depends(get_current_user_from_cookie)],
) -> UserPublic:
    return UserPublic(**current_user)
