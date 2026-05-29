import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import jwt
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash

from app.repositories.user_repo import SQLAlchemyRepository

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, repository: SQLAlchemyRepository):
        self.repository = repository
        self.password_hash = PasswordHash.recommended()
        self.secret_key = os.getenv("SECRET_KEY", "dev-secret-key-change-me")
        self.algorithm = os.getenv("ALGORITHM", "HS256")
        self.access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
        self.reset_token_expire_minutes = int(os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "15"))

        if self.secret_key == "dev-secret-key-change-me":
            logger.warning("Using default SECRET_KEY. Set SECRET_KEY in env for production.")

    def get_password_hash(self, password: str) -> str:
        return self.password_hash.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return self.password_hash.verify(plain_password, hashed_password)

    def create_access_token(
        self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None
    ) -> str:
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + (
            expires_delta or timedelta(minutes=self.access_token_expire_minutes)
        )
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        try:
            return jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
        except InvalidTokenError:
            return None

    def create_reset_token(self, email: str) -> str:
        return self.create_access_token(
            data={"sub": email, "token_type": "reset"},
            expires_delta=timedelta(minutes=self.reset_token_expire_minutes),
        )

    def verify_reset_token(self, token: str) -> Optional[str]:
        payload = self.verify_token(token)
        if not payload:
            return None
        if payload.get("token_type") != "reset":
            return None
        email = payload.get("sub")
        if not isinstance(email, str):
            return None
        return email

    def authenticate_user(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        user = self.repository.get_user_by_email(email)
        if not user:
            return None
        if not self.verify_password(password, user.get("hashed_password", "")):
            return None
        return user
