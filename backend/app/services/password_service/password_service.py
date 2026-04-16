import uuid
from datetime import datetime, timezone
from typing import Any
from backend.app.models.saved_password import SavedPassword
from backend.app.repositories.saved_password_repo import PasswordRepository
from backend.app.core.exceptions import NotFoundError
from backend.app.schemas.password_post import PasswordPostRequest, PasswordGetResponse, PatchResponse, DeleteResponse


class PasswordService:
    def __init__(self, repo: PasswordRepository):
        self.repo = repo

    @staticmethod
    def make_settings_preview(settings: dict[str, Any]) -> str:
        if not settings:
            return "настройки не заданы"
        parts = []
        if "length" in settings:
            parts.append(f"длина: {settings['length']}")
        if "use_digits" in settings:
            digits = "да" if settings["use_digits"] else "нет"
            parts.append(f"цифры: {digits}")
        if "use_symbols" in settings:
            symbols = "да" if settings["use_symbols"] else "нет"
            parts.append(f"символы: {symbols}")
        if "use_uppercase" in settings:
            upper = "да" if settings["use_uppercase"] else "нет"
            parts.append(f"верхний регистр: {upper}")
        if "use_lowercase" in settings:
            lower = "да" if settings["use_lowercase"] else "нет"
            parts.append(f"нижний регистр: {lower}")
        if "exclude_chars" in settings and settings["exclude_chars"]:
            parts.append(f"исключены: '{settings['exclude_chars']}'")
        if not parts:
            raw_items = [f"{k}={v}" for k, v in settings.items()]
            return ", ".join(raw_items)
        return ", ".join(parts)

    @staticmethod
    def orm_to_password_response(password: SavedPassword) -> PasswordGetResponse:
        return PasswordGetResponse(
            id=password.id,
            hashed_password=password.hashed_password,          # исправлено: было hashed_password
            description=password.description,
            created_at=password.created_at.isoformat(),
            settings_preview=password.settings_preview
        )

    def create_password(self, user_id: int, request: PasswordPostRequest) -> PasswordGetResponse:
        preview = self.make_settings_preview(request.generation_settings)
        # Предполагаем, что пароль уже хэширован где-то выше (или хэшируем здесь)
        new_password = self.repo.create(
            user_id=user_id,
            password=request.hashed_password,            # исправлено: было request.hashed_password
            description=request.description,
            generation_settings=request.generation_settings,
            settings_preview=preview
        )
        return self.orm_to_password_response(new_password)

    def get_user_passwords(self, user_id: int, limit: int = 10) -> list[PasswordGetResponse]:
        passwords = self.repo.list_by_user(user_id, limit)
        return [self.orm_to_password_response(pwd) for pwd in passwords]

    def update_description(self, user_id: int, password_id: uuid.UUID, new_description: str) -> PatchResponse:

        existing = self.repo.get_by_id_and_user(password_id, user_id)
        if existing is None:
            raise NotFoundError("Password not found")
        updated = self.repo.update_description(password_id, user_id, new_description)
        if updated is None:
            raise RuntimeError("Failed to update description")
        return PatchResponse(
            id=updated.id,
            description=updated.description,
            updated_at=updated.updated_at.isoformat() if updated.updated_at else datetime.now(timezone.utc).isoformat()
        )

    def delete_password(self, user_id: int, password_id: uuid.UUID) -> DeleteResponse:
        existing = self.repo.get_by_id_and_user(password_id, user_id)
        if existing is None:
            raise NotFoundError("Password not found")
        deleted = self.repo.delete(password_id, user_id)
        if not deleted:
            raise RuntimeError("Failed to delete password")
        return DeleteResponse()




