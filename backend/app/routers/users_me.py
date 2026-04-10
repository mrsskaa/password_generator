from fastapi import APIRouter, Depends
from typing import Annotated,Dict
from backend.app.services.get_current_user_from_cookie import get_current_user_from_cookie

router=APIRouter()
@router.get("/users/me")
async def read_current_user(
    current_user: Annotated[Dict, Depends(get_current_user_from_cookie)]
):
    return current_user