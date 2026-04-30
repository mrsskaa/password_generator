import uuid
from datetime import datetime, timezone
from typing import Any

from app.core.exceptions import NotFoundError
from app.models.encrypted_password import EncryptedPassword
from app.models.saved_password import SavedPassword
from app.repositories.saved_password_repo import PasswordRepository
from app.schemas.password_post import (
    DeleteResponse,
    PasswordGetResponse,
    PasswordListResponse,
    PasswordPostRequest,
    PasswordRevealResponse,
    PatchResponse,
)
from app.services.crypto_service import PasswordEncryptionService


class PasswordService:
    def __init__(self, repo: PasswordRepository):
        self.repo = repo

    @staticmethod
    def make_settings_preview(settings: dict[str, Any]) -> str:
        if not settings:
            return "настройки не указаны"

        parts: list[str] = []
        if "length" in settings:
            parts.append(f"длина: {settings['length']}")
        if "use_digits" in settings:
            parts.append(f"цифры: {'да' if settings['use_digits'] else 'нет'}")
        if "use_symbols" in settings:
            parts.append(f"спецсимволы: {'да' if settings['use_symbols'] else 'нет'}")
        if "use_upper" in settings:
            parts.append(f"верхний регистр: {'да' if settings['use_upper'] else 'нет'}")
        if "use_lower" in settings:
            parts.append(f"нижний регистр: {'да' if settings['use_lower'] else 'нет'}")

        if not parts:
            return ", ".join(f"{key}={value}" for key, value in settings.items())
        return ", ".join(parts)

    @staticmethod
    def _encrypted_payload(password: SavedPassword) -> EncryptedPassword:
        return {
            "encrypted_password": password.encrypted_password,
            "salt": password.salt,
            "nonce": password.nonce,
        }

    @staticmethod
    def orm_to_password_response(password: SavedPassword) -> PasswordGetResponse:
        return PasswordGetResponse(
            id=password.id,
            description=password.description,
            created_at=password.created_at.isoformat(),
            settings_preview=password.settings_preview,
        )

    def create_password(self, user_id: int, request: PasswordPostRequest) -> PasswordGetResponse:
        preview = self.make_settings_preview(request.generation_settings)
        encryption_service = PasswordEncryptionService(request.code_word)
        encrypted_payload = encryption_service.encrypt(request.password)
        new_password = self.repo.create(
            user_id=user_id,
            encrypted_password=encrypted_payload["encrypted_password"],
            salt=encrypted_payload["salt"],
            nonce=encrypted_payload["nonce"],
            description=request.description,
            generation_settings=request.generation_settings,
            settings_preview=preview,
        )
        return self.orm_to_password_response(new_password)

    def get_user_passwords(self, user_id: int, limit: int = 50, offset: int = 0) -> PasswordListResponse:
        passwords = self.repo.list_by_user(user_id, limit, offset)
        total = self.repo.count_by_user(user_id)
        return PasswordListResponse(
            items=[self.orm_to_password_response(password) for password in passwords],
            total=total,
            limit=limit,
            offset=offset,
        )

    def reveal_password(self, user_id: int, password_id: uuid.UUID, code_word: str) -> PasswordRevealResponse:
        existing = self.repo.get_by_id_and_user(password_id, user_id)
        if existing is None:
            raise NotFoundError("Пароль не найден")

        encryption_service = PasswordEncryptionService(code_word)
        decrypted_password = encryption_service.decrypt(self._encrypted_payload(existing))
        if decrypted_password is None:
            raise PermissionError("Неверное кодовое слово")

        return PasswordRevealResponse(password=decrypted_password)

    def update_description(self, user_id: int, password_id: uuid.UUID, new_description: str) -> PatchResponse:
        existing = self.repo.get_by_id(password_id)
        if existing is None:
            raise NotFoundError("Пароль не найден")
        if existing.user_id != user_id:
            raise PermissionError("Доступ запрещён")

        updated = self.repo.update_description(password_id, user_id, new_description)
        if updated is None:
            raise RuntimeError("Не удалось обновить описание")

        return PatchResponse(
            id=updated.id,
            description=updated.description,
            updated_at=(updated.updated_at or datetime.now(timezone.utc)).isoformat(),
        )

    def delete_password(self, user_id: int, password_id: uuid.UUID) -> DeleteResponse:
        existing = self.repo.get_by_id(password_id)
        if existing is None:
            raise NotFoundError("Пароль не найден")
        if existing.user_id != user_id:
            raise PermissionError("Доступ запрещён")

        deleted = self.repo.delete(password_id, user_id)
        if not deleted:
            raise RuntimeError("Не удалось удалить пароль")

        return DeleteResponse()
