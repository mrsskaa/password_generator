from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from typing import Annotated
from backend.app.services.auth.auth import AuthService
from backend.app.repositories.user_repo import SQLAlchemyRepository
repository = SQLAlchemyRepository()#тут просто объект класа создаётся
auth_service = AuthService(repository)

router = APIRouter()

@router.post("/login")
async def login(response: Response,form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user = auth_service.authenticate_user(form_data.username, form_data.password)

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Incorrect username or password")

    token_data = {"sub": user["username"]}
    access_token = auth_service.create_access_token(data=token_data)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        # secure=True,
        samesite="lax",
        max_age=auth_service.access_token_expire_minutes * 60
    )

    return {"message": "Login successful", "username": user["username"]}