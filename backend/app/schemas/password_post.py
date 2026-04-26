import uuid
from typing import Any, Annotated

from pydantic import BaseModel, Field

ISO8601 = Annotated[str, "ISO8601 datetime string"]


class PasswordPostRequest(BaseModel):
    password: str = Field(..., min_length=8, max_length=128)
    description: str = Field(..., min_length=1, max_length=500)
    generation_settings: dict[str, Any]


class DescriptionPatchRequest(BaseModel):
    description: str = Field(..., min_length=1, max_length=500)


class PasswordGetResponse(BaseModel):
    id: uuid.UUID
    password: str = Field(..., max_length=255)
    description: str = Field(..., min_length=1, max_length=500)
    created_at: ISO8601
    settings_preview: str


class PatchResponse(BaseModel):
    id: uuid.UUID
    description: str = Field(..., min_length=1, max_length=500)
    updated_at: ISO8601


class DeleteResponse(BaseModel):
    message: str = "Password deleted"
