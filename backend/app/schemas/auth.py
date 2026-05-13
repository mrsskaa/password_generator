from pydantic import BaseModel, Field, field_validator

from app.core.password_policy import validate_password_policy


class RegisterRequest(BaseModel):
    password: str = Field(...)
    email: str = Field(..., max_length=255)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return validate_password_policy(value)


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=8, max_length=128)


class UserPublic(BaseModel):
    id: int
    username: str
    email: str | None = None
    role: str
    created_at: str


class AuthResponse(BaseModel):
    message: str
    user: UserPublic | None = None
