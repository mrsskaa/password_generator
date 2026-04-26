import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, String, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.models.user import Base


class SavedPassword(Base):
    __tablename__ = "saved_passwords"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    generation_settings: Mapped[dict] = mapped_column(JSON,nullable=False,default=dict)
    settings_preview: Mapped[str] = mapped_column(String(500),nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False,default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True,default=None,onupdate=lambda: datetime.now(timezone.utc))
