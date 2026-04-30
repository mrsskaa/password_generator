import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, String, ForeignKey, JSON, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.models.user import Base


class SavedPassword(Base):
    __tablename__ = "saved_passwords"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(500),nullable=False)
    len_password: Mapped[int] = mapped_column(Integer, nullable=False)
    used_lower: Mapped[bool] = mapped_column(Boolean, nullable=False)
    used_upper: Mapped[bool] = mapped_column(Boolean, nullable=False)
    used_digits: Mapped[bool] = mapped_column(Boolean, nullable=False)
    used_special_symbols: Mapped[bool] = mapped_column(Boolean, nullable=False)
    used_similar_symbols: Mapped[bool] = mapped_column(Boolean, nullable=False)
    password_cracking_time: Mapped[int] = mapped_column(Integer, nullable=False)
    crack_color: Mapped[str] = mapped_column(String(255), nullable=False)
    code_word: Mapped[str] = mapped_column(String(255), nullable=False)
    encrypted_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False,default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True,default=None,onupdate=lambda: datetime.now(timezone.utc))
