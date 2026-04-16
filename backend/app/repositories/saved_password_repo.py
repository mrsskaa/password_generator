import uuid
from typing import Optional

from sqlalchemy import select, delete
from sqlalchemy.orm import Session

from backend.app.models.saved_password import SavedPassword


class PasswordRepository:
    def __init__(self, session_factory):
        self.session_factory = session_factory

    def _get_session(self) -> Session:
        return self.session_factory()

    def create(
        self,
        user_id: int,
        hashed_password: str,
        description: str,
        generation_settings: dict,
        settings_preview: str,
    ) -> SavedPassword:
        with self._get_session() as session:
            new_password = SavedPassword(
                user_id=user_id,
                hashed_password=hashed_password,
                description=description,
                generation_settings=generation_settings,
                settings_preview=settings_preview,
            )
            session.add(new_password)
            session.commit()
            session.refresh(new_password)
            return new_password

    def list_by_user(self, user_id: int, limit: int = 10) -> list[SavedPassword]:
        with self._get_session() as session:
            stmt = (
                select(SavedPassword)
                .where(SavedPassword.user_id == user_id)
                .order_by(SavedPassword.created_at.desc())
                .limit(limit)
            )
            result = session.execute(stmt)
            return list(result.scalars().all())

    def get_by_id_and_user(self, password_id: uuid.UUID, user_id: int) -> Optional[SavedPassword]:
        with self._get_session() as session:
            stmt = select(SavedPassword).where(
                SavedPassword.id == password_id,
                SavedPassword.user_id == user_id,
            )
            return session.scalar(stmt)

    def update_description(
        self, password_id: uuid.UUID, user_id: int, new_description: str
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

    def delete(self, password_id: uuid.UUID, user_id: int) -> bool:
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
