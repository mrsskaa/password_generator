from fastapi import APIRouter
from backend.app.schemas.verify_code2 import VerifyCodeRequest

router = APIRouter()

@router.post("/verify-code")
def verify_code(data: VerifyCodeRequest):
    return {"message" : "Code valid", "reset_token" : "str"}