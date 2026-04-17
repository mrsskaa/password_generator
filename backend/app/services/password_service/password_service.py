import uuid
from datetime import datetime, timezone
from typing import Any

from app.core.exceptions import NotFoundError
from app.models.saved_password import SavedPassword
from app.repositories.saved_password_repo import PasswordRepository
from app.schemas.password_post import (
    DeleteResponse,
    PasswordGetResponse,
    PasswordPostRequest,
    PatchResponse,
)


class PasswordService:
    def __init__(self, repo: PasswordRepository):
        self.repo = repo

    @staticmethod
    def make_settings_preview(settings: dict[str, Any]) -> str:
        if not settings:
            return "settings not specified"

        parts: list[str] = []
        if "length" in settings:
            parts.append(f"length: {settings['length']}")
        if "use_digits" in settings:
            parts.append(f"digits: {'yes' if settings['use_digits'] else 'no'}")
        if "use_symbols" in settings:
            parts.append(f"symbols: {'yes' if settings['use_symbols'] else 'no'}")
        if "use_upper" in settings:
            parts.append(f"upper: {'yes' if settings['use_upper'] else 'no'}")
        if "use_lower" in settings:
            parts.append(f"lower: {'yes' if settings['use_lower'] else 'no'}")

        if not parts:
            return ", ".join(f"{k}={v}" for k, v in settings.items())
        return ", ".join(parts)

    @staticmethod
    def orm_to_password_response(password: SavedPassword) -> PasswordGetResponse:
        return PasswordGetResponse(
            id=password.id,
            password=password.hashed_password,
            description=password.description,
            created_at=password.created_at.isoformat(),
            settings_preview=password.settings_preview,
        )

    def create_password(self, user_id: int, request: PasswordPostRequest) -> PasswordGetResponse:
        preview = self.make_settings_preview(request.generation_settings)
        new_password = self.repo.create(
            user_id=user_id,
            hashed_password=request.password,
            description=request.description,
            generation_settings=request.generation_settings,
            settings_preview=preview,
        )
        return self.orm_to_password_response(new_password)

    def get_user_passwords(self, user_id: int, limit: int = 50) -> list[PasswordGetResponse]:
        passwords = self.repo.list_by_user(user_id, limit)
        return [self.orm_to_password_response(pwd) for pwd in passwords]

    def update_description(self, user_id: int, password_id: uuid.UUID, new_description: str) -> PatchResponse:
        existing = self.repo.get_by_id(password_id)
        if existing is None:
            raise NotFoundError("Password not found")
        if existing.user_id != user_id:
            raise PermissionError("Forbidden")

        updated = self.repo.update_description(password_id, user_id, new_description)
        if updated is None:
            raise RuntimeError("Failed to update description")

        return PatchResponse(
            id=updated.id,
            description=updated.description,
            updated_at=(updated.updated_at or datetime.now(timezone.utc)).isoformat(),
        )

    def delete_password(self, user_id: int, password_id: uuid.UUID) -> DeleteResponse:
        existing = self.repo.get_by_id(password_id)
        if existing is None:
            raise NotFoundError("Password not found")
        if existing.user_id != user_id:
            raise PermissionError("Forbidden")

        deleted = self.repo.delete(password_id, user_id)
        if not deleted:
            raise RuntimeError("Failed to delete password")

        return DeleteResponse()
