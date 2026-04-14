import os
from datetime import datetime
from typing import Any
from sqlalchemy import DateTime, String, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    role: Mapped[str] = mapped_column(String(32), nullable=False, default="user")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


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

    @staticmethod
    def _to_dict(user: User) -> dict[str, Any]:
        return {
            "id": user.id,
            "username": user.username,
            "hashed_password": user.hashed_password,
            "email": user.email,
            "role": user.role,
            "created_at": user.created_at.isoformat(),
        }

    def create_user(
        self,
        username: str,
        hashed_password: str,
        email: str | None = None,
        role: str = "user",
    ) -> dict[str, Any]:
        with self.SessionLocal() as session:
            user = User(
                username=username,
                hashed_password=hashed_password,
                email=email,
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
