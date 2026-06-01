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
    def normalize_generation_settings(settings: dict[str, Any]) -> dict[str, Any]:
        if not settings:
            return {}

        normalized = dict(settings)
        if "length" not in normalized and "password_length" in normalized:
            normalized["length"] = normalized["password_length"]

        field_map = {
            "includeNumbers": "use_digits",
            "includeSymbols": "use_symbols",
            "includeUppercase": "use_upper",
            "includeLowercase": "use_lower",
            "excludeSimilar": "use_similar_symbols",
        }
        for source_key, target_key in field_map.items():
            if source_key in normalized and target_key not in normalized:
                normalized[target_key] = normalized[source_key]

        return normalized

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
            password_length=password.password_length,
            generation_settings=password.generation_settings or {},
        )

    def create_password(self, user_id: uuid.UUID, request: PasswordPostRequest) -> PasswordGetResponse:
        generation_settings = self.normalize_generation_settings(request.generation_settings)
        encryption_service = PasswordEncryptionService(request.code_word)
        encrypted_payload = encryption_service.encrypt(request.password)
        new_password = self.repo.create(
            user_id=user_id,
            encrypted_password=encrypted_payload["encrypted_password"],
            salt=encrypted_payload["salt"],
            nonce=encrypted_payload["nonce"],
            description=request.description,
            generation_settings=generation_settings,
            password_length=str(len(request.password)),
        )
        return self.orm_to_password_response(new_password)

    def get_user_passwords(self, user_id: uuid.UUID, limit: int = 50, offset: int = 0) -> PasswordListResponse:
        passwords = self.repo.list_by_user(user_id, limit, offset)
        total = self.repo.count_by_user(user_id)
        return PasswordListResponse(
            items=[self.orm_to_password_response(password) for password in passwords],
            total=total,
            limit=limit,
            offset=offset,
        )

    def get_password(self, user_id: uuid.UUID, password_id: uuid.UUID) -> PasswordGetResponse:
        existing = self.repo.get_by_id_and_user(password_id, user_id)
        if existing is None:
            raise NotFoundError("Пароль не найден")
        return self.orm_to_password_response(existing)

    def reveal_password(self, user_id: uuid.UUID, password_id: uuid.UUID, code_word: str) -> PasswordRevealResponse:
        existing = self.repo.get_by_id_and_user(password_id, user_id)
        if existing is None:
            raise NotFoundError("Пароль не найден")

        encryption_service = PasswordEncryptionService(code_word)
        decrypted_password = encryption_service.decrypt(self._encrypted_payload(existing))
        if decrypted_password is None:
            raise PermissionError("Неверное кодовое слово")

        return PasswordRevealResponse(password=decrypted_password)

    def update_description(self, user_id: uuid.UUID, password_id: uuid.UUID, new_description: str) -> PatchResponse:
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

    def delete_password(self, user_id: uuid.UUID, password_id: uuid.UUID) -> DeleteResponse:
        existing = self.repo.get_by_id(password_id)
        if existing is None:
            raise NotFoundError("Пароль не найден")
        if existing.user_id != user_id:
            raise PermissionError("Доступ запрещён")

        deleted = self.repo.delete(password_id, user_id)
        if not deleted:
            raise RuntimeError("Не удалось удалить пароль")

        return DeleteResponse()
