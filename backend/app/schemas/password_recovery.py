from pydantic import BaseModel, Field


class ForgotPasswordRequest(BaseModel):
    email: str


class VerifyCodeRequest(BaseModel):
    email: str
    code: str


class ResetPasswordRequest(BaseModel):
    new_password: str = Field(..., max_length=128)
