from fastapi import APIRouter, HTTPException
from backend.app.services.password_generator import generate_password
from backend.app.schemas.password import PasswordRequest, PasswordResponse

router = APIRouter()

def crack_time(length: int)->int | str:
    if length < 8:
        return "<1 second"
    alphabet = 94
    iter_per_sec = 200_000_000_000
    time = alphabet ** length / (2 * iter_per_sec)
    return round(time/3600)

def color_security(time:int|str)->str:
    if time.isdigit():
        if time*60<1:
            return "red"
        elif 1<=time*60<=1440:
            return "orange"
        elif 1440<time*60<=525600:
            return "yellow"
        elif 525600<time*60<=52_560_000:
            return "green"
        else:
            return "blue"
    else:
        return "red"

def level_security(time:int|str)->str:
    if time.isdigit():
        if time*60<1:
            return "ужасный"
        elif 1<=time*60<=1440:
            return "слабый"
        elif 1440<time*60<=525600:
            return "средний"
        elif 525600<time*60<=52_560_000:
            return "хороший"
        else:
            return "отличный"
    else:
        return "ужасный"


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
            cracking_time=crack_time(data.length),
            color=color_security(crack_time(data.length)),
            level=level_security(crack_time(data.length)),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
