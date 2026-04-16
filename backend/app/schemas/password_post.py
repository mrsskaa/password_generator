import uuid
from typing import Any, Annotated
from pydantic import BaseModel, Field

ISO8601 = Annotated[str, "ISO8601 datetime string"]

class PasswordPostRequest(BaseModel):
    hashed_password: str = Field(..., min_length=8, max_length=32)
    description: str = Field(..., min_length=1, max_length=500)  # не пустое
    generation_settings: dict[str, Any]   # было settings_preview – исправлено

class DescriptionPatchRequest(BaseModel):
    description: str = Field(..., min_length=1, max_length=500)  # не пустое

class PasswordGetResponse(BaseModel):
    id: uuid.UUID
    hashed_password: str = Field(..., max_length=128)
    description: str = Field(..., min_length=1, max_length=500)
    created_at: ISO8601
    settings_preview: str   # строка-превью настроек

class PatchResponse(BaseModel):
    id: uuid.UUID
    description: str = Field(..., min_length=1, max_length=500)
    updated_at: ISO8601

class DeleteResponse(BaseModel):
    message: str = "Password deleted"

