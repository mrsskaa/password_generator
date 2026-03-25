from fastapi import APIRouter, HTTPException
from backend.app.services.password_generator import generate_password
from backend.app.schemas.password import PasswordRequest, PasswordResponse

router = APIRouter()


@router.post("/generate", response_model=PasswordResponse)
async def generate_password(data: PasswordRequest) -> PasswordResponse:
    try:
        password = generate_password(data.length, data.use_lower,
                                     data.use_upper, data.use_digits,
                                     data.use_symbols, 100)

        return PasswordResponse(
            password=password,
            length=data.length,
            used_lower=data.use_lower,
            used_upper=data.use_upper,
            used_digits=data.use_digits,
            used_symbols=data.use_symbols,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
