from pydantic import BaseModel, Field


class ForgotPasswordRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)


class VerifyCodeRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    code: str = Field(min_length=6, max_length=6)


class ResetPasswordRequest(BaseModel):
    reset_token: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)
