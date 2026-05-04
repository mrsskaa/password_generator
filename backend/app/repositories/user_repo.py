import os
from datetime import datetime, timezone
from typing import Any
from sqlalchemy import create_engine, delete, inspect, select, text, update
from sqlalchemy.orm import sessionmaker
from app.models.user import Base, PasswordResetCode, PendingRegistration, RegistrationCode, User
from app.models.saved_password import SavedPassword  # noqa: F401



class SQLAlchemyRepository:
    """
    User repository backed by PostgreSQL via SQLAlchemy.
    """

    def __init__(self, database_url: str | None = None):
        self.database_url = database_url or os.getenv(
            "DATABASE_URL",
            "postgresql+psycopg://postgres:postgres@localhost:5432/password_generator",
        )
        self.engine = create_engine(self.database_url, pool_pre_ping=True)
        self.SessionLocal = sessionmaker(bind=self.engine, autoflush=False, autocommit=False)
        Base.metadata.create_all(bind=self.engine)
        self._ensure_backward_compatible_schema()

    def _ensure_backward_compatible_schema(self) -> None:
        with self.engine.begin() as connection:
            inspector = inspect(connection)
            table_names = set(inspector.get_table_names())

            if "users" in table_names:
                user_columns = {column["name"] for column in inspector.get_columns("users")}
                if "email_verified" not in user_columns:
                    connection.execute(
                        text(
                            "ALTER TABLE users "
                            "ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE"
                        )
                    )

            if "registration_codes" not in table_names:
                RegistrationCode.__table__.create(bind=connection)

            if "pending_registrations" not in table_names:
                PendingRegistration.__table__.create(bind=connection)

            if "saved_passwords" in table_names:
                password_columns = {column["name"] for column in inspector.get_columns("saved_passwords")}
                if "hashed_password" in password_columns and self.database_url.startswith("postgresql"):
                    connection.execute(text("ALTER TABLE saved_passwords ALTER COLUMN hashed_password DROP NOT NULL"))
                if "encrypted_password" not in password_columns:
                    connection.execute(
                        text(
                            "ALTER TABLE saved_passwords "
                            "ADD COLUMN encrypted_password VARCHAR(512) NOT NULL DEFAULT ''"
                        )
                    )
                if "salt" not in password_columns:
                    connection.execute(
                        text("ALTER TABLE saved_passwords ADD COLUMN salt VARCHAR(128) NOT NULL DEFAULT ''")
                    )
                if "nonce" not in password_columns:
                    connection.execute(
                        text("ALTER TABLE saved_passwords ADD COLUMN nonce VARCHAR(128) NOT NULL DEFAULT ''")
                    )
                if "generation_settings" not in password_columns:
                    connection.execute(
                        text(
                            "ALTER TABLE saved_passwords "
                            "ADD COLUMN generation_settings JSON NOT NULL DEFAULT '{}'"
                        )
                    )
                if "settings_preview" not in password_columns:
                    connection.execute(
                        text(
                            "ALTER TABLE saved_passwords "
                            "ADD COLUMN settings_preview VARCHAR(500) NOT NULL DEFAULT 'настройки не указаны'"
                        )
                    )

    @staticmethod
    def _to_dict(user: User) -> dict[str, Any]:
        return {
            "id": user.id,
            "username": user.username,
            "hashed_password": user.hashed_password,
            "email": user.email,
            "email_verified": user.email_verified,
            "role": user.role,
            "created_at": user.created_at.isoformat(),
        }

    def create_user(
        self,
        username: str,
        hashed_password: str,
        email: str | None = None,
        email_verified: bool = False,
        role: str = "user",
    ) -> dict[str, Any]:
        with self.SessionLocal() as session:
            user = User(
                username=username,
                hashed_password=hashed_password,
                email=email,
                email_verified=email_verified,
                role=role,
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            return self._to_dict(user)

    def get_user_by_username(self, username: str) -> dict[str, Any] | None:
        with self.SessionLocal() as session:
            user = session.scalar(select(User).where(User.username == username))
            return self._to_dict(user) if user else None

    def get_user_by_id(self, user_id: int) -> dict[str, Any] | None:
        with self.SessionLocal() as session:
            user = session.scalar(select(User).where(User.id == user_id))
            return self._to_dict(user) if user else None

    def set_user_role(self, username: str, role: str) -> bool:
        with self.SessionLocal() as session:
            user = session.scalar(select(User).where(User.username == username))
            if not user:
                return False
            user.role = role
            session.commit()
            return True

    def get_user_by_email(self, email: str) -> dict[str, Any] | None:
        with self.SessionLocal() as session:
            user = session.scalar(select(User).where(User.email == email))
            return self._to_dict(user) if user else None

    def update_user_password_by_email(self, email: str, hashed_password: str) -> bool:
        with self.SessionLocal() as session:
            result = session.execute(
                update(User).where(User.email == email).values(hashed_password=hashed_password)
            )
            session.commit()
            return result.rowcount > 0

    def delete_user_by_id(self, user_id: int) -> bool:
        with self.SessionLocal() as session:
            user = session.get(User, user_id)
            if not user:
                return False
            session.delete(user)
            session.commit()
            return True

    def upsert_pending_registration(self, email: str, username: str, hashed_password: str) -> dict[str, Any]:
        now = datetime.now(timezone.utc)
        with self.SessionLocal() as session:
            row = session.get(PendingRegistration, email)
            if row:
                row.username = username
                row.hashed_password = hashed_password
                row.updated_at = now
            else:
                session.add(
                    PendingRegistration(
                        email=email,
                        username=username,
                        hashed_password=hashed_password,
                        updated_at=now,
                    )
                )
            session.commit()
            refreshed = session.get(PendingRegistration, email)
            assert refreshed is not None
            return {
                "email": refreshed.email,
                "username": refreshed.username,
                "hashed_password": refreshed.hashed_password,
                "updated_at": refreshed.updated_at,
            }

    def get_pending_registration(self, email: str) -> dict[str, Any] | None:
        with self.SessionLocal() as session:
            row = session.get(PendingRegistration, email)
            if not row:
                return None
            return {
                "email": row.email,
                "username": row.username,
                "hashed_password": row.hashed_password,
                "updated_at": row.updated_at,
            }

    def delete_pending_registration(self, email: str) -> None:
        with self.SessionLocal() as session:
            row = session.get(PendingRegistration, email)
            if row:
                session.delete(row)
                session.commit()

    def migrate_legacy_unverified_user_to_pending(self, email: str) -> dict[str, Any] | None:
        """Старый аккаунт с email_verified=False переносим в pending и удаляем строку users."""
        with self.SessionLocal() as session:
            user = session.scalar(select(User).where(User.email == email))
            if not user or user.email_verified:
                return None
            hashed = user.hashed_password
            username = user.username
            session.delete(user)
            session.commit()
        return self.upsert_pending_registration(email, username, hashed)

    def set_user_email_verified(self, email: str, email_verified: bool = True) -> bool:
        with self.SessionLocal() as session:
            result = session.execute(
                update(User).where(User.email == email).values(email_verified=email_verified)
            )
            session.commit()
            return result.rowcount > 0

    def get_latest_reset_code_for_email(self, email: str) -> dict[str, Any] | None:
        with self.SessionLocal() as session:
            code_row = session.scalar(
                select(PasswordResetCode)
                .where(PasswordResetCode.email == email)
                .order_by(PasswordResetCode.created_at.desc())
            )
            if not code_row:
                return None
            return {
                "id": code_row.id,
                "email": code_row.email,
                "code": code_row.code,
                "created_at": code_row.created_at,
                "expires_at": code_row.expires_at,
                "used_at": code_row.used_at,
            }

    def create_password_reset_code(self, email: str, code: str, expires_at: datetime) -> dict[str, Any]:
        with self.SessionLocal() as session:
            reset_code = PasswordResetCode(email=email, code=code, expires_at=expires_at)
            session.add(reset_code)
            session.commit()
            session.refresh(reset_code)
            return {
                "id": reset_code.id,
                "email": reset_code.email,
                "code": reset_code.code,
                "created_at": reset_code.created_at,
                "expires_at": reset_code.expires_at,
                "used_at": reset_code.used_at,
            }

    def get_password_reset_code(self, email: str, code: str) -> dict[str, Any] | None:
        with self.SessionLocal() as session:
            code_row = session.scalar(
                select(PasswordResetCode).where(
                    PasswordResetCode.email == email,
                    PasswordResetCode.code == code,
                )
            )
            if not code_row:
                return None
            return {
                "id": code_row.id,
                "email": code_row.email,
                "code": code_row.code,
                "created_at": code_row.created_at,
                "expires_at": code_row.expires_at,
                "used_at": code_row.used_at,
            }

    def mark_password_reset_code_used(self, code_id: int) -> bool:
        with self.SessionLocal() as session:
            result = session.execute(
                update(PasswordResetCode)
                .where(PasswordResetCode.id == code_id)
                .values(used_at=datetime.now(timezone.utc))
            )
            session.commit()
            return result.rowcount > 0

    def delete_reset_codes_for_email(self, email: str) -> None:
        with self.SessionLocal() as session:
            session.execute(delete(PasswordResetCode).where(PasswordResetCode.email == email))
            session.commit()

    def delete_password_reset_code_by_id(self, code_id: int) -> bool:
        with self.SessionLocal() as session:
            result = session.execute(
                delete(PasswordResetCode).where(PasswordResetCode.id == code_id)
            )
            session.commit()
            return result.rowcount > 0

    def get_latest_registration_code_for_email(self, email: str) -> dict[str, Any] | None:
        with self.SessionLocal() as session:
            code_row = session.scalar(
                select(RegistrationCode)
                .where(RegistrationCode.email == email)
                .order_by(RegistrationCode.created_at.desc())
            )
            if not code_row:
                return None
            return {
                "id": code_row.id,
                "email": code_row.email,
                "code": code_row.code,
                "created_at": code_row.created_at,
                "expires_at": code_row.expires_at,
                "used_at": code_row.used_at,
            }

    def create_registration_code(self, email: str, code: str, expires_at: datetime) -> dict[str, Any]:
        with self.SessionLocal() as session:
            registration_code = RegistrationCode(email=email, code=code, expires_at=expires_at)
            session.add(registration_code)
            session.commit()
            session.refresh(registration_code)
            return {
                "id": registration_code.id,
                "email": registration_code.email,
                "code": registration_code.code,
                "created_at": registration_code.created_at,
                "expires_at": registration_code.expires_at,
                "used_at": registration_code.used_at,
            }

    def get_registration_code(self, email: str, code: str) -> dict[str, Any] | None:
        with self.SessionLocal() as session:
            code_row = session.scalar(
                select(RegistrationCode).where(
                    RegistrationCode.email == email,
                    RegistrationCode.code == code,
                )
            )
            if not code_row:
                return None
            return {
                "id": code_row.id,
                "email": code_row.email,
                "code": code_row.code,
                "created_at": code_row.created_at,
                "expires_at": code_row.expires_at,
                "used_at": code_row.used_at,
            }

    def mark_registration_code_used(self, code_id: int) -> bool:
        with self.SessionLocal() as session:
            result = session.execute(
                update(RegistrationCode)
                .where(RegistrationCode.id == code_id)
                .values(used_at=datetime.now(timezone.utc))
            )
            session.commit()
            return result.rowcount > 0

    def delete_registration_codes_for_email(self, email: str) -> None:
        with self.SessionLocal() as session:
            session.execute(delete(RegistrationCode).where(RegistrationCode.email == email))
            session.commit()

    def delete_registration_code_by_id(self, code_id: int) -> bool:
        with self.SessionLocal() as session:
            result = session.execute(
                delete(RegistrationCode).where(RegistrationCode.id == code_id)
            )
            session.commit()
            return result.rowcount > 0
