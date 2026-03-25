from fastapi import APIRouter, HTTPException
from backend.app.services.password_generator import generate_password
from backend.app.schemas.password import PasswordRequest
router=APIRouter()



@router.post("/generate")
async def generate_password(password: PasswordRequest)->dict:
    try:
        return {"secret_password": generate_password(password.length, password.use_lower,
                                                     password.use_upper, password.use_digits,
                                                     password.use_symbols, 100)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

