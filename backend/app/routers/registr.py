from fastapi import APIRouter, HTTPException
from backend.app.repositories.user_repo import SQLAlchemyRepository
from backend.app.services.auth.auth import AuthService


repository = SQLAlchemyRepository()
auth_service = AuthService(repository)
router=APIRouter()

@router.post("/register")
async def register(username: str, password: str, email: str = None):
    existing = repository.get_user_by_username(username)#вот раз метод get_ser_by_username
    if existing:
        raise HTTPException(400, "Username already exists")
    hashed = auth_service.get_password_hash(password)
    user = repository.create_user(username=username, hashed_password=hashed, email=email)#вот два метод, #лучше посоветуйся с нейронкой какие вообще нужны
    return {"message": "User created"}