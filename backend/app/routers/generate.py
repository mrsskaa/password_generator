from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.app.services.password_generator import generate_password

router=APIRouter()

class Password(BaseModel):
    length : int
    use_of_lowercase_letters : bool
    use_of_uppercase_letters : bool
    use_of_digits : bool
    use_of_special_symbols : bool

@router.post("/generate")
async def generate_password(password: Password)->dict:
    try:
        return {"secret_password": generate_password(password.length, password.use_of_lowercase_letters,
                                                     password.use_of_uppercase_letters, password.use_of_digits,
                                                     password.use_of_special_symbols, 100)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

