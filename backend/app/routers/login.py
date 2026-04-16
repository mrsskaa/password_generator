import logging
from fastapi import APIRouter, HTTPException, Response, status
from backend.app.repositories.user_repo import SQLAlchemyRepository
from backend.app.schemas.auth import LoginRequest, UserPublic
from backend.app.services.auth.auth import AuthService

logger = logging.getLogger(__name__)

repository = SQLAlchemyRepository()
auth_service = AuthService(repository)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
async def login(payload: LoginRequest, response: Response) -> dict:
    user = auth_service.authenticate_user(payload.username, payload.password)

    if not user:
        logger.warning("Login failed for username=%s", payload.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    token_data = {"sub": user["username"], "role": user.get("role", "user")}
    access_token = auth_service.create_access_token(data=token_data)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=auth_service.access_token_expire_minutes * 60,
    )

    logger.info("Login success for username=%s", payload.username)
    return {
        "message": "Login successful",
        "user": UserPublic(**{k: user[k] for k in ["id", "username", "email", "role", "created_at"]}).model_dump(),
    }


@router.post("/logout")
async def logout(response: Response) -> dict[str, str]:
    response.delete_cookie("access_token")
    return {"message": "Logout successful"}
