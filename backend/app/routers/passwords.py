import uuid
from datetime import datetime
from fastapi import APIRouter
from backend.app.schemas.password_post import PasswordPostRequest,DescriptionPatchRequest

from backend.app.schemas.auth import AuthResponse

router = APIRouter()

@router.get("/passwords")
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

@router.post("/passwords")
def create_password(data: PasswordPostRequest):
    return {"id" : uuid.uuid4(), "password" : data.password, "description" : data.description, "created_at" : datetime.now().isoformat(), "settings_preview" : "poka"}

@router.delete("/passwords")
def delete_password():
    return {"message" : "Password deleted"}

@router.patch("/passwords")
def update_password(data: DescriptionPatchRequest):
    return {"id" : uuid.uuid4(), "description" : "privet", "created_at" : datetime.now().isoformat()}

