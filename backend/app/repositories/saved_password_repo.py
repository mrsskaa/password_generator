import uuid
from typing import Optional

from sqlalchemy import select, delete, func
from sqlalchemy.orm import Session

from app.models.saved_password import SavedPassword


class PasswordRepository:
    def __init__(self, session_factory):
        self.session_factory = session_factory

    def _get_session(self) -> Session:
        return self.session_factory()

    def create(
        self,
        user_id: uuid.UUID,
        encrypted_password: str,
        salt: str,
        nonce: str,
        description: str,
        generation_settings: dict,
        settings_preview: str,
    ) -> SavedPassword:
        with self._get_session() as session:
            new_password = SavedPassword(
                user_id=user_id,
                encrypted_password=encrypted_password,
                salt=salt,
                nonce=nonce,
                description=description,
                generation_settings=generation_settings,
                settings_preview=settings_preview,
            )
            session.add(new_password)
            session.commit()
            session.refresh(new_password)
            return new_password

    def list_by_user(self, user_id: uuid.UUID, limit: int = 10, offset: int = 0) -> list[SavedPassword]:
        with self._get_session() as session:
            stmt = (
                select(SavedPassword)
                .where(SavedPassword.user_id == user_id)
                .order_by(SavedPassword.created_at.desc())
                .limit(limit)
                .offset(offset)
            )
            result = session.execute(stmt)
            return list(result.scalars().all())

    def count_by_user(self, user_id: uuid.UUID) -> int:
        with self._get_session() as session:
            stmt = select(func.count()).select_from(SavedPassword).where(SavedPassword.user_id == user_id)
            return int(session.scalar(stmt) or 0)

    def get_by_id_and_user(self, password_id: uuid.UUID, user_id: uuid.UUID) -> Optional[SavedPassword]:
        with self._get_session() as session:
            stmt = select(SavedPassword).where(
                SavedPassword.id == password_id,
                SavedPassword.user_id == user_id,
            )
            return session.scalar(stmt)

    def update_description(
        self, password_id: uuid.UUID, user_id: uuid.UUID, new_description: str
    ) -> Optional[SavedPassword]:
        with self._get_session() as session:
            stmt = select(SavedPassword).where(
                SavedPassword.id == password_id,
                SavedPassword.user_id == user_id,
            )
            password = session.scalar(stmt)
            if not password:
                return None
            password.description = new_description
            session.commit()
            session.refresh(password)
            return password

    def delete(self, password_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        with self._get_session() as session:
            stmt = delete(SavedPassword).where(
                SavedPassword.id == password_id,
                SavedPassword.user_id == user_id,
            )
            result = session.execute(stmt)
            session.commit()
            return result.rowcount is not None and result.rowcount > 0

    def get_by_id(self, password_id: uuid.UUID) -> Optional[SavedPassword]:
        with self._get_session() as session:
            stmt = select(SavedPassword).where(SavedPassword.id == password_id)
            return session.scalar(stmt)
