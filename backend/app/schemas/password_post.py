from pydantic import BaseModel,Field
from typing import Dict, Any

class PasswordPostRequest(BaseModel):
    password : str = Field(...,min_length=8,max_length=32)
    description : str = Field(...,min_length=0,max_length=500)
    settings_preview : Dict[Any] = Field(...,min_length=0,max_length=500)

class DescriptionPatchRequest(BaseModel):
    description : str = Field(...,min_length=0,max_length=500)


