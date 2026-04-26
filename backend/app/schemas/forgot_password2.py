from pydantic import BaseModel

class ForgotPasswordRequest(BaseModel):
    email: str