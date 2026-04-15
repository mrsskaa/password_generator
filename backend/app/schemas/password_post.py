from pydantic import BaseModel, Field
from typing import Any

class PasswordPostRequest(BaseModel):
    password: str = Field(..., min_length=8, max_length=32)
    description: str = Field(..., min_length=0, max_length=500)
    settings_preview: dict[str, Any]

class DescriptionPatchRequest(BaseModel):
    description: str = Field(..., min_length=0, max_length=500)
