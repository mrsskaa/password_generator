from fastapi import APIRouter
from backend.app.schemas.forgot_password2 import ForgotPasswordRequest

router = APIRouter()

@router.post("/forgot_password")
def forgot_password(data: ForgotPasswordRequest):
    return {"message" : "Code sent"}

