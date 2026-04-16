import uuid
from datetime import datetime
from fastapi import APIRouter
from starlette import status

from backend.app.schemas.password_post import PasswordPostRequest, DescriptionPatchRequest, PasswordGetResponse, PatchResponse, DeleteResponse

from backend.app.schemas.auth import AuthResponse

router = APIRouter()

@router.get("/passwords",response_model=list[PasswordGetResponse],status_code=status.HTTP_200_OK)
async def get_passwords():
    return [
        {"id" : uuid.uuid4(), "password" : "135792468", "description" : "privet", "created_at" : datetime.now().isoformat(), "settings_preview" : "settings"},
        {"id": uuid.uuid4(), "password": "135792468", "description": "privet", "created_at": datetime.now().isoformat(),
         "settings_preview": "settings"},
        {"id": uuid.uuid4(), "password": "135792468", "description": "privet", "created_at": datetime.now().isoformat(),
         "settings_preview": "settings"},
        {"id": uuid.uuid4(), "password": "135792468", "description": "privet", "created_at": datetime.now().isoformat(),
         "settings_preview": "settings"},
        {"id": uuid.uuid4(), "password": "135792468", "description": "privet", "created_at": datetime.now().isoformat(),
         "settings_preview": "settings"},
        {"id": uuid.uuid4(), "password": "135792468", "description": "privet", "created_at": datetime.now().isoformat(),
         "settings_preview": "settings"},
        {"id": uuid.uuid4(), "password": "135792468", "description": "privet", "created_at": datetime.now().isoformat(),
         "settings_preview": "settings"},
        {"id": uuid.uuid4(), "password": "135792468", "description": "privet", "created_at": datetime.now().isoformat(),
         "settings_preview": "settings"},
        {"id": uuid.uuid4(), "password": "135792468", "description": "privet", "created_at": datetime.now().isoformat(),
         "settings_preview": "settings"},
        {"id": uuid.uuid4(), "password": "135792468", "description": "privet", "created_at": datetime.now().isoformat(),
         "settings_preview": "settings"}
    ]

@router.post("/passwords",response_model=PasswordGetResponse,status_code=status.HTTP_201_CREATED)
def create_password(data: PasswordPostRequest):
    return {"id" : uuid.uuid4(), "password" : data.password, "description" : data.description, "created_at" : datetime.now().isoformat(), "settings_preview" : "poka"}

@router.delete("/passwords",response_model=DeleteResponse,status_code=status.HTTP_200_OK)
def delete_password():
    return {"message" : "Password deleted"}

@router.patch("/passwords",response_model=PatchResponse,status_code=status.HTTP_200_OK)
def update_password(data: DescriptionPatchRequest):
    return {"id" : uuid.uuid4(), "description" : "privet", "created_at" : datetime.now().isoformat()}

