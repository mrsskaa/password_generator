import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.exceptions import NotFoundError
from app.dependencies import get_password_service
from app.schemas.password_post import (
    DeleteResponse,
    DescriptionPatchRequest,
    PasswordGetResponse,
    PasswordListResponse,
    PasswordPostRequest,
    PasswordRevealRequest,
    PasswordRevealResponse,
    PatchResponse,
)
from app.services.get_current_user_from_cookie import get_current_user_from_cookie
from app.services.password_service.password_service import PasswordService

router = APIRouter(prefix="/api", tags=["passwords"])


@router.get("/passwords", response_model=PasswordListResponse, status_code=status.HTTP_200_OK)
async def get_passwords(
    current_user: Annotated[dict[str, Any], Depends(get_current_user_from_cookie)],
    service: Annotated[PasswordService, Depends(get_password_service)],
    limit: int = 20,
    offset: int = 0,
) -> PasswordListResponse:
    limit = max(1, min(limit, 100))
    offset = max(0, offset)
    return service.get_user_passwords(current_user["id"], limit=limit, offset=offset)


@router.get("/passwords/{password_id}", response_model=PasswordGetResponse, status_code=status.HTTP_200_OK)
async def get_password(
    password_id: uuid.UUID,
    current_user: Annotated[dict[str, Any], Depends(get_current_user_from_cookie)],
    service: Annotated[PasswordService, Depends(get_password_service)],
) -> PasswordGetResponse:
    try:
        return service.get_password(current_user["id"], password_id)
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пароль не найден")


@router.post("/passwords", response_model=PasswordGetResponse, status_code=status.HTTP_201_CREATED)
async def create_password(
    data: PasswordPostRequest,
    current_user: Annotated[dict[str, Any], Depends(get_current_user_from_cookie)],
    service: Annotated[PasswordService, Depends(get_password_service)],
) -> PasswordGetResponse:
    return service.create_password(current_user["id"], data)


@router.post("/passwords/{password_id}/reveal", response_model=PasswordRevealResponse, status_code=status.HTTP_200_OK)
async def reveal_password(
    password_id: uuid.UUID,
    data: PasswordRevealRequest,
    current_user: Annotated[dict[str, Any], Depends(get_current_user_from_cookie)],
    service: Annotated[PasswordService, Depends(get_password_service)],
) -> PasswordRevealResponse:
    try:
        return service.reveal_password(current_user["id"], password_id, data.code_word)
    except PermissionError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Неверное кодовое слово")
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пароль не найден")


@router.delete("/passwords/{password_id}", response_model=DeleteResponse, status_code=status.HTTP_200_OK)
async def delete_password(
    password_id: uuid.UUID,
    current_user: Annotated[dict[str, Any], Depends(get_current_user_from_cookie)],
    service: Annotated[PasswordService, Depends(get_password_service)],
) -> DeleteResponse:
    try:
        return service.delete_password(current_user["id"], password_id)
    except PermissionError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пароль не найден")


@router.patch("/passwords/{password_id}", response_model=PatchResponse, status_code=status.HTTP_200_OK)
async def update_password(
    password_id: uuid.UUID,
    data: DescriptionPatchRequest,
    current_user: Annotated[dict[str, Any], Depends(get_current_user_from_cookie)],
    service: Annotated[PasswordService, Depends(get_password_service)],
) -> PatchResponse:
    try:
        return service.update_description(current_user["id"], password_id, data.description)
    except PermissionError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пароль не найден")
